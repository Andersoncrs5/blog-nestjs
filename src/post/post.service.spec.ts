import { Test, TestingModule } from '@nestjs/testing';
import { PostService } from './post.service';
import { DataSource, Repository } from 'typeorm';
import { User } from '../../src/user/entities/user.entity';
import { addTransactionalDataSource, initializeTransactionalContext } from 'typeorm-transactional';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { UnitOfWorkModule } from '../../src/utils/UnitOfWork/UnitOfWork.module';
import { PostModule } from './post.module';
import { PostController } from './post.controller';
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
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { FilterPostDto } from './dto/filterPost.dto';
import { paginate } from 'nestjs-typeorm-paginate';
import { PaginationDto } from 'src/utils/pagination.util';
import { Like as a } from 'typeorm';
import { Follower } from '../../src/followers/entities/follower.entity';
import * as redisStore from 'cache-manager-redis-store';
import { CACHE_MANAGER, CacheModule } from '@nestjs/cache-manager';

jest.mock('nestjs-typeorm-paginate');

let app;

describe('PostService unitary tes', () => {
  let service: PostService;
  let repository: Repository<Post>

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

  const mockRepository = {
    findOne: jest.fn(),
    delete: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    findAndCount: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(),
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
                User, Post, Category, Comment, FavoritePost, Follower,
                FavoriteComment, Like, UserMetric, RecoverPassword,
                LikeComment, PostMetric, CommentMetric
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
        PostModule
      ],
      controllers: [PostController],
      providers: [PostController]
    }).compile()

    app = moduleRef.createNestApplication()
    await app.init()

    repository = moduleRef.get(getRepositoryToken(Post))
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostService,
        {
          provide: getRepositoryToken(Post),
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

    service = module.get<PostService>(PostService);
    repository = module.get<Repository<Post>>(getRepositoryToken(Post))

  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw bad request', async ()=> {
    await expect(service.findOne(NaN)).rejects.toThrow(BadRequestException);
    await expect(service.findOne(-1)).rejects.toThrow(BadRequestException);
    await expect(service.findOne(0)).rejects.toThrow(BadRequestException);
  });

  it('should throw not found', async ()=> {
    const id = 99;
    const findOneSpy = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(null);

    await expect(service.findOne(id)).rejects.toThrow(NotFoundException);

    expect(findOneSpy).toHaveBeenCalledTimes(1)
    expect(findOneSpy).toHaveBeenCalledWith({ where: { id } });

  });

  it('should get post', async ()=> {
    const findOneSpy = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(mockPost);

    const result = await service.findOne(mockPost.id);

    expect(result.id).toBe(mockPost.id)
    expect(result.title).toBe(mockPost.title)
    expect(result.content).toBe(mockPost.content)
    expect(result.user.id).toBe(mockPost.user.id)
    expect(result.category.id).toBe(mockPost.category.id)

    expect(findOneSpy).toHaveBeenCalledWith({ where: { id: mockPost.id } });

  });

  it('should remove post', async ()=> {
    const post = Object.assign(new Post, mockPost);

    const deleteSpy = jest.spyOn(service['repository'], 'delete')
      .mockResolvedValueOnce({ affected: 1 } as any );

    await service.remove(post);

    expect(deleteSpy).toHaveBeenCalledTimes(1)
    expect(deleteSpy).toHaveBeenCalledWith(post)
  });

  it('should create a post', async ()=> {
    const post = Object.assign(new Post, mockPost);

    const createSpy = jest.spyOn(service['repository'], 'create').mockReturnValue(post)
    const saveSpy = jest.spyOn(service['repository'], 'save').mockResolvedValue(post)

    const dto: CreatePostDto = {
      title: post.title,
      content: post.content,
    }

    const result = await service.create(mockCategory, mockUser, dto);

    expect(result).not.toBeNull();
    expect(result.title).toBe(post.title);
    expect(result.content).toBe(post.content);
    expect(result.user.id).toBe(post.user.id);
    expect(result.category.id).toBe(post.category.id);

    expect(createSpy).toHaveBeenCalledTimes(1)
    expect(createSpy).toHaveBeenCalledWith({...dto, user:mockUser, category:mockCategory})

    expect(saveSpy).toHaveBeenCalledTimes(1)
    expect(saveSpy).toHaveBeenCalledWith(post)
  });

  it('should find all post', async ()=> {
    const page: number = 0
    const limit: number = 10

    const post1 = Object.assign(new Post, mockPost)
    const post2 = Object.assign(new Post, mockPost, { id: 2 })
    const post3 = Object.assign(new Post, mockPost, { id: 3 })

    const posts: Post[] = [post1, post2, post3]

    const findAndCountSpy = jest.spyOn(service['repository'], 'findAndCount').mockResolvedValue([posts, posts.length]);

    const result = await service.findAll(page, limit);

    expect(findAndCountSpy).toHaveBeenCalledWith({
      skip: (page - 1) * limit,
      take: limit,
      order: { id: 'ASC' },
      where: { isActived: true, isBlocked: false },
      relations: ['user'],
    });

    expect(result).toEqual({
      data: posts,
      totalItems: posts.length,
      currentPage: page,
      totalPages: 1,
    });
  });

  it('should update the post', async ()=> {
    const post = Object.assign(new Post, mockPost)

    const dto: UpdatePostDto = {
      title: 'post update',
      content: post.content,
    }

    const updateSpyOn = jest.spyOn(service['repository'], 'update').mockResolvedValue({ affected: 1 } as any);

    const result = await service.update(post, dto);

    console.log(result);
    expect(result).not.toBeNull()

    expect(updateSpyOn).toHaveBeenCalledTimes(1);
    expect(updateSpyOn).toHaveBeenCalledWith(post.id, {
      ...dto, version: post.version, category: mockCategory
    });
  });

  it('should find By Category', async ()=> {
    const page = 1
    const limit = 1

    const post1 = Object.assign(new Post, mockPost)
    const post2 = Object.assign(new Post, mockPost, { id: 2 })
    const post3 = Object.assign(new Post, mockPost, { id: 3 })
    const post4 = Object.assign(new Post, mockPost, { id: 4 })

    const posts = [ post1, post2, post3, post4 ]

    const findAndCountSpy = jest.spyOn(service['repository'], 'findAndCount').mockResolvedValue([posts, posts.length])

    const result = await service.findByCategory(mockCategory, page, limit);

    expect(findAndCountSpy).toHaveBeenCalledWith({ 
      skip: (page - 1) * limit,
      take: limit,
      order: { id: 'ASC' },
      where: { category: mockCategory },
      relations: [ 'user' ]
    })

    expect(result).toEqual({
      data: posts,
      totalItems: posts.length,
      currentPage: page,
      totalPages: 4,
    });
  });

  it('should find all posts of user with filters and pagination', async () => {
    const user = Object.assign(new User, mockUser, { id: 1 });
    const page = 1;
    const limit = 10;

    const filter = {
      title: 'test',
      authorName: 'John',
      categoryId: 5,
      viewedAfter: 10,
      viewedBefore: 100,
      createdAtAfter: new Date('2023-01-01'),
      createdAtBefore: new Date('2023-12-31'),
      likeAfter: 5,
      likeBefore: 50,
      dislikeAfter: 0,
      dislikeBefore: 10,
      commentsCountAfter: 3,
      commentsCountBefore: 20,
      favoriteCountAfter: 1,
      favoriteCountBefore: 15,
    } as FilterPostDto;

    const mockQueryBuilder: any = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
    };

    (service['repository'].createQueryBuilder as jest.Mock).mockReturnValue(mockQueryBuilder);

    const fakePaginateResult = {
      items: [],
      meta: { totalItems: 0, itemCount: 0, itemsPerPage: limit, totalPages: 0, currentPage: page },
      links: {},
    };
    (paginate as jest.Mock).mockResolvedValue(fakePaginateResult);

    const result = await service.findAllOfUser(user, page, limit, filter);

    expect(service['repository'].createQueryBuilder).toHaveBeenCalledWith('post');
    expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('post.metric', 'metric');
    expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('post.user', 'user');
    expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('post.category', 'category');

    expect(mockQueryBuilder.where).toHaveBeenCalledWith('post.userId = :userId', { userId: user.id });
    expect(mockQueryBuilder.andWhere).toHaveBeenCalled(); 
    expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('post.id', 'ASC');

    expect(paginate).toHaveBeenCalledWith(mockQueryBuilder, {
      page,
      limit,
      route: '/post/findAllOfUser',
    });

    expect(result).toBe(fakePaginateResult);
  });

  it('should find By Title', async ()=> {
    const page = 1
    const limit = 1
    const title = "post"

    const post1 = Object.assign(new Post, mockPost)
    const post2 = Object.assign(new Post, mockPost, { id: 2 })
    const post3 = Object.assign(new Post, mockPost, { id: 3 })
    const post4 = Object.assign(new Post, mockPost, { id: 4 })

    const posts = [ post1, post2, post3, post4 ]

    const findAndCountSpy = jest.spyOn(service['repository'], 'findAndCount').mockResolvedValue([posts, posts.length])

    const result = await service.findByTitle(title, page, limit)

    expect(findAndCountSpy).toHaveBeenCalledWith({ 
      skip: (page - 1) * limit,
      take: limit,
      order: { id: 'ASC' },
      where: { title: a(`%${title}%`) },
      relations: [ 'user' ]
    })

    expect(result).toEqual({
      data: posts,
      totalItems: posts.length,
      currentPage: page,
      totalPages: 4,
    });
  });

  it('should apply filters, paginate, and return results', async () => {
    const filter: FilterPostDto = {
      title: 'example',
      authorName: 'John',
      categoryId: 1,
      viewedAfter: 10,
      viewedBefore: 100,
      createdAtAfter: new Date('2023-01-01'),
      createdAtBefore: new Date('2023-12-31'),
    };

    const pagination: PaginationDto = {
      page: 2,
      limit: 5,
    };

    const mockQueryBuilder: any = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[{ id: 1 } as Post], 1]),
    };

    (service['repository'].createQueryBuilder as jest.Mock).mockReturnValue(mockQueryBuilder);

    const result = await service.filter(filter, pagination);

    expect(service['repository'].createQueryBuilder).toHaveBeenCalledWith('post');
    expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('post.user', 'user');
    expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('post.category', 'category');
    expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('post.metrics', 'metrics');

    expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('post.id', 'ASC');
    expect(mockQueryBuilder.skip).toHaveBeenCalledWith((pagination.page - 1) * pagination.limit);
    expect(mockQueryBuilder.take).toHaveBeenCalledWith(pagination.limit);

    expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('post.title ILIKE :title', { title: `%${filter.title}%` });
    expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('user.name ILIKE :authorName', { authorName: `%${filter.authorName}%` });
    expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('category.id = :categoryId', { categoryId: filter.categoryId });
    expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('metrics.viewed >= :viewedAfter', { viewedAfter: filter.viewedAfter });
    expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('metrics.viewed <= :viewedBefore', { viewedBefore: filter.viewedBefore });
    expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('post.createdAt >= :createdAtAfter', { createdAtAfter: filter.createdAtAfter });
    expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('post.createdAt <= :createdAtBefore', { createdAtBefore: filter.createdAtBefore });

    expect(mockQueryBuilder.getManyAndCount).toHaveBeenCalled();

    expect(result).toEqual({
      data: [{ id: 1 }],
      totalItems: 1,
      currentPage: pagination.page,
      totalPages: Math.ceil(1 / pagination.limit),
    });
  });

});