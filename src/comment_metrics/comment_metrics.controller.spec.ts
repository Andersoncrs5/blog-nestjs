import { Test, TestingModule } from '@nestjs/testing';
import { CommentMetricsController } from './comment_metrics.controller';
import { CommentMetricsService } from './comment_metrics.service';

describe('CommentMetricsController', () => {
  let controller: CommentMetricsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommentMetricsController],
      providers: [CommentMetricsService],
    }).compile();

    controller = module.get<CommentMetricsController>(CommentMetricsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
