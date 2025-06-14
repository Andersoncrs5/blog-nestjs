import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { FavoritePost } from './entities/favorite_post.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Propagation, Transactional } from 'typeorm-transactional';
import { User } from '../../src/user/entities/user.entity';
import { Post } from '../../src/post/entities/post.entity';
import { IPaginationMeta, paginate, Pagination } from 'nestjs-typeorm-paginate';

@Injectable()
export class FavoritePostService {
  constructor(
    @InjectRepository(FavoritePost)
    private readonly repository: Repository<FavoritePost>,
  ) {}

  @Transactional()
  async create(user: User, post: Post, ): Promise<FavoritePost> {
    const existingFavorite: FavoritePost | null = await this.repository.findOne({ where: { user: { id: user.id }, post: { id: post.id } } });
    if (existingFavorite) throw new BadRequestException('This post is already in favorites');

    const created: FavoritePost = this.repository.create({ user, post });

    return await this.repository.save(created);
  }

  @Transactional()
  async findAllOfUser(user: User, page: number, limit: number) {
    const [result, count] = await this.repository.findAndCount({ 
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'ASC' },
      where: { user },
    });

    return {
      data: result,
      totalItems: count,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
    };
  }

  @Transactional()
  async exists(user: User, post: Post): Promise<boolean> {
    const count = await this.repository.count({ where: { user, post } });
    return count > 0;
  }

  @Transactional()
  async remove(id: number, user: User): Promise<void> {
    const favoritePost: FavoritePost | null = await this.repository.findOne({ where: { id } });
    if (!favoritePost) throw new NotFoundException(`Favorite post not found`);

    if (favoritePost.user.id !== user.id) { 
      throw new BadRequestException('You do not have permission to remove this favorite'); 
    }

    await this.repository.delete(favoritePost);
  }
}