import { forwardRef, Module } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from "../../src/comment/entities/comment.entity";
import { UserModule } from '../../src/user/user.module';
import { PostModule } from '../../src/post/post.module';
import { UserMetricsModule } from '../../src/user_metrics/user_metrics.module';
import { PostMetricsModule } from '../../src/post_metrics/post_metrics.module';
import { CommentMetricsModule } from '../../src/comment_metrics/comment_metrics.module';

@Module({
  imports: [TypeOrmModule.forFeature([Comment]), 
  forwardRef(() => UserModule), 
  forwardRef(() => PostModule),
  forwardRef(() => CommentMetricsModule), 
  forwardRef(() => PostMetricsModule),
  forwardRef(() => UserMetricsModule)],
  controllers: [CommentController],
  providers: [CommentService],
  exports: [CommentService]
})
export class CommentModule {}
