import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { LikeComment } from './entities/like_comment.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from '../../src/comment/entities/comment.entity';
import { Propagation, Transactional } from 'typeorm-transactional';
import { User } from '../../src/user/entities/user.entity';
import { LikeOrDislike } from '../../src/like/entities/likeOrDislike.enum';

@Injectable()
export class LikeCommentService {
  constructor(
    @InjectRepository(LikeComment)
    private readonly repository: Repository<LikeComment>,
  ) {}
  
  @Transactional()
  async create(user: User, comment: Comment, action: LikeOrDislike): Promise<LikeComment> {
    const existing: boolean = await this.repository.exists({
      where: { user, comment },
    });
    
    if (existing) {
      throw new ConflictException('Action already exists');
    }

    const actionSave: LikeComment = this.repository.create({ user, comment, action });
    return await this.repository.save(actionSave);
  }

  @Transactional()
  async findAllOfUser(user: User, page: number, limit: number) {
    const [result, count] = await this.repository.findAndCount({ 
      skip: (page - 1) * limit,
      take: limit,
      order: { id: 'ASC' },
      where: { user },
      relations: ['comment', 'user']
    });

    return {
      data: result,
      totalItems: count,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
    };
  }

  @Transactional()
  async exists(user: User, comment: Comment): Promise<boolean> {
    return await this.repository.exists({
      where: { user, comment },
    });
  }

  @Transactional()
  async findOne(id: number) {
    if (!id || isNaN(id) || id <= 0) {
      throw new BadRequestException('ID must be a positive number');
    }

    const like: LikeComment | null = await this.repository.findOne({ where: { id } });

    if (like == null) {
      throw new NotFoundException('Action not found');
    }

    return like;
  }

  @Transactional()
  async remove(action: LikeComment) {
    await this.repository.delete(action);
    return action;
  }
}
