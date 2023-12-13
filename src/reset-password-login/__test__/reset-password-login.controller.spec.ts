import { Test, TestingModule } from '@nestjs/testing';
import { ResetPasswordLoginController } from '../reset-password-login.controller';
import { ResetPasswordLoginService } from '../reset-password-login.service';

describe('ResetPasswordLoginController', () => {
  let controller: ResetPasswordLoginController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ResetPasswordLoginController],
      providers: [ResetPasswordLoginService],
    }).compile();

    controller = module.get<ResetPasswordLoginController>(ResetPasswordLoginController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
