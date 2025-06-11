import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Req, HttpStatus, HttpCode, Query } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { JwtAuthGuard } from '../../src/auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { FilterPostDto } from './dto/filterPost.dto';
import { PaginationDto } from '../../src/utils/pagination.util';
import { UnitOfWork } from '../../src/utils/UnitOfWork/UnitOfWork';
import { User } from '../../src/user/entities/user.entity';
import { ActionEnum } from '../../src/user_metrics/action/ActionEnum.enum';
import { ResponseDto } from '../../src/utils/Responses/ResponseDto.reponse';
import { UserMetric } from '../../src/user_metrics/entities/user_metric.entity';
import { Throttle } from '@nestjs/throttler';

@Controller({ path:'post', version:'1'})
export class PostController {
  constructor(private readonly unit: UnitOfWork ) {}

  @Post(':categoryId')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({long: { ttl: 3000, limit: 6 } })
  async create(@Param('categoryId') categoryId: string, @Req() req, @Body() createPostDto: CreatePostDto) {
    const category = await this.unit.categoryService.findOne(+categoryId);
    const user: User = await this.unit.userService.findOneV2(+req.user.sub);

    const post = await this.unit.postService.create(category, user, createPostDto);

    const metric = await this.unit.userMetricService.findOneV2(user);
    this.unit.userMetricService.sumOrReducePostsCount(metric, ActionEnum.SUM);
    await this.unit.postMetricsService.create(post);

    return ResponseDto.of("Post created with successfully!!!", post, "no");
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @Throttle({long: { ttl: 3000, limit: 8 } })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Número da página' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, description: 'Quantidade de itens por página (máximo 100)' })
  async findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '40',
  ) {
    const pageNumber = Math.max(1, parseInt(page));
    const limitNumber = Math.min(100, parseInt(limit));

    return await this.unit.postService.findAll(pageNumber, limitNumber);
  }

  @Get('/findAllOfUser')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Número da página' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, description: 'Quantidade de itens por página (máximo 100)' })
  @ApiBearerAuth()
  @Throttle({long: { ttl: 3000, limit: 6 } })
  async findAllOfUser(
    @Req() req,
    @Query('page') page = '1',
    @Query('limit') limit = '40',
    @Query() filter: FilterPostDto,
  ) {
    const pageNumber: number = Math.max(1, parseInt(page));
    const limitNumber: number = Math.min(100, parseInt(limit));
    const user: User = await this.unit.userService.findOneV2(+req.user.sub);

    return await this.unit.postService.findAllOfUser(user, pageNumber, limitNumber, filter);
  }

  @Get('/:id')
  @HttpCode(HttpStatus.OK)
  @Throttle({long: { ttl: 3000, limit: 8 } })
  async findOne(@Param('id') id: string) {
    const post = await this.unit.postService.findOne(+id);
    const metric = await this.unit.postMetricsService.findOne(post);
    await this.unit.postMetricsService.sameViewed(metric);

    return ResponseDto.of("Post founded with successfully!!!", post, "no");
  }

  @Get('findByTitle/:title')
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Número da página' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, description: 'Quantidade de itens por página (máximo 100)' })
  @HttpCode(HttpStatus.OK)
  @Throttle({long: { ttl: 2000, limit: 10 } })
  async findByTitle(
    @Param('title') title: string,
    @Query('page') page = '1',
    @Query('limit') limit = '40',
  ) {
    const pageNumber: number = Math.max(1, parseInt(page));
    const limitNumber: number = Math.min(100, parseInt(limit));

    return await this.unit.postService.findByTitle(title, pageNumber, limitNumber);
  }

  @Get('findByCategory/:categoryId')
  @HttpCode(HttpStatus.OK)
  @Throttle({long: { ttl: 3000, limit: 4 } })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Número da página' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, description: 'Quantidade de itens por página (máximo 100)' })
  async findByCategory(
    @Param('categoryId') categoryId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '40',
  ) {
    const category = await this.unit.categoryService.findOne(+categoryId);
    const pageNumber: number = Math.max(1, parseInt(page));
    const limitNumber: number = Math.min(100, parseInt(limit));
    return await this.unit.postService.findByCategory(category, pageNumber, limitNumber);
  }

  @Put('/:id')
  @HttpCode(HttpStatus.OK)
  @Throttle({long: { ttl: 2000, limit: 4 } })
  async update(@Param('id') id: string, @Body() updatePostDto: UpdatePostDto) {
    const post = await this.unit.postService.findOne(+id)

    const udpated = await this.unit.postService.update(post, updatePostDto);
    const metric = await this.unit.postMetricsService.findOne(post);
    await this.unit.postMetricsService.sumOrReduceEditedCount(metric, ActionEnum.SUM);

    return ResponseDto.of("Post updated with successfully!!!", udpated, "no");
  }

  @Delete('/:id')
  @HttpCode(HttpStatus.OK)
  @Throttle({long: { ttl: 2000, limit: 4 } })
  async remove(@Param('id') id: string) {
    const post = await this.unit.postService.findOne(+id);
    const metric: UserMetric = await this.unit.userMetricService.findOneV2(post.user);
    await this.unit.userMetricService.sumOrReducePostsCount(metric, ActionEnum.REDUCE);
    await this.unit.postService.remove(post);

    return ResponseDto.of("Post deletd with successfully!!!", "null", "no");
  }

  @Get('filter')
  @Throttle({long: { ttl: 4000, limit: 12 } })
  async filter(
    @Query() filter: FilterPostDto,
    @Query() pagination: PaginationDto
  ) {
    return this.unit.postService.filter(filter, pagination);
  }

}