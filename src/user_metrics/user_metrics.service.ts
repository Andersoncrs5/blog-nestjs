import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Transactional } from 'typeorm-transactional';
import { UserMetric } from './entities/user_metric.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../src/user/entities/user.entity';
import { ActionEnum } from './action/ActionEnum.enum';
import { LikeOrDislike } from '../../src/like/entities/likeOrDislike.enum';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class UserMetricsService {
  constructor (
    @InjectRepository(UserMetric)
    private readonly repository: Repository<UserMetric>,
    @Inject(CACHE_MANAGER)
    private cache: Cache

  ) {}

  @Transactional()
  async sumOrReduceProfileViews(metric: UserMetric, action: ActionEnum): Promise<UserMetric> {
    if (action == ActionEnum.SUM) {
      metric.profileViews += 1;
    }

    if (action == ActionEnum.REDUCE) {
      metric.profileViews -= 1;
    }

    const result = this.update(metric, metric.user);
    return result;
  }

  @Transactional()
  async sumOrReduceEditedCount(metric: UserMetric, action: ActionEnum): Promise<UserMetric> {
    if (action == ActionEnum.SUM) {
      metric.editedCount += 1;
    }

    if (action == ActionEnum.REDUCE) {
      metric.editedCount -= 1;
    }

    const result = this.update(metric, metric.user);
    return result;
  }

  @Transactional()
  async sumOrReduceSavedMediaCount(metric: UserMetric, action: ActionEnum) {
    if (action == ActionEnum.SUM) {
      metric.savedMediaCount += 1;
    }

    if (action == ActionEnum.REDUCE) {
      metric.savedMediaCount -= 1;
    }

    const result = this.update(metric, metric.user);
    return result;
  }

  @Transactional()
  async sumOrReduceFollowersCount(metric: UserMetric, action: ActionEnum) {
    if (action == ActionEnum.SUM) {
      metric.followersCount += 1;
    }

    if (action == ActionEnum.REDUCE) {
      metric.followersCount -= 1;
    }

    const result = this.update(metric, metric.user);
    return result;
  }

  @Transactional()
  async sumOrReduceSavedCommentsCount(metric: UserMetric, action: ActionEnum) {
    if (action == ActionEnum.SUM) {
      metric.savedCommentsCount += 1;
    }

    if (action == ActionEnum.REDUCE) {
      metric.savedCommentsCount -= 1;
    }

    const result = this.update(metric, metric.user);
    return result;
  }

  @Transactional()
  async sumOrReduceSavedPostsCount(metric: UserMetric, action: ActionEnum) {
    if (action == ActionEnum.SUM) {
      metric.savedPostsCount += 1;
    }

    if (action == ActionEnum.REDUCE) {
      metric.savedPostsCount -= 1;
    }

    const result = this.update(metric, metric.user);
    return result;
  }

  @Transactional()
  async sumOrReduceMediaUploadsCount(metric: UserMetric, action: ActionEnum) {
    if (action == ActionEnum.SUM) {
      metric.mediaUploadsCount += 1;
    }

    if (action == ActionEnum.REDUCE) {
      metric.mediaUploadsCount -= 1;
    }

    const result = this.update(metric, metric.user);
    return result;
  }

  @Transactional()
  async sumOrReduceReportsReceivedCount(metric: UserMetric, action: ActionEnum) {
    if (action == ActionEnum.SUM) {
      metric.reportsReceivedCount += 1;
    }

    if (action == ActionEnum.REDUCE) {
      metric.reportsReceivedCount -= 1;
    }

    const result = this.update(metric, metric.user);
    return result;
  }
  
  @Transactional()
  async sumOrReduceSharesCount(metric: UserMetric, action: ActionEnum) {
    if (action == ActionEnum.SUM) {
      metric.sharesCount += 1;
    }

    if (action == ActionEnum.REDUCE) {
      metric.sharesCount -= 1;
    }

    const result = this.update(metric, metric.user);
    return result;
  }

  @Transactional()
  async sumOrReduceDislikeOrLikesGivenCountInPost(metric: UserMetric, action: ActionEnum, likeOrDislike: LikeOrDislike) {
    if (action == ActionEnum.SUM  && likeOrDislike == LikeOrDislike.LIKE ) {
      metric.likesGivenCountInPost += 1;
    }

    if (action == ActionEnum.REDUCE && likeOrDislike == LikeOrDislike.LIKE ) {
      metric.likesGivenCountInPost -= 1;
    }

    if (action == ActionEnum.SUM && likeOrDislike == LikeOrDislike.DISLIKE ) {
      metric.deslikesGivenCountInPost += 1;
    }

    if (action == ActionEnum.REDUCE && likeOrDislike == LikeOrDislike.DISLIKE ) {
      metric.deslikesGivenCountInPost -= 1;
    }

    const result = this.update(metric, metric.user);
    return result;
  }

  @Transactional()
  async sumOrReduceDislikeOrLikesGivenCountInComment(metric: UserMetric, action: ActionEnum, likeOrDislike: LikeOrDislike) {
    if (action == ActionEnum.SUM  && likeOrDislike == LikeOrDislike.LIKE ) {
      metric.likesGivenCountInComment += 1;
    }

    if (action == ActionEnum.REDUCE && likeOrDislike == LikeOrDislike.LIKE ) {
      metric.likesGivenCountInComment -= 1;
    }

    if (action == ActionEnum.SUM && likeOrDislike == LikeOrDislike.DISLIKE ) {
      metric.deslikesGivenCountInComment += 1;
    }

    if (action == ActionEnum.REDUCE && likeOrDislike == LikeOrDislike.DISLIKE ) {
      metric.deslikesGivenCountInComment -= 1;
    }

    const result = this.update(metric, metric.user);
    return result;
  }

  @Transactional()
  async sumOrReduceCommentsCount(metric: UserMetric, action: ActionEnum) {
    if (action == ActionEnum.SUM) {
      metric.commentsCount += 1;
    }

    if (action == ActionEnum.REDUCE) {
      metric.commentsCount -= 1;
    }

    const result = this.update(metric, metric.user);
    return result;
  }

  @Transactional()
  async sumOrReducePostsCount(metric: UserMetric, action: ActionEnum) {
    if (action == ActionEnum.SUM) {
      metric.postsCount += 1;
    }

    if (action == ActionEnum.REDUCE) {
      metric.postsCount -= 1;
    }

    const result = this.update(metric, metric.user);
    return result;
  }

  @Transactional()
  async sumOrReduceFollowingCount(metric: UserMetric, action: ActionEnum) {
    if (action == ActionEnum.SUM) {
      metric.followingCount += 1;
    }

    if (action == ActionEnum.REDUCE) {
      metric.followingCount -= 1;
    }

    const result = this.update(metric, metric.user);
    return result;
  }

  @Transactional()
  async create(user: User): Promise<UserMetric> {
    if (user == null || user.id <= 0 ) {
      throw new BadRequestException('User is required');
    }

    const created = this.repository.create(user); 
    return await this.repository.save(created);
  }

  @Transactional()
  async findOneV2(user: User): Promise<UserMetric> {

    const key = `user_metric:${user.id}`
    const metricCache = await this.cache.get<UserMetric>(key);

    if (metricCache) {
      return metricCache
    }

    const metric: UserMetric | null = await this.repository.findOne({ where: { user } })

    if (metric == null) {
      throw new NotFoundException;
    }

    await this.cache.set(key, metric, 60)

    return metric;
  }

  @Transactional()
  async updateV2(metric: UserMetric, user: User) {
    const existingMetric: UserMetric = await this.findOneV2(user);

    metric.lastActivity = new Date();
    metric.version = existingMetric.version;

    const key = `user_metric:${user.id}`
    const result = await this.repository.save(metric);
    await this.cache.set(key, metric, 60)

    return result
  }

  @Transactional()
  async findOne(user: User): Promise<UserMetric> {
    const metric: UserMetric | null = await this.repository.findOne({ where: { user } })

    if (metric == null) {
      throw new NotFoundException;
    }

    return metric;
  }

  @Transactional()
  async update(metric: UserMetric, user: User) {
    const existingMetric: UserMetric = await this.findOne(user);

    metric.lastActivity = new Date();
    metric.version = existingMetric.version;

    return await this.repository.save(metric);
  }
}
