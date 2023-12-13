import { Test, TestingModule } from '@nestjs/testing';
import { UserChatStatusController } from '../user-chat-status.controller';
import { UserChatStatusService } from '../user-chat-status.service';

describe('UserChatStatusController', () => {
  let controller: UserChatStatusController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserChatStatusController],
      providers: [UserChatStatusService],
    }).compile();

    controller = module.get<UserChatStatusController>(UserChatStatusController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
