
import { DataSource, Repository, UpdateResult } from 'typeorm';
import { User } from './entities/user.entity';
import { UserController } from './user.controller';
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
import { UserModule } from './user.module';
import { UserService } from './user.service';
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CryptoService } from '../../CryptoService';
import { LoginUserDTO } from './dto/login-user.dto';
import * as redisStore from 'cache-manager-redis-store';
import { CACHE_MANAGER, CacheModule } from '@nestjs/cache-manager';
import { Follower } from '../../src/followers/entities/follower.entity';

let app;

describe('UserService', () => {
  let service: UserService;
  let repository: Repository<User>;

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

  const loginDto: LoginUserDTO = {
    email: mockUser.email,
    password: mockUser.password,
  };

  const mockRepository = {
    create: jest.fn().mockImplementation((user) => user),
    save: jest.fn().mockResolvedValue(mockUser),
    findOneBy: jest.fn().mockResolvedValue(mockUser),
    findOne: jest.fn(),
    exists: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
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
          },
        }),
        TypeOrmModule.forFeature([
          CommentMetric, PostMetric, User, Post, Category, Comment,
          FavoritePost, FavoriteComment, Like, UserMetric, RecoverPassword, LikeComment, Follower
        ]),
        UnitOfWorkModule,
        UserModule,
      ],
      controllers: [UserController],
      providers: [UserService],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    repository = moduleRef.get(getRepositoryToken(User));
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
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

    service = module.get<UserService>(UserService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw bad request in findOne', async ()=> {
    await expect(service.findOne(NaN)).rejects.toThrow(BadRequestException);
    await expect(service.findOne(0)).rejects.toThrow(BadRequestException);
    await expect(service.findOne(-1)).rejects.toThrow(BadRequestException);
  });

  it('should get the user by email', async ()=> {
    jest.spyOn(service, 'findOneByEmail').mockResolvedValueOnce(mockUser);

    const user = await service.findOneByEmail(mockUser.email);

    expect(user.id).toBe(mockUser.id);
  });

  it('should throw bad request in findOneByEmail', async ()=> {
    await expect(service.findOneByEmail("")).rejects.toThrow(BadRequestException);
  });

  it('should throw not found in findOneByEmail', async ()=> {
    const email: string = "user@gmail.com";
    const findOne = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(null)

    await expect(service.findOneByEmail(email)).rejects.toThrow(NotFoundException);

    expect(findOne).toHaveBeenCalledWith({ where: { email } });
    expect(findOne).toHaveBeenCalledTimes(1);
  });

  it('should call method of form right', async () => {
    const id = mockUser.id;
    const findOne = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(mockUser);

    await service.findOne(id);

    expect(findOne).toHaveBeenCalledTimes(2);
    expect(findOne).toHaveBeenCalledWith({ where: { id } });
  });

  it('should get the user by id', async () => {
    const id = mockUser.id;
    jest.spyOn(service['repository'], 'findOne').mockResolvedValue(mockUser);

    const result = await service.findOne(id);

    expect(result.id).toBe(mockUser.id);
  });

  it('should throw not found in findOne', async () => {
    const id = 999;
    jest.spyOn(service['repository'], 'findOne').mockResolvedValue(null);

    await expect(service.findOne(id)).rejects.toThrow(NotFoundException);
  });

  it('should create a user', async ()=> {
    const existsSpy = jest.spyOn(service['repository'], 'exists').mockResolvedValue(false)

    const createSpy = jest.spyOn(service['repository'], 'create').mockReturnValue(mockUser)
    const saveSpy = jest.spyOn(service['repository'], 'save').mockResolvedValue(mockUser)

    const dto: CreateUserDto = {
      name: mockUser.name,
      email: mockUser.email,
      password: mockUser.password
    }

    const result = service.create(dto);

    expect((await result).name).toBe(mockUser.name)
    expect((await result).email).toBe(mockUser.email)

    expect(existsSpy).toHaveBeenCalledTimes(1)
    expect(existsSpy).toHaveBeenCalledWith({ where: { email: dto.email } })

    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(createSpy).toHaveBeenCalledWith(dto);

    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(saveSpy).toHaveBeenCalledWith(mockUser);
  });

  it('should remove a user', async ()=> {
    const deleteSpy = jest.spyOn(service['repository'], 'delete').mockResolvedValue({ affected: 1 } as any)

    await service.remove(mockUser)

    expect(deleteSpy).toHaveBeenCalledTimes(1);
    expect(deleteSpy).toHaveBeenCalledWith(mockUser.id);
  });

  it('should make logout', async () => {
    const user = Object.assign(new User(), mockUser);
    user.refreshToken = null;
    user.refreshToken = null;

    const saveSpy = jest.spyOn(service['repository'], 'save').mockResolvedValue(user);

    await service.logout(user);

    expect(saveSpy).toHaveBeenCalledWith(user);
  });

  it('should update user', async ()=> {
    const user = Object.assign(new User(), mockUser);

    const dto: UpdateUserDto = {
      name: 'user update',
      email: user.email,
      password: '12345678',
      version: user.version
    }

    const updateSpy = jest.spyOn(service['repository'], 'update').mockResolvedValue({ affected: 1 } as any );

    const result: UpdateResult = await service.update(user, dto);

    expect(result).not.toBeNull()

    expect(updateSpy).toHaveBeenCalledTimes(1)
    expect(updateSpy).toHaveBeenCalledWith(user.id, {
      ...dto,
      version: user.version
    });
  });

  it('should login successfully', async ()=> {
    jest.spyOn(repository, 'findOne').mockResolvedValue(mockUser);
    jest.spyOn(CryptoService, 'compare').mockResolvedValue(true);

    const result = await service.LoginAsync(loginDto)

    expect(repository.findOne).toHaveBeenCalledWith({ where: { email: loginDto.email.trim() } });
    expect(CryptoService.compare).toHaveBeenCalledWith(loginDto.password, mockUser.password);
    expect(result).toBe(mockUser);
  });

  it('should throw UnauthorizedException if user is not found', async () => {
    jest.spyOn(repository, 'findOne').mockResolvedValue(null);

    await expect(service.LoginAsync(loginDto)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException if password is invalid', async () => {
    jest.spyOn(repository, 'findOne').mockResolvedValue(mockUser);
    jest.spyOn(CryptoService, 'compare').mockResolvedValue(false);

    await expect(service.LoginAsync(loginDto)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException if user is blocked', async () => {
    const blockedUser = Object.assign(new User, mockUser);
    blockedUser.isBlocked = true;
    jest.spyOn(repository, 'findOne').mockResolvedValue(blockedUser);
    jest.spyOn(CryptoService, 'compare').mockResolvedValue(true);

    await expect(service.LoginAsync(loginDto)).rejects.toThrow(UnauthorizedException);
  });

});
