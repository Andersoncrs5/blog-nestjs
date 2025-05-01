import { Test, TestingModule } from '@nestjs/testing';
import { FavoritePostService } from './favorite_post.service';

describe('FavoritePostService', () => {
  let service: FavoritePostService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FavoritePostService],
    }).compile();

    service = module.get<FavoritePostService>(FavoritePostService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
