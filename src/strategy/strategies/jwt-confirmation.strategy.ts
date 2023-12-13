import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifiedCallback } from 'passport-jwt';
import { Request } from 'express';
import { TokenTypeEnum } from 'src/jwt/models/enums/token-type.enum';
import { ConfigLoaderService } from 'src/settings/config/config-loader.service';
import { ConfirmPayload } from '../interface/confirm-stategy.interface';
import { StrategyService } from 'src/strategy/strategy.service';
import { ErrorHandlerService } from 'src/errro-catch/error-catch.service';
import { UserWithEmailToken } from '../types/strategies.types';

@Injectable()
export class JwtConfirmationStrategy extends PassportStrategy(
	Strategy,
	'JwtConfirmationStrategy'
) {
	private readonly logger: Logger = new Logger(JwtConfirmationStrategy.name);
	constructor(
		private readonly configLoaderService: ConfigLoaderService,
		private readonly strategyService: StrategyService,
		private readonly errorHandlerService: ErrorHandlerService
	) {
		const domain: string = configLoaderService.domain;
		const issuer: string = configLoaderService.issuer;
		const { publicKey } = configLoaderService.jwtConfig.confirmation;
		super({
			jwtFromRequest: (req: Request) => {
				const token: string = req.params.token;
				return token;
			},
			ignoreExpiration: true,
			algorithms: ['RS256'],
			secretOrKey: publicKey,
			audience: domain,
			issuer: issuer
		});
	}

	async validate(payload: any, done: VerifiedCallback) {
		try {
			const value: ConfirmPayload =
				await this.strategyService.validatePayload(payload);
			this.logger.log(`Запуск JwtConfirmationStrategy.`);
			const user: UserWithEmailToken =
				await this.strategyService.checkAndFindUserWithEmailModelById(value.id);
			this.logger.log(
				`Найден пользователь в JwtConfirmationStrategy, userId: ${user.id}`
			);
			await this.strategyService.findTokenInBlackList(
				user.id,
				value.jti,
				value.exp,
				TokenTypeEnum.CONFIRMATION
			);
			this.logger.log(`Завершение JwtConfirmationStrategy, userId: ${user.id}`);
			done(null, {
				user,
				payload: value
			});
		} catch (error) {
			this.logger.error(
				`Ошибка в JwtConfirmationStrategy. userID: ${payload.id}, error: ${error.message}`
			);
			this.errorHandlerService.handleError(error);
		}
	}
}
