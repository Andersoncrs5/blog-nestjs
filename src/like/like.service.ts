import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Like } from './entities/like.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../src/user/entities/user.entity';
import { Post } from '../../src/post/entities/post.entity';
import { Transactional } from 'typeorm-transactional';
import { LikeOrDislike } from './entities/likeOrDislike.enum';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';

@Injectable()
export class LikeService {
  constructor(
    @InjectRepository(Like)
    private readonly repository: Repository<Like>,
  ) {}
 
  @Transactional()
  async create(user:User, post:Post, action: LikeOrDislike) {
    const data = {
      action,
      post,
      user
    }

    const likeSave = await this.repository.save(data);
    await this.repository.save(likeSave);

    return likeSave;
  }

  async findAllOfUser(user: User, page: number, limit: number): Promise<Pagination<Like>> {
    const queryBuilder = this.repository.createQueryBuilder('like')
      .leftJoinAndSelect('like.post', 'post')
      .where('like.userId = :userId', { userId: user.id })
      .orderBy('like.id', 'ASC');

    return paginate(queryBuilder, {
      page,
      limit,
      route: '/like/findAllofUser',
    });
  }

  async findOne(id: number): Promise<Like> {
    const like = await this.repository.findOne({ where: { id }, relations: ['user', 'post'] });
    if (!like) throw new NotFoundException(`Like not found with id ${id}`);
    return like;
  }

  async exists(user: User, post: Post): Promise<boolean> {
    const count = await this.repository.count({ where: { user, post } });
    return count > 0;
  }

  @Transactional()
  async remove(like: Like) {
    if (!like) { throw new NotFoundException(); }
    this.repository.delete(like);
    return like;
  }

}