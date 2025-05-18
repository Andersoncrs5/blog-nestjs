import { forwardRef, Module } from '@nestjs/common';
import { UserMetricsService } from './user_metrics.service';
import { UserMetricsController } from './user_metrics.controller';
import { UserMetric } from './entities/user_metric.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../../src/user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserMetric]), 
  forwardRef(() => UserModule)], 
  controllers: [UserMetricsController],
  providers: [UserMetricsService],
  exports: [UserMetricsService]
})
export class UserMetricsModule {}
