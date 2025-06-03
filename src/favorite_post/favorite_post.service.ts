import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { FavoritePost } from './entities/favorite_post.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Transactional } from 'typeorm-transactional';
import { User } from 'src/user/entities/user.entity';
import { Post } from 'src/post/entities/post.entity';
import { paginate } from 'nestjs-typeorm-paginate';

@Injectable()
export class FavoritePostService {
  constructor(
    @InjectRepository(FavoritePost)
    private readonly repository: Repository<FavoritePost>,
  ) {}

  @Transactional()
  async create(user: User, post: Post, ): Promise<FavoritePost> {
    const existingFavorite = await this.repository.findOne({ where: { user: { id: user.id }, post: { id: post.id } } });
    if (existingFavorite) throw new BadRequestException('This post is already in favorites');

    const data = { user, post }

    const created = await this.repository.create(data);

    return await this.repository.save(created);
  }

  async findAllOfUser(user: User, page: number, limit: number) {
    const queryBuilder = this.repository
      .createQueryBuilder('favorite_post')
      .leftJoinAndSelect('favorite_post.post', 'post')
      .where('favorite_post.userId = :userId', { userId: user.id })
      .orderBy('favorite_post.id', 'ASC');

    return paginate(queryBuilder, {
      page,
      limit,
      route: '/like/findAllofUser',
    });
  }


  async exists(user: User, post: Post): Promise<boolean> {
    const count = await this.repository.count({ where: { user, post } });
    return count > 0;
  }

  @Transactional()
  async remove(id: number): Promise<void> {
    const favoritePost = await this.repository.findOne({ where: { id } });
    if (!favoritePost) throw new NotFoundException(`Favorite post not found with id: ${id}`);

    await this.repository.delete(favoritePost);
  }
}
