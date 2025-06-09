import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Post } from './entities/post.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { Transactional } from 'typeorm-transactional';
import { IPaginationOptions, paginate, Pagination } from 'nestjs-typeorm-paginate';
import { PaginationDto } from '../../src/utils/pagination.util';
import { FilterPostDto } from './dto/filterPost.dto';
import { Category } from '../../src/category/entities/category.entity';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private readonly repository: Repository<Post>
  ){}

  @Transactional()
  async create(category: Category ,user: User,createPostDto: CreatePostDto) {
    const postData = {...createPostDto, user, category}

    const post = this.repository.create(postData);
    const save = await this.repository.save(post);

    return save
  }

  async findAll(page: number, limit: number) {
    const [result, count] = await this.repository.findAndCount({ 
      skip: (page - 1) * limit,
      take: limit,
      order: { id: 'ASC' },
      where: { isActived: true, isBlocked: false },
      relations: [ 'user' ]
    });

    return {
      data: result,
      totalItems: count,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
    };
  }

  async findAllOfUser(user: User, page: number, limit: number) {
    const queryBuilder = this.repository.createQueryBuilder('post')
      .where('post.userId = :userId', { userId: user.id })
      .orderBy('post.id', 'ASC');

    return paginate(queryBuilder, {
      page,
      limit,
      route: '/post/findAllOfUser',
    });
  }

  async findByCategory(category: Category, page: number, limit: number){  
    const [result, count] = await this.repository.findAndCount({ 
      skip: (page - 1) * limit,
      take: limit,
      order: { id: 'ASC' },
      where: { category },
      relations: [ 'user' ]
    });

    return {
      data: result,
      totalItems: count,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
    };
  }

  async findByTitle(title: string, page: number, limit: number) {
    const [result, count] = await this.repository.findAndCount({ 
      skip: (page - 1) * limit,
      take: limit,
      order: { id: 'ASC' },
      where: { title },
      relations: [ 'user' ]
    });

    return {
      data: result,
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
  async update(postExists: Post, updatePostDto: UpdatePostDto) {
    const category = postExists.category;
    const data = { ...updatePostDto, version: postExists.version, category }
    
    return await this.repository.update(postExists.id, data);
  }

  @Transactional()
  async remove(postExists: Post): Promise<void> {
    await this.repository.delete(postExists);
  }

  async filter(filter: FilterPostDto, pagination: PaginationDto) {
    const {
      title,
      authorName,
      categoryId,
      viewedAfter,
      viewedBefore,
      createdAtAfter,
      createdAtBefore
    } = filter;

    const query = this.repository.createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .leftJoinAndSelect('post.category', 'category')
      .leftJoinAndSelect('post.metrics', 'metrics')
      .orderBy('post.id', 'ASC')
      .skip((pagination.page - 1) * pagination.limit)
      .take(pagination.limit);

    if (title) {
      query.andWhere('post.title ILIKE :title', { title: `%${title}%` });
    }

    if (authorName) {
      query.andWhere('user.name ILIKE :authorName', { authorName: `%${authorName}%` });
    }

    if (categoryId) {
      query.andWhere('category.id = :categoryId', { categoryId });
    }

    if (viewedAfter) {
      query.andWhere('metrics.viewed >= :viewedAfter', { viewedAfter });
    }

    if (viewedBefore) {
      query.andWhere('metrics.viewed <= :viewedBefore', { viewedBefore });
    }

    if (createdAtAfter) {
      query.andWhere('post.createdAt >= :createdAtAfter', { createdAtAfter });
    }

    if (createdAtBefore) {
      query.andWhere('post.createdAt <= :createdAtBefore', { createdAtBefore });
    }

    const [result, count] = await query.getManyAndCount();

    return {
      data: result,
      totalItems: count,
      currentPage: pagination.page,
      totalPages: Math.ceil(count / pagination.limit),
    };
  }


}