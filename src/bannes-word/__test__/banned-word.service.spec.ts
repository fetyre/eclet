import { Test, TestingModule } from '@nestjs/testing';
import { BannesWordService } from '../banned-word.service';

describe('BannesWordService', () => {
  let service: BannesWordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BannesWordService],
    }).compile();

    service = module.get<BannesWordService>(BannesWordService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
