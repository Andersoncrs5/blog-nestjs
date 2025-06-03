import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Comment } from 'src/comment/entities/comment.entity';
import { User } from 'src/user/entities/user.entity';
import { Transactional } from 'typeorm-transactional';
import { FavoriteComment } from './entities/favorite_comment.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { paginate } from 'nestjs-typeorm-paginate';

@Injectable()
export class FavoriteCommentService {
  constructor(
    @InjectRepository(FavoriteComment)
    private readonly repository: Repository<FavoriteComment>,
  ) {}

  @Transactional()
  async create(user: User, comment: Comment) {
    const data = { user, comment }

    if(await this.existsItem(user, comment)) { throw new ConflictException(); }

    const save = await this.repository.save(data);

    await this.repository.create(save);

    return save;
  }

  async existsItem(user: User, comment: Comment): Promise<boolean> {
    return await this.repository.exists({ where: { user, comment } });
  }

  async findAllOfUser(user: User, page: number, limit: number) {
    const queryBuilder = this.repository.createQueryBuilder('favorite_post')
      .where('favorite_post.userId = :userId', { userId: user.id })
      .orderBy('favorite_post.id', 'ASC');

    return paginate(queryBuilder, {
      page,
      limit,
      route: '/post/findAllOfUser',
    });
  }

  async findOne(id: number): Promise<FavoriteComment> {
    const favorite: FavoriteComment | null = await this.repository.findOne({ where: { id } })

    if (!favorite) { throw new NotFoundException(''); }

    return favorite;
  }

  @Transactional()
  async remove(favorite: FavoriteComment) {
    await this.repository.delete(favorite);
    return favorite;
  }
}
