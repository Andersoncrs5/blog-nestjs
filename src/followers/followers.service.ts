import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { User } from '../../src/user/entities/user.entity';
import { Follower } from './entities/follower.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class FollowersService {
  constructor(
    @InjectRepository(Follower)
    private readonly repository: Repository<Follower>,
  ) {}

  async create(follower: User, following: User): Promise<Follower> {
    const exists = await this.repository.findOne({ where: { follower, following } });

    if (exists) {
      throw new BadRequestException(`You already follow the user: ${following.name}`);
    }

    const data = this.repository.create({ follower, following });
    return await this.repository.save(data);
  }

  async findAllFollower(follower: User): Promise<Follower[]> {
    return await this.repository.find({ where: { follower } });
  }

  async findAllFollowing(following: User): Promise<Follower[]> {
    return await this.repository.find({ where: { following } });
  }

  async checkIfFollowing(follower: User, following: User): Promise<boolean> {
    const exists = await this.repository.findOne({ where: { follower, following } });
    return !!exists;
  }

  async remove(id: number, follower: User): Promise<void> {
    if (!id || isNaN(id) || id <= 0) {
      throw new BadRequestException('ID must be a positive number');
    }

    const result: Follower | null = await this.repository.findOne({
      where: { id },
      relations: ['follower'],
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