import { Test, TestingModule } from '@nestjs/testing';
import { PostMetricsController } from './post_metrics.controller';
import { PostMetricsService } from './post_metrics.service';

describe('PostMetricsController', () => {
  let controller: PostMetricsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostMetricsController],
      providers: [PostMetricsService],
    }).compile();

    controller = module.get<PostMetricsController>(PostMetricsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
