import { Test, TestingModule } from '@nestjs/testing';
import { ResetUserEmailService } from '../reset-user-email.service';

describe('ResetUserEmailService', () => {
  let service: ResetUserEmailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ResetUserEmailService],
    }).compile();

    service = module.get<ResetUserEmailService>(ResetUserEmailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
