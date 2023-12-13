import { Test, TestingModule } from '@nestjs/testing';
import { BannesWordResolver } from '../banned-word.resolver';
import { BannesWordService } from '../banned-word.service';

describe('BannesWordResolver', () => {
  let resolver: BannesWordResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BannesWordResolver, BannesWordService],
    }).compile();

    resolver = module.get<BannesWordResolver>(BannesWordResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
