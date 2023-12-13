import { Module } from '@nestjs/common';
import { OAuthService } from './oauth-auth.service';
import { OAuthController } from './oauth-auth.controller';
import { ValidateService } from 'src/validate/validate.service';
import { BlackListService } from 'src/black-list/black-list.service';
import { TokenAuthService } from 'src/auth/token/token-auth.service';
import { JwtService } from 'src/jwt/jwt.service';
import { FacebookStrategy, GoogleStrategy } from './strategies';

@Module({
	controllers: [OAuthController],
	providers: [
		OAuthService,
		ValidateService,
		BlackListService,
		TokenAuthService,
		JwtService,
		FacebookStrategy,
		GoogleStrategy
	]
})
export class OauthAuthModule {}
