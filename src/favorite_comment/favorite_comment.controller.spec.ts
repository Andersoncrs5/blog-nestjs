import { Test, TestingModule } from '@nestjs/testing';
import { FavoriteCommentController } from './favorite_comment.controller';
import { FavoriteCommentService } from './favorite_comment.service';

describe('FavoriteCommentController', () => {
  let controller: FavoriteCommentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FavoriteCommentController],
      providers: [FavoriteCommentService],
    }).compile();

    controller = module.get<FavoriteCommentController>(FavoriteCommentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
