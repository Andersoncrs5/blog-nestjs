import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { User } from '../../src/user/entities/user.entity';
import { Transactional } from 'typeorm-transactional';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly repository: Repository<Category>,

  ) {}

  @Transactional()
  async create(user: User, createCategoryDto: CreateCategoryDto) {
    const categoryCreate = { ...createCategoryDto, user, nameUser: user.name };

    const category: Category = this.repository.create(categoryCreate);
    return await this.repository.save(category);
  }

  async findAll(): Promise<Category[]> {
    return await this.repository.find({ where: { isActived: true } });
  }

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
  async remove(category: Category) {
    await this.repository.delete(category.id);
  }

  @Transactional()
  async ChangeStatusActive(category: Category) {
    category.isActived = !category.isActived;

    return await this.repository.update(category.id, category);
  }
}
