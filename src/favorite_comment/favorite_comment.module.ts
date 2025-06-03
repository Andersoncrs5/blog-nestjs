import { forwardRef, Module } from '@nestjs/common';
import { FavoriteCommentService } from './favorite_comment.service';
import { FavoriteCommentController } from './favorite_comment.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FavoriteComment } from './entities/favorite_comment.entity';
import { UnitOfWorkModule } from 'src/utils/UnitOfWork/UnitOfWork.module';

@Module({
  imports: [TypeOrmModule.forFeature([FavoriteComment]), forwardRef(() => UnitOfWorkModule)],
  controllers: [FavoriteCommentController],
  providers: [FavoriteCommentService],
  exports: [FavoriteCommentService],
})
export class FavoriteCommentModule {}
