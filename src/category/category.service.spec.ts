import { Test, TestingModule } from '@nestjs/testing';
import { CategoryService } from './category.service';
import { DataSource, Repository } from 'typeorm';
import { User } from '../../src/user/entities/user.entity';
import { addTransactionalDataSource, initializeTransactionalContext } from 'typeorm-transactional';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { CategoryModule } from './category.module';
import { CategoryController } from './category.controller';
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
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { mock } from 'node:test';
import { UpdateCategoryDto } from './dto/update-category.dto';

let app

describe('CategoryService', () => {
  let service: CategoryService;
  let repository: Repository<Category>
  
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

  const mockRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    exists: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
  }

  beforeAll(async () => {
    initializeTransactionalContext()

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
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
          CommentMetric, PostMetric, User, Post, Category, Comment,
          FavoritePost, FavoriteComment, Like, UserMetric, RecoverPassword, LikeComment
        ]),
        UnitOfWorkModule,
        CategoryModule
      ],
      controllers: [CategoryController],
      providers: [CategoryService]
    }).compile();

    app = moduleRef.createNestApplication()
    await app.init();

    repository = moduleRef.get(getRepositoryToken(Category));
  });

  beforeEach(async ()=>{
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        {
          provide: getRepositoryToken(Category),
          useValue: mockRepository
        }
      ]
    }).compile();

    service = module.get<CategoryService>(CategoryService);
    repository = module.get<Repository<Category>>(getRepositoryToken(Category));
  })

  it('should be defined', async () => {
    expect(service).toBeDefined();
  });

  it('should throw throw bad request', async ()=> {
    expect(service.findOne(-1)).rejects.toThrow(BadRequestException);
    expect(service.findOne(NaN)).rejects.toThrow(BadRequestException);
    expect(service.findOne(0)).rejects.toThrow(BadRequestException);
  });

  it('should throw not found in findOne ', async ()=> {
    const id = 99;
    const findOne = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(null);

    expect(service.findOne(id)).rejects.toThrow(NotFoundException);

    expect(findOne).toHaveBeenCalledTimes(1);
    expect(findOne).toHaveBeenCalledWith({ where: { id } });
  });

  it('should get category', async ()=> {
    const id = mockCategory.id
    const findOne = jest.spyOn(service['repository'], 'findOne').mockResolvedValue(mockCategory);

    const result = await service.findOne(mockCategory.id);

    expect(result.name).toBe(mockCategory.name)
    expect(result.nameUser).toBe(mockCategory.nameUser)
    expect(result.id).toBe(mockCategory.id)

    expect(findOne).toHaveBeenCalledWith({ where: { id } })
  });

  it('should create a category', async () => {
    const dto: CreateCategoryDto = {
      name: 'ti',
      nameUser: mockUser.name,
    };

    const categoryCreate = { ...dto, user: mockUser, nameUser: mockUser.name };
    const saveCategory: Category = Object.assign(new Category(), {
      ...mockCategory,
      name: dto.name,
    });

    const existsSpy = jest
      .spyOn(service['repository'], 'exists')
      .mockResolvedValue(false);

    const createSpy = jest
      .spyOn(service['repository'], 'create')
      .mockReturnValue(saveCategory);

    const saveSpy = jest
      .spyOn(service['repository'], 'save')
      .mockResolvedValue(saveCategory);

    const result = await service.create(mockUser, dto);

    expect(result).not.toBeNull();
    expect(result.name).toBe(dto.name);

    expect(existsSpy).toHaveBeenCalledTimes(1);
    expect(existsSpy).toHaveBeenCalledWith({ where: { name: dto.name } });

    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(createSpy).toHaveBeenCalledWith(categoryCreate);

    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(saveSpy).toHaveBeenCalledWith(saveCategory);
  });

  it('should throw confliet in create', async ()=> {
    const dto: CreateCategoryDto = {
      name: 'ti',
      nameUser: mockUser.name,
    };

    const categoryCreate = { ...dto, user: mockUser, nameUser: mockUser.name };

    const existsSpy = jest
      .spyOn(service['repository'], 'exists')
      .mockResolvedValue(true);

    await expect(service.create(mockUser, dto)).rejects.toThrow(ConflictException);
  });

  it('should return all active categories', async () => {
    const activeCategories: Category[] = [
      { ...new Category(), id: 1, name: 'Categoria 1', isActived: true, user: mockUser },
      { ...new Category(), id: 2, name: 'Categoria 2', isActived: true, user: mockUser },
    ];

    const findSpy = jest
      .spyOn(service['repository'], 'find')
      .mockResolvedValue(activeCategories);

    const result = await service.findAll();

    expect(findSpy).toHaveBeenCalledTimes(1);
    expect(findSpy).toHaveBeenCalledWith({ where: { isActived: true } });
    expect(result).toEqual(activeCategories);
  });

  it('should delete a category', async ()=> {
    const category = Object.assign(new Category, mockCategory);
    const deleteSpy = jest.spyOn(service['repository'], 'delete').mockResolvedValue({ affected: 1 } as any)

    await service.remove(category);

    await expect(deleteSpy).toHaveBeenCalledTimes(1)
    await expect(deleteSpy).toHaveBeenCalledWith(category.id)
  });

  it('should change category status  ', async ()=> {
    const category = Object.assign(new Category, mockCategory);
    category.isActived = true;

    const update = jest.spyOn(service['repository'], 'update').mockResolvedValue({ affected: 1 } as any)

    const result = await service.ChangeStatusActive(category);

    await expect(category.isActived).toBe(false);
    await expect(update).toHaveBeenCalledTimes(1)
    await expect(update).toHaveBeenCalledWith(category.id, category);
  });

  it('should update a category', async ()=> {
    const category = Object.assign(new Category, mockCategory);
    const update = jest.spyOn(service['repository'], 'update').mockResolvedValue({ affected: 1 } as any)

    const dto: UpdateCategoryDto = {
      name: 'IT',
      nameUser: mockUser.name,
    };

    const result = await service.update(category, dto);

    await expect(update).toHaveBeenCalledWith(category.id, {
      ...dto,
      version: category.version
    });

      expect(result).toEqual({ affected: 1 });
  });

});
