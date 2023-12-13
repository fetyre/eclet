import { Test, TestingModule } from '@nestjs/testing';
import { ResetUserPasswordController } from '../reset-user-password.controller';
import { ResetUserPasswordService } from '../reset-user-password.service';

describe('ResetUserPasswordController', () => {
  let controller: ResetUserPasswordController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ResetUserPasswordController],
      providers: [ResetUserPasswordService],
    }).compile();

    controller = module.get<ResetUserPasswordController>(ResetUserPasswordController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
