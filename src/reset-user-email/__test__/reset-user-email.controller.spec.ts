import { Test, TestingModule } from '@nestjs/testing';
import { ResetUserEmailController } from '../reset-user-email.controller';
import { ResetUserEmailService } from '../reset-user-email.service';

describe('ResetUserEmailController', () => {
  let controller: ResetUserEmailController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ResetUserEmailController],
      providers: [ResetUserEmailService],
    }).compile();

    controller = module.get<ResetUserEmailController>(ResetUserEmailController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
