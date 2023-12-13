import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { User } from '@prisma/client';
import { Strategy, ExtractJwt, VerifiedCallback } from 'passport-jwt';
import { ConfigLoaderService } from 'src/settings/config/config-loader.service';
import { StrategyService } from 'src/strategy/strategy.service';
import { ErrorHandlerService } from 'src/errro-catch/error-catch.service';
import { ConfirmPayload } from 'src/strategy/interface/confirm-stategy.interface';
import { TokenTypeEnum } from 'src/jwt/models/enums/token-type.enum';

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(
	Strategy,
	'jwtAccessStrategy'
) {
	private readonly logger: Logger = new Logger(JwtAccessStrategy.name);
	constructor(
		private readonly configLoaderService: ConfigLoaderService,
		private readonly strategyService: StrategyService,
		private readonly errorHandlerService: ErrorHandlerService
	) {
		const domain: string = configLoaderService.domain;
		const issuer: string = configLoaderService.issuer;
		const { publicKey } = configLoaderService.jwtConfig.access;
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: true,
			algorithms: ['RS256'],
			secretOrKey: publicKey,
			audience: domain,
			issuer: issuer
		});
	}

	async validate(payload: any, done: VerifiedCallback) {
		try {
			this.logger.log(`Запуск JwtAccessStrategy.`);
			const value: ConfirmPayload =
				await this.strategyService.validatePayload(payload);
			const user: User = await this.strategyService.checkAndFindUserById(
				value.id
			);
			this.logger.log(
				`Найден пользователь в JwtAccessStrategy, userId: ${user.id}`
			);
			await this.strategyService.findTokenInBlackList(
				user.id,
				value.jti,
				value.exp,
				TokenTypeEnum.ACCESS
			);
			this.logger.log(`Завершение JwtAccessStrategy, userID: ${user.id}`);
			done(null, { user });
		} catch (error) {
			this.logger.error(
				`Ошибка в JwtAccessStrategy. userID: ${payload.id}, error: ${error.message}`
			);
			this.errorHandlerService.handleError(error);
		}
	}
}
