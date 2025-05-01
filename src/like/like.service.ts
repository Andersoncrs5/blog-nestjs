import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateLikeDto } from './dto/create-like.dto';
import { Repository } from 'typeorm';
import { Like } from './entities/like.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { Post } from 'src/post/entities/post.entity';
import { UserService } from 'src/user/user.service';
import { PostService } from 'src/post/post.service';

@Injectable()
export class LikeService {
  constructor(
    @InjectRepository(Like)
    private readonly repository: Repository<Like>,
    private readonly userService : UserService,
    private readonly postService : PostService,
  ) {}

  async create(createLikeDto: CreateLikeDto): Promise<Like> {
    const queryRunner = this.repository.manager.connection.createQueryRunner();
    await queryRunner.startTransaction();

    const user = await this.userService.findOne(createLikeDto.userId);
    const post = await this.postService.findOne(createLikeDto.postId);

    const existingLike = await this.repository.findOne({ where: { user: { id: user.id }, post: { id: post.id } } });
    if (existingLike) throw new BadRequestException('This post is already liked');

    try {
      const like = queryRunner.manager.create(Like, { user, post });
      const created = await queryRunner.manager.save(like);
      await queryRunner.commitTransaction();
      return created;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAllOfUser(id: number, page: number, limit: number){
    const user = await this.userService.findOne(id);

    const [likes, count] = await this.repository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { id: 'ASC' },
      where: { user: { id } },
      relations : ['post']
    })

    return {
      data: likes,
      totalItems: count,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
    };
  }

  async findOne(id: number): Promise<Like> {
    const like = await this.repository.findOne({ where: { id }, relations: ['user', 'post'] });
    if (!like) throw new NotFoundException(`Like not found with id ${id}`);
    return like;
  }

  async exists(userId: number, postId: number): Promise<boolean> {
    const count = await this.repository.count({ where: { user: { id: userId }, post: { id: postId } } });
    return count > 0;
  }

  async remove(id: number): Promise<string> {
    const queryRunner = this.repository.manager.connection.createQueryRunner();
    await queryRunner.startTransaction();

    try {
      const like = await this.findOne(id);

      await queryRunner.manager.delete(Like, id);
      await queryRunner.commitTransaction();

      return `Like removed with id: ${id}`;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async CountLikeByPost(id: number): Promise<number> {
    const postExists = await this.postService.findOne(id);

    return await this.repository.count({ where: { post: { id } } });
  }

}
