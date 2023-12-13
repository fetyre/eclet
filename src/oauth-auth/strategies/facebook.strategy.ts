import { Injectable, Logger } from '@nestjs/common';
import { VerifiedCallback } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { OAuthCreateDto } from '../models/dto/oauth.dto';
import { ConfigLoaderService } from 'src/settings/config/config-loader.service';
import { Strategy } from 'passport-facebook';
import { OAuthCreateUser } from '../models/interface';
import { ValidateService } from 'src/validate/validate.service';
import { OAuthProvider } from 'src/auth/models/enums/oauth.provide.emun';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
	private readonly logger: Logger = new Logger(FacebookStrategy.name);
	constructor(
		private readonly configLoaderService: ConfigLoaderService,
		private readonly validateService: ValidateService
	) {
		const { id, secret, redirectUrl } =
			configLoaderService.oauthConfig.facebook;
		super({
			clientID: id,
			clientSecret: secret,
			callbackURL: redirectUrl,
			profileFields: ['id', 'email', 'displayName'],
			passReqToCallback: true,
			scope: ['email']
		});
	}

	async validate(
		req: any,
		accessToken: string,
		refreshToken: string,
		profile: any,
		done: VerifiedCallback
	) {
		try {
			this.logger.log(`Запуск FacebookStrategy`);
			const jsonProfile = (profile && profile._json) || {};
			const userProfile: OAuthCreateUser =
				await this.validatePayload(jsonProfile);
			this.logger.log(
				`Создание пользователя в FacebookStrategy, email: ${userProfile.email}`
			);
			// const user: User = await this.authService.findExistingUser(
			// 	userProfile,
			// 	OAuthProvider.FACEBOOK
			// );
			// const [access_token, refresh_token] =
			// 	await this.tokenAuthService.generateAuthTokens(user);
			done(null, {
				oauthData: {
					...userProfile,
					provider: OAuthProvider.FACEBOOK
				}
			});
		} catch (err) {
			this.logger.error(
				`Ошибка в FacebookStrategy, email: ${profile.email}, error: ${err.message}`
			);
			done(err, false);
		}
	}

	private async validatePayload(jsonProfile: any): Promise<OAuthCreateUser> {
		this.logger.log(`Запуск validatePayload`);
		const userProfile: OAuthCreateDto = {
			oauthId: String(jsonProfile.sub),
			username: jsonProfile.name,
			email: jsonProfile.email
		};
		await this.validateService.validateDto(OAuthCreateDto, userProfile);
		return userProfile;
	}
}
