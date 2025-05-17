import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { User } from 'src/user/entities/user.entity';
import { UserService } from 'src/user/user.service';
import { Transactional } from 'typeorm-transactional';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly repository: Repository<Category>,
    private readonly userService: UserService,
  ) {}

  @Transactional()
  async create(id: number, createCategoryDto: CreateCategoryDto) {
    const user: User = await this.userService.findOne(id);
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
  async update(id: number, updateCategoryDto: UpdateCategoryDto): Promise<Category | null> {
    await this.findOne(id); 

    await this.repository.update(id, updateCategoryDto);
    return await this.repository.findOne({ where: { id } });
  }

  @Transactional()
  async remove(id: number) {
    await this.findOne(id); 

    await this.repository.delete(id);
    return 'Category deleted';
  }

  @Transactional()
  async ChangeStatusActive(id: number): Promise<Category> {
    const category: Category = await this.findOne(id);
    category.isActived = !category.isActived;

    await this.repository.update(id, category);
    return category;
  }
}
