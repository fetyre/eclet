import { Test, TestingModule } from '@nestjs/testing';
import { UserChatStatusService } from '../user-chat-status.service';

describe('UserChatStatusService', () => {
  let service: UserChatStatusService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserChatStatusService],
    }).compile();

    service = module.get<UserChatStatusService>(UserChatStatusService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
