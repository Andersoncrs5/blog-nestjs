import { Controller, Get, Post, Param, Delete, Req, HttpCode, HttpStatus, Query, UseGuards } from '@nestjs/common';
import { UnitOfWork } from '../../src/utils/UnitOfWork/UnitOfWork';
import { User } from '../../src/user/entities/user.entity';
import { Comment } from '../../src/comment/entities/comment.entity';
import { LikeOrDislike } from '../../src/like/entities/likeOrDislike.enum';
import { ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../src/auth/guards/jwt-auth.guard';
import { ActionEnum } from '../../src/user_metrics/action/ActionEnum.enum';
import { Throttle } from '@nestjs/throttler';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller({ path:'like-comment', version:'1'})
export class LikeCommentController {
  constructor(private readonly unit: UnitOfWork) {}

  @HttpCode(HttpStatus.CREATED)
  @Post('/:commentId/:action')
  @Throttle({long: { ttl: 3000, limit: 6 } })
  async create(@Req() req, @Param('commentId') commentId: string, @Param('action') action: LikeOrDislike ) {
    const user: User = await this.unit.userService.findOneV2(+req.user.sub);
    const comment: Comment = await this.unit.commentService.findOne(+commentId);

    const userMetric = await this.unit.userMetricService.findOne(user);
    await this.unit.userMetricService.sumOrReduceDislikeOrLikesGivenCountInComment(userMetric, ActionEnum.SUM, action);

    const commentMetric = await this.unit.commentMetricsService.findOne(comment);
    await this.unit.commentMetricsService.sumOrReduceDislikesOrLike(commentMetric, ActionEnum.SUM, action)

    const result = await this.unit.likeCommentService.create(user, comment, action);
  }

  @Get('/findAllOfUser')
  @HttpCode(HttpStatus.OK)
  @Throttle({long: { ttl: 3000, limit: 8 } })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Número da página' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, description: 'Quantidade de itens por página (máximo 100)' })
  async findAllOfUser(
    @Query('page') page = '1',
    @Query('limit') limit = '40',
    @Req() req
  ) {
    const pageNumber = Math.max(1, parseInt(page));
    const limitNumber = Math.min(100, parseInt(limit));
    const user: User = await this.unit.userService.findOneV2(+req.user.sub);
    return await this.unit.likeCommentService.findAllOfUser(user, pageNumber, limitNumber);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/exists/:commentId')
  @Throttle({long: { ttl: 2000, limit: 14 } })
  async exists(@Req() req, @Param('commentId') commentId: string) {
    const user: User = await this.unit.userService.findOneV2(+req.user.sub);
    const comment: Comment = await this.unit.commentService.findOne(+commentId);

    return await this.unit.likeCommentService.exists(user, comment);
  }

  @Get(':id')
  @Throttle({long: { ttl: 4000, limit: 12 } })
  async findOne(@Param('id') id: string) {
    return await this.unit.likeCommentService.findOne(+id);
  }

  @Delete(':id')
  @Throttle({long: { ttl: 3000, limit: 6 } })
  async remove(@Param('id') id: string) {
    const action = await this.unit.likeCommentService.findOne(+id);

    const userMetric = await this.unit.userMetricService.findOneV2(action.user);
    await this.unit.userMetricService.sumOrReduceDislikeOrLikesGivenCountInComment(userMetric, ActionEnum.REDUCE, action.action);

    const commentMetric = await this.unit.commentMetricsService.findOne(action.comment);
    await this.unit.commentMetricsService.sumOrReduceDislikesOrLike(commentMetric, ActionEnum.SUM, action.action)

    return this.unit.likeCommentService.remove(action);
  }
}
