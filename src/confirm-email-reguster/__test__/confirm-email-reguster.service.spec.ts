import { Test, TestingModule } from '@nestjs/testing';
import { ConfirmEmailRegusterService } from '../confirm-email-reguster.service';

describe('ConfirmEmailRegusterService', () => {
  let service: ConfirmEmailRegusterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConfirmEmailRegusterService],
    }).compile();

    service = module.get<ConfirmEmailRegusterService>(ConfirmEmailRegusterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
