import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PostMetricsService } from './post_metrics.service';

@Controller({ path:'post-metrics', version:'1'})
export class PostMetricsController {
  constructor(private readonly postMetricsService: PostMetricsService) {}

}
