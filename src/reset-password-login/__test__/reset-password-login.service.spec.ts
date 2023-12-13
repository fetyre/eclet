import { Test, TestingModule } from '@nestjs/testing';
import { ResetPasswordLoginService } from '../reset-password-login.service';

describe('ResetPasswordLoginService', () => {
  let service: ResetPasswordLoginService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ResetPasswordLoginService],
    }).compile();

    service = module.get<ResetPasswordLoginService>(ResetPasswordLoginService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
