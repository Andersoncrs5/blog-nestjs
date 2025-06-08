import { forwardRef, Module } from '@nestjs/common';
import { UserMetricsService } from './user_metrics.service';
import { UserMetricsController } from './user_metrics.controller';
import { UserMetric } from './entities/user_metric.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UnitOfWorkModule } from '../../src/utils/UnitOfWork/UnitOfWork.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserMetric])
  , forwardRef(() => UnitOfWorkModule)], 
  controllers: [UserMetricsController],
  providers: [UserMetricsService],
  exports: [UserMetricsService]
})
export class UserMetricsModule {}
