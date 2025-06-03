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

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private readonly repository: Repository<Post>
  ){}

  @Transactional()
  async create(user: User,createPostDto: CreatePostDto) {
    const postData = {...createPostDto, user}

    const post = this.repository.create(postData);
    const save = await this.repository.save(post);

    return save
  }

  async findAll(page: number, limit: number): Promise<Pagination<Post>> {
    const queryBuilder = this.repository.createQueryBuilder('post')
      .where('post.isActived = :isActived', { isActived: true })
      .orderBy('post.id', 'ASC');

    return paginate(queryBuilder, {
      page,
      limit,
      route: '/post',
    });
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

  async findByCategory(category: string, page: number, limit: number){  
    const queryBuilder = this.repository.createQueryBuilder('post')
      .where('post.category = :category', { category: category })
      .orderBy('post.id', 'ASC');

    return paginate(queryBuilder, {
      page,
      limit,
      route: '/post/findByCategory',
    });
  }

  async findByTitle(title: string, page: number, limit: number) {
    const queryBuilder = await this.repository.createQueryBuilder('post')
    .where('post.title = %:title%', { title: title })
    .orderBy('post.id', 'ASC');

    return paginate(queryBuilder, {
      page,
      limit,
      route: '/post/findByTitle',
    });
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
    const data = { ...updatePostDto, version: postExists.version }
    
    return await this.repository.update(postExists.id, data);
  }

  @Transactional()
  async remove(postExists: Post): Promise<void> {
    await this.repository.delete(postExists);
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