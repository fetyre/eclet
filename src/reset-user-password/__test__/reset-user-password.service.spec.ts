import { Test, TestingModule } from '@nestjs/testing';
import { ResetUserPasswordService } from '../reset-user-password.service';

describe('ResetUserPasswordService', () => {
  let service: ResetUserPasswordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ResetUserPasswordService],
    }).compile();

    service = module.get<ResetUserPasswordService>(ResetUserPasswordService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
