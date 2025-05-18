import { BadRequestException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CommentService } from 'src/comment/comment.service';
import { CommentMetric } from './entities/comment_metric.entity';
import { Repository } from 'typeorm';
import { Comment } from "../../src/comment/entities/comment.entity";
import { InjectRepository } from '@nestjs/typeorm';
import { Transactional } from 'typeorm-transactional';

@Injectable()
export class CommentMetricsService {
  constructor(
    @InjectRepository(CommentMetric)
    private readonly repository: Repository<CommentMetric>,

    @Inject(forwardRef(() => CommentService))
    private readonly commentService: CommentService
  ) {}

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
  async sumViewed(id: number, amount = 1) {
    const comment = await this.commentService.findOne(id)
    const metric = await this.findOne(comment);

    metric.viewsCount += amount;
    await this.update(metric);
  }

}
