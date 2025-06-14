import { Test, TestingModule } from '@nestjs/testing';
import { PostMetricsService } from './post_metrics.service';
import { DataSource, Repository } from 'typeorm';
import { PostMetric } from './entities/post_metric.entity';
import { Post } from '../../src/post/entities/post.entity';
import { Category } from '../../src/category/entities/category.entity';
import { UserMetric } from '../../src/user_metrics/entities/user_metric.entity';
import { RecoverPassword } from '../../src/recover_password/entities/recover_password.entity';
import { User } from '../../src/user/entities/user.entity';
import { addTransactionalDataSource, initializeTransactionalContext } from 'typeorm-transactional';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { UnitOfWorkModule } from '../../src/utils/UnitOfWork/UnitOfWork.module';
import { PostMetricsModule } from './post_metrics.module';
import { FavoriteComment } from '../../src/favorite_comment/entities/favorite_comment.entity';
import { CommentMetric } from '../../src/comment_metrics/entities/comment_metric.entity';
import { FavoritePost } from '../../src/favorite_post/entities/favorite_post.entity';
import { Like } from '../../src/like/entities/like.entity';
import { LikeComment } from '../../src/like_comment/entities/like_comment.entity';
import { PostMetricsController } from './post_metrics.controller';
import { Comment } from '../../src/comment/entities/comment.entity';
import { NotFoundException } from '@nestjs/common/exceptions';
import { ActionEnum } from '../../src/user_metrics/action/ActionEnum.enum';
import { LikeOrDislike } from '../../src/like/entities/likeOrDislike.enum';
import * as redisStore from 'cache-manager-redis-store';
import { CACHE_MANAGER, CacheModule } from '@nestjs/cache-manager';
import { Follower } from '../../src/followers/entities/follower.entity';

let app;

describe('PostMetricsService', () => {
  let service: PostMetricsService;
  let repository: Repository<PostMetric>
  
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
    createdAt: new Date,
    updatedAt: new Date
  }
  
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
    createdAt: new Date,
    updatedAt: new Date
  }

  const mockPostMetric: PostMetric = {
    id: 1,
    version: 0,
    likes: 0,
    dislikes: 0,
    shares: 0,
    commentsCount: 0,
    favoriteCount: 0,
    bookmarks: 0,
    viewed: 0,
    lastInteractionAt: new Date,
    engagementScore: 0,
    reportsReceivedCount: 0,
    editedCount: 0,
    averageViewTime: 0,
    readThroughRate: 0,
    isTrending: false,
    post: mockPost,
    createdAt: new Date,
    updatedAt: new Date
  }

  const mockRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
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
          CommentMetric, PostMetric, User, Post, Category, Comment, Follower,
          FavoritePost, FavoriteComment, Like, UserMetric, RecoverPassword, LikeComment
        ]),
        UnitOfWorkModule,
        PostMetricsModule
      ],
      controllers: [PostMetricsController],
      providers: [PostMetricsController]
    }).compile();

    app = moduleRef.createNestApplication()
    await app.init()

    repository = moduleRef.get(getRepositoryToken(PostMetric))
  })

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostMetricsService,
        {
          provide: getRepositoryToken(PostMetric),
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

    service = module.get<PostMetricsService>(PostMetricsService);
    repository = module.get<Repository<PostMetric>>(getRepositoryToken(PostMetric))
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find a post metric', async ()=> {
    const post: Post = Object.assign(new Post, mockPost, { metric: mockPostMetric })
    const findOne = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(mockPostMetric);

    const result = await service.findOne(post);

    expect(result).not.toBeNull();
    expect(result.id).toBe(mockPostMetric.id)

    expect(findOne).toHaveBeenCalledTimes(1)
    expect(findOne).toHaveBeenCalledWith({ where : { post } })
  });

  it('should throw NotFoundException if post metric not found', async () => {
    const post: Post = Object.assign(new Post(), mockPost);

    jest.spyOn(service['repository'], 'findOne').mockResolvedValue(null);

    await expect(service.findOne(post)).rejects.toThrow(NotFoundException);
  });

  it('should sum Viewed in postMetric ', async ()=> {
    const post: Post = Object.assign(new Post, mockPost, { metric: mockPostMetric });
    const postMetric: PostMetric = Object.assign(new PostMetric, mockPostMetric, { post: post, viewed: 0 })
    const value = postMetric.viewed + 1

    const findOne = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(mockPostMetric);

    const saveSpy = jest.spyOn(service['repository'], 'save').mockResolvedValue(postMetric);

    const result: PostMetric = await service.sumOrReduceViewed(postMetric, ActionEnum.SUM);

    expect(result.id).toBe(postMetric.id)
    expect(result.post.id).toBe(postMetric.post.id)
    expect(result.viewed).toBe(value)

    expect(findOne).toHaveBeenCalledWith({ where : { post } })
  });

  it('should reduce Viewed in postMetric ', async ()=> {
    const post: Post = Object.assign(new Post, mockPost, { metric: mockPostMetric });
    const postMetric: PostMetric = Object.assign(new PostMetric, mockPostMetric, { post: post, viewed: 1 })
    const value = postMetric.viewed - 1

    const findOne = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(mockPostMetric);

    const saveSpy = jest.spyOn(service['repository'], 'save').mockResolvedValue(postMetric);

    const result: PostMetric = await service.sumOrReduceViewed(postMetric, ActionEnum.REDUCE);

    expect(result.id).toBe(postMetric.id)
    expect(result.post.id).toBe(postMetric.post.id)
    expect(result.viewed).toBe(value)

    expect(findOne).toHaveBeenCalledWith({ where : { post } })
  });

  it('should sum bookmarks in postMetric ', async ()=> {
    const post: Post = Object.assign(new Post, mockPost, { metric: mockPostMetric });
    const postMetric: PostMetric = Object.assign(new PostMetric, mockPostMetric, { post: post, bookmarks: 0 })
    const value = postMetric.bookmarks + 1

    const findOne = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(mockPostMetric);

    const saveSpy = jest.spyOn(service['repository'], 'save').mockResolvedValue(postMetric);

    const result: PostMetric = await service.sumOrReduceBookmarks(postMetric, ActionEnum.SUM);

    expect(result.id).toBe(postMetric.id)
    expect(result.post.id).toBe(postMetric.post.id)
    expect(result.bookmarks).toBe(value)

    expect(findOne).toHaveBeenCalledWith({ where : { post } })
  });

  it('should reduce bookmarks in postMetric ', async ()=> {
    const post: Post = Object.assign(new Post, mockPost, { metric: mockPostMetric });
    const postMetric: PostMetric = Object.assign(new PostMetric, mockPostMetric, { post: post, bookmarks: 1 })
    const value = postMetric.bookmarks - 1

    const findOne = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(mockPostMetric);

    const saveSpy = jest.spyOn(service['repository'], 'save').mockResolvedValue(postMetric);

    const result: PostMetric = await service.sumOrReduceBookmarks(postMetric, ActionEnum.REDUCE);

    expect(result.id).toBe(postMetric.id)
    expect(result.post.id).toBe(postMetric.post.id)
    expect(result.bookmarks).toBe(value)

    expect(findOne).toHaveBeenCalledWith({ where : { post } })
  });

  it('should sum shares in postMetric ', async ()=> {
    const post: Post = Object.assign(new Post, mockPost, { metric: mockPostMetric });
    const postMetric: PostMetric = Object.assign(new PostMetric, mockPostMetric, { post: post, shares: 0 })
    const value = postMetric.shares + 1

    const findOne = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(mockPostMetric);

    const saveSpy = jest.spyOn(service['repository'], 'save').mockResolvedValue(postMetric);

    const result: PostMetric = await service.sumOrReduceShares(postMetric, ActionEnum.SUM);

    expect(result.id).toBe(postMetric.id)
    expect(result.post.id).toBe(postMetric.post.id)
    expect(result.shares).toBe(value)

    expect(findOne).toHaveBeenCalledWith({ where : { post } })
  });

  it('should reduce shares in postMetric ', async ()=> {
    const post: Post = Object.assign(new Post, mockPost, { metric: mockPostMetric });
    const postMetric: PostMetric = Object.assign(new PostMetric, mockPostMetric, { post: post, shares: 1 })
    const value = postMetric.shares - 1

    const findOne = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(mockPostMetric);

    const saveSpy = jest.spyOn(service['repository'], 'save').mockResolvedValue(postMetric);

    const result: PostMetric = await service.sumOrReduceShares(postMetric, ActionEnum.REDUCE);

    expect(result.id).toBe(postMetric.id)
    expect(result.post.id).toBe(postMetric.post.id)
    expect(result.shares).toBe(value)

    expect(findOne).toHaveBeenCalledWith({ where : { post } })
  });

  it('should sum shares in postMetric ', async ()=> {
    const post: Post = Object.assign(new Post, mockPost, { metric: mockPostMetric });
    const postMetric: PostMetric = Object.assign(new PostMetric, mockPostMetric, { post: post, shares: 0 })
    const value = postMetric.shares + 1

    const findOne = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(mockPostMetric);

    const saveSpy = jest.spyOn(service['repository'], 'save').mockResolvedValue(postMetric);

    const result: PostMetric = await service.sumOrReduceShares(postMetric, ActionEnum.SUM);

    expect(result.id).toBe(postMetric.id)
    expect(result.post.id).toBe(postMetric.post.id)
    expect(result.shares).toBe(value)

    expect(findOne).toHaveBeenCalledWith({ where : { post } })
  });

  it('should reduce shares in postMetric ', async ()=> {
    const post: Post = Object.assign(new Post, mockPost, { metric: mockPostMetric });
    const postMetric: PostMetric = Object.assign(new PostMetric, mockPostMetric, { post: post, shares: 1 })
    const value = postMetric.shares - 1

    const findOne = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(mockPostMetric);

    const saveSpy = jest.spyOn(service['repository'], 'save').mockResolvedValue(postMetric);

    const result: PostMetric = await service.sumOrReduceShares(postMetric, ActionEnum.REDUCE);

    expect(result.id).toBe(postMetric.id)
    expect(result.post.id).toBe(postMetric.post.id)
    expect(result.shares).toBe(value)

    expect(findOne).toHaveBeenCalledWith({ where : { post } })
  });

  it('should sum commentsCount in postMetric ', async ()=> {
    const post: Post = Object.assign(new Post, mockPost, { metric: mockPostMetric });
    const postMetric: PostMetric = Object.assign(new PostMetric, mockPostMetric, { post: post, commentsCount: 0 })
    const value = postMetric.commentsCount + 1

    const findOne = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(mockPostMetric);

    const saveSpy = jest.spyOn(service['repository'], 'save').mockResolvedValue(postMetric);

    const result: PostMetric = await service.sumOrReduceCommentsCount(postMetric, ActionEnum.SUM);

    expect(result.id).toBe(postMetric.id)
    expect(result.post.id).toBe(postMetric.post.id)
    expect(result.commentsCount).toBe(value)

    expect(findOne).toHaveBeenCalledWith({ where : { post } })
  });

  it('should reduce commentsCount in postMetric ', async ()=> {
    const post: Post = Object.assign(new Post, mockPost, { metric: mockPostMetric });
    const postMetric: PostMetric = Object.assign(new PostMetric, mockPostMetric, { post: post, commentsCount: 1 })
    const value = postMetric.commentsCount - 1

    const findOne = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(mockPostMetric);

    const saveSpy = jest.spyOn(service['repository'], 'save').mockResolvedValue(postMetric);

    const result: PostMetric = await service.sumOrReduceCommentsCount(postMetric, ActionEnum.REDUCE);

    expect(result.id).toBe(postMetric.id)
    expect(result.post.id).toBe(postMetric.post.id)
    expect(result.commentsCount).toBe(value)

    expect(findOne).toHaveBeenCalledWith({ where : { post } })
  });

  it('should sum editedCount in postMetric ', async ()=> {
    const post: Post = Object.assign(new Post, mockPost, { metric: mockPostMetric });
    const postMetric: PostMetric = Object.assign(new PostMetric, mockPostMetric, { post: post, editedCount: 0 })
    const value = postMetric.editedCount + 1

    const findOne = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(mockPostMetric);

    const saveSpy = jest.spyOn(service['repository'], 'save').mockResolvedValue(postMetric);

    const result: PostMetric = await service.sumOrReduceEditedCount(postMetric, ActionEnum.SUM);

    expect(result.id).toBe(postMetric.id)
    expect(result.post.id).toBe(postMetric.post.id)
    expect(result.editedCount).toBe(value)

    expect(findOne).toHaveBeenCalledWith({ where : { post } })
  });

  it('should reduce editedCount in postMetric ', async ()=> {
    const post: Post = Object.assign(new Post, mockPost, { metric: mockPostMetric });
    const postMetric: PostMetric = Object.assign(new PostMetric, mockPostMetric, { post: post, editedCount: 1 })
    const value = postMetric.editedCount - 1

    const findOne = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(mockPostMetric);

    const saveSpy = jest.spyOn(service['repository'], 'save').mockResolvedValue(postMetric);

    const result: PostMetric = await service.sumOrReduceEditedCount(postMetric, ActionEnum.REDUCE);

    expect(result.id).toBe(postMetric.id)
    expect(result.post.id).toBe(postMetric.post.id)
    expect(result.editedCount).toBe(value)

    expect(findOne).toHaveBeenCalledWith({ where : { post } })
  });

  it('should sum favoriteCount in postMetric ', async ()=> {
    const post: Post = Object.assign(new Post, mockPost, { metric: mockPostMetric });
    const postMetric: PostMetric = Object.assign(new PostMetric, mockPostMetric, { post: post, favoriteCount: 0 })
    const value = postMetric.favoriteCount + 1

    const findOne = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(mockPostMetric);

    const saveSpy = jest.spyOn(service['repository'], 'save').mockResolvedValue(postMetric);

    const result: PostMetric = await service.sumOrReduceFavoriteCount(postMetric, ActionEnum.SUM);

    expect(result.id).toBe(postMetric.id)
    expect(result.post.id).toBe(postMetric.post.id)
    expect(result.favoriteCount).toBe(value)

    expect(findOne).toHaveBeenCalledWith({ where : { post } })
  });

  it('should reduce favoriteCount in postMetric ', async ()=> {
    const post: Post = Object.assign(new Post, mockPost, { metric: mockPostMetric });
    const postMetric: PostMetric = Object.assign(new PostMetric, mockPostMetric, { post: post, favoriteCount: 1 })
    const value = postMetric.favoriteCount - 1

    const findOne = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(mockPostMetric);

    const saveSpy = jest.spyOn(service['repository'], 'save').mockResolvedValue(postMetric);

    const result: PostMetric = await service.sumOrReduceFavoriteCount(postMetric, ActionEnum.REDUCE);

    expect(result.id).toBe(postMetric.id)
    expect(result.post.id).toBe(postMetric.post.id)
    expect(result.favoriteCount).toBe(value)

    expect(findOne).toHaveBeenCalledWith({ where : { post } })
  });

  it('should create post metric', async ()=> {
    const post: Post = Object.assign(new Post, mockPost, { metric: mockPostMetric });
    const postMetric: PostMetric = Object.assign(new PostMetric, mockPostMetric, { post })

    const createSpy = jest.spyOn(service['repository'], 'create').mockReturnValue(postMetric)
    const saveSpy = jest.spyOn(service['repository'], 'save').mockResolvedValue(postMetric)

    const result = await service.create(post);

    expect(result).not.toBeNull();
    expect(result.id).toBe(mockPostMetric.id)
    expect(result.post.id).toBe(mockPostMetric.post.id)

    expect(createSpy).toHaveBeenCalledWith({ post })
    
    expect(saveSpy).toHaveBeenCalledWith(postMetric)
  });
  
  it('should sum like in postMetric', async () => {
    const post: Post = Object.assign(new Post(), mockPost, { metric: mockPostMetric });
    const metric: PostMetric = Object.assign(new PostMetric(), mockPostMetric, {
      post,
      likes: 3,
    });

    const expectedLikes = metric.likes + 1;

    const findOne = jest.spyOn(service, 'findOne').mockResolvedValue(mockPostMetric);
    const saveSpy = jest.spyOn(service['repository'], 'save').mockResolvedValue(metric);

    const result = await service.sumOrReduceLikesOrDislikes(metric, ActionEnum.SUM, LikeOrDislike.LIKE);

    expect(result.likes).toBe(expectedLikes);
    expect(result.dislikes).toBe(metric.dislikes);
    expect(result.post.id).toBe(post.id);
    expect(findOne).toHaveBeenCalledWith(post);
    expect(saveSpy).toHaveBeenCalledWith(metric);
  });

  it('should reduce like in postMetric', async () => {
    const post: Post = Object.assign(new Post(), mockPost, { metric: mockPostMetric });
    const metric: PostMetric = Object.assign(new PostMetric(), mockPostMetric, {
      post,
      likes: 2,
    });

    const expectedLikes = metric.likes - 1;

    const findOne = jest.spyOn(service, 'findOne').mockResolvedValue(mockPostMetric);
    const saveSpy = jest.spyOn(service['repository'], 'save').mockResolvedValue(metric);

    const result = await service.sumOrReduceLikesOrDislikes(metric, ActionEnum.REDUCE, LikeOrDislike.LIKE);

    expect(result.likes).toBe(expectedLikes);
    expect(result.dislikes).toBe(metric.dislikes);
    expect(result.post.id).toBe(post.id);
    expect(findOne).toHaveBeenCalledWith(post);
    expect(saveSpy).toHaveBeenCalledWith(metric);
  });

  it('should sum dislike in postMetric', async () => {
    const post: Post = Object.assign(new Post(), mockPost, { metric: mockPostMetric });
    const metric: PostMetric = Object.assign(new PostMetric(), mockPostMetric, {
      post,
      dislikes: 1,
    });

    const expectedDislikes = metric.dislikes + 1;

    const findOne = jest.spyOn(service, 'findOne').mockResolvedValue(mockPostMetric);
    const saveSpy = jest.spyOn(service['repository'], 'save').mockResolvedValue(metric);

    const result = await service.sumOrReduceLikesOrDislikes(metric, ActionEnum.SUM, LikeOrDislike.DISLIKE);

    expect(result.dislikes).toBe(expectedDislikes);
    expect(result.likes).toBe(metric.likes);
    expect(result.post.id).toBe(post.id);
    expect(findOne).toHaveBeenCalledWith(post);
    expect(saveSpy).toHaveBeenCalledWith(metric);
  });

  it('should reduce dislike in postMetric', async () => {
    const post: Post = Object.assign(new Post(), mockPost, { metric: mockPostMetric });
    const metric: PostMetric = Object.assign(new PostMetric(), mockPostMetric, {
      post,
      dislikes: 3,
    });

    const expectedDislikes = metric.dislikes - 1;

    const findOne = jest.spyOn(service, 'findOne').mockResolvedValue(mockPostMetric);
    const saveSpy = jest.spyOn(service['repository'], 'save').mockResolvedValue(metric);

    const result = await service.sumOrReduceLikesOrDislikes(metric, ActionEnum.REDUCE, LikeOrDislike.DISLIKE);

    expect(result.dislikes).toBe(expectedDislikes);
    expect(result.likes).toBe(metric.likes);
    expect(result.post.id).toBe(post.id);
    expect(findOne).toHaveBeenCalledWith(post);
    expect(saveSpy).toHaveBeenCalledWith(metric);
  });

  it('should update lastInteractionAt and version from existing metric', async () => {
    const post: Post = Object.assign(new Post(), mockPost, { metric: mockPostMetric });
    const metric: PostMetric = Object.assign(new PostMetric(), mockPostMetric, {
      post,
      likes: 0,
    });

    const oldDate = new Date('2020-01-01');
    metric.lastInteractionAt = oldDate;

    const existingMetric = Object.assign(new PostMetric(), mockPostMetric, {
      version: 7,
    });

    const findOne = jest.spyOn(service, 'findOne').mockResolvedValue(existingMetric);
    const saveSpy = jest.spyOn(service['repository'], 'save').mockResolvedValue(metric);

    const result = await service.sumOrReduceLikesOrDislikes(metric, ActionEnum.SUM, LikeOrDislike.LIKE);

    expect(result.version).toBe(existingMetric.version);
    expect(result.lastInteractionAt.getTime()).toBeGreaterThan(oldDate.getTime());
    expect(findOne).toHaveBeenCalledWith(post);
    expect(saveSpy).toHaveBeenCalledWith(metric);
  });
});