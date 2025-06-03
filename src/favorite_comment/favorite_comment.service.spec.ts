import { Test, TestingModule } from '@nestjs/testing';
import { FavoriteCommentService } from './favorite_comment.service';

describe('FavoriteCommentService', () => {
  let service: FavoriteCommentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FavoriteCommentService],
    }).compile();

    service = module.get<FavoriteCommentService>(FavoriteCommentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
