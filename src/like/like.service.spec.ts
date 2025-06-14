import { Test, TestingModule } from '@nestjs/testing';
import { LikeService } from './like.service';
import { CacheModule, CACHE_MANAGER } from '@nestjs/cache-manager';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Category } from '../../src/category/entities/category.entity';
import { CommentMetric } from '../../src/comment_metrics/entities/comment_metric.entity';
import { FavoriteComment } from '../../src/favorite_comment/entities/favorite_comment.entity';
import { FavoritePost } from '../../src/favorite_post/entities/favorite_post.entity';
import { Follower } from '../../src/followers/entities/follower.entity';
import { LikeComment } from '../../src/like_comment/entities/like_comment.entity';
import { Post } from '../../src/post/entities/post.entity';
import { PostMetric } from '../../src/post_metrics/entities/post_metric.entity';
import { RecoverPassword } from '../../src/recover_password/entities/recover_password.entity';
import { User } from '../../src/user/entities/user.entity';
import { UserMetric } from '../../src/user_metrics/entities/user_metric.entity';
import { UserMetricsModule } from '../../src/user_metrics/user_metrics.module';
import { UnitOfWorkModule } from '../../src/utils/UnitOfWork/UnitOfWork.module';
import { initializeTransactionalContext, addTransactionalDataSource } from 'typeorm-transactional';
import { Like } from './entities/like.entity';
import { LikeOrDislike } from './entities/likeOrDislike.enum';
import { Comment } from '../../src/comment/entities/comment.entity'
import * as redisStore from 'cache-manager-redis-store';
import { DataSource, Repository } from 'typeorm';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common/exceptions';

let app;

describe('LikeService unitary', () => {
  let service: LikeService;
  let repository: Repository<Like>;

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
    name: 'tech',
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
    title: 'NestJS Tips',
    content: 'Some tips about NestJS',
    isActived: true,
    isBlocked: false,
    version: 0,
    category: mockCategory,
    user: mockUser,
    comments: [],
    metric: new PostMetric(),
    favoritePosts: [],
    likes: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockAction: Like = {
    id: 1,
    post: mockPost,
    user: mockUser,
    createdAt: new Date(),
    action: LikeOrDislike.LIKE
  };

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
      providers: [LikeService],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    service = moduleRef.get<LikeService>(LikeService);
    repository = moduleRef.get<Repository<Like>>(getRepositoryToken(Like));
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LikeService,
        {
          provide: getRepositoryToken(Like),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            exists: jest.fn(),
            delete: jest.fn(),
            findAndCount: jest.fn(),
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

    service = module.get<LikeService>(LikeService);
    repository = module.get<Repository<Like>>(getRepositoryToken(Like));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw ConflictException', async () => {
    const existsSpy = jest.spyOn(service['repository'], 'exists').mockResolvedValue(true);

    await expect(service.create(mockUser, mockPost, LikeOrDislike.DISLIKE)).rejects.toThrow(ConflictException);

    expect(existsSpy).toHaveBeenCalledWith({
      where: { user: mockUser, post: mockPost },
    });
  });

  it('should create a like', async () => {
    const existsSpy = jest.spyOn(service['repository'], 'exists').mockResolvedValue(false);
    const createSpy = jest.spyOn(service['repository'], 'create').mockReturnValue(mockAction);
    const saveSpy = jest.spyOn(service['repository'], 'save').mockResolvedValue(mockAction)
    
    const result: Like = await service.create(mockUser, mockPost, LikeOrDislike.LIKE);

    expect(result.id).toBe(mockAction.id)
    expect(result.post.id).toBe(mockAction.post.id)
    expect(result.user.id).toBe(mockAction.user.id)
    expect(result.action).toBe(mockAction.action)

    expect(existsSpy).toHaveBeenCalledWith({
      where: { user: mockUser, post: mockPost },
    });

    expect(createSpy).toHaveBeenCalledWith({ 
      user: mockUser, 
      post: mockPost, 
      action: LikeOrDislike.LIKE 
    });

    expect(saveSpy).toHaveBeenCalledWith(mockAction);
  });

  it('should create a dislike', async () => {
    const action = Object.assign(new Like, mockAction, { action: LikeOrDislike.DISLIKE })

    const existsSpy = jest.spyOn(service['repository'], 'exists').mockResolvedValue(false);
    const createSpy = jest.spyOn(service['repository'], 'create').mockReturnValue(action);
    const saveSpy = jest.spyOn(service['repository'], 'save').mockResolvedValue(action)
    
    const result: Like = await service.create(mockUser, mockPost, LikeOrDislike.DISLIKE);

    expect(result.id).toBe(action.id)
    expect(result.post.id).toBe(action.post.id)
    expect(result.user.id).toBe(action.user.id)
    expect(result.action).toBe(action.action)

    expect(existsSpy).toHaveBeenCalledWith({
      where: { user: mockUser, post: mockPost },
    });

    expect(createSpy).toHaveBeenCalledWith({ 
      user: mockUser, 
      post: mockPost, 
      action: LikeOrDislike.DISLIKE 
    });

    expect(saveSpy).toHaveBeenCalledWith(action);
  });

  it('should throw BadRequestException', async () => {
    await expect(service.findOne(0)).rejects.toThrow(BadRequestException)
    await expect(service.findOne(NaN)).rejects.toThrow(BadRequestException)
    await expect(service.findOne(-1)).rejects.toThrow(BadRequestException)
  });

  it('should throw not found', async () => {
    const id = 9;
    const findOneSpy = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(null)

    await expect(service.findOne(id)).rejects.toThrow(NotFoundException);

    expect(findOneSpy).toHaveBeenCalledWith({ where: { id } });
  });

  it('should retrun action', async () => {
    const findOneSpy = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(mockAction)

    const result = await service.findOne(mockAction.id);

    expect(result.id).toBe(mockAction.id)
    expect(result.post.id).toBe(mockAction.post.id)
    expect(result.user.id).toBe(mockAction.user.id)
    expect(result.action).toBe(mockAction.action)

    expect(findOneSpy).toHaveBeenCalledWith({ where: { id: mockAction.id } });
  });

  it('should return true in exists ', async () => {
    const existsSpy = jest.spyOn(service['repository'], 'exists').mockResolvedValue(true);

    const check = await service.exists(mockUser, mockPost);

    expect(check).toBe(true)

    expect(existsSpy).toHaveBeenCalledWith({
      where: { user: mockUser, post: mockPost },
    });
  });

  it('should return false in exists ', async () => {
    const existsSpy = jest.spyOn(service['repository'], 'exists').mockResolvedValue(false);

    const check = await service.exists(mockUser, mockPost);

    expect(check).toBe(false)

    expect(existsSpy).toHaveBeenCalledWith({
      where: { user: mockUser, post: mockPost },
    });
  });

  it('should return paginated like of a user', async () => {
    const page = 1;
    const limit = 10;

    const mockLikes: Like[] = [
      { ...mockAction, id: 1 },
      { ...mockAction, id: 2 },
      { ...mockAction, id: 3 },
      { ...mockAction, id: 4 },
    ];

    const findAndCountMock = jest
      .spyOn(service['repository'], 'findAndCount')
      .mockResolvedValue([mockLikes, mockLikes.length]);

    const result = await service.findAllOfUser(mockUser, page, limit);

    expect(findAndCountMock).toHaveBeenCalledWith({ 
      skip: (page - 1) * limit,
      take: limit,
      order: { id: 'ASC' },
      where: { user: mockUser }, 
    });


    expect(result).toEqual({
      data: mockLikes,
      totalItems: mockLikes.length,
      currentPage: page,
      totalPages: 1,
    });

  });

  it('should remove a like', async () => {
    const deleteSpy = jest.spyOn(service['repository'], 'delete').mockResolvedValue({} as any);

    const result = await service.remove(mockAction);

    expect(deleteSpy).toHaveBeenCalledWith(mockAction);
    expect(result).toBe(mockAction);
  });
});