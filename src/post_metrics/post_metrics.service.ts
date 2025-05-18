import { BadRequestException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Post } from '../../src/post/entities/post.entity';
import { PostMetric } from './entities/post_metric.entity';
import { Repository } from 'typeorm';
import { PostService } from '../../src/post/post.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Transactional } from 'typeorm-transactional';

@Injectable()
export class PostMetricsService {
  constructor (
    @InjectRepository(PostMetric)
    private readonly repository: Repository<PostMetric>,

    @Inject(forwardRef(() => PostService))
    private readonly postService : PostService,
  ) {}

  @Transactional()
  async create(post: Post) {
    const data = { post }

    const created = await this.repository.create(data)
    const save = await this.repository.save(created);
  }

  async findOne(id: number) {
    if (!id || isNaN(id) || id <= 0) {
      throw new BadRequestException('ID must be a positive number');
    }

    const post: Post = await this.postService.findOne(id);
    const metric: PostMetric | null = await this.repository.findOne({ where : { post } })

    if (metric == null) {
      throw new NotFoundException('Metric not found');
    }

    return metric;
  }

  @Transactional()
  async update(metric: PostMetric) {
    const existingMetric = await this.findOne(metric.post.id)

    metric.lastInteractionAt = new Date();
    metric.version = existingMetric.version;

    await this.repository.save(metric);
  }

  async sameViewed(postId: number, amount: number = 1) {
    const metric = await this.findOne(postId)
    metric.viewed += amount;
    await this.update(metric);
  }

}

