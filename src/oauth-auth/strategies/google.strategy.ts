import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { OAuthProvider } from '../../auth/models/enums/oauth.provide.emun';
import { ConfigLoaderService } from 'src/settings/config/config-loader.service';
import { VerifiedCallback } from 'passport-jwt';
import { Strategy } from 'passport-google-oauth2';
import { ValidateService } from 'src/validate/validate.service';
import { OAuthCreateUser } from '../models/interface';
import { OAuthCreateDto } from '../../auth/models/dto';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
	private readonly logger: Logger = new Logger(GoogleStrategy.name);
	constructor(
		private readonly configLoaderService: ConfigLoaderService,
		private readonly validateService: ValidateService
	) {
		const { id, secret, redirectUrl } = configLoaderService.oauthConfig.google;
		super({
			clientID: id,
			clientSecret: secret,
			callbackURL: redirectUrl,
			passReqToCallback: true,
			scope: ['profile', 'email']
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
			this.logger.log(`Запуск GoogleStrategy`);
			const jsonProfile = (profile && profile._json) || {};
			const userProfile: OAuthCreateUser =
				await this.validatePayload(jsonProfile);
			this.logger.log(
				`Создание пользователя в GoogleStrategy, email: ${userProfile.email}`
			);
			done(null, {
				oauthData: {
					...userProfile,
					provider: OAuthProvider.GOOGLE
				}
			});
		} catch (err) {
			this.logger.error(
				`Ошибка в GoogleStrategy, email: ${profile.email}, error: ${err.message}`
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
