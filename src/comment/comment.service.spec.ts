import { Test, TestingModule } from '@nestjs/testing';
import { CommentService } from './comment.service';
import { CacheModule, CACHE_MANAGER } from '@nestjs/cache-manager';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { redisStore } from 'cache-manager-redis-store';
import { Category } from '../../src/category/entities/category.entity';
import { CommentMetric } from '../../src/comment_metrics/entities/comment_metric.entity';
import { FavoriteComment } from '../../src/favorite_comment/entities/favorite_comment.entity';
import { LikeComment } from '../../src/like_comment/entities/like_comment.entity';
import { Post } from '../../src/post/entities/post.entity';
import { RecoverPassword } from '../../src/recover_password/entities/recover_password.entity';
import { User } from '../../src/user/entities/user.entity';
import { UserMetric } from '../../src/user_metrics/entities/user_metric.entity';
import { UnitOfWorkModule } from '../../src/utils/UnitOfWork/UnitOfWork.module';
import { Comment } from '../../src/comment/entities/comment.entity'
import { Repository, DataSource } from 'typeorm';
import { initializeTransactionalContext, addTransactionalDataSource } from 'typeorm-transactional';
import { PostMetric } from '../../src/post_metrics/entities/post_metric.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common/exceptions';

let app;

describe('CommentService', () => {
  let service: CommentService;
  let repository: Repository<Comment>;

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

  const mockCommentOnComment: Comment = {
    id: 2,
    nameUser: mockUser.name,
    content: 'content of comment on comment',
    isEdited: false,
    isActived: false,
    isBlocked: false,
    parentId: 1,
    version: 0,
    user: mockUser,
    post: mockPost,
    metric: new CommentMetric,
    favoriteComments: [],
    likesComments: [],
    createdAt: new Date,
    updatedAt: new Date
  }

  const mockComments: Comment[] = [
    Object.assign(new Comment(), mockComment, { id: 1 }),
    Object.assign(new Comment(), mockComment, { id: 2 }),
    Object.assign(new Comment(), mockComment, { id: 3 }),
    Object.assign(new Comment(), mockComment, { id: 4 }),
    Object.assign(new Comment(), mockComment, { id: 5 }),
    Object.assign(new Comment(), mockComment, { id: 6 }),
    Object.assign(new Comment(), mockComment, { id: 7 }),
    Object.assign(new Comment(), mockComment, { id: 8 }),
    Object.assign(new Comment(), mockComment, { id: 9 }),
    Object.assign(new Comment(), mockComment, { id: 10 }),
  ];

  const mockRepository = {
    findOne: jest.fn(),
    delete: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    findAndCount: jest.fn(),
    update: jest.fn(),
    find: jest.fn(),
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
                User, Post, Category, Comment,
                FavoriteComment, LikeComment,
                UserMetric, RecoverPassword, CommentMetric
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
          User, Post, Category, Comment,
          FavoriteComment, LikeComment,
          UserMetric, RecoverPassword, CommentMetric
        ]),
        UnitOfWorkModule,
      ],
      providers: [CommentService],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    repository = moduleRef.get(getRepositoryToken(Comment));
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentService,
        {
          provide: getRepositoryToken(Comment),
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

    service = module.get<CommentService>(CommentService);
    repository = module.get<Repository<Comment>>(getRepositoryToken(Comment));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create comment', async () => {
    const dto: CreateCommentDto = {
      nameUser: mockUser.name,
      content: mockComment.content,
      parentId: 0
    }
    const createSpy = jest.spyOn(service['repository'], 'create').mockReturnValue(mockComment);
    const saveSpy = jest.spyOn(service['repository'], 'save').mockResolvedValue(mockComment);

    const result: Comment = await service.create(mockPost, mockUser, dto);

    expect(result.id).toBe(mockComment.id)
    expect(result.content).toBe(mockComment.content)
    expect(result.post.id).toBe(mockComment.post.id)
    expect(result.user.id).toBe(mockComment.user.id)

    expect(createSpy).toHaveBeenCalledWith({ ...dto, post: mockPost, user:mockUser, nameUser: mockUser.name });

    expect(saveSpy).toHaveBeenCalledWith(mockComment)
  });

  it('should throw bad request in findOne', async ()=> {
    await expect(service.findOne(NaN)).rejects.toThrow(BadRequestException);
    await expect(service.findOne(0)).rejects.toThrow(BadRequestException);
    await expect(service.findOne(-1)).rejects.toThrow(BadRequestException);
  });

  it('should throw not found in findOne', async () => {
    const id = 99;
    const findOne = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(null);

    await expect(service.findOne(id)).rejects.toThrow(NotFoundException);

    expect(findOne).toHaveBeenCalledWith(({ where: { id } }))
  });

  it('should get comment', async () => {
    const findOne = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(mockComment);

    const result = await service.findOne(mockComment.id);

    expect(result.id).toBe(mockComment.id)
    expect(result.content).toBe(mockComment.content)
    expect(result.post.id).toBe(mockComment.post.id)
    expect(result.user.id).toBe(mockComment.user.id)

    expect(findOne).toHaveBeenCalledWith(({ where: { id: mockComment.id } }))
  });

  it('should create comment On Comment', async () => {
    const dto: CreateCommentDto = {
      nameUser: mockUser.name,
      content: mockCommentOnComment.content,
      parentId: 0,
    }
    const createSpy = jest.spyOn(service['repository'], 'create').mockReturnValue(mockCommentOnComment);
    const saveSpy = jest.spyOn(service['repository'], 'save').mockResolvedValue(mockCommentOnComment);

    const result: Comment = await service.createOnComment(mockComment, mockUser, dto);

    expect(result.id).toBe(mockCommentOnComment.id)
    expect(result.content).toBe(mockCommentOnComment.content)
    expect(result.post.id).toBe(mockCommentOnComment.post.id)
    expect(result.user.id).toBe(mockCommentOnComment.user.id)

    expect(createSpy).toHaveBeenCalledWith({
      ...dto,
      user: mockUser,
      parentId: mockComment.id,
      post: mockComment.post,
      nameUser: mockUser.name,
    });

    expect(saveSpy).toHaveBeenCalledWith(mockCommentOnComment)
  });

  it('should remove comment and its replies', async () => {
    const mockComment = Object.assign(new Comment(), { id: 1 });

    const mockReplies: Comment[] = [
      Object.assign(new Comment(), { id: 2 }),
      Object.assign(new Comment(), { id: 3 }),
    ];

    const findSpy = jest.spyOn(service['repository'], 'find').mockResolvedValue(mockReplies);
    const deleteSpy = jest.spyOn(service['repository'], 'delete').mockResolvedValue({ affected: 1 } as any);

    await service.remove(mockComment);

    expect(findSpy).toHaveBeenCalledWith({
      where: { parentId: mockComment.id, isActived: true, isBlocked: false },
    });

    for (const reply of mockReplies) {
      expect(deleteSpy).toHaveBeenCalledWith(reply.id);
    }

    expect(deleteSpy).toHaveBeenCalledWith(mockComment.id);
  });

  it('should return paginated comments of a post', async () => {
    const page = 1;
    const limit = 10;

    const mockPost = { id: 1 } as Post;
    const mockComments = [{ id: 1 }, { id: 2 }] as Comment[];

    const findAndCountSpy = jest
      .spyOn(service['repository'], 'findAndCount')
      .mockResolvedValue([mockComments, mockComments.length]);

    const result = await service.findAllOfPost(mockPost, page, limit);

    expect(findAndCountSpy).toHaveBeenCalledWith({
      skip: (page - 1) * limit,
      take: limit,
      order: { id: 'ASC' },
      where: { post: mockPost, isActived: true, parentId: 0 },
    });

    expect(result).toEqual({
      data: mockComments,
      totalItems: mockComments.length,
      currentPage: page,
      totalPages: 1,
    });
  });

  it('should return paginated comments of a user', async () => {
    const page = 1;
    const limit = 5;

    const mockUser = { id: 1 } as User;
    const mockComments = [{ id: 1 }, { id: 2 }] as Comment[];

    const findAndCountSpy = jest
      .spyOn(service['repository'], 'findAndCount')
      .mockResolvedValue([mockComments, mockComments.length]);

    const result = await service.findAllOfUser(mockUser, page, limit);

    expect(findAndCountSpy).toHaveBeenCalledWith({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'ASC' },
      where: { user: mockUser },
    });

    expect(result).toEqual({
      data: mockComments,
      totalItems: mockComments.length,
      currentPage: page,
      totalPages: 1,
    });
  });

  it('should return paginated replies of a comment', async () => {
    const page = 2;
    const limit = 3;

    const mockComment = { id: 100 } as Comment;
    const mockReplies = [{ id: 101 }, { id: 102 }] as Comment[];

    const findAndCountSpy = jest
      .spyOn(service['repository'], 'findAndCount')
      .mockResolvedValue([mockReplies, mockReplies.length]);

    const result = await service.findAllOfComment(mockComment, page, limit);

    expect(findAndCountSpy).toHaveBeenCalledWith({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'ASC' },
      where: { parentId: mockComment.id },
    });

    expect(result).toEqual({
      data: mockReplies,
      totalItems: mockReplies.length,
      currentPage: page,
      totalPages: 1,
    });
  });

  it('should update and return the comment with isEdited=true', async () => {
    const mockComment = { id: 1, content: 'Old content' } as Comment;
    const updateDto = { content: 'New content' };

    const updatedComment = {
      ...mockComment,
      ...updateDto,
      isEdited: true,
    };

    const saveSpy = jest
      .spyOn(service['repository'], 'save')
      .mockResolvedValue(updatedComment);

    const result = await service.update(mockComment, updateDto);

    expect(saveSpy).toHaveBeenCalledWith(updatedComment);
    expect(result).toEqual(updatedComment);
  });


});
