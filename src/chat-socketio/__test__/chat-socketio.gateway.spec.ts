import { Test, TestingModule } from '@nestjs/testing';
import { ChatSocketioGateway } from '../chat-socketio.gateway';
import { ChatSocketioService } from '../chat-socketio.service';

describe('ChatSocketioGateway', () => {
  let gateway: ChatSocketioGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChatSocketioGateway, ChatSocketioService],
    }).compile();

    gateway = module.get<ChatSocketioGateway>(ChatSocketioGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
