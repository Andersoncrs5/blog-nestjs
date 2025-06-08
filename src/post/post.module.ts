import { forwardRef, Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { UnitOfWorkModule } from '../../src/utils/UnitOfWork/UnitOfWork.module';

@Module({
  imports: [TypeOrmModule.forFeature([Post]), 
  forwardRef(() => UnitOfWorkModule)],
  controllers: [PostController],
  providers: [PostService],
  exports: [PostService]
})
export class PostModule {}
