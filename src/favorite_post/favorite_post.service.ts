import { BadRequestException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateFavoritePostDto } from './dto/create-favorite_post.dto';
import { Repository } from 'typeorm';
import { FavoritePost } from './entities/favorite_post.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UserService } from '../../src/user/user.service';
import { PostService } from '../../src/post/post.service';
import { Transactional } from 'typeorm-transactional';
import { UserMetricsService } from '../../src/user_metrics/user_metrics.service';
import { UserMetric } from '../../src/user_metrics/entities/user_metric.entity';
import { PostMetricsService } from '../../src/post_metrics/post_metrics.service';
import { PostMetric } from '../../src/post_metrics/entities/post_metric.entity';

@Injectable()
export class FavoritePostService {
  constructor(
    @InjectRepository(FavoritePost)
    private readonly repository: Repository<FavoritePost>,

    @Inject(forwardRef(() => UserService))
    private readonly userService : UserService,

    @Inject(forwardRef(() => PostService))
    private readonly postService : PostService,

    @Inject(forwardRef(() => UserMetricsService))
    private readonly userMetricService: UserMetricsService,

    @Inject(forwardRef(() => PostMetricsService))
    private readonly postMetricService: PostMetricsService
  ) {}

  @Transactional()
  async create(createFavoritePostDto: CreateFavoritePostDto): Promise<FavoritePost> {
    const user = await this.userService.findOne(createFavoritePostDto.userId);
    const post = await this.postService.findOne(createFavoritePostDto.postId);

    const existingFavorite = await this.repository.findOne({ where: { user: { id: user.id }, post: { id: post.id } } });
    if (existingFavorite) throw new BadRequestException('This post is already in favorites');

    const data = { user, post }

    const created = await this.repository.create(data);

    const userMetric: UserMetric = await this.userMetricService.findOne(user.id);
    userMetric.savedPostsCount += 1;
    await this.userMetricService.update(userMetric);

    const postMetric: PostMetric = await this.postMetricService.findOne(post.id);
    postMetric.favoriteCount += 1;
    await this.postMetricService.update(postMetric);

    return await this.repository.save(created);
  }

  async findAllOfUser(id: number, page: number, limit: number) {
    const user = await this.userService.findOne(id);

    const [result, count] = await this.repository.findAndCount({ 
      skip: (page - 1) * limit,
      take: limit,
      order: { id: 'ASC' },
      where: { user: { id } }, 
      relations: ['post'] 
    });

    return {
      data: result,
      totalItems: count,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
    };
  }

  async exists(idUser: number, idPost: number): Promise<boolean> {
    const user = await this.userService.findOne(idUser);
    const post = await this.postService.findOne(idPost);

    const count = await this.repository.count({ where: { user: { id: idUser }, post: { id: idPost } } });
    return count > 0;
  }

  @Transactional()
  async remove(id: number): Promise<string> {
    const queryRunner = this.repository.manager.connection.createQueryRunner();
    await queryRunner.startTransaction();

    const favoritePost = await this.repository.findOne({ where: { id } });
    if (!favoritePost) throw new NotFoundException(`Favorite post not found with id: ${id}`);

    await this.repository.delete(favoritePost);

    const userMetric: UserMetric = await this.userMetricService.findOne(favoritePost.user.id);
    userMetric.savedPostsCount -= 1;
    await this.userMetricService.update(userMetric);

    const postMetric: PostMetric = await this.postMetricService.findOne(favoritePost.post.id);
    postMetric.favoriteCount += 1;
    await this.postMetricService.update(postMetric);

    return `Favorite post deleted with id: ${id}`;
  }
}
