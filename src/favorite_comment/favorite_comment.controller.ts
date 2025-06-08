import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UnitOfWork } from 'src/utils/UnitOfWork/UnitOfWork';
import { User } from 'src/user/entities/user.entity';
import { Comment } from 'src/comment/entities/comment.entity';
import { ActionEnum } from 'src/user_metrics/action/ActionEnum.enum';
import { Throttle } from '@nestjs/throttler';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller({ path:'favorite-comment', version:'1'})
export class FavoriteCommentController {
  constructor(private readonly unit: UnitOfWork) {}

  @Post(':commentId')
  @HttpCode(HttpStatus.OK)
  @Throttle({long: { ttl: 3000, limit: 6 } })
  async create(@Param('commentId') commentId: string, @Req() req) {
    const user: User = await this.unit.userService.findOne(+req.user.sub);
    const comment: Comment = await this.unit.commentService.findOne(+commentId);

    const commentMetric = await this.unit.commentMetricsService.findOne(comment);
    await this.unit.commentMetricsService.sumOrReduceFavoritesCount(commentMetric, ActionEnum.SUM);

    const userMetric = await this.unit.userMetricService.findOne(user);
    await this.unit.userMetricService.sumOrReduceSavedCommentsCount(userMetric, ActionEnum.SUM);

    const result = this.unit.favoriteCommentService.create(user, comment);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @Throttle({long: { ttl: 3000, limit: 6 } })
  async findOne(@Param('id') id: string) {
    return this.unit.favoriteCommentService.findOne(+id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Throttle({long: { ttl: 2000, limit: 4 } })
  async remove(@Param('id') id: string) {
    const favorite = await this.unit.favoriteCommentService.findOne(+id);
    const favoriteRemoved = await this.unit.favoriteCommentService.remove(favorite);

    const commentMetric = await this.unit.commentMetricsService.findOne(favoriteRemoved.comment);
    await this.unit.commentMetricsService.sumOrReduceFavoritesCount(commentMetric, ActionEnum.REDUCE);

    const userMetric = await this.unit.userMetricService.findOne(favoriteRemoved.user);
    await this.unit.userMetricService.sumOrReduceSavedCommentsCount(userMetric, ActionEnum.REDUCE);


  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @Throttle({long: { ttl: 3000, limit: 6 } })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Número da página' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, description: 'Quantidade de itens por página (máximo 100)' })
  async findAll(
    @Req() req,
    @Query('page') page = '1',
    @Query('limit') limit = '40'
  ) {
    const pageNumber = Math.max(1, parseInt(page));
    const limitNumber = Math.min(100, parseInt(limit));

    const user: User = await this.unit.userService.findOne(+req.user.sub);
    return this.unit.favoriteCommentService.findAllOfUser(user, pageNumber, limitNumber);
  }
}
