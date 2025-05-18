import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CommentMetricsService } from './comment_metrics.service';

@Controller('comment-metrics')
export class CommentMetricsController {
  constructor(private readonly commentMetricsService: CommentMetricsService) {}
}
