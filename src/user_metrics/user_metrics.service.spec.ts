import { Test, TestingModule } from '@nestjs/testing';
import { UserMetricsService } from './user_metrics.service';
import { DataSource, Repository } from 'typeorm';
import { User } from '../../src/user/entities/user.entity';
import { addTransactionalDataSource, initializeTransactionalContext } from 'typeorm-transactional';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Post } from '../../src/post/entities/post.entity';
import { Category } from '../../src/category/entities/category.entity';
import { Comment } from '../../src/comment/entities/comment.entity';
import { FavoritePost } from '../../src/favorite_post/entities/favorite_post.entity';
import { FavoriteComment } from '../../src/favorite_comment/entities/favorite_comment.entity';
import { UserMetric } from '../../src/user_metrics/entities/user_metric.entity';
import { Like } from '../../src/like/entities/like.entity';
import { RecoverPassword } from '../../src/recover_password/entities/recover_password.entity';
import { LikeComment } from '../../src/like_comment/entities/like_comment.entity';
import { PostMetric } from '../../src/post_metrics/entities/post_metric.entity';
import { CommentMetric } from '../../src/comment_metrics/entities/comment_metric.entity';
import { UnitOfWorkModule } from '../../src/utils/UnitOfWork/UnitOfWork.module';
import { UserMetricsModule } from './user_metrics.module';
import { UserMetricsController } from './user_metrics.controller';
import { NotFoundException } from '@nestjs/common';
import { ActionEnum } from './action/ActionEnum.enum';
import { LikeOrDislike } from '../../src/like/entities/likeOrDislike.enum';
import * as redisStore from 'cache-manager-redis-store';
import { CACHE_MANAGER, CacheModule } from '@nestjs/cache-manager';
import { Follower } from '../../src/followers/entities/follower.entity';

let app;

describe('UserMetricsService', () => {
  let service: UserMetricsService;
  let repository: Repository<UserMetric>

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
    metric: new UserMetric,
    recover: new RecoverPassword(),
    likesComments: [],
    hashPassword: async function (): Promise<void> {
      throw new Error('Function not implemented.');
    }
  };

  const mockMetricUser: UserMetric = {
    id: 1,
    likesGivenCountInComment: 0,
    deslikesGivenCountInComment: 0,
    followersCount: 0,
    followingCount: 0,
    postsCount: 0,
    commentsCount: 0,
    likesGivenCountInPost: 0,
    deslikesGivenCountInPost: 0,
    sharesCount: 0,
    reportsReceivedCount: 0,
    reputationScore: 0,
    mediaUploadsCount: 0,
    savedPostsCount: 0,
    savedCommentsCount: 0,
    savedMediaCount: 0,
    editedCount: 0,
    avgSessionTime: 0,
    reportsMadeCount: 0,
    profileViews: 0,
    version: 0,
    user: mockUser,
    createdAt: new Date,
    updatedAt: new Date
  }

  const mockRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  }

  beforeAll(async () => {
    initializeTransactionalContext()

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
                User, Post, Category, Comment, FavoritePost,
                FavoriteComment, Like, UserMetric, RecoverPassword,
                LikeComment, PostMetric, CommentMetric, Follower
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
          User, Post, Category, Comment, FavoritePost,
          FavoriteComment, Like, UserMetric, RecoverPassword,
          LikeComment, PostMetric, CommentMetric, Follower
        ]),
        UnitOfWorkModule,
        UserMetricsModule
      ],
      controllers: [UserMetricsController],
      providers: [UserMetricsController]
    }).compile()

    app = moduleRef.createNestApplication()
    await app.init()

    repository = moduleRef.get(getRepositoryToken(UserMetric))
  })

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserMetricsService,
        {
          provide: getRepositoryToken(UserMetric),
          useValue: mockRepository
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
          },
        },
      ]
    }).compile()
    service = module.get<UserMetricsService>(UserMetricsService)
    repository = module.get<Repository<UserMetric>>(getRepositoryToken(UserMetric))
  })

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should get metric', async ()=> {
    const findOne = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(mockMetricUser);

    const result = await service.findOne(mockUser);

    expect(result.id).toBe(mockMetricUser.id)
    expect(result.user).toBe(mockMetricUser.user)

    expect(findOne).toHaveBeenCalledTimes(1)
    expect(findOne).toHaveBeenCalledWith({ where: { user: mockUser } })
  });

  it('should throw not founc', async ()=> {
    const findOne = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(null);

    expect(service.findOne(mockUser)).rejects.toThrow(NotFoundException);

    expect(findOne).toHaveBeenCalledTimes(1)
    expect(findOne).toHaveBeenCalledWith({ where: { user: mockUser } })
  });

  it('should create a metric', async () => {
    const createSpy = jest.spyOn(service['repository'], 'create').mockReturnValue(mockMetricUser)
    const saveSpy = jest.spyOn(service['repository'], 'save').mockResolvedValue(mockMetricUser)

    const result = await service.create(mockUser);

    expect(result.id).toBe(mockMetricUser.id)
    expect(result.user.id).toBe(mockMetricUser.user.id)

    expect(createSpy).toHaveBeenCalledTimes(1)
    expect(createSpy).toHaveBeenCalledWith(mockUser)

    expect(saveSpy).toHaveBeenCalledTimes(1)
    expect(saveSpy).toHaveBeenCalledWith(mockMetricUser)
  });

  it('should reduce Profile Views in user metric', async ()=> {
    const metric: UserMetric = Object.assign(new UserMetric, mockMetricUser, { profileViews: 1 })

    const value = metric.profileViews - 1

    const findOne = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(metric);
    const saveSpy = jest.spyOn(service['repository'], 'save').mockResolvedValue(metric);

    const result = await service.sumOrReduceProfileViews(metric, ActionEnum.REDUCE);

    expect(result.id).toBe(metric.id)
    expect(result.profileViews).toBe(value)

    expect(findOne).toHaveBeenCalledWith({ where: { user: mockUser } })

    expect(saveSpy).toHaveBeenCalledWith(mockMetricUser)
  });

  it('should sum Profile Views in user metric', async ()=> {
    const sum = mockMetricUser.profileViews + 1

    const findOne = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(mockMetricUser);
    const saveSpy = jest.spyOn(service['repository'], 'save').mockResolvedValue(mockMetricUser);

    const result = await service.sumOrReduceProfileViews(mockMetricUser, ActionEnum.SUM);

    expect(result.id).toBe(mockMetricUser.id)
    expect(result.profileViews).toBe(sum)

    expect(findOne).toHaveBeenCalledWith({ where: { user: mockUser } })

    expect(saveSpy).toHaveBeenCalledWith(mockMetricUser)
  });

  it('should sum Edited Count in user metric', async ()=> {
    const sum = mockMetricUser.editedCount + 1

    const findOne = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(mockMetricUser);
    const saveSpy = jest.spyOn(service['repository'], 'save').mockResolvedValue(mockMetricUser);

    const result = await service.sumOrReduceEditedCount(mockMetricUser, ActionEnum.SUM);

    expect(result.id).toBe(mockMetricUser.id)
    expect(result.editedCount).toBe(sum)

    expect(findOne).toHaveBeenCalledWith({ where: { user: mockUser } })

    expect(saveSpy).toHaveBeenCalledWith(mockMetricUser)
  });

  it('should reduce Edited Count in user metric', async ()=> {
    const metric: UserMetric = Object.assign(new UserMetric, mockMetricUser, { editedCount: 1 })

    const value = metric.editedCount - 1

    const findOne = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(metric);
    const saveSpy = jest.spyOn(service['repository'], 'save').mockResolvedValue(metric);

    const result = await service.sumOrReduceEditedCount(metric, ActionEnum.REDUCE);

    expect(result.id).toBe(metric.id)
    expect(result.editedCount).toBe(value)

    expect(findOne).toHaveBeenCalledWith({ where: { user: mockUser } })

    expect(saveSpy).toHaveBeenCalledWith(mockMetricUser)
  });

  it('should sum saved Media Count in user metric', async ()=> {
    const metric: UserMetric = Object.assign(new UserMetric, mockMetricUser, { savedMediaCount: 0 })

    const value = metric.savedMediaCount + 1

    const findOne = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(metric);
    const saveSpy = jest.spyOn(service['repository'], 'save').mockResolvedValue(metric);

    const result = await service.sumOrReduceSavedMediaCount(metric, ActionEnum.SUM);

    expect(result.id).toBe(metric.id)
    expect(result.savedMediaCount).toBe(value)

    expect(findOne).toHaveBeenCalledWith({ where: { user: mockUser } })

    expect(saveSpy).toHaveBeenCalledWith(mockMetricUser)
  });

  it('should reduce saved Media Count in user metric', async ()=> {
    const metric: UserMetric = Object.assign(new UserMetric, mockMetricUser, { savedMediaCount: 1 })

    const value = metric.savedMediaCount - 1

    const findOne = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(metric);
    const saveSpy = jest.spyOn(service['repository'], 'save').mockResolvedValue(metric);

    const result = await service.sumOrReduceSavedMediaCount(metric, ActionEnum.REDUCE);

    expect(result.id).toBe(metric.id)
    expect(result.savedMediaCount).toBe(value)

    expect(findOne).toHaveBeenCalledWith({ where: { user: mockUser } })

    expect(saveSpy).toHaveBeenCalledWith(mockMetricUser)
  });

  it('should sum followers Count in user metric', async ()=> {
    const metric: UserMetric = Object.assign(new UserMetric, mockMetricUser, { followersCount: 0 })

    const value = metric.followersCount + 1

    const findOne = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(metric);
    const saveSpy = jest.spyOn(service['repository'], 'save').mockResolvedValue(metric);

    const result = await service.sumOrReduceFollowersCount(metric, ActionEnum.SUM);

    expect(result.id).toBe(metric.id)
    expect(result.followersCount).toBe(value)

    expect(findOne).toHaveBeenCalledWith({ where: { user: mockUser } })

    expect(saveSpy).toHaveBeenCalledWith(mockMetricUser)
  });

  it('should reduce followers Count in user metric', async ()=> {
    const metric: UserMetric = Object.assign(new UserMetric, mockMetricUser, { followersCount: 1 })

    const value = metric.followersCount - 1

    const findOne = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(metric);
    const saveSpy = jest.spyOn(service['repository'], 'save').mockResolvedValue(metric);

    const result = await service.sumOrReduceFollowersCount(metric, ActionEnum.REDUCE);

    expect(result.id).toBe(metric.id)
    expect(result.followersCount).toBe(value)

    expect(findOne).toHaveBeenCalledWith({ where: { user: mockUser } })

    expect(saveSpy).toHaveBeenCalledWith(mockMetricUser)
  });

  it('should sum following Count in user metric', async ()=> {
    const metric: UserMetric = Object.assign(new UserMetric, mockMetricUser, { followingCount: 0 })

    const value = metric.followingCount + 1

    const findOne = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(metric);
    const saveSpy = jest.spyOn(service['repository'], 'save').mockResolvedValue(metric);

    const result = await service.sumOrReduceFollowingCount(metric, ActionEnum.SUM);

    expect(result.id).toBe(metric.id)
    expect(result.followingCount).toBe(value)

    expect(findOne).toHaveBeenCalledWith({ where: { user: mockUser } })

    expect(saveSpy).toHaveBeenCalledWith(mockMetricUser)
  });

  it('should reduce following Count in user metric', async ()=> {
    const metric: UserMetric = Object.assign(new UserMetric, mockMetricUser, { followingCount: 1 })

    const value = metric.followingCount - 1

    const findOne = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(metric);
    const saveSpy = jest.spyOn(service['repository'], 'save').mockResolvedValue(metric);

    const result = await service.sumOrReduceFollowingCount(metric, ActionEnum.REDUCE);

    expect(result.id).toBe(metric.id)
    expect(result.followingCount).toBe(value)

    expect(findOne).toHaveBeenCalledWith({ where: { user: mockUser } })

    expect(saveSpy).toHaveBeenCalledWith(mockMetricUser)
  });

  it('should sum saved Comments Count in user metric', async ()=> {
    const metric: UserMetric = Object.assign(new UserMetric, mockMetricUser, { savedCommentsCount: 0 })

    const value = metric.savedCommentsCount + 1

    const findOne = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(metric);
    const saveSpy = jest.spyOn(service['repository'], 'save').mockResolvedValue(metric);

    const result = await service.sumOrReduceSavedCommentsCount(metric, ActionEnum.SUM);

    expect(result.id).toBe(metric.id)
    expect(result.savedCommentsCount).toBe(value)

    expect(findOne).toHaveBeenCalledWith({ where: { user: mockUser } })

    expect(saveSpy).toHaveBeenCalledWith(mockMetricUser)
  });

  it('should reduce saved Comments Count in user metric', async ()=> {
    const metric: UserMetric = Object.assign(new UserMetric, mockMetricUser, { savedCommentsCount: 1 })

    const value = metric.savedCommentsCount - 1

    const findOne = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(metric);
    const saveSpy = jest.spyOn(service['repository'], 'save').mockResolvedValue(metric);

    const result = await service.sumOrReduceSavedCommentsCount(metric, ActionEnum.REDUCE);

    expect(result.id).toBe(metric.id)
    expect(result.savedCommentsCount).toBe(value)

    expect(findOne).toHaveBeenCalledWith({ where: { user: mockUser } })

    expect(saveSpy).toHaveBeenCalledWith(mockMetricUser)
  });

  it('should sum saved Posts Count in user metric', async ()=> {
    const metric: UserMetric = Object.assign(new UserMetric, mockMetricUser, { savedPostsCount: 0 })

    const value = metric.savedPostsCount + 1

    const findOne = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(metric);
    const saveSpy = jest.spyOn(service['repository'], 'save').mockResolvedValue(metric);

    const result = await service.sumOrReduceSavedPostsCount(metric, ActionEnum.SUM);

    expect(result.id).toBe(metric.id)
    expect(result.savedPostsCount).toBe(value)

    expect(findOne).toHaveBeenCalledWith({ where: { user: mockUser } })

    expect(saveSpy).toHaveBeenCalledWith(mockMetricUser)
  });

  it('should reduce saved Posts Count in user metric', async ()=> {
    const metric: UserMetric = Object.assign(new UserMetric, mockMetricUser, { savedPostsCount: 1 })

    const value = metric.savedPostsCount - 1

    const findOne = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(metric);
    const saveSpy = jest.spyOn(service['repository'], 'save').mockResolvedValue(metric);

    const result = await service.sumOrReduceSavedPostsCount(metric, ActionEnum.REDUCE);

    expect(result.id).toBe(metric.id)
    expect(result.savedPostsCount).toBe(value)

    expect(findOne).toHaveBeenCalledWith({ where: { user: mockUser } })

    expect(saveSpy).toHaveBeenCalledWith(mockMetricUser)
  });

  it('should sum Media Uploads Count in user metric', async ()=> {
    const metric: UserMetric = Object.assign(new UserMetric, mockMetricUser, { mediaUploadsCount: 0 })

    const value = metric.mediaUploadsCount + 1

    const findOne = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(metric);
    const saveSpy = jest.spyOn(service['repository'], 'save').mockResolvedValue(metric);

    const result = await service.sumOrReduceMediaUploadsCount(metric, ActionEnum.SUM);

    expect(result.id).toBe(metric.id)
    expect(result.mediaUploadsCount).toBe(value)

    expect(findOne).toHaveBeenCalledWith({ where: { user: mockUser } })

    expect(saveSpy).toHaveBeenCalledWith(mockMetricUser)
  });

  it('should reduce Media Uploads Count in user metric', async ()=> {
    const metric: UserMetric = Object.assign(new UserMetric, mockMetricUser, { mediaUploadsCount: 1 })

    const value = metric.mediaUploadsCount - 1

    const findOne = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(metric);
    const saveSpy = jest.spyOn(service['repository'], 'save').mockResolvedValue(metric);

    const result = await service.sumOrReduceMediaUploadsCount(metric, ActionEnum.REDUCE);

    expect(result.id).toBe(metric.id)
    expect(result.mediaUploadsCount).toBe(value)

    expect(findOne).toHaveBeenCalledWith({ where: { user: mockUser } })

    expect(saveSpy).toHaveBeenCalledWith(mockMetricUser)
  });

  it('should sum reports Received Count in user metric', async ()=> {
    const metric: UserMetric = Object.assign(new UserMetric, mockMetricUser, { reportsReceivedCount: 0 })

    const value = metric.reportsReceivedCount + 1

    const findOne = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(metric);
    const saveSpy = jest.spyOn(service['repository'], 'save').mockResolvedValue(metric);

    const result = await service.sumOrReduceReportsReceivedCount(metric, ActionEnum.SUM);

    expect(result.id).toBe(metric.id)
    expect(result.reportsReceivedCount).toBe(value)

    expect(findOne).toHaveBeenCalledWith({ where: { user: mockUser } })

    expect(saveSpy).toHaveBeenCalledWith(mockMetricUser)
  });

  it('should reduce reports Received Count in user metric', async ()=> {
    const metric: UserMetric = Object.assign(new UserMetric, mockMetricUser, { reportsReceivedCount: 1 })

    const value = metric.reportsReceivedCount - 1

    const findOne = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(metric);
    const saveSpy = jest.spyOn(service['repository'], 'save').mockResolvedValue(metric);

    const result = await service.sumOrReduceReportsReceivedCount(metric, ActionEnum.REDUCE);

    expect(result.id).toBe(metric.id)
    expect(result.reportsReceivedCount).toBe(value)

    expect(findOne).toHaveBeenCalledWith({ where: { user: mockUser } })

    expect(saveSpy).toHaveBeenCalledWith(mockMetricUser)
  });

  it('should sum shares Count in user metric', async ()=> {
    const metric: UserMetric = Object.assign(new UserMetric, mockMetricUser, { sharesCount: 0 })

    const value = metric.sharesCount + 1

    const findOne = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(metric);
    const saveSpy = jest.spyOn(service['repository'], 'save').mockResolvedValue(metric);

    const result = await service.sumOrReduceSharesCount(metric, ActionEnum.SUM);

    expect(result.id).toBe(metric.id)
    expect(result.sharesCount).toBe(value)

    expect(findOne).toHaveBeenCalledWith({ where: { user: mockUser } })

    expect(saveSpy).toHaveBeenCalledWith(mockMetricUser)
  });

  it('should reduce shares Count in user metric', async ()=> {
    const metric: UserMetric = Object.assign(new UserMetric, mockMetricUser, { sharesCount: 1 })

    const value = metric.sharesCount - 1

    const findOne = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(metric);
    const saveSpy = jest.spyOn(service['repository'], 'save').mockResolvedValue(metric);

    const result = await service.sumOrReduceSharesCount(metric, ActionEnum.REDUCE);

    expect(result.id).toBe(metric.id)
    expect(result.sharesCount).toBe(value)

    expect(findOne).toHaveBeenCalledWith({ where: { user: mockUser } })

    expect(saveSpy).toHaveBeenCalledWith(mockMetricUser)
  });

  it('should sum comments Count in user metric', async ()=> {
    const metric: UserMetric = Object.assign(new UserMetric, mockMetricUser, { commentsCount: 0 })

    const value = metric.commentsCount + 1

    const findOne = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(metric);
    const saveSpy = jest.spyOn(service['repository'], 'save').mockResolvedValue(metric);

    const result = await service.sumOrReduceCommentsCount(metric, ActionEnum.SUM);

    expect(result.id).toBe(metric.id)
    expect(result.commentsCount).toBe(value)

    expect(findOne).toHaveBeenCalledWith({ where: { user: mockUser } })

    expect(saveSpy).toHaveBeenCalledWith(mockMetricUser)
  });

  it('should reduce comments Count in user metric', async ()=> {
    const metric: UserMetric = Object.assign(new UserMetric, mockMetricUser, { commentsCount: 1 })

    const value = metric.commentsCount - 1

    const findOne = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(metric);
    const saveSpy = jest.spyOn(service['repository'], 'save').mockResolvedValue(metric);

    const result = await service.sumOrReduceCommentsCount(metric, ActionEnum.REDUCE);

    expect(result.id).toBe(metric.id)
    expect(result.commentsCount).toBe(value)

    expect(findOne).toHaveBeenCalledWith({ where: { user: mockUser } })

    expect(saveSpy).toHaveBeenCalledWith(mockMetricUser)
  });

  it('should sum posts Count in user metric', async ()=> {
    const metric: UserMetric = Object.assign(new UserMetric, mockMetricUser, { postsCount: 0 })

    const value = metric.postsCount + 1

    const findOne = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(metric);
    const saveSpy = jest.spyOn(service['repository'], 'save').mockResolvedValue(metric);

    const result = await service.sumOrReducePostsCount(metric, ActionEnum.SUM);

    expect(result.id).toBe(metric.id)
    expect(result.postsCount).toBe(value)

    expect(findOne).toHaveBeenCalledWith({ where: { user: mockUser } })

    expect(saveSpy).toHaveBeenCalledWith(mockMetricUser)
  });

  it('should reduce posts Count in user metric', async ()=> {
    const metric: UserMetric = Object.assign(new UserMetric, mockMetricUser, { postsCount: 1 })

    const value = metric.postsCount - 1

    const findOne = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(metric);
    const saveSpy = jest.spyOn(service['repository'], 'save').mockResolvedValue(metric);

    const result = await service.sumOrReducePostsCount(metric, ActionEnum.REDUCE);

    expect(result.id).toBe(metric.id)
    expect(result.postsCount).toBe(value)

    expect(findOne).toHaveBeenCalledWith({ where: { user: mockUser } })

    expect(saveSpy).toHaveBeenCalledWith(mockMetricUser)
  });

  it('should sum like in post metric', async () => {
    const metric: UserMetric = Object.assign(new UserMetric(), mockMetricUser, {
      likesGivenCountInPost: 0,
    });

    const expected = metric.likesGivenCountInPost + 1;

    const saveSpy = jest.spyOn(service['repository'], 'save').mockResolvedValue(metric);

    const result = await service.sumOrReduceDislikeOrLikesGivenCountInPost(
      metric,
      ActionEnum.SUM,
      LikeOrDislike.LIKE,
    );

    expect(result.likesGivenCountInPost).toBe(expected);
    expect(saveSpy).toHaveBeenCalledWith(metric);
  });

  it('should reduce dislike in post metric', async () => {
    const metric: UserMetric = Object.assign(new UserMetric(), mockMetricUser, {
      deslikesGivenCountInPost: 1,
    });

    const expected = metric.deslikesGivenCountInPost - 1;

    const saveSpy = jest.spyOn(service['repository'], 'save').mockResolvedValue(metric);

    const result = await service.sumOrReduceDislikeOrLikesGivenCountInPost(
      metric,
      ActionEnum.REDUCE,
      LikeOrDislike.DISLIKE,
    );

    expect(result.deslikesGivenCountInPost).toBe(expected);
    expect(saveSpy).toHaveBeenCalledWith(metric);
  });

  it('should sum dislike in comment metric', async () => {
    const metric: UserMetric = Object.assign(new UserMetric(), mockMetricUser, {
      deslikesGivenCountInComment: 0,
    });

    const expected = metric.deslikesGivenCountInComment + 1;

    const saveSpy = jest.spyOn(service['repository'], 'save').mockResolvedValue(metric);

    const result = await service.sumOrReduceDislikeOrLikesGivenCountInComment(
      metric,
      ActionEnum.SUM,
      LikeOrDislike.DISLIKE,
    );

    expect(result.deslikesGivenCountInComment).toBe(expected);
    expect(saveSpy).toHaveBeenCalledWith(metric);
  });

  it('should reduce like in comment metric', async () => {
    const metric: UserMetric = Object.assign(new UserMetric(), mockMetricUser, {
      likesGivenCountInComment: 1,
    });

    const expected = metric.likesGivenCountInComment - 1;

    const saveSpy = jest.spyOn(service['repository'], 'save').mockResolvedValue(metric);

    const result = await service.sumOrReduceDislikeOrLikesGivenCountInComment(
      metric,
      ActionEnum.REDUCE,
      LikeOrDislike.LIKE,
    );

    expect(result.likesGivenCountInComment).toBe(expected);
    expect(saveSpy).toHaveBeenCalledWith(metric);
  });
});