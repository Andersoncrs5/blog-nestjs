import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Req, HttpStatus, HttpCode, Query } from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}


  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async create(@Req() req, @Body() createPostDto: CreatePostDto) {
    return await this.postService.create(+req.user.sub, createPostDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Número da página' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, description: 'Quantidade de itens por página (máximo 100)' })
  async findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '40',
  ) {
    const pageNumber = Math.max(1, parseInt(page));
    const limitNumber = Math.min(100, parseInt(limit));

    return await this.postService.findAll(pageNumber, limitNumber);
  }

  @Get('/findAllOfUser')
  @HttpCode(HttpStatus.FOUND)
  @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Número da página' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, description: 'Quantidade de itens por página (máximo 100)' })
  @ApiBearerAuth()
  async findAllOfUser(
    @Req() req,
    @Query('page') page = '1',
    @Query('limit') limit = '40',
  ) {
    const pageNumber: number = Math.max(1, parseInt(page));
    const limitNumber: number = Math.min(100, parseInt(limit));

    return await this.postService.findAllOfUser(+req.user.sub, pageNumber, limitNumber);
  }

  @Get(':id')
  @HttpCode(HttpStatus.FOUND)
  async findOne(@Param('id') id: string) {
    return await this.postService.findOne(+id);
  }

  @Get('findByTitle/:title')
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Número da página' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, description: 'Quantidade de itens por página (máximo 100)' })
  @HttpCode(HttpStatus.FOUND)
  async findByTitle(
    @Param('title') title: string,
    @Query('page') page = '1',
    @Query('limit') limit = '40',
  ) {
    const pageNumber: number = Math.max(1, parseInt(page));
    const limitNumber: number = Math.min(100, parseInt(limit));

    return await this.postService.findByTitle(title, pageNumber, limitNumber);
  }

  @Get('findByCategory/:category')
  @HttpCode(HttpStatus.FOUND)
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Número da página' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, description: 'Quantidade de itens por página (máximo 100)' })
  async findByCategory(
    @Param('category') category: string,
    @Query('page') page = '1',
    @Query('limit') limit = '40',
  ) {
    const pageNumber: number = Math.max(1, parseInt(page));
    const limitNumber: number = Math.min(100, parseInt(limit));
    return await this.postService.findByCategory(category, pageNumber, limitNumber);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() updatePostDto: UpdatePostDto) {
    return await this.postService.update(+id, updatePostDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    return await this.postService.remove(+id);
  }
}
