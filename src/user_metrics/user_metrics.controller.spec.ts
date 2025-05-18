import { Test, TestingModule } from '@nestjs/testing';
import { UserMetricsController } from './user_metrics.controller';
import { UserMetricsService } from './user_metrics.service';

describe('UserMetricsController', () => {
  let controller: UserMetricsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserMetricsController],
      providers: [UserMetricsService],
    }).compile();

    controller = module.get<UserMetricsController>(UserMetricsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
