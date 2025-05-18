import { BadRequestException, forwardRef, Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateLikeDto } from './dto/create-like.dto';
import { Repository } from 'typeorm';
import { Like } from './entities/like.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../src/user/entities/user.entity';
import { Post } from '../../src/post/entities/post.entity';
import { UserService } from '../../src/user/user.service';
import { PostService } from '../../src/post/post.service';
import { Transactional } from 'typeorm-transactional';
import { UserMetricsService } from '../../src/user_metrics/user_metrics.service';
import { UserMetric } from '../../src/user_metrics/entities/user_metric.entity';
import { LikeOrDislike } from './entities/likeOrDislike.enum';
import { PostMetricsService } from '../../src/post_metrics/post_metrics.service';
import { PostMetric } from '../../src/post_metrics/entities/post_metric.entity';

@Injectable()
export class LikeService {
  constructor(
    @InjectRepository(Like)
    private readonly repository: Repository<Like>,
    
    @Inject(forwardRef(() => UserService))
    private readonly userService : UserService,

    @Inject(forwardRef(() => PostService))
    private readonly postService : PostService,

    @Inject(forwardRef(() => UserMetricsService))
    private readonly userMetricsService: UserMetricsService,

    @Inject(forwardRef(() => PostMetricsService))
    private readonly postMetricsService: PostMetricsService
  ) {}

  @Transactional()
  async create(createLikeDto: CreateLikeDto, action: LikeOrDislike): Promise<Like | null> {
    const user = await this.userService.findOne(createLikeDto.userId);
    const post = await this.postService.findOne(createLikeDto.postId);
    const userMetric = await this.userMetricsService.findOne(user.id);
    const postMetric = await this.postMetricsService.findOne(post.id);

    const existingLike = await this.repository.findOne({
      where: { user: { id: user.id }, post: { id: post.id } },
    });

    if (existingLike && existingLike.action === action) {
      await this.repository.remove(existingLike);

      this.adjustMetrics(userMetric, action, -1);
      await this.userMetricsService.update(userMetric);
      return null;
    }

    if (existingLike) {
      existingLike.action = action;
      await this.repository.save(existingLike);

      await this.adjustMetrics(userMetric, action, 1); 
      await this.adjustMetrics(userMetric, await this.oppositeAction(action), -1);
      await this.adjustPostMetrics(postMetric, action, 1); 
      await this.adjustPostMetrics(postMetric, await this.oppositeAction(action), -1);
      await this.userMetricsService.update(userMetric);
      await this.postMetricsService.update(postMetric)
      return existingLike;
    }

    const newLike = await this.repository.create({ user, post, action });
    const saved = await this.repository.save(newLike);

    await this.adjustMetrics(userMetric, action, 1);
    await this.userMetricsService.update(userMetric);

    return saved;
  }

  private async adjustMetrics(metric: UserMetric, action: LikeOrDislike, value: number) {
    if (action === LikeOrDislike.LIKE) {
      metric.likesGivenCountInPost += value;
    } else {
      metric.deslikesGivenCountInPost += value;
    }
  }

  private async adjustPostMetrics(metric: PostMetric, action: LikeOrDislike, value: number) {
    if (action === LikeOrDislike.LIKE) {
      metric.likes += value;
    } else {
      metric.dislikes += value;
    }
  }


  private async oppositeAction(action: LikeOrDislike): Promise<LikeOrDislike> {
    return action === LikeOrDislike.LIKE ? LikeOrDislike.DISLIKE : LikeOrDislike.LIKE;
  }

  async findAllOfUser(id: number, page: number, limit: number){
    await this.userService.findOne(id);

    const [likes, count] = await this.repository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { id: 'ASC' },
      where: { user: { id } },
      relations : ['post']
    })

    return {
      data: likes,
      totalItems: count,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
    };
  }

  async findOne(id: number): Promise<Like> {
    const like = await this.repository.findOne({ where: { id }, relations: ['user', 'post'] });
    if (!like) throw new NotFoundException(`Like not found with id ${id}`);
    return like;
  }

  async exists(userId: number, postId: number): Promise<boolean> {
    const count = await this.repository.count({ where: { user: { id: userId }, post: { id: postId } } });
    return count > 0;
  }

  @Transactional()
  async remove(id: number): Promise<string> {
    const like = await this.findOne(id);
    this.repository.delete(like);

    const userMetric: UserMetric = await this.userMetricsService.findOne(like.user.id);
    userMetric.likesGivenCountInPost -= 1;
    await this.userMetricsService.update(userMetric);

    return `Like removed with id: ${id}`;
  }

}