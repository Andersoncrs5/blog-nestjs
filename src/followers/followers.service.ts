import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { User } from '../../src/user/entities/user.entity';
import { Follower } from './entities/follower.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional, Propagation } from 'typeorm-transactional';

@Injectable()
export class FollowersService {
  constructor(
    @InjectRepository(Follower)
    private readonly repository: Repository<Follower>,
  ) {}

  @Transactional()
  async create(follower: User, following: User): Promise<Follower> {
    const exists: boolean = await this.repository.exists({ where: { follower, following } });

    if (exists) {
      throw new BadRequestException(`You already follow the user: ${following.name}`);
    }

    const data = this.repository.create({ follower, following });
    return await this.repository.save(data);
  }

  @Transactional()
  async findAllFollower(follower: User): Promise<Follower[]> {
    return await this.repository.find({ where: { follower } });
  }

  @Transactional()
  async findAllFollowing(following: User): Promise<Follower[]> {
    return await this.repository.find({ where: { following } });
  }

  @Transactional()
  async checkIfFollowing(follower: User, following: User): Promise<boolean> {
    return await this.repository.exists({ where: { follower, following } });
  }

  @Transactional()
  async remove(id: number, follower: User): Promise<void> {
    if (!id || isNaN(id) || id <= 0) {
      throw new BadRequestException('ID must be a positive number');
    }

    const result: Follower | null = await this.repository.findOne({
      where: { id }
    });

    if (!result) {
      throw new NotFoundException('Follow relationship not found');
    }

    if (result.follower.id !== follower.id) {
      throw new BadRequestException('You do not have permission to remove this follow');
    }

    await this.repository.delete(result.id);
  }

}