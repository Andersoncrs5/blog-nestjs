import { Test, TestingModule } from '@nestjs/testing';
import { FavoritePostController } from './favorite_post.controller';
import { FavoritePostService } from './favorite_post.service';

describe('FavoritePostController', () => {
  let controller: FavoritePostController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FavoritePostController],
      providers: [FavoritePostService],
    }).compile();

    controller = module.get<FavoritePostController>(FavoritePostController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
