import { Controller, Get, UseGuards, Res, HttpStatus } from '@nestjs/common';
import { FacebookAuthGuard, GoogleAuthGuard } from './guard';
import { Response } from 'express';
import { OAuthTokens } from './models/interface';
import { GetOAuthPayload } from './decorator/oauth.decorator';
import { OAuthService } from './oauth-auth.service';
import { OAuthReqDto } from './models/dto';

@Controller('oauth')
export class OAuthController {
	constructor(private readonly oauthService: OAuthService) {}

	@Get('google')
	@UseGuards(GoogleAuthGuard)
	async googleLogin() {}

	@Get('facebook')
	@UseGuards(FacebookAuthGuard)
	async facebookLogin() {}

	@Get('facebook/redirect')
	@UseGuards(FacebookAuthGuard)
	async facebookLoginRedirect(
		@GetOAuthPayload() data: OAuthReqDto,
		@Res() res: Response
	): Promise<any> {
		const tokens: OAuthTokens = await this.oauthService.createOAuthUser(data);
		res.status(HttpStatus.OK).json(tokens);
	}

	@Get('google/redirect')
	@UseGuards(GoogleAuthGuard)
	async googleLoginRedirect(
		@GetOAuthPayload() data: OAuthReqDto,
		@Res() res: Response
	): Promise<any> {
		const tokens: OAuthTokens = await this.oauthService.createOAuthUser(data);
		res.status(HttpStatus.OK).json(tokens);
	}
}
