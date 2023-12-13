import { Test, TestingModule } from '@nestjs/testing';
import { OauthAuthService } from '../oauth-auth.service';

describe('OauthAuthService', () => {
  let service: OauthAuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OauthAuthService],
    }).compile();

    service = module.get<OauthAuthService>(OauthAuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
