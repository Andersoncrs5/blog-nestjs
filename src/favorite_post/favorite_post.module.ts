import { Module } from '@nestjs/common';
import { FavoritePostService } from './favorite_post.service';
import { FavoritePostController } from './favorite_post.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FavoritePost } from './entities/favorite_post.entity';
import { UserModule } from 'src/user/user.module';
import { PostModule } from 'src/post/post.module';

@Module({
  imports: [TypeOrmModule.forFeature([FavoritePost]), UserModule, PostModule ], 
  controllers: [FavoritePostController],
  providers: [FavoritePostService],
})
export class FavoritePostModule {}
