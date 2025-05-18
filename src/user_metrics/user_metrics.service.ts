import { BadRequestException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Transactional } from 'typeorm-transactional';
import { UserMetric } from './entities/user_metric.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UserService } from '../../src/user/user.service';
import { User } from '../../src/user/entities/user.entity';

@Injectable()
export class UserMetricsService {
  constructor (
    @InjectRepository(UserMetric)
    private readonly repository: Repository<UserMetric>,
    
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService
  ) {}

  @Transactional()
  async create(user: User) {
    if (user == null) {
      throw new BadRequestException('User is required');
    }

    const data = { user }

    const created = await this.repository.create(data);
    await this.repository.save(created);
  }

  @Transactional()
  async findOne(userId: number): Promise<UserMetric> {
    const user: User = await this.userService.findOne(userId);
    const metric = await this.repository.findOne({ where: { user } })

    if (metric == null) {
      throw new NotFoundException;
    }

    return metric;
  }

  @Transactional()
  async update(metric: UserMetric) {
    const existingMetric: UserMetric = await this.findOne(metric.user.id);

    metric.lastActivity = new Date();
    metric.version = existingMetric.version;

    await this.repository.save(metric);
  }
}
