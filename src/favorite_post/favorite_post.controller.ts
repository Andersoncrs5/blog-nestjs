import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, HttpStatus, HttpCode, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../../src/auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UnitOfWork } from 'src/utils/UnitOfWork/UnitOfWork';
import { ResponseDto } from 'src/utils/Responses/ResponseDto.reponse';
import { ActionEnum } from 'src/user_metrics/action/ActionEnum.enum';
import { UserMetric } from 'src/user_metrics/entities/user_metric.entity';
import { PostMetric } from 'src/post_metrics/entities/post_metric.entity';
import { User } from 'src/user/entities/user.entity';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('favorite-post')
export class FavoritePostController {
  constructor(private readonly unit: UnitOfWork) {}

  @Post('/:postId')
  @HttpCode(HttpStatus.CREATED)
  async create(@Req() req, @Body() @Param() postId: string ) {
    const user = await this.unit.userService.findOne(+req.user.sub);
    const post = await this.unit.postService.findOne(+postId);

    const userMetric: UserMetric = await this.unit.userMetricService.findOne(user);
    await this.unit.userMetricService.sumOrReduceSavedPostsCount(userMetric, ActionEnum.SUM);

    const postMetric: PostMetric = await this.unit.postMetricsService.findOne(post);
    await this.unit.postMetricsService.sumOrReduceFavoriteCount(postMetric, ActionEnum.SUM);

    const result = await this.unit.favoritePostService.create(user, post);

    return ResponseDto.of("Post favorited!!!", result, "no");
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
    const user: User = await this.unit.userService.findOne(+req.user.sub);
    return this.unit.favoritePostService.findAllOfUser(user, pageNumber, limitNumber);
  }

  @Get('/exists/:postId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.FOUND)
  @ApiBearerAuth()
  async exists(@Req() req, @Param('postId') postId: number ) {
    const user: User = await this.unit.userService.findOne(+req.user.sub);
    const post = await this.unit.postService.findOne(+postId);
    return await this.unit.favoritePostService.exists(user, post);
  }

  @Delete(':id/:postId')
  @HttpCode(HttpStatus.OK)
  async remove(@Req() req, @Param('id') id: string, @Param() postId: string ) {
    const user: User = await this.unit.userService.findOne(+req.user.sub);
    const post = await this.unit.postService.findOne(+postId);

    const userMetric: UserMetric = await this.unit.userMetricService.findOne(user);
    await this.unit.userMetricService.sumOrReduceSavedPostsCount(userMetric, ActionEnum.REDUCE);

    const postMetric: PostMetric = await this.unit.postMetricsService.findOne(post);
    await this.unit.postMetricsService.sumOrReduceFavoriteCount(postMetric, ActionEnum.REDUCE);

    await this.unit.favoritePostService.remove(+id);

    return ResponseDto.of("Post removed with favorite!!!", 'null', "no");
  }
}
