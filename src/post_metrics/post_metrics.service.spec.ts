import { Test, TestingModule } from '@nestjs/testing';
import { PostMetricsService } from './post_metrics.service';

describe('PostMetricsService', () => {
  let service: PostMetricsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PostMetricsService],
    }).compile();

    service = module.get<PostMetricsService>(PostMetricsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
