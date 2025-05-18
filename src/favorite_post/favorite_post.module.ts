import { forwardRef, Module } from '@nestjs/common';
import { FavoritePostService } from './favorite_post.service';
import { FavoritePostController } from './favorite_post.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FavoritePost } from './entities/favorite_post.entity';
import { UserModule } from '../../src/user/user.module';
import { PostModule } from '../../src/post/post.module';
import { UserMetricsModule } from '../../src/user_metrics/user_metrics.module';
import { PostMetricsModule } from '../../src/post_metrics/post_metrics.module';

@Module({
  imports: [TypeOrmModule.forFeature([FavoritePost]), 
  forwardRef(() => UserModule), 
  forwardRef(() => PostModule), 
  forwardRef(() => PostMetricsModule),
  forwardRef(() => UserMetricsModule)],
  controllers: [FavoritePostController],
  providers: [FavoritePostService],
})
export class FavoritePostModule {}
