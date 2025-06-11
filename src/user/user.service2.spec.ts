import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UserMetric } from '../../src/user_metrics/entities/user_metric.entity';
import { RecoverPassword } from '../../src/recover_password/entities/recover_password.entity';

describe('UserService - findOneV2', () => {
  let service: UserService;
  let repository: Repository<User>;
  let cache: any;

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
    metric: new UserMetric,
    recover: new RecoverPassword,
    likesComments: [],
    hashPassword: async function (): Promise<void> {
      return;
    }
  };

  const mockRepository = {
    findOne: jest.fn(),
  };

  const mockCache = {
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getRepositoryToken(User), useValue: mockRepository },
        { provide: CACHE_MANAGER, useValue: mockCache },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
    cache = module.get(CACHE_MANAGER);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw BadRequestException if the ID is invalid', async () => {
    await expect(service.findOneV2(NaN)).rejects.toThrow(BadRequestException);
    await expect(service.findOneV2(0)).rejects.toThrow(BadRequestException);
    await expect(service.findOneV2(-1)).rejects.toThrow(BadRequestException);
  });

  it('should to return the user in cache if exist', async () => {
    cache.get.mockResolvedValue(mockUser);

    const result = await service.findOneV2(1);

    expect(cache.get).toHaveBeenCalledWith('user:1');
    expect(result).toEqual(mockUser);
    expect(repository.findOne).not.toHaveBeenCalled();
  });

  it('should to find the user in back and to store in cache if not been have in cache', async () => {
    cache.get.mockResolvedValue(null);
    mockRepository.findOne.mockResolvedValue(mockUser);

    const result = await service.findOneV2(1);

    expect(cache.get).toHaveBeenCalledWith('user:1');
    expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(cache.set).toHaveBeenCalledWith('user:1', mockUser, 120);
    expect(result).toEqual(mockUser);
  });

  it('should to throw NotFoundException if the user not found in bank', async () => {
    cache.get.mockResolvedValue(null);
    mockRepository.findOne.mockResolvedValue(null);

    await expect(service.findOneV2(1)).rejects.toThrow(NotFoundException);

    expect(cache.get).toHaveBeenCalledWith('user:1');
    expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(cache.set).not.toHaveBeenCalled();
  });
});
