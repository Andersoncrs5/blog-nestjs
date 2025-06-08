import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Transactional } from 'typeorm-transactional';
import { UserMetric } from './entities/user_metric.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../src/user/entities/user.entity';
import { ActionEnum } from './action/ActionEnum.enum';
import { LikeOrDislike } from '../../src/like/entities/likeOrDislike.enum';

@Injectable()
export class UserMetricsService {
  constructor (
    @InjectRepository(UserMetric)
    private readonly repository: Repository<UserMetric>,
  ) {}

  @Transactional()
  async sumOrReduceProfileViews(metric: UserMetric, action: ActionEnum) {
    if (action == ActionEnum.SUM) {
      metric.profileViews += 1;
    }

    if (action == ActionEnum.REDUCE) {
      metric.profileViews -= 1;
    }

    this.update(metric, metric.user);
  }

  @Transactional()
  async sumOrReduceEditedCount(metric: UserMetric, action: ActionEnum) {
    if (action == ActionEnum.SUM) {
      metric.editedCount += 1;
    }

    if (action == ActionEnum.REDUCE) {
      metric.editedCount -= 1;
    }

    this.update(metric, metric.user);
  }

  @Transactional()
  async sumOrReduceSavedMediaCount(metric: UserMetric, action: ActionEnum) {
    if (action == ActionEnum.SUM) {
      metric.savedMediaCount += 1;
    }

    if (action == ActionEnum.REDUCE) {
      metric.savedMediaCount -= 1;
    }

    this.update(metric, metric.user);
  }

  @Transactional()
  async sumOrReduceFollowersCount(metric: UserMetric, action: ActionEnum) {
    if (action == ActionEnum.SUM) {
      metric.followersCount += 1;
    }

    if (action == ActionEnum.REDUCE) {
      metric.followersCount -= 1;
    }

    this.update(metric, metric.user);
  }

  @Transactional()
  async sumOrReduceSavedCommentsCount(metric: UserMetric, action: ActionEnum) {
    if (action == ActionEnum.SUM) {
      metric.savedCommentsCount += 1;
    }

    if (action == ActionEnum.REDUCE) {
      metric.savedCommentsCount -= 1;
    }

    this.update(metric, metric.user);
  }

  @Transactional()
  async sumOrReduceSavedPostsCount(metric: UserMetric, action: ActionEnum) {
    if (action == ActionEnum.SUM) {
      metric.savedPostsCount += 1;
    }

    if (action == ActionEnum.REDUCE) {
      metric.savedPostsCount -= 1;
    }

    this.update(metric, metric.user);
  }

  @Transactional()
  async sumOrReduceMediaUploadsCount(metric: UserMetric, action: ActionEnum) {
    if (action == ActionEnum.SUM) {
      metric.mediaUploadsCount += 1;
    }

    if (action == ActionEnum.REDUCE) {
      metric.mediaUploadsCount -= 1;
    }

    this.update(metric, metric.user);
  }

  @Transactional()
  async sumOrReduceReportsReceivedCount(metric: UserMetric, action: ActionEnum) {
    if (action == ActionEnum.SUM) {
      metric.reportsReceivedCount += 1;
    }

    if (action == ActionEnum.REDUCE) {
      metric.reportsReceivedCount -= 1;
    }

    this.update(metric, metric.user);
  }
  
  @Transactional()
  async sumOrReduceSharesCount(metric: UserMetric, action: ActionEnum) {
    if (action == ActionEnum.SUM) {
      metric.sharesCount += 1;
    }

    if (action == ActionEnum.REDUCE) {
      metric.sharesCount -= 1;
    }

    this.update(metric, metric.user);
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

    this.update(metric, metric.user);
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

    this.update(metric, metric.user);
  }

  @Transactional()
  async sumOrReduceCommentsCount(metric: UserMetric, action: ActionEnum) {
    if (action == ActionEnum.SUM) {
      metric.commentsCount += 1;
    }

    if (action == ActionEnum.REDUCE) {
      metric.commentsCount -= 1;
    }

    this.update(metric, metric.user);
  }

  @Transactional()
  async sumOrReducePostsCount(metric: UserMetric, action: ActionEnum) {
    if (action == ActionEnum.SUM) {
      metric.postsCount += 1;
    }

    if (action == ActionEnum.REDUCE) {
      metric.postsCount -= 1;
    }

    this.update(metric, metric.user);
  }

  @Transactional()
  async sumOrReduceFollowingCount(metric: UserMetric, action: ActionEnum) {
    if (action == ActionEnum.SUM) {
      metric.followingCount += 1;
    }

    if (action == ActionEnum.REDUCE) {
      metric.followingCount -= 1;
    }

    this.update(metric, metric.user);
  }

  @Transactional()
  async create(user: User) {
    if (user == null) {
      throw new BadRequestException('User is required');
    }

    const created = this.repository.create(user); 
    return await this.repository.save(created);
  }


  @Transactional()
  async findOne(user: User): Promise<UserMetric> {
    const metric: UserMetric | null = await this.repository.findOne({ where: { user } })

    if (metric == null) {
      console.log('User metric not found')
      throw new NotFoundException;
    }

    return metric;
  }

  @Transactional()
  async update(metric: UserMetric, user: User) {
    const existingMetric: UserMetric = await this.findOne(user);

    metric.lastActivity = new Date();
    metric.version = existingMetric.version;

    await this.repository.save(metric);
  }
}
