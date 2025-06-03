import { forwardRef, Module } from '@nestjs/common';
import { CommentMetricsService } from './comment_metrics.service';
import { CommentMetricsController } from './comment_metrics.controller';
import { CommentMetric } from './entities/comment_metric.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UnitOfWorkModule } from 'src/utils/UnitOfWork/UnitOfWork.module';

@Module({
  imports: [TypeOrmModule.forFeature([CommentMetric]), forwardRef(() => UnitOfWorkModule)], 
  controllers: [CommentMetricsController],
  providers: [CommentMetricsService],
  exports: [CommentMetricsService]
})
export class CommentMetricsModule {}
