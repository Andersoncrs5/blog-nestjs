import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Comment } from '../../src/comment/entities/comment.entity';
import { User } from '../../src/user/entities/user.entity';
import { Propagation, Transactional } from 'typeorm-transactional';
import { FavoriteComment } from './entities/favorite_comment.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class FavoriteCommentService {
  constructor(
    @InjectRepository(FavoriteComment)
    private readonly repository: Repository<FavoriteComment>,
  ) {}

  @Transactional()
  async create(user: User, comment: Comment): Promise<FavoriteComment> {
    const check: boolean = await this.repository.exists({ where: { user, comment } });

    if(check) { throw new ConflictException('You already to favorite this comment'); }

    const created = this.repository.create({ user, comment });

    return await this.repository.save(created);
  }

  @Transactional()
  async existsItem(user: User, comment: Comment): Promise<boolean> {
    return await this.repository.exists({ where: { user, comment } });
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
  async findOne(id: number): Promise<FavoriteComment> {
    if (!id || isNaN(id) || id <= 0) {
      throw new BadRequestException('ID must be a positive number');
    }
    
    const favorite: FavoriteComment | null = await this.repository.findOne({ where: { id } })

    if (!favorite) { throw new NotFoundException('Favorite not found'); }

    return favorite;
  }

  @Transactional()
  async remove(favorite: FavoriteComment, user: User): Promise<FavoriteComment> {
    if (favorite.user.id !== user.id) { 
      throw new BadRequestException('You do not have permission to remove this favorite'); 
    }

    await this.repository.delete(favorite);
    return favorite;
  }
}
