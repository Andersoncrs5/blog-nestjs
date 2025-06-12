import { Test, TestingModule } from '@nestjs/testing';
import { FavoritePostService } from './favorite_post.service';
import { DataSource, Repository } from 'typeorm';
import { FavoritePost } from './entities/favorite_post.entity';
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
import { FavoritePostController } from './favorite_post.controller';
import { BadRequestException, NotFoundException } from '@nestjs/common';

let app;


describe('FavoritePostService', () => {
  let service: FavoritePostService;
  let repository: Repository<FavoritePost>;

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
    metric: new PostMetric(),
    favoritePosts: [],
    likes: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockFavorite: FavoritePost = {
    id: 1,
    user: mockUser,
    post: mockPost,
    createdAt: new Date()
  };

  const mockRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
    delete: jest.fn(),
    findAndCount: jest.fn(),
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
      controllers: [FavoritePostController],
      providers: [FavoritePostService],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    repository = moduleRef.get(getRepositoryToken(FavoritePost));
    service = moduleRef.get(FavoritePostService);
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FavoritePostService,
        {
          provide: getRepositoryToken(FavoritePost),
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
    }).compile();

    service = module.get<FavoritePostService>(FavoritePostService);
    repository = module.get<Repository<FavoritePost>>(getRepositoryToken(FavoritePost));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should save the post with favorite', async ()=> {
    const findOneSpy = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(null)
    const createSpy = jest.spyOn(service['repository'], 'create').mockReturnValue(mockFavorite);
    const saveSpy = jest.spyOn(service['repository'], 'save').mockResolvedValue(mockFavorite);

    const result: FavoritePost = await service.create(mockUser, mockPost);

    expect(result.id).toBe(mockFavorite.id)
    expect(result.user.id).toBe(mockFavorite.user.id)
    expect(result.post.id).toBe(mockFavorite.post.id)

    expect(findOneSpy).toHaveBeenCalledWith({ where: { user: { id: mockUser.id }, post: { id: mockPost.id } } });

    expect(createSpy).toHaveBeenCalledWith({ user: mockUser, post: mockPost });

    expect(saveSpy).toHaveBeenCalledWith(mockFavorite);
  });

  it('should throw bad request', async ()=> {
    const findOneSpy = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(mockFavorite)

    await expect(service.create(mockUser, mockPost)).rejects.toThrow(BadRequestException)

    expect(findOneSpy).toHaveBeenCalledWith({ where: { user: { id: mockUser.id }, post: { id: mockPost.id } } });
  });

  it('should false exist favorite', async ()=> {
    const countSpy = jest.spyOn(service['repository'], 'count').mockResolvedValue(0);

    const result: boolean = await service.exists(mockUser, mockPost);

    expect(result).toBe(false);

    expect(countSpy).toHaveBeenCalledWith({ where: { user: mockUser, post: mockPost } });
  });

  it('should true exist favorite', async ()=> {
    const countSpy = jest.spyOn(service['repository'], 'count').mockResolvedValue(1);

    const result: boolean = await service.exists(mockUser, mockPost);

    expect(result).toBe(true);

    expect(countSpy).toHaveBeenCalledWith({ where: { user: mockUser, post: mockPost } });
  });

  it('should remove the favorite', async ()=> {
    const findOneSpy = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(mockFavorite)
    const deleteSpy = jest.spyOn(service['repository'], 'delete').mockResolvedValue({ affected: 1 } as any)

    await service.remove(mockFavorite.id, mockUser);

    expect(findOneSpy).toHaveBeenCalledWith({ where: { id: mockFavorite.id } });
    expect(deleteSpy).toHaveBeenCalledWith(mockFavorite);
  });

  it('should remove the favorite', async ()=> {
    const findOneSpy = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(null)

    await expect(service.remove(mockFavorite.id, mockUser)).rejects.toThrow(NotFoundException)
  });

  it('should throw BadRequest ', async ()=> {
    const anotherUser = Object.assign(new User(), mockUser, { id: 2, email: 'user2@gmail.com' })

    const findOneSpy = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(mockFavorite)

    await expect(service.remove(mockFavorite.id, anotherUser)).rejects.toThrow(BadRequestException);

    expect(findOneSpy).toHaveBeenCalledWith({ where: { id: mockFavorite.id } });
  });

  it('should return paginated favorites for the user', async () => {
    const mockFavorites = [
      { id: 1, createdAt: new Date(), user: mockUser },
      { id: 2, createdAt: new Date(), user: mockUser },
    ] as FavoritePost[];

    const page = 1;
    const limit = 10;

    jest.spyOn(repository, 'findAndCount').mockResolvedValue([mockFavorites, 2]);

    const result = await service.findAllOfUser(mockUser, page, limit);

    expect(repository.findAndCount).toHaveBeenCalledWith({
      skip: 0,
      take: 10,
      order: { createdAt: 'ASC' },
      where: { user: mockUser },
    });

    expect(result).toEqual({
      data: mockFavorites,
      totalItems: 2,
      currentPage: 1,
      totalPages: 1,
    });
  });

});
