import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards, HttpStatus, HttpCode, Query, ConflictException } from '@nestjs/common';
import { LikeService } from './like.service';
import { JwtAuthGuard } from '../../src/auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { LikeOrDislike } from './entities/likeOrDislike.enum';
import { UnitOfWork } from 'src/utils/UnitOfWork/UnitOfWork';
import { User } from 'src/user/entities/user.entity';
import { ActionEnum } from 'src/user_metrics/action/ActionEnum.enum';
import { Like } from './entities/like.entity';
import { Throttle } from '@nestjs/throttler/dist/throttler.decorator';

@Controller({ path:'like', version:'1'})
export class LikeController {
  constructor(private readonly likeService: LikeService, private readonly unit: UnitOfWork) {}

  @Post(':action/:postId')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({long: { ttl: 4000, limit: 10 } })
  async create(
    @Param('action') action: LikeOrDislike,
    @Param('postId') postId: string,
    @Req() req
  ) {
    const user = await this.unit.userService.findOne(+req.user.sub);
    const post = await this.unit.postService.findOne(+postId);

    const check = await this.unit.likeService.exists(user, post);

    if (check) { throw new ConflictException('Action exists!'); }

    const like = this.likeService.create(user, post, action);

    const userMetric = await this.unit.userMetricService.findOne(user);
    await this.unit.userMetricService.sumOrReduceDislikeOrLikesGivenCountInPost(userMetric, ActionEnum.SUM, (await like).action);
    
  }

  @Get('/findAllofUser')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.FOUND)
  @Throttle({long: { ttl: 3000, limit: 10 } })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Número da página' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, description: 'Quantidade de itens por página (máximo 100)' })
  async findAllOfUser(
    @Req() req,
    @Query('page') page = '1',
    @Query('limit') limit = '40',
  ) {
    const pageNumber = Math.max(1, parseInt(page));
    const limitNumber = Math.min(100, parseInt(limit));
    const user = await this.unit.userService.findOne(+req.user.sub);

    return this.likeService.findAllOfUser(user, pageNumber, limitNumber);
  }


  @Get(':id')
  @HttpCode(HttpStatus.FOUND)
  @Throttle({long: { ttl: 3000, limit: 6 } })
  async findOne(@Param('id') id: string) {
    return await this.likeService.findOne(+id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Throttle({long: { ttl: 2000, limit: 6 } })
  async remove(@Param('id') id: string, @Req() req) {
    const like = await this.unit.likeService.findOne(+id);

    const user = await this.unit.userService.findOne(+req.user.sub);
    const userMetric = await this.unit.userMetricService.findOne(user);
    const action: Like = await this.likeService.remove(like);

    await this.unit.userMetricService.sumOrReduceDislikeOrLikesGivenCountInPost(userMetric, ActionEnum.REDUCE, action.action);

    
  }

  @Get('/exists/:postId/')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.FOUND)
  @Throttle({long: { ttl: 2000, limit: 30 } })
  async exists(@Param('postId') postId: number, @Req() req) {
    const user: User = await this.unit.userService.findOne(+req.user.sub);
    const post = await this.unit.postService.findOne(postId)
    const result = await this.likeService.exists(user, post);
  }

}