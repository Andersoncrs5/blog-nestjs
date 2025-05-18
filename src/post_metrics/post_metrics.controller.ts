import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PostMetricsService } from './post_metrics.service';

@Controller('post-metrics')
export class PostMetricsController {
  constructor(private readonly postMetricsService: PostMetricsService) {}

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postMetricsService.findOne(+id);
  }

}
