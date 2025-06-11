import { Injectable, NotFoundException } from '@nestjs/common';
import { Post } from '../../src/post/entities/post.entity';
import { PostMetric } from './entities/post_metric.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Transactional } from 'typeorm-transactional';
import { ActionEnum } from '../../src/user_metrics/action/ActionEnum.enum';
import { LikeOrDislike } from '../../src/like/entities/likeOrDislike.enum';

@Injectable()
export class PostMetricsService {
  constructor (
    @InjectRepository(PostMetric)
    private readonly repository: Repository<PostMetric>,
  ) {}

  @Transactional()
  async setLastInteractionAt(metric: PostMetric): Promise<PostMetric> {

    metric.lastInteractionAt = new Date();
    return await this.update(metric);
  }
  
  @Transactional()
  async sumOrReduceViewed(metric: PostMetric, action: ActionEnum): Promise<PostMetric> {
    if (action == ActionEnum.SUM) {
      metric.viewed += 1;
    }

    if (action == ActionEnum.REDUCE) {
      metric.viewed -= 1;
    }

    return this.update(metric);
  }
  
  @Transactional()
  async sumOrReduceBookmarks(metric: PostMetric, action: ActionEnum): Promise<PostMetric> {
    if (action == ActionEnum.SUM) {
      metric.bookmarks += 1;
    }

    if (action == ActionEnum.REDUCE) {
      metric.bookmarks -= 1;
    }

    return this.update(metric);
  }

  @Transactional()
  async sumOrReduceShares(metric: PostMetric, action: ActionEnum): Promise<PostMetric> {
    if (action == ActionEnum.SUM) {
      metric.shares += 1;
    }

    if (action == ActionEnum.REDUCE) {
      metric.shares -= 1;
    }

    return this.update(metric);
  }
  
  @Transactional()
  async sumOrReduceLikesOrDislikes(metric: PostMetric, action: ActionEnum, likeOrDislike: LikeOrDislike): Promise<PostMetric> {
    if (action === ActionEnum.SUM && likeOrDislike === LikeOrDislike.LIKE) {
      metric.likes += 1;
    }

    if (action === ActionEnum.REDUCE && likeOrDislike === LikeOrDislike.LIKE) {
      metric.likes -= 1;
    }

    if (action === ActionEnum.SUM && likeOrDislike === LikeOrDislike.DISLIKE) {
      metric.dislikes += 1;
    }

    if (action === ActionEnum.REDUCE && likeOrDislike === LikeOrDislike.DISLIKE) {
      metric.dislikes -= 1;
    }

    return this.update(metric);
  }

  @Transactional()
  async sumOrReduceCommentsCount(metric: PostMetric, action: ActionEnum): Promise<PostMetric> {
    if (action == ActionEnum.SUM) {
      metric.commentsCount += 1;
    }

    if (action == ActionEnum.REDUCE) {
      metric.commentsCount -= 1;
    }

    return this.update(metric);
  }

  @Transactional()
  async sumOrReduceEditedCount(metric: PostMetric, action: ActionEnum): Promise<PostMetric> {
    if (action == ActionEnum.SUM) {
      metric.editedCount += 1;
    }

    if (action == ActionEnum.REDUCE) {
      metric.editedCount -= 1;
    }

    return this.update(metric);
  }

  @Transactional()
  async sumOrReduceFavoriteCount(metric: PostMetric, action: ActionEnum): Promise<PostMetric> {
    if (action == ActionEnum.SUM) {
      metric.favoriteCount += 1;
    }

    if (action == ActionEnum.REDUCE) {
      metric.favoriteCount -= 1;
    }

    return this.update(metric);
  }

  @Transactional()
  async create(post: Post): Promise<PostMetric> {

    const created = await this.repository.create({ post })
    return await this.repository.save(created);
  }

  async findOne(post: Post): Promise<PostMetric> {
    const metric: PostMetric | null = await this.repository.findOne({ where : { post } })

    if (metric == null) {
      throw new NotFoundException('Metric not found');
    }

    return metric;
  }

  @Transactional()
  async update(metric: PostMetric): Promise<PostMetric> {
    const existingMetric = await this.findOne(metric.post)

    metric.lastInteractionAt = new Date();
    metric.version = existingMetric.version;

    return await this.repository.save(metric);
  }

  async sameViewed(metric: PostMetric, amount: number = 1): Promise<PostMetric> {
    metric.viewed += amount;
    return await this.update(metric);
  }

}

