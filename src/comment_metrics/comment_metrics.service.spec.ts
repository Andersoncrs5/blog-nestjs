import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, Repository } from 'typeorm';
import { Comment } from '../../src/comment/entities/comment.entity'
import { User } from '../../src/user/entities/user.entity';
import { UserMetric } from '../../src/user_metrics/entities/user_metric.entity';
import { RecoverPassword } from '../../src/recover_password/entities/recover_password.entity';
import { Category } from '../../src/category/entities/category.entity';
import { Post } from '../../src/post/entities/post.entity';
import { PostMetric } from '../../src/post_metrics/entities/post_metric.entity';
import { addTransactionalDataSource, initializeTransactionalContext } from 'typeorm-transactional';
import * as redisStore from 'cache-manager-redis-store';
import { CACHE_MANAGER, CacheModule } from '@nestjs/cache-manager';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { FavoriteComment } from '../../src/favorite_comment/entities/favorite_comment.entity';
import { LikeComment } from '../../src/like_comment/entities/like_comment.entity';
import { Like } from '../../src/like/entities/like.entity';
import { CommentMetric } from '../../src/comment_metrics/entities/comment_metric.entity';
import { Follower } from '../../src/followers/entities/follower.entity';
import { UnitOfWorkModule } from '../../src/utils/UnitOfWork/UnitOfWork.module';
import { UserMetricsModule } from '../../src/user_metrics/user_metrics.module';
import { FavoritePost } from '../../src/favorite_post/entities/favorite_post.entity';
import { CommentMetricsService } from './comment_metrics.service';
import { CommentMetricsController } from './comment_metrics.controller';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ActionEnum } from '../../src/user_metrics/action/ActionEnum.enum';
import { LikeOrDislike } from '../../src/like/entities/likeOrDislike.enum';

let app;

describe('CommentMetricsService', () => {
  let service: CommentMetricsService;
  let repository: Repository<CommentMetric>;

  const mockUser: User = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    password: 'hashedpassword123',
    createdAt: new Date(),
    updatedAt: new Date(),
    refreshToken: null,
    isAdm: false,
    isBlocked: false,
    version: 0,
    posts: [],
    categories: [],
    comments: [],
    favoritePosts: [],
    favoriteComments: [],
    likes: [],
    metric: new UserMetric(),
    recover: new RecoverPassword(),
    likesComments: [],
    hashPassword: async function (): Promise<void> {
      throw new Error('Function not implemented.');
    }
  };

  const mockCategory: Category = {
    id: 1,
    name: 'home',
    nameUser: mockUser.name,
    isActived: true,
    version: 0,
    posts: [],
    user: mockUser,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockPost: Post = {
    id: 1,
    title: 'post 1',
    content: 'content post 1',
    isActived: false,
    isBlocked: false,
    version: 0,
    category: mockCategory,
    user: mockUser,
    comments: [],
    metric: new PostMetric,
    favoritePosts: [],
    likes: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockComment: Comment = {
    id: 1,
    nameUser: mockUser.name,
    content: 'content of comment',
    isEdited: false,
    isActived: true,
    isBlocked: false,
    parentId: 0,
    version: 0,
    user: mockUser,
    post: mockPost,
    metric: new CommentMetric,
    favoriteComments: [],
    likesComments: [],
    createdAt: new Date,
    updatedAt: new Date
  }

  const mockMetrics: CommentMetric = {
    id: 1,
    likes: 0,
    dislikes: 0,
    reportCount: 0,
    editedTimes: 0,
    engagementScore: 0,
    lastInteractionAt: new Date(),
    favoritesCount: 0,
    repliesCount: 0,
    viewsCount: 0,
    version: 0,
    comment: mockComment,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  beforeAll(async () => {
    initializeTransactionalContext();

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        CacheModule.registerAsync({
          isGlobal: true,
          useFactory: async () => ({
            store: redisStore as any,
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            ttl: parseInt(process.env.REDIS_TTL || '120'),
          }),
        }),
        TypeOrmModule.forRootAsync({
          useFactory() {
            return {
              type: 'postgres',
              host: 'localhost',
              port: 5432,
              username: 'postgres',
              password: '',
              database: 'test',
              dropSchema: true,
              entities: [
                User, Post, Category, Comment, FavoritePost, FavoriteComment,
                Like, UserMetric, RecoverPassword, LikeComment, PostMetric,
                CommentMetric, Follower
              ],
              autoLoadEntities: true,
              synchronize: true,
            };
          },
          async dataSourceFactory(options) {
            if (!options) throw new Error('Invalid options passed');
            return addTransactionalDataSource(new DataSource(options));
          }
        }),
        TypeOrmModule.forFeature([
          User, Post, Category, Comment, FavoritePost, FavoriteComment,
          Like, UserMetric, RecoverPassword, LikeComment, PostMetric,
          CommentMetric, Follower
        ]),
        UnitOfWorkModule,
        UserMetricsModule
      ],
      
      controllers: [CommentMetricsController],
      providers: [CommentMetricsService],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    service = moduleRef.get<CommentMetricsService>(CommentMetricsService);
    repository = moduleRef.get<Repository<CommentMetric>>(getRepositoryToken(CommentMetric));
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentMetricsService,
        {
          provide: getRepositoryToken(CommentMetric),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CommentMetricsService>(CommentMetricsService);
    repository = module.get<Repository<CommentMetric>>(getRepositoryToken(CommentMetric));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should retrun comment metrics', async () => {
    const findOneSpy = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(mockMetrics);

    const result: CommentMetric = await service.findOne(mockComment);

    expect(result.id).toBe(mockMetrics.id)
    expect(result.comment.id).toBe(mockMetrics.comment.id)

    expect(findOneSpy).toHaveBeenCalledWith(({ where: { comment: mockComment } }));
  });

  it('should throw badRequest', async () => {
    const comment: Comment = Object.assign(new Comment(), mockComment, { id: 0 })

    await expect(service.findOne(comment)).rejects.toThrow(BadRequestException)
  });

  it('should throw not found', async () => {
    const findOneSpy = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(null);

    await expect(service.findOne(mockComment)).rejects.toThrow(NotFoundException);

    expect(findOneSpy).toHaveBeenCalledWith(({ where: { comment: mockComment } }));
  });

  it('should sum Replies Count', async () => {
    const metric = Object.assign(new CommentMetric(), mockMetrics, { repliesCount: 0 })
    const value = metric.repliesCount + 1;

    const findOneSpy = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(metric);
    const updateSpy = jest.spyOn(service['repository'], 'update').mockResolvedValue({ affected: 1 } as any);

    const result = await service.sumOrReduceRepliesCount(metric, ActionEnum.SUM);

    expect(result.id).toBe(metric.id)
    expect(result.comment.id).toBe(metric.comment.id)
    expect(result.repliesCount).toBe(value)

    expect(findOneSpy).toHaveBeenCalledWith(({ where: { comment: mockComment } }));
  });

  it('should red Replies Count', async () => {
    const metric = Object.assign(new CommentMetric(), mockMetrics, { repliesCount: 1 })
    const value = metric.repliesCount - 1;

    const findOneSpy = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(metric);
    const updateSpy = jest.spyOn(service['repository'], 'update').mockResolvedValue({ affected: 1 } as any);

    const result = await service.sumOrReduceRepliesCount(metric, ActionEnum.REDUCE);

    expect(result.id).toBe(metric.id)
    expect(result.comment.id).toBe(metric.comment.id)
    expect(result.repliesCount).toBe(value)

    expect(findOneSpy).toHaveBeenCalledWith(({ where: { comment: mockComment } }));
  });

  it('should sum favoritesCount', async () => {
    const metric = Object.assign(new CommentMetric(), mockMetrics, { favoritesCount: 0 })
    const value = metric.favoritesCount + 1;

    const findOneSpy = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(metric);
    const updateSpy = jest.spyOn(service['repository'], 'update').mockResolvedValue({ affected: 1 } as any);

    const result = await service.sumOrReduceFavoritesCount(metric, ActionEnum.SUM);

    expect(result.id).toBe(metric.id)
    expect(result.comment.id).toBe(metric.comment.id)
    expect(result.favoritesCount).toBe(value)

    expect(findOneSpy).toHaveBeenCalledWith(({ where: { comment: mockComment } }));
  });

  it('should red favorites Count', async () => {
    const metric = Object.assign(new CommentMetric(), mockMetrics, { favoritesCount: 1 })
    const value = metric.favoritesCount - 1;

    const findOneSpy = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(metric);
    const updateSpy = jest.spyOn(service['repository'], 'update').mockResolvedValue({ affected: 1 } as any);

    const result = await service.sumOrReduceFavoritesCount(metric, ActionEnum.REDUCE);

    expect(result.id).toBe(metric.id)
    expect(result.comment.id).toBe(metric.comment.id)
    expect(result.favoritesCount).toBe(value)

    expect(findOneSpy).toHaveBeenCalledWith(({ where: { comment: mockComment } }));
  });

  it('should sum reportCount', async () => {
    const metric = Object.assign(new CommentMetric(), mockMetrics, { reportCount: 0 })
    const value = metric.reportCount + 1;

    const findOneSpy = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(metric);
    const updateSpy = jest.spyOn(service['repository'], 'update').mockResolvedValue({ affected: 1 } as any);

    const result = await service.sumOrReduceReportCount(metric, ActionEnum.SUM);

    expect(result.id).toBe(metric.id)
    expect(result.comment.id).toBe(metric.comment.id)
    expect(result.reportCount).toBe(value)

    expect(findOneSpy).toHaveBeenCalledWith(({ where: { comment: mockComment } }));
  });

  it('should red report Count', async () => {
    const metric = Object.assign(new CommentMetric(), mockMetrics, { reportCount: 1 })
    const value = metric.reportCount - 1;

    const findOneSpy = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(metric);
    const updateSpy = jest.spyOn(service['repository'], 'update').mockResolvedValue({ affected: 1 } as any);

    const result = await service.sumOrReduceReportCount(metric, ActionEnum.REDUCE);

    expect(result.id).toBe(metric.id)
    expect(result.comment.id).toBe(metric.comment.id)
    expect(result.reportCount).toBe(value)

    expect(findOneSpy).toHaveBeenCalledWith(({ where: { comment: mockComment } }));
  });

  it('should sum editedTimes', async () => {
    const metric = Object.assign(new CommentMetric(), mockMetrics, { editedTimes: 0 })
    const value = metric.editedTimes + 1;

    const findOneSpy = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(metric);
    const updateSpy = jest.spyOn(service['repository'], 'update').mockResolvedValue({ affected: 1 } as any);

    const result = await service.sumOrReduceEditedTimes(metric, ActionEnum.SUM);

    expect(result.id).toBe(metric.id)
    expect(result.comment.id).toBe(metric.comment.id)
    expect(result.editedTimes).toBe(value)

    expect(findOneSpy).toHaveBeenCalledWith(({ where: { comment: mockComment } }));
  });

  it('should red editedTimes', async () => {
    const metric = Object.assign(new CommentMetric(), mockMetrics, { editedTimes: 1 })
    const value = metric.editedTimes - 1;

    const findOneSpy = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(metric);
    const updateSpy = jest.spyOn(service['repository'], 'update').mockResolvedValue({ affected: 1 } as any);

    const result = await service.sumOrReduceEditedTimes(metric, ActionEnum.REDUCE);

    expect(result.id).toBe(metric.id)
    expect(result.comment.id).toBe(metric.comment.id)
    expect(result.editedTimes).toBe(value)

    expect(findOneSpy).toHaveBeenCalledWith(({ where: { comment: mockComment } }));
  });

  it('should sum like', async () => {
    const metric = Object.assign(new CommentMetric(), mockMetrics, { likes: 0 })
    const value = metric.likes + 1;

    const findOneSpy = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(metric);
    const updateSpy = jest.spyOn(service['repository'], 'update').mockResolvedValue({ affected: 1 } as any);

    const result = await service.sumOrReduceDislikesOrLike(metric, ActionEnum.SUM, LikeOrDislike.LIKE);

    expect(result.id).toBe(metric.id)
    expect(result.comment.id).toBe(metric.comment.id)
    expect(result.likes).toBe(value)
    expect(result.dislikes).toBe(metric.dislikes)

    expect(findOneSpy).toHaveBeenCalledWith(({ where: { comment: mockComment } }));
  });

  it('should sum dislike', async () => {
    const metric = Object.assign(new CommentMetric(), mockMetrics, { dislikes: 0 })
    const value = metric.dislikes + 1;

    const findOneSpy = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(metric);
    const updateSpy = jest.spyOn(service['repository'], 'update').mockResolvedValue({ affected: 1 } as any);

    const result = await service.sumOrReduceDislikesOrLike(metric, ActionEnum.SUM, LikeOrDislike.DISLIKE);

    expect(result.id).toBe(metric.id)
    expect(result.comment.id).toBe(metric.comment.id)
    expect(result.dislikes).toBe(value)
    expect(result.likes).toBe(metric.likes)

    expect(findOneSpy).toHaveBeenCalledWith(({ where: { comment: mockComment } }));
  });

  it('should reduce like', async () => {
    const metric = Object.assign(new CommentMetric(), mockMetrics, { likes: 1 })
    const value = metric.likes - 1;

    const findOneSpy = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(metric);
    const updateSpy = jest.spyOn(service['repository'], 'update').mockResolvedValue({ affected: 1 } as any);

    const result = await service.sumOrReduceDislikesOrLike(metric, ActionEnum.REDUCE, LikeOrDislike.LIKE);

    expect(result.id).toBe(metric.id)
    expect(result.comment.id).toBe(metric.comment.id)
    expect(result.likes).toBe(value)
    expect(result.dislikes).toBe(metric.dislikes)

    expect(findOneSpy).toHaveBeenCalledWith(({ where: { comment: mockComment } }));
  });

  it('should reduce dislike', async () => {
    const metric = Object.assign(new CommentMetric(), mockMetrics, { dislikes: 1 })
    const value = metric.dislikes - 1;

    const findOneSpy = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(metric);
    const updateSpy = jest.spyOn(service['repository'], 'update').mockResolvedValue({ affected: 1 } as any);

    const result = await service.sumOrReduceDislikesOrLike(metric, ActionEnum.REDUCE, LikeOrDislike.DISLIKE);

    expect(result.id).toBe(metric.id)
    expect(result.comment.id).toBe(metric.comment.id)
    expect(result.dislikes).toBe(value)
    expect(result.likes).toBe(metric.likes)

    expect(findOneSpy).toHaveBeenCalledWith(({ where: { comment: mockComment } }));
  });

  it('should sum views Count', async () => {
    const metric = Object.assign(new CommentMetric(), mockMetrics, { viewsCount: 0 })
    const value = metric.viewsCount + 1;

    const findOneSpy = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(metric);
    const updateSpy = jest.spyOn(service['repository'], 'update').mockResolvedValue({ affected: 1 } as any);

    const result = await service.sumViewed(metric, 1);

    expect(result.id).toBe(metric.id)
    expect(result.comment.id).toBe(metric.comment.id)
    expect(result.viewsCount).toBe(value)

    expect(findOneSpy).toHaveBeenCalledWith(({ where: { comment: mockComment } }));
  });

  it('should update the metric', async () => {
    const metric = Object.assign(new CommentMetric(), mockMetrics)

    const updateSpy = jest.spyOn(service['repository'], 'update').mockResolvedValue({ affected: 1 } as any);
    const findOneSpy = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(metric);

    const result = await service.update(metric);

    expect(result.id).toBe(metric.id)
    expect(result.comment.id).toBe(metric.comment.id)

    expect(findOneSpy).toHaveBeenCalledWith(({ where: { comment: mockComment } }));
  });

  it('should create a metric ', async () => {
    const createSpy = jest.spyOn(service['repository'], 'create').mockReturnValue(mockMetrics)
    const saveSpy = jest.spyOn(service['repository'], 'save').mockResolvedValue(mockMetrics)

    const result = await service.create(mockComment);

    expect(result.id).toBe(mockMetrics.id)
    expect(result.comment.id).toBe(mockMetrics.comment.id)

    expect(createSpy).toHaveBeenCalledWith({ comment: mockComment });
    expect(saveSpy).toHaveBeenCalledWith(mockMetrics)
  });

});