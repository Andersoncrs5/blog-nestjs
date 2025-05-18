import { forwardRef, Module } from '@nestjs/common';
import { LikeService } from './like.service';
import { LikeController } from './like.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Like } from './entities/like.entity';
import { UserModule } from '../../src/user/user.module';
import { PostModule } from '../../src/post/post.module';
import { UserMetricsModule } from '../../src/user_metrics/user_metrics.module';
import { PostMetricsModule } from '../../src/post_metrics/post_metrics.module';

@Module({
  imports: [TypeOrmModule.forFeature([Like]), 
  forwardRef(() => UserModule), 
  forwardRef(() => PostModule),
  forwardRef(() => PostMetricsModule),
  forwardRef(() => UserMetricsModule)],
  controllers: [LikeController],
  providers: [LikeService],
})
export class LikeModule {}
