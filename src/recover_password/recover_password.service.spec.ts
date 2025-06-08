import { Test, TestingModule } from '@nestjs/testing';
import { RecoverPasswordService } from './recover_password.service';

describe('RecoverPasswordService', () => {
  let service: RecoverPasswordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RecoverPasswordService],
    }).compile();

    service = module.get<RecoverPasswordService>(RecoverPasswordService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
