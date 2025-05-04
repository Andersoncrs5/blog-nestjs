import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, HttpStatus, HttpCode } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  async create(@Req() req, @Body() createCategoryDto: CreateCategoryDto) {
    return this.categoryService.create(+req.user.sub, createCategoryDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll() {
    return await this.categoryService.findAll();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    return await this.categoryService.findOne(+id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  async update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return await this.categoryService.update(+id, updateCategoryDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.categoryService.remove(+id);
  }
  
  @Get('/changeStatusActive/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  async changeStatusActive(@Param('id') id: string) {
    return this.categoryService.ChangeStatusActive(+id);
  }

}
