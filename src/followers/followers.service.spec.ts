import { DataSource, Repository, UpdateResult } from 'typeorm';
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
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as redisStore from 'cache-manager-redis-store';
import { CACHE_MANAGER, CacheModule } from '@nestjs/cache-manager';
import { Follower } from '../../src/followers/entities/follower.entity';
import { FollowersService } from './followers.service';
import { User } from '../../src/user/entities/user.entity';

let app;

describe('FollowersService', () => {
  let service: FollowersService;
  let repository: Repository<Follower>;

  const mockUserFollower: User = {
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
    recover: new RecoverPassword,
    likesComments: [],
    hashPassword: async function (): Promise<void> {
      throw new Error('Function not implemented.');
    },
  };

  const mockUserFollowing: User = {
    id: 2,
    name: 'John Doe2 ',
    email: 'john2@example.com',
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
    recover: new RecoverPassword,
    likesComments: [],
    hashPassword: async function (): Promise<void> {
      throw new Error('Function not implemented.');
    },
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOneBy: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    exists: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
  };

  const mockAction: Follower = {
    id: 1,
    follower: mockUserFollower,
    following: mockUserFollowing,
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
          },
        }),
        TypeOrmModule.forFeature([
          User, Post, Category, Comment, FavoritePost,
          FavoriteComment, Like, UserMetric, RecoverPassword,
          LikeComment, PostMetric, CommentMetric, Follower
        ]),
      ],
      providers: [FollowersService],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    service = moduleRef.get<FollowersService>(FollowersService);
    repository = moduleRef.get<Repository<Follower>>(getRepositoryToken(Follower));
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FollowersService,
        {
          provide: getRepositoryToken(Follower),
          useValue: mockRepository,
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

    service = module.get<FollowersService>(FollowersService);
    repository = module.get<Repository<Follower>>(getRepositoryToken(Follower));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create', async () => {
    const existsSpy = jest.spyOn(service['repository'], 'exists').mockResolvedValue(false)
    const createSpy = jest.spyOn(service['repository'], 'create').mockReturnValue(mockAction)
    const saveSpy = jest.spyOn(service['repository'], 'save').mockResolvedValue(mockAction)

    const result: Follower = await service.create(mockUserFollower, mockUserFollowing);

    expect(result.id).toBe(mockAction.id)
    expect(result.follower.id).toBe(mockAction.follower.id)
    expect(result.following.id).toBe(mockAction.following.id)

    expect(existsSpy).toHaveBeenCalledWith({ where: { follower: mockUserFollower, following: mockUserFollowing } });
    expect(createSpy).toHaveBeenCalledWith({ follower: mockUserFollower, following: mockUserFollowing });
    expect(saveSpy).toHaveBeenCalledWith(mockAction);
  });

  it('should throw BadRequestException', async () => {
    const existsSpy = jest.spyOn(service['repository'], 'exists').mockResolvedValue(true)

    await expect(service.create(mockUserFollower, mockUserFollowing)).rejects.toThrow(BadRequestException);

    expect(existsSpy).toHaveBeenCalledWith({ where: { follower: mockUserFollower, following: mockUserFollowing } });
  });

  it('should return true', async () => {
    const existsSpy = jest.spyOn(service['repository'], 'exists').mockResolvedValue(true)

    const result = await service.checkIfFollowing(mockUserFollower, mockUserFollowing);

    expect(result).toBe(true);

    expect(existsSpy).toHaveBeenCalledWith({ where: { follower: mockUserFollower, following: mockUserFollowing } });
  });

  it('should return false', async () => {
    const existsSpy = jest.spyOn(service['repository'], 'exists').mockResolvedValue(false)

    const result = await service.checkIfFollowing(mockUserFollower, mockUserFollowing);

    expect(result).toBe(false);

    expect(existsSpy).toHaveBeenCalledWith({ where: { follower: mockUserFollower, following: mockUserFollowing } });
  });

  it('should return all followers of a user', async () => {
    const mockFollowers: Follower[] = [mockAction];
    mockRepository.find = jest.fn().mockResolvedValue(mockFollowers);

    const result = await service.findAllFollower(mockUserFollower);

    expect(mockRepository.find).toHaveBeenCalledWith({ where: { follower: mockUserFollower } });
    expect(result).toEqual(mockFollowers);
  });

  it('should return all users followed by the user', async () => {
    const mockFollowing: Follower[] = [mockAction];
    mockRepository.find = jest.fn().mockResolvedValue(mockFollowing);

    const result = await service.findAllFollowing(mockUserFollowing);

    expect(mockRepository.find).toHaveBeenCalledWith({ where: { following: mockUserFollowing } });
    expect(result).toEqual(mockFollowing);
  });

  it('should throw BadRequestException if id is invalid on remove', async () => {
    await expect(service.remove(0, mockUserFollower)).rejects.toThrow(BadRequestException);
    await expect(service.remove(NaN, mockUserFollower)).rejects.toThrow(BadRequestException);
    await expect(service.remove(-1, mockUserFollower)).rejects.toThrow(BadRequestException);
  });

  it('should throw NotFoundException if follow relationship is not found', async () => {
    const id = 99;
    mockRepository.findOne = jest.fn().mockResolvedValue(null);

    await expect(service.remove(id, mockUserFollower)).rejects.toThrow(NotFoundException);
    expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id } });
  });

  it('should throw BadRequestException if user does not own the follow relationship', async () => {
    const id = mockAction.id;
    const invalidUser = { ...mockUserFollower, id: 999 } as User
    mockRepository.findOne = jest.fn().mockResolvedValue(mockAction);

    await expect(service.remove(id, invalidUser)).rejects.toThrow(BadRequestException);
    expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id } });
  });

  it('should delete the follow relationship successfully', async () => {
    const id = mockAction.id;
    mockRepository.findOne = jest.fn().mockResolvedValue(mockAction);
    mockRepository.delete = jest.fn().mockResolvedValue(undefined);

    await service.remove(id, mockUserFollower);

    expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id } });
    expect(mockRepository.delete).toHaveBeenCalledWith(id);
  });


});
