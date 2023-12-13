import { Test, TestingModule } from '@nestjs/testing';
import { ChatSocketioService } from '../chat-socketio.service';

describe('ChatSocketioService', () => {
  let service: ChatSocketioService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChatSocketioService],
    }).compile();

    service = module.get<ChatSocketioService>(ChatSocketioService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
