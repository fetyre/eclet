import { Test, TestingModule } from '@nestjs/testing';
import { OauthAuthController } from '../oauth-auth.controller';
import { OauthAuthService } from '../oauth-auth.service';

describe('OauthAuthController', () => {
  let controller: OauthAuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OauthAuthController],
      providers: [OauthAuthService],
    }).compile();

    controller = module.get<OauthAuthController>(OauthAuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
