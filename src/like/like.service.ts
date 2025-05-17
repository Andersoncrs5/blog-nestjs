import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateLikeDto } from './dto/create-like.dto';
import { Repository } from 'typeorm';
import { Like } from './entities/like.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { Post } from 'src/post/entities/post.entity';
import { UserService } from 'src/user/user.service';
import { PostService } from 'src/post/post.service';
import { Transactional } from 'typeorm-transactional';

@Injectable()
export class LikeService {
  constructor(
    @InjectRepository(Like)
    private readonly repository: Repository<Like>,
    private readonly userService : UserService,
    private readonly postService : PostService,
  ) {}

  @Transactional()
  async create(createLikeDto: CreateLikeDto): Promise<Like> {
    const user = await this.userService.findOne(createLikeDto.userId);
    const post = await this.postService.findOne(createLikeDto.postId);

    const existingLike = await this.repository.findOne({ where: { user: { id: user.id }, post: { id: post.id } } });
    if (existingLike) throw new BadRequestException('This post is already liked');

    const data = { user, post }

    const created = this.repository.create(data);
    const save = this.repository.save(created);

    return save;
  }

  async findAllOfUser(id: number, page: number, limit: number){
    await this.userService.findOne(id);

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

  @Transactional()
  async remove(id: number): Promise<string> {
      const like = await this.findOne(id);
      this.repository.delete(like);

      return `Like removed with id: ${id}`;
  }

  async CountLikeByPost(id: number): Promise<number> {
    const postExists = await this.postService.findOne(id);

    return await this.repository.count({ where: { post: { id } } });
  }

}