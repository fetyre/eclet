import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { UserRole, User } from '@prisma/client';
import { Strategy, ExtractJwt, VerifiedCallback } from 'passport-jwt';
import { ErrorHandlerService } from 'src/errro-catch/error-catch.service';
import { ConfigLoaderService } from 'src/settings/config/config-loader.service';
import { ConfirmPayload } from 'src/strategy/interface/confirm-stategy.interface';
import { StrategyService } from 'src/strategy/strategy.service';

@Injectable()
export class JwtSuperAdminAccessStrategy extends PassportStrategy(
	Strategy,
	'JwtSuperAdminAccessStrategy'
) {
	private readonly logger: Logger = new Logger(
		JwtSuperAdminAccessStrategy.name
	);

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
			this.logger.log(`Запуск JwtSuperAdminAccessStrategy`);
			const value: ConfirmPayload =
				await this.strategyService.validatePayload(payload);
			this.strategyService.checkRoleUser(value.role, UserRole.superAdmin);
			const user: User = await this.strategyService.checkAndFindUserById(
				value.id
			);
			this.logger.log(
				`Найден пользователь в JwtSuperAdminAccessStrategy, userId: ${user.id}`
			);
			this.strategyService.checkRoleUser(user.role, UserRole.superAdmin);
			this.logger.log(
				`Завершение JwtSuperAdminAccessStrategy, userID: ${user.id}`
			);
			done(null, { user });
		} catch (error) {
			this.logger.error(
				`Ошибка в JwtSuperAdminAccessStrategy. userID: ${payload.id}, error: ${error.message}`
			);
			this.errorHandlerService.handleError(error);
		}
	}
}
