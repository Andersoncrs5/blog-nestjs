import { BadRequestException, forwardRef, Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Post } from './entities/post.entity';
import { Like, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { UserService } from '../user/user.service';
import { Transactional } from 'typeorm-transactional';
import { IPaginationOptions, paginate, Pagination } from 'nestjs-typeorm-paginate';
import { PaginationDto } from '../../src/utils/pagination.util';
import { FilterPostDto } from './dto/filterPost.dto';
import { UserMetricsService } from '../../src/user_metrics/user_metrics.service';
import { UserMetric } from '../../src/user_metrics/entities/user_metric.entity';
import { PostMetricsService } from '../../src/post_metrics/post_metrics.service';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private readonly repository: Repository<Post>,

    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,

    @Inject(forwardRef(() => UserMetricsService))
    private readonly userMetricService: UserMetricsService,

    @Inject(forwardRef(() => PostMetricsService))
    private readonly postMetricService: PostMetricsService
  ){}

  @Transactional()
  async create(id: number,createPostDto: CreatePostDto) {
    const user: User = await this.userService.findOne(id);

    const postData = {...createPostDto, user}

    const post = await this.repository.create(postData);
    const save = await this.repository.save(post);

    await this.postMetricService.create(save);

    const userMetric: UserMetric = await this.userMetricService.findOne(id);
    userMetric.postsCount += 1;
    await this.userMetricService.update(userMetric);

    return 'Post created with success';
  }

  async findAll(page: number, limit: number){  
    const [products, count] = await this.repository.
      findAndCount({
        skip: (page - 1) * limit,
        take: limit,
        order: { id: 'ASC' },
        where: { isActived: true }
      });
  
      return {
        data: products,
        totalItems: count,
        currentPage: page,
        totalPages: Math.ceil(count / limit),
      };

  }
  
  async findAllOfUser(id: number, page: number, limit: number){  
    const user: User = await this.userService.findOne(id);

    const [products, count] = await this.repository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { id: 'ASC' },
      where: { user: { id } }
    })

    return {
      result: products,
      totalItems: count,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
    };
  }

  async findOne(id: number): Promise<Post> {
    if (!id || isNaN(id) || id <= 0) {
      throw new BadRequestException('ID must be a positive number');
    }

    const post: Post | null = await this.repository.findOne({ where: { id } });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return post;
  }

  @Transactional()
  async update(id: number, updatePostDto: UpdatePostDto) {
    const postExists: Post = await this.findOne(id);

    const data = { ...updatePostDto, version: postExists.version }

    const metric = await this.postMetricService.findOne(id);
    metric.editedCount += 1;
    
    await this.repository.update(id, data);
    await this.postMetricService.update(metric);

    return 'Post updated with success!';
  }

  @Transactional()
  async remove(id: number): Promise<string> {
    const postExists: Post = await this.findOne(id);
    await this.repository.delete(postExists);

    const userMetric: UserMetric = await this.userMetricService.findOne(postExists.user.id);
    userMetric.postsCount -= 1;
    await this.userMetricService.update(userMetric);

    return 'Post deleted';
  }

  async findByTitle(title: string, page: number, limit: number){  
    const [products, count] = await this.repository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { id: 'ASC' },
      where: { title: Like(`%${title}%`) }
    })

    return {
      data: products,
      totalItems: count,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
    };
  }

  async findByCategory(category: string, page: number, limit: number){  
    const [products, count] = await this.repository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { id: 'ASC' },
      where: { category }
    })

    return {
      data: products,
      totalItems: count,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
    };
  }

  async filter(
    filter: FilterPostDto,
    pagination: PaginationDto,
  ): Promise<Pagination<Post>> {
    const { title, category, authorName, createdAt } = filter;
  
    const queryBuilder = this.repository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.category', 'category')
      .leftJoinAndSelect('post.author', 'author');
  
    if (title) {
      queryBuilder.andWhere('LOWER(post.title) LIKE LOWER(:title)', {
        title: `%${title}%`,
      });
    }
  
    if (category) {
      queryBuilder.andWhere('LOWER(category.name) = LOWER(:category)', {
        category,
      });
    }
  
    if (authorName) {
      queryBuilder.andWhere('LOWER(author.name) LIKE LOWER(:authorName)', {
        authorName: `%${authorName}%`,
      });
    }
  
    if (createdAt) {
      queryBuilder.andWhere('DATE(post.createdAt) = :createdAt', {
        createdAt: createdAt.toISOString().split('T')[0],
      });
    }
  
    const options: IPaginationOptions = {
      page: pagination.page,
      limit: pagination.limit,
      route: '/posts', 
    };
  
    return paginate<Post>(queryBuilder, options);
  }

}