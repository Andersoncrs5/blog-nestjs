import { Test, TestingModule } from '@nestjs/testing';
import { LikeCommentService } from './like_comment.service';
import { User } from '../../src/user/entities/user.entity';
import { Category } from '../../src/category/entities/category.entity';
import { CommentMetric } from '../../src/comment_metrics/entities/comment_metric.entity';
import { Post } from '../../src/post/entities/post.entity';
import { PostMetric } from '../../src/post_metrics/entities/post_metric.entity';
import { RecoverPassword } from '../../src/recover_password/entities/recover_password.entity';
import { UserMetric } from '../../src/user_metrics/entities/user_metric.entity';
import { DataSource, Like, Repository } from 'typeorm';
import { LikeComment } from './entities/like_comment.entity';
import { addTransactionalDataSource, initializeTransactionalContext } from 'typeorm-transactional';
import { CACHE_MANAGER, CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { FavoriteComment } from '../../src/favorite_comment/entities/favorite_comment.entity';
import { FavoritePost } from '../../src/favorite_post/entities/favorite_post.entity';
import { Follower } from '../../src/followers/entities/follower.entity';
import { UserMetricsModule } from '../../src/user_metrics/user_metrics.module';
import { UnitOfWorkModule } from '../../src/utils/UnitOfWork/UnitOfWork.module';
import { LikeCommentController } from './like_comment.controller';
import { Comment } from '../../src/comment/entities/comment.entity'
import { LikeOrDislike } from '../../src/like/entities/likeOrDislike.enum';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';

let app;

describe('LikeCommentService', () => {
  let service: LikeCommentService;
  let repository: Repository<LikeComment>

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

  const mockAction: LikeComment = {
    id: 1,
    user: mockUser,
    comment: mockComment,
    action: LikeOrDislike.LIKE,
    createdAt: new Date()
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

      controllers: [LikeCommentController],
      providers: [LikeCommentService]
    }).compile()

    app = moduleRef.createNestApplication()
    await app.init();

    service = moduleRef.get<LikeCommentService>(LikeCommentService);
    repository = moduleRef.get<Repository<LikeComment>>(getRepositoryToken(LikeComment))
  })

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LikeCommentService,
        {
          provide: getRepositoryToken(LikeComment),
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

    service = module.get<LikeCommentService>(LikeCommentService);
    repository = module.get<Repository<LikeComment>>(getRepositoryToken(LikeComment))
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a like', async () => {
    const existsSpy = jest.spyOn(service['repository'], 'exists').mockResolvedValue(false);
    const createSpy = jest.spyOn(service['repository'], 'create').mockReturnValue(mockAction);
    const saveSpy = jest.spyOn(service['repository'], 'save').mockResolvedValue(mockAction)
    
    const result: LikeComment = await service.create(mockUser, mockComment, LikeOrDislike.LIKE);

    expect(result.id).toBe(mockAction.id)
    expect(result.comment.id).toBe(mockAction.comment.id)
    expect(result.user.id).toBe(mockAction.user.id)
    expect(result.action).toBe(mockAction.action)

    expect(existsSpy).toHaveBeenCalledWith({
      where: { user: mockUser, comment: mockComment },
    });

    expect(createSpy).toHaveBeenCalledWith({ 
      user: mockUser, 
      comment: mockComment, 
      action: LikeOrDislike.LIKE 
    });

    expect(saveSpy).toHaveBeenCalledWith(mockAction);
  });

  it('should create a dislike', async () => {
    const action = Object.assign(new LikeComment, mockAction, { action: LikeOrDislike.DISLIKE })

    const existsSpy = jest.spyOn(service['repository'], 'exists').mockResolvedValue(false);
    const createSpy = jest.spyOn(service['repository'], 'create').mockReturnValue(action);
    const saveSpy = jest.spyOn(service['repository'], 'save').mockResolvedValue(action)
    
    const result: LikeComment = await service.create(mockUser, mockComment, LikeOrDislike.DISLIKE);

    expect(result.id).toBe(action.id)
    expect(result.comment.id).toBe(action.comment.id)
    expect(result.user.id).toBe(action.user.id)
    expect(result.action).toBe(action.action)

    expect(existsSpy).toHaveBeenCalledWith({
      where: { user: mockUser, comment: mockComment },
    });

    expect(createSpy).toHaveBeenCalledWith({ 
      user: mockUser, 
      comment: mockComment, 
      action: LikeOrDislike.DISLIKE 
    });

    expect(saveSpy).toHaveBeenCalledWith(action);
  });

  it('should throw ConflictException', async () => {
    const existsSpy = jest.spyOn(service['repository'], 'exists').mockResolvedValue(true);

    await expect(service.create(mockUser, mockComment, LikeOrDislike.DISLIKE)).rejects.toThrow(ConflictException);

    expect(existsSpy).toHaveBeenCalledWith({
      where: { user: mockUser, comment: mockComment },
    });
  });

  it('should return true in exists ', async () => {
    const existsSpy = jest.spyOn(service['repository'], 'exists').mockResolvedValue(true);

    const check = await service.exists(mockUser, mockComment);

    expect(check).toBe(true)

    expect(existsSpy).toHaveBeenCalledWith({
      where: { user: mockUser, comment: mockComment },
    });
  });

  it('should return false in exists ', async () => {
    const existsSpy = jest.spyOn(service['repository'], 'exists').mockResolvedValue(false);

    const check = await service.exists(mockUser, mockComment);

    expect(check).toBe(false)

    expect(existsSpy).toHaveBeenCalledWith({
      where: { user: mockUser, comment: mockComment },
    });
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
    expect(result.comment.id).toBe(mockAction.comment.id)
    expect(result.user.id).toBe(mockAction.user.id)
    expect(result.action).toBe(mockAction.action)

    expect(findOneSpy).toHaveBeenCalledWith({ where: { id: mockAction.id } });
  });

  it('should remove action', async () => {
    const action = Object.assign(new LikeComment, mockAction)
    const removeSpy = jest.spyOn(service['repository'], 'delete').mockResolvedValue({ affected: 1 } as any );

    const result = await service.remove(action);

    expect(result.id).toBe(action.id)
    expect(result.comment.id).toBe(action.comment.id)
    expect(result.user.id).toBe(action.user.id)
    expect(result.action).toBe(action.action)

    expect(removeSpy).toHaveBeenCalledWith(action);
  });

  it('should return paginated like-comments of a user', async () => {
    const page = 1;
    const limit = 10;

    const mockLikes: LikeComment[] = [
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
      relations: ['comment', 'user'],
    });

    expect(result).toEqual({
      data: mockLikes,
      totalItems: mockLikes.length,
      currentPage: page,
      totalPages: 1,
    });
  });
});