import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards, HttpStatus, HttpCode, Query } from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { JwtAuthGuard } from '../../src/auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UnitOfWork } from 'src/utils/UnitOfWork/UnitOfWork';
import { UserMetric } from 'src/user_metrics/entities/user_metric.entity';
import { ActionEnum } from 'src/user_metrics/action/ActionEnum.enum';
import { PostMetric } from 'src/post_metrics/entities/post_metric.entity';
import { ResponseDto } from 'src/utils/Responses/ResponseDto.reponse';
import { User } from 'src/user/entities/user.entity';

@Controller('comment')
export class CommentController {
  constructor(private readonly unit:UnitOfWork) {}

  @Post(':postId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  async create(@Param('postId') postId: number, @Req() req, @Body() createCommentDto: CreateCommentDto) {
    const post = await this.unit.postService.findOne(postId)
    const user = await this.unit.userService.findOne(+req.user.id);

    const userMetric: UserMetric = await this.unit.userMetricService.findOne(user);
    await this.unit.userMetricService.sumOrReduceCommentsCount(userMetric, ActionEnum.SUM);

    const postMetric: PostMetric = await this.unit.postMetricsService.findOne(post);
    await this.unit.postMetricsService.sumOrReduceCommentsCount(postMetric, ActionEnum.SUM);

    const result = await this.unit.commentService.create(post, user, createCommentDto);
    await this.unit.commentMetricsService.create(result);

    return ResponseDto.of("Comment added!!!", result, "no");
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
    const post = await this.unit.postService.findOne(id)
    return await this.unit.commentService.findAllOfPost(post, pageNumber, limitNumber);
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
    const user: User = await this.unit.userService.findOne(+req.user.sub);
    return this.unit.commentService.findAllOfUser(user, pageNumber, limitNumber);
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

    const comment = await this.unit.commentService.findOne(+id);

    return await this.unit.commentService.findAllOfComment(comment, pageNumber, limitNumber);
  }

  @Get(':id')
  @HttpCode(HttpStatus.FOUND)
  async findOne(@Param('id') id: string) {
    
    const comment = await this.unit.commentService.findOne(+id);
    await this.unit.commentMetricsService.sumViewed(comment.metric);

    return ResponseDto.of("Comment found!!!", comment, "no");
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() updateCommentDto: UpdateCommentDto) {
    const comment = await this.unit.commentService.findOne(+id);

    const commentMetric = await this.unit.commentMetricsService.findOne(comment);
    await this.unit.commentMetricsService.sumOrReduceEditedTimes(commentMetric, ActionEnum.SUM);
    await this.unit.commentMetricsService.sumOrReduceEditedTimes(commentMetric, ActionEnum.SUM);

    return await this.unit.commentService.update(comment, updateCommentDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Req() Req, @Param('id') id: string) {
    const comment = await this.unit.commentService.findOne(+id);

    const user: User = await this.unit.userService.findOne(+Req.user.id);
    const userMetric: UserMetric = await this.unit.userMetricService.findOne(user);
    await this.unit.userMetricService.sumOrReduceCommentsCount(userMetric, ActionEnum.REDUCE);

    const postMetric: PostMetric = await this.unit.postMetricsService.findOne(comment.post);
    await this.unit.postMetricsService.sumOrReduceCommentsCount(postMetric, ActionEnum.REDUCE);

    await this.unit.commentService.remove(comment);
    return ResponseDto.of("Comment removed!!!", "no result", "no");
  }

  @Post('/createOnComment/:idComment/')
  @HttpCode(HttpStatus.CREATED)
  async createOnComment(@Param('idComment') idComment: number, @Req() req, @Body() createCommentDto: CreateCommentDto) {
    const comment = await this.unit.commentService.findOne(idComment);
    const commentMetric = await this.unit.commentMetricsService.findOne(comment);

    const user: User = await this.unit.userService.findOne(+req.user.id);
    const userMetric: UserMetric = await this.unit.userMetricService.findOne(user);
    await this.unit.userMetricService.sumOrReduceCommentsCount(userMetric, ActionEnum.SUM);

    const postMetric: PostMetric = await this.unit.postMetricsService.findOne(comment.post);
    await this.unit.postMetricsService.sumOrReduceCommentsCount(postMetric, ActionEnum.SUM);

    const result = await this.unit.commentService.createOnComment(comment, user, createCommentDto);
    await this.unit.commentMetricsService.create(comment);

    await this.unit.commentMetricsService.sumOrReduceRepliesCount(commentMetric, ActionEnum.SUM);

    return ResponseDto.of("Comment added!!!", result, "no");
  }

}