import { Test, TestingModule } from '@nestjs/testing';
import { UserMetricsService } from './user_metrics.service';

describe('UserMetricsService', () => {
  let service: UserMetricsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserMetricsService],
    }).compile();

    service = module.get<UserMetricsService>(UserMetricsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
