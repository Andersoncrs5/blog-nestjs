import { Injectable, NotFoundException } from '@nestjs/common';
import { Post } from '../../src/post/entities/post.entity';
import { PostMetric } from './entities/post_metric.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Transactional } from 'typeorm-transactional';
import { ActionEnum } from '../../src/user_metrics/action/ActionEnum.enum';

@Injectable()
export class PostMetricsService {
  constructor (
    @InjectRepository(PostMetric)
    private readonly repository: Repository<PostMetric>,
  ) {}

  @Transactional()
  async setLastInteractionAt(metric: PostMetric) {

    metric.lastInteractionAt = new Date();
    await this.update(metric);
  }
  
  @Transactional()
  async sumOrReduceViewed(metric: PostMetric, action: ActionEnum) {
    if (action == ActionEnum.SUM) {
      metric.viewed += 1;
    }

    if (action == ActionEnum.REDUCE) {
      metric.viewed -= 1;
    }

    this.update(metric);
  }
  
  @Transactional()
  async sumOrReduceBookmarks(metric: PostMetric, action: ActionEnum) {
    if (action == ActionEnum.SUM) {
      metric.bookmarks += 1;
    }

    if (action == ActionEnum.REDUCE) {
      metric.bookmarks -= 1;
    }

    this.update(metric);
  }

  @Transactional()
  async sumOrReduceShares(metric: PostMetric, action: ActionEnum) {
    if (action == ActionEnum.SUM) {
      metric.shares += 1;
    }

    if (action == ActionEnum.REDUCE) {
      metric.shares -= 1;
    }

    this.update(metric);
  }
  
  @Transactional()
  async sumOrReduceDislikes(metric: PostMetric, action: ActionEnum) {
    if (action == ActionEnum.SUM) {
      metric.dislikes += 1;
    }

    if (action == ActionEnum.REDUCE) {
      metric.dislikes -= 1;
    }

    this.update(metric);
  }

  @Transactional()
  async sumOrReduceLikes(metric: PostMetric, action: ActionEnum) {
    if (action == ActionEnum.SUM) {
      metric.likes += 1;
    }

    if (action == ActionEnum.REDUCE) {
      metric.likes -= 1;
    }

    this.update(metric);
  }

  @Transactional()
  async sumOrReduceCommentsCount(metric: PostMetric, action: ActionEnum) {
    if (action == ActionEnum.SUM) {
      metric.commentsCount += 1;
    }

    if (action == ActionEnum.REDUCE) {
      metric.commentsCount -= 1;
    }

    this.update(metric);
  }

  @Transactional()
  async sumOrReduceEditedCount(metric: PostMetric, action: ActionEnum) {
    if (action == ActionEnum.SUM) {
      metric.editedCount += 1;
    }

    if (action == ActionEnum.REDUCE) {
      metric.editedCount -= 1;
    }

    this.update(metric);
  }

  @Transactional()
  async sumOrReduceFavoriteCount(metric: PostMetric, action: ActionEnum) {
    if (action == ActionEnum.SUM) {
      metric.favoriteCount += 1;
    }

    if (action == ActionEnum.REDUCE) {
      metric.favoriteCount -= 1;
    }

    this.update(metric);
  }

  @Transactional()
  async create(post: Post) {
    const data = { post }

    const created = await this.repository.create(data)
    await this.repository.save(created);
  }

  async findOne(post: Post) {
    const metric: PostMetric | null = await this.repository.findOne({ where : { post } })

    if (metric == null) {
      throw new NotFoundException('Metric not found');
    }

    return metric;
  }

  @Transactional()
  async update(metric: PostMetric) {
    const existingMetric = await this.findOne(metric.post)

    metric.lastInteractionAt = new Date();
    metric.version = existingMetric.version;

    await this.repository.save(metric);
  }

  async sameViewed(metric: PostMetric, amount: number = 1) {
    metric.viewed += amount;
    await this.update(metric);
  }

}

