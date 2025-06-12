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
import { FavoriteCommentService } from './favorite_comment.service';
import { FavoritePost } from '../../src/favorite_post/entities/favorite_post.entity';
import { FavoriteCommentController } from './favorite_comment.controller';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common/exceptions';

let app;

describe('FavoriteCommentService', () => {
  let service: FavoriteCommentService;
  let repository: Repository<FavoriteComment>;

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

  const mockComment: Comment = {
    id: 1,
    nameUser: mockUser.name,
    content: 'content of comment',
    isEdited: false,
    isActived: false,
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

  const mockFavorite: FavoriteComment = {
    id: 1,
    user: mockUser,
    comment: mockComment,
    createdAt: new Date
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
      
      controllers: [FavoriteCommentController],
      providers: [FavoriteCommentService],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    service = moduleRef.get<FavoriteCommentService>(FavoriteCommentService);
    repository = moduleRef.get(getRepositoryToken(FavoriteComment));
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FavoriteCommentService,
        {
          provide: getRepositoryToken(FavoriteComment),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
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

    service = module.get<FavoriteCommentService>(FavoriteCommentService);
    repository = module.get<Repository<FavoriteComment>>(getRepositoryToken(FavoriteComment));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should save comment how favorite', async () => {
    const existsSpy = jest.spyOn(service['repository'], 'exists').mockResolvedValue(false);
    const createSpy = jest.spyOn(service['repository'], 'create').mockReturnValue(mockFavorite);
    const saveSpy = jest.spyOn(service['repository'], 'save').mockResolvedValue(mockFavorite);

    const result: FavoriteComment = await service.create(mockUser, mockComment);

    expect(result.id).toBe(mockFavorite.id)
    expect(result.user.id).toBe(mockFavorite.user.id)
    expect(result.comment.id).toBe(mockFavorite.comment.id)

    expect(existsSpy).toHaveBeenCalledWith({ where: { user: mockUser, comment: mockComment } });

    expect(createSpy).toHaveBeenCalledWith({ user:mockUser, comment: mockComment });

    expect(saveSpy).toHaveBeenCalledWith(mockFavorite);
  });

  it('should throw ConflictException ', async () => {
    const existsSpy = jest.spyOn(service['repository'], 'exists').mockResolvedValue(true);
    
    await expect(service.create(mockUser, mockComment)).rejects.toThrow(ConflictException)

    expect(existsSpy).toHaveBeenCalledWith({ where: { user: mockUser, comment: mockComment } });
  });

  it('should existsItem return true ', async () => {
    const existsSpy = jest.spyOn(service['repository'], 'exists').mockResolvedValue(true);

    const check = await service.existsItem(mockUser, mockComment);

    expect(check).toBe(true);

    expect(existsSpy).toHaveBeenCalledWith({ where: { user: mockUser, comment: mockComment } });
  });

  it('should existsItem return false ', async () => {
    const existsSpy = jest.spyOn(service['repository'], 'exists').mockResolvedValue(false);

    const check = await service.existsItem(mockUser, mockComment);

    expect(check).toBe(false);

    expect(existsSpy).toHaveBeenCalledWith({ where: { user: mockUser, comment: mockComment } });
  });

  it('should find one favorite', async () => {
    const findOneSpy = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(mockFavorite);

    const result: FavoriteComment = await service.findOne(mockFavorite.id);

    expect(result.id).toBe(mockFavorite.id)
    expect(result.user.id).toBe(mockFavorite.user.id)
    expect(result.comment.id).toBe(mockFavorite.comment.id)

    expect(findOneSpy).toHaveBeenCalledWith({ where: { id: mockFavorite.id } })
  });

  it('should throw bad request', async () => {
    await expect(service.findOne(-1)).rejects.toThrow(BadRequestException)
    await expect(service.findOne(NaN)).rejects.toThrow(BadRequestException)
    await expect(service.findOne(0)).rejects.toThrow(BadRequestException)
  });

  it('should thorw not found ', async () => {
    const id = 999
    const findOneSpy = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(null);

    await expect(service.findOne(id)).rejects.toThrow(NotFoundException);

    expect(findOneSpy).toHaveBeenCalledWith({ where: { id } })
  });

  it('should remove', async () => {
    const deletSpy = jest.spyOn(service['repository'], 'delete').mockResolvedValue({ affected: 1 } as any );

    await service.remove(mockFavorite, mockUser);
  });

  it('should throw BadRequestException in remove', async () => {
    const anotherUser = Object.assign(new User(), mockUser, { id: 2, email: 'user2@gmail.com' });
    const deletSpy = jest.spyOn(service['repository'], 'delete').mockResolvedValue({ affected: 1 } as any );

    await expect(service.remove(mockFavorite, anotherUser)).rejects.toThrow(BadRequestException);
  });

  it('should find all favorite comments of a user with pagination', async () => {
    const page = 1;
    const limit = 2;

    const fav1 = Object.assign(new FavoriteComment(), mockFavorite);
    const fav2 = Object.assign(new FavoriteComment(), mockFavorite, { id: 2 });

    const favorites = [fav1, fav2];

    const findAndCountSpy = jest
      .spyOn(service['repository'], 'findAndCount')
      .mockResolvedValue([favorites, favorites.length]);

    const result = await service.findAllOfUser(mockUser, page, limit);

    expect(findAndCountSpy).toHaveBeenCalledWith({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'ASC' },
      where: { user: mockUser },
    });

    expect(result).toEqual({
      data: favorites,
      totalItems: favorites.length,
      currentPage: page,
      totalPages: Math.ceil(favorites.length / limit),
    });
  });
});