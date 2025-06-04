import { forwardRef, Module } from '@nestjs/common';
;import { UnitOfWork } from './UnitOfWork';
import { UserModule } from 'src/user/user.module';
import { UserMetricsModule } from 'src/user_metrics/user_metrics.module';
import { PostMetricsModule } from 'src/post_metrics/post_metrics.module';
import { PostModule } from 'src/post/post.module';
import { LikeModule } from 'src/like/like.module';
import { FavoritePostModule } from 'src/favorite_post/favorite_post.module';
import { CommentMetricsModule } from 'src/comment_metrics/comment_metrics.module';
import { CommentModule } from 'src/comment/comment.module';
import { CategoryModule } from 'src/category/category.module';
import { AuthModule } from 'src/auth/auth.module';
import { FavoriteCommentModule } from 'src/favorite_comment/favorite_comment.module';
import { LikeCommentModule } from 'src/like_comment/like_comment.module';

@Module({
  imports: [
    forwardRef(() => UserModule),
    forwardRef(() => UserMetricsModule),
    forwardRef(() => PostMetricsModule),
    forwardRef(() => PostModule),
    forwardRef(() => LikeModule),
    forwardRef(() => FavoritePostModule),
    forwardRef(() => CommentMetricsModule),
    forwardRef(() => CommentModule),
    forwardRef(() => CategoryModule),
    forwardRef(() => AuthModule),
    forwardRef(() => FavoriteCommentModule),
    forwardRef(() => LikeCommentModule),
  ],
  providers: [
    UnitOfWork,
  ],
  exports: [UnitOfWork],
})
export class UnitOfWorkModule {}
