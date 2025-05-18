import { Test, TestingModule } from '@nestjs/testing';
import { CommentMetricsService } from './comment_metrics.service';

describe('CommentMetricsService', () => {
  let service: CommentMetricsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CommentMetricsService],
    }).compile();

    service = module.get<CommentMetricsService>(CommentMetricsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
