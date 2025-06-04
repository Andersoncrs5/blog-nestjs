import { BadRequestException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CommentMetric } from './entities/comment_metric.entity';
import { Repository } from 'typeorm';
import { Comment } from "../../src/comment/entities/comment.entity";
import { InjectRepository } from '@nestjs/typeorm';
import { Transactional } from 'typeorm-transactional';
import { ActionEnum } from 'src/user_metrics/action/ActionEnum.enum';
import { LikeOrDislike } from 'src/like/entities/likeOrDislike.enum';

@Injectable()
export class CommentMetricsService {
  constructor(
    @InjectRepository(CommentMetric)
    private readonly repository: Repository<CommentMetric>,
  ) {}  
  
  @Transactional()
  async sumOrReduceRepliesCount(metric: CommentMetric, action: ActionEnum) {
    if (action == ActionEnum.SUM) {
      metric.repliesCount += 1;
    }

    if (action == ActionEnum.REDUCE) {
      metric.repliesCount -= 1;
    }

    this.update(metric);
  }

  @Transactional()
  async sumOrReduceFavoritesCount(metric: CommentMetric, action: ActionEnum) {
    if (action == ActionEnum.SUM) {
      metric.favoritesCount += 1;
    }

    if (action == ActionEnum.REDUCE) {
      metric.favoritesCount -= 1;
    }

    this.update(metric);
  }

  @Transactional()
  async sumOrReduceReportCount(metric: CommentMetric, action: ActionEnum) {
    if (action == ActionEnum.SUM) {
      metric.reportCount += 1;
    }

    if (action == ActionEnum.REDUCE) {
      metric.reportCount -= 1;
    }

    this.update(metric);
  }

  @Transactional()
  async sumOrReduceDislikesOrLike(metric: CommentMetric, action: ActionEnum, likeOrDislike: LikeOrDislike) {
      if (action == ActionEnum.SUM  && likeOrDislike == LikeOrDislike.LIKE ) {
        metric.likes += 1;
      }
  
      if (action == ActionEnum.REDUCE && likeOrDislike == LikeOrDislike.LIKE ) {
        metric.likes -= 1;
      }
  
      if (action == ActionEnum.SUM && likeOrDislike == LikeOrDislike.DISLIKE ) {
        metric.dislikes += 1;
      }
  
      if (action == ActionEnum.REDUCE && likeOrDislike == LikeOrDislike.DISLIKE ) {
        metric.dislikes -= 1;
      }
  
      this.update(metric);
    }

  @Transactional()
  async sumOrReduceLikes(metric: CommentMetric, action: ActionEnum) {
    if (action == ActionEnum.SUM) {
      metric.likes += 1;
    }

    if (action == ActionEnum.REDUCE) {
      metric.likes -= 1;
    }

    this.update(metric);
  }

  @Transactional()
  async sumOrReduceEditedTimes(metric: CommentMetric, action: ActionEnum) {
    if (action == ActionEnum.SUM) {
      metric.editedTimes += 1;
    }

    if (action == ActionEnum.REDUCE) {
      metric.editedTimes -= 1;
    }

    this.update(metric);
  }

  @Transactional()
  async create(comment: Comment) {
    const data = { comment }

    const created = await this.repository.create(data);
    const save = await this.repository.save(created);
  }

  async findOne(comment: Comment) {
    if (comment == null) {
      throw new BadRequestException;
    }

    const metric: CommentMetric | null = await this.repository.findOne({ where: { comment } })

    if( metric == null) {
      throw new NotFoundException('Metric not found');
    }

    return metric;
  }

  @Transactional()
  async update(metric: CommentMetric) {
    const existingMetric = await this.findOne(metric.comment);

    metric.version = existingMetric.version;
    metric.lastInteractionAt = new Date

    await this.repository.update(existingMetric.id, metric);
  }

  @Transactional()
  async sumViewed(metric: CommentMetric, amount = 1) {
    metric.viewsCount += amount;
    await this.update(metric);
  }

}
