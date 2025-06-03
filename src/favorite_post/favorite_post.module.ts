import { forwardRef, Module } from '@nestjs/common';
import { FavoritePostService } from './favorite_post.service';
import { FavoritePostController } from './favorite_post.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FavoritePost } from './entities/favorite_post.entity';
import { UnitOfWorkModule } from 'src/utils/UnitOfWork/UnitOfWork.module';

@Module({
  imports: [TypeOrmModule.forFeature([FavoritePost]), forwardRef(() => UnitOfWorkModule)],
  controllers: [FavoritePostController],
  providers: [FavoritePostService],
  exports: [FavoritePostService],
})
export class FavoritePostModule {}
