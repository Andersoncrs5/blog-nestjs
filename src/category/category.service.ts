import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { User } from '../../src/user/entities/user.entity';
import { Propagation, Transactional } from 'typeorm-transactional';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly repository: Repository<Category>,
    @Inject(CACHE_MANAGER)
    private readonly cache: Cache
  ) {}

  @Transactional()
  async create(user: User, createCategoryDto: CreateCategoryDto): Promise<Category> {
    const check = await this.repository.exists({ where: { name: createCategoryDto.name } })

    if (check) { throw new ConflictException('Name in use!!!'); }

    const categoryCreate = { ...createCategoryDto, user, nameUser: user.name };

    const category: Category = await this.repository.create(categoryCreate);
    return await this.repository.save(category);
  }

  @Transactional()
  async findAllV2(): Promise<Category[]> {
    const key = `category:all`

    const categoryCache = await this.cache.get<Category[]>(key);

    if (categoryCache) {
      return categoryCache;
    }

    const result = await this.repository.find({ where: { isActived: true } });

    await this.cache.set(key, categoryCache, 200);

    return result;
  }

  @Transactional()
  async findAll(): Promise<Category[]> {
    const result = await this.repository.find({ where: { isActived: true } });
    return result;
  }

  @Transactional()
  async findOne(id: number): Promise<Category> {
    if (!id || isNaN(id) || id <= 0) {
      throw new BadRequestException('ID must be a positive number');
    }

    const category: Category | null = await this.repository.findOne({ where: { id } });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  @Transactional()
  async update(category: Category, updateCategoryDto: UpdateCategoryDto) {
    const data = { ...updateCategoryDto, version: category.version }

    return await this.repository.update(category.id, data);
  }

  @Transactional()
  async remove(category: Category): Promise<void> {
    await this.repository.delete(category.id);
  }

  @Transactional()
  async ChangeStatusActive(category: Category) {
    category.isActived = !category.isActived;
    category.version = category.version;

    return await this.repository.update(category.id, category);
  }
}
