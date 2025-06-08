import { forwardRef, Module } from '@nestjs/common';
import { LikeCommentService } from './like_comment.service';
import { LikeCommentController } from './like_comment.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LikeComment } from './entities/like_comment.entity';
import { UnitOfWorkModule } from '../../src/utils/UnitOfWork/UnitOfWork.module';

@Module({
  imports: [TypeOrmModule.forFeature([LikeComment]),
  forwardRef(() => UnitOfWorkModule)],
  controllers: [LikeCommentController],
  providers: [LikeCommentService],
  exports: [LikeCommentService],
})
export class LikeCommentModule {}
