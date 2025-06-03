import { forwardRef, Module } from '@nestjs/common';
import { PostMetricsService } from './post_metrics.service';
import { PostMetricsController } from './post_metrics.controller';
import { PostMetric } from './entities/post_metric.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UnitOfWorkModule } from 'src/utils/UnitOfWork/UnitOfWork.module';

@Module({
  imports: [TypeOrmModule.forFeature([PostMetric]), 
  forwardRef(() => UnitOfWorkModule)],
  controllers: [PostMetricsController],
  providers: [PostMetricsService],
  exports: [PostMetricsService]
})
export class PostMetricsModule {}
