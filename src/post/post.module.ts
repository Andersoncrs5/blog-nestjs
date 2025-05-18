import { forwardRef, Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { User } from '../../src/user/entities/user.entity';
import { UserService } from '../../src/user/user.service';
import { UserModule } from '../../src/user/user.module';
import { UserMetricsModule } from '../../src/user_metrics/user_metrics.module';
import { PostMetricsModule } from '../../src/post_metrics/post_metrics.module';

@Module({
  imports: [TypeOrmModule.forFeature([Post]), 
  forwardRef(() => UserModule),
  forwardRef(() => PostMetricsModule),
  forwardRef(() => UserMetricsModule)],
  controllers: [PostController],
  providers: [PostService],
  exports: [PostService]
})
export class PostModule {}
