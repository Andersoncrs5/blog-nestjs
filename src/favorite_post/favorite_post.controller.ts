import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, HttpStatus, HttpCode, Query } from '@nestjs/common';
import { FavoritePostService } from './favorite_post.service';
import { CreateFavoritePostDto } from './dto/create-favorite_post.dto';
import { UpdateFavoritePostDto } from './dto/update-favorite_post.dto';
import { JwtAuthGuard } from '../../src/auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@Controller('favorite-post')
export class FavoritePostController {
  constructor(private readonly service: FavoritePostService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createFavoritePostDto: CreateFavoritePostDto) {
    return await this.service.create(createFavoritePostDto);
  }

  @Get('/findAllofUser')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Número da página' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, description: 'Quantidade de itens por página (máximo 100)' })
  async findAllOfUser(
    @Req() req,
    @Query('page') page = '1',
    @Query('limit') limit = '40',
  ) {
    const pageNumber = Math.max(1, parseInt(page));
    const limitNumber = Math.min(100, parseInt(limit));
    return this.service.findAllOfUser(+req.user.sub, pageNumber, limitNumber);
  }

  @Get('/exists/:idPost')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.FOUND)
  @ApiBearerAuth()
  async exists(@Req() req, @Param('idPost') idPost: number ) {
    return await this.service.exists(+req.user.sub, idPost);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }
}
