import { Controller } from '@nestjs/common';
import { CommentMetricsService } from './comment_metrics.service';

@Controller({ path:'comment-metrics', version:'1'})
export class CommentMetricsController {
  constructor(private readonly commentMetricsService: CommentMetricsService) {}
}
