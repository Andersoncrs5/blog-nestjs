import { forwardRef, Module } from '@nestjs/common';
import { CommentMetricsService } from './comment_metrics.service';
import { CommentMetricsController } from './comment_metrics.controller';
import { CommentMetric } from './entities/comment_metric.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentModule } from '../../src/comment/comment.module';

@Module({
  imports: [TypeOrmModule.forFeature([CommentMetric]), 
  forwardRef(() => CommentModule)], 
  controllers: [CommentMetricsController],
  providers: [CommentMetricsService],
  exports: [CommentMetricsService]
})
export class CommentMetricsModule {}
