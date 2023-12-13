import { ExtractJwt, Strategy, VerifiedCallback } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, Logger } from '@nestjs/common';
import { User } from '@prisma/client';
import { TokenTypeEnum } from 'src/jwt/models/enums/token-type.enum';
import { ConfigLoaderService } from 'src/settings/config/config-loader.service';
import { ConfirmPayload } from '../interface/confirm-stategy.interface';
import { StrategyService } from 'src/strategy/strategy.service';
import { ErrorHandlerService } from 'src/errro-catch/error-catch.service';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
	Strategy,
	'jwtRefresh'
) {
	private readonly logger: Logger = new Logger(JwtRefreshStrategy.name);
	constructor(
		private readonly configLoaderService: ConfigLoaderService,
		private readonly strategyService: StrategyService,
		private readonly errorHandlerService: ErrorHandlerService
	) {
		const domain: string = configLoaderService.domain;
		const issuer: string = configLoaderService.issuer;
		const { publicKey } = configLoaderService.jwtConfig.refresh;
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			algorithms: ['RS256'],
			secretOrKey: publicKey,
			audience: domain,
			issuer: issuer
		});
	}

	async validate(payload: any, done: VerifiedCallback) {
		try {
			this.logger.log(`Запуск JwtRefreshStrategy.`);
			const value: ConfirmPayload =
				await this.strategyService.validatePayload(payload);
			const user: User = await this.strategyService.checkAndFindUserById(
				value.id
			);
			this.logger.log(
				`Найден пользователь в JwtRefreshStrategy, userId: ${user.id}`
			);
			await this.strategyService.findTokenInBlackList(
				user.id,
				value.jti,
				value.exp,
				TokenTypeEnum.REFRESH
			);
			this.logger.log(`Завершение JwtRefreshStrategy, userId: ${user.id}`);
			done(null, {
				user,
				jti: value.jti,
				exp: value.exp
			});
		} catch (error) {
			this.logger.error(
				`Ошибка в JwtRefreshStrategy. userId: ${payload.id}, error: ${error.message}`
			);
			this.errorHandlerService.handleError(error);
		}
	}
}
