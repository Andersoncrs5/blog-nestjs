import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Like } from './entities/like.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../src/user/entities/user.entity';
import { Post } from '../../src/post/entities/post.entity';
import { Propagation, Transactional } from 'typeorm-transactional';
import { LikeOrDislike } from './entities/likeOrDislike.enum';

@Injectable()
export class LikeService {
  constructor(
    @InjectRepository(Like)
    private readonly repository: Repository<Like>,
  ) {}
 
  @Transactional()
  async create(user:User, post:Post, action: LikeOrDislike): Promise<Like> {
    const existing: boolean = await this.repository.exists({
      where: { user, post },
    });
    
    if (existing) {
      throw new ConflictException('Action already exists');
    }

    const likeSave = this.repository.create({
      action,
      post,
      user
    });

    return await this.repository.save(likeSave);
  }

  @Transactional()
  async findAllOfUser(user: User, page: number, limit: number) {
    const [result, count] = await this.repository.findAndCount({ 
      skip: (page - 1) * limit,
      take: limit,
      order: { id: 'ASC' },
      where: { user },
    });

    return {
      data: result,
      totalItems: count,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
    };
  }

  @Transactional()
  async findOne(id: number): Promise<Like> {
    if (!id || isNaN(id) || id <= 0) {
      throw new BadRequestException('ID must be a positive number');
    }

    const like: Like | null = await this.repository.findOne({ where: { id } });

    if (!like) throw new NotFoundException(`Like not found with id ${id}`);

    return like;
  }

  @Transactional()
  async exists(user: User, post: Post): Promise<boolean> {
    return  await this.repository.exists({ where: { user, post } });
  }

  @Transactional()
  async remove(like: Like) {
    this.repository.delete(like);
    return like;
  }

}