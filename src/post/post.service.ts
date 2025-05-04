import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Post } from './entities/post.entity';
import { Like, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { UserService } from '../user/user.service';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private readonly repository: Repository<Post>,
    private readonly userService: UserService,
  ){}
  async create(id: number,createPostDto: CreatePostDto) {
    const queryRunner = this.repository.manager.connection.createQueryRunner();
    await queryRunner.startTransaction();
    
    const user: User = await this.userService.findOne(id);

    const postData = {...createPostDto, user}

    try {
      const post: Post = await queryRunner.manager.create(Post, postData);

      const postCreated: Post = await queryRunner.manager.save(post);
      await queryRunner.commitTransaction();
      return 'Post created with success';
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(error);
    } finally {
      await queryRunner.release();
    }
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
      data: products,
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

  async update(id: number, updatePostDto: UpdatePostDto) {
    const queryRunner = this.repository.manager.connection.createQueryRunner();
    await queryRunner.startTransaction();
    const postExists: Post = await this.findOne(id);

    try {
      await queryRunner.manager.update(Post, id, updatePostDto);

      const postUpdated: Post | null = await queryRunner.manager.findOne(Post, { where: { id } })
      await queryRunner.commitTransaction();

      return postUpdated;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(error);
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: number): Promise<string> {
    const queryRunner = this.repository.manager.connection.createQueryRunner();
    await queryRunner.startTransaction();

    const post: Post = await this.findOne(id);

    try {
    
      await queryRunner.manager.delete(Post, id);
      await queryRunner.commitTransaction();
      return 'Post deleted';
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(error);
    } finally {
      await queryRunner.release();
    }
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
    try {
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
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }

}