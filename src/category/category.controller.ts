import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, HttpStatus, HttpCode } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../../src/auth/guards/jwt-auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { RolesGuard } from '../../src/auth/guards/roles.guard';
import { UnitOfWork } from '../../src/utils/UnitOfWork/UnitOfWork';
import { User } from '../../src/user/entities/user.entity';
import { ResponseDto } from '../../src/utils/Responses/ResponseDto.reponse';
import { Throttle } from '@nestjs/throttler';

@Controller({ path:'category', version:'1'})
export class CategoryController {
  constructor(private readonly categoryService: CategoryService, private readonly unit:UnitOfWork) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @Throttle({long: { ttl: 3000, limit: 6 } })
  async create(@Req() req, @Body() createCategoryDto: CreateCategoryDto) {
    const user: User = await this.unit.userService.findOneV2(+req.user.sub);
    const newCategory = await this.categoryService.create(user, createCategoryDto);

    return ResponseDto.of("Category created!!!", newCategory, "no");
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @Throttle({long: { ttl: 3000, limit: 10 } })
  async findAll() {
    return await this.categoryService.findAll();
  }

  @Get('/v2')
  @HttpCode(HttpStatus.OK)
  @Throttle({long: { ttl: 3000, limit: 10 } })
  async findAllV2() {
    return await this.categoryService.findAllV2();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @Throttle({long: { ttl: 3000, limit: 6 } })
  async findOne(@Param('id') id: string) {
    return await this.categoryService.findOne(+id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Throttle({long: { ttl: 3000, limit: 4 } })
  async update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    const category = await this.unit.categoryService.findOne(+id);
    const categoryUpdated = await this.categoryService.update(category, updateCategoryDto);

    return ResponseDto.of("Category created!!!", categoryUpdated, "no");
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @Throttle({long: { ttl: 3000, limit: 4 } })
  async remove(@Param('id') id: string) {
    const category = await this.unit.categoryService.findOne(+id);
    await this.categoryService.remove(category);

    return ResponseDto.of("Category deleted!!!", "null", "no");
  }
  
  @Get('/changeStatusActive/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @Throttle({long: { ttl: 3000, limit: 6 } })
  async changeStatusActive(@Param('id') id: string) {
    const category = await this.unit.categoryService.findOne(+id);

    const categoryUpdated = await this.categoryService.ChangeStatusActive(category);

    return ResponseDto.of("Category updated!!!", categoryUpdated, "no");
  }

}
