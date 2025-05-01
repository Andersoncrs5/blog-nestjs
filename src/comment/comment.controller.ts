import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards, HttpStatus, HttpCode, Query } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@Controller('comment')
export class CommentController {
  constructor(private readonly service: CommentService) {}

  @Post(':idPost')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  async create(@Param('idPost') idPost: number, @Req() req, @Body() createCommentDto: CreateCommentDto) {
    return await this.service.create(idPost, +req.user.id, createCommentDto);
  }

  @Get('findAllOfPost/:id')
  @HttpCode(HttpStatus.FOUND)
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Número da página' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, description: 'Quantidade de itens por página (máximo 100)' })
  async findAllOfPost(
    @Param('id') id: number,
    @Query('page') page = '1',
    @Query('limit') limit = '40',
  ) {
    const pageNumber = Math.max(1, parseInt(page));
    const limitNumber = Math.min(100, parseInt(limit));
    return await this.service.findAllOfPost(id, pageNumber, limitNumber);
  }

  @Get('/findAllofUser')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.FOUND)
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

  @Get('/findAllOfComment/:id')
  @HttpCode(HttpStatus.FOUND)
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Número da página' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, description: 'Quantidade de itens por página (máximo 100)' })
  async findAllOfComment(
    @Param('id') id: string,
    @Query('page') page = '1',
    @Query('limit') limit = '40',
  ) {
    const pageNumber = Math.max(1, parseInt(page));
    const limitNumber = Math.min(100, parseInt(limit));
    return await this.service.findAllOfComment(+id, pageNumber, limitNumber);
  }

  @Get(':id')
  @HttpCode(HttpStatus.FOUND)
  async findOne(@Param('id') id: string) {
    return await this.service.findOne(+id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() updateCommentDto: UpdateCommentDto) {
    return await this.service.update(+id, updateCommentDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    return await this.service.remove(+id);
  }

  @Post('/createOnComment/:idComment/')
  @HttpCode(HttpStatus.CREATED)
  async createOnComment(@Param('idComment') idComment: number, @Req() req, @Body() createCommentDto: CreateCommentDto) {
    return await this.service.createOnComment(idComment, +req.user.sub, createCommentDto);
  }

}