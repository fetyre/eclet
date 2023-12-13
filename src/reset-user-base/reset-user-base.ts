import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { User } from '@prisma/client';
import { CommonService } from 'src/common/common.service';
import { OptionalEmailChangel } from 'src/reset-user-email/types/reset-user-email.type';
import { PasswordResetOrNull } from 'src/reset-user-password/types/reset-user-password.type';
import { ValidateService } from 'src/validate/validate.service';

@Injectable()
export abstract class ResetUserBaseService {
	protected readonly logger: Logger = new Logger(ResetUserBaseService.name);

	constructor(
		readonly validateService: ValidateService,
		readonly commonService: CommonService
	) {}

	protected verifyUserAccess(user: User, model: { userId: string }): void {
		this.logger.log(`Запуск verifyUserAccess, userId: ${user.id}`);
		if (user.id !== model.userId) {
			throw new HttpException(
				'Несоответствие идентификаторов пользователя.',
				HttpStatus.UNAUTHORIZED
			);
		}
	}

	protected validateResetCode(
		codeData: { code: string },
		resetModel: { code: string; userId: string }
	): void {
		this.logger.log(`Запуск validateResetCode, userId: ${resetModel.userId}`);
		if (codeData.code !== resetModel.code) {
			throw new HttpException(
				'Коды сброса не совпадают.',
				HttpStatus.BAD_REQUEST
			);
		}
	}

	protected validateTimeLiveResetCode(
		model: { userId: string; lastAttemptMessage: Date[] },
		timeLiveResetCode: number
	): void {
		this.logger.log(
			`Запуск validateTimeLiveResetCode, userId: ${model.userId}`
		);
		const dataNow: number = this.commonService.getCurrentTimeMillis();
		const nextAllowedAttemptTime: number = this.calculateNextAttemptTime(
			model.lastAttemptMessage,
			timeLiveResetCode
		);
		if (dataNow < nextAllowedAttemptTime) {
			throw new HttpException(
				'Ваш код подтверждения истек. Пожалуйста, запросите новый код и повторите процесс.',
				HttpStatus.FORBIDDEN
			);
		}
	}

	protected calculateNextAttemptTime(
		lastAttemptMessage: Date[],
		timeLimit: number
	): number {
		this.logger.log(`Запуск calculateNextAttemptTime,`);
		const lastEmailChangeAttempt: Date =
			lastAttemptMessage[lastAttemptMessage.length - 1];
		const lastAttemptTime: number = lastEmailChangeAttempt.getTime();
		return lastAttemptTime + timeLimit;
	}

	protected validateLastReset(
		model: { userId: string; lastRestEmail: Date },
		resetInterval: number
	): void {
		this.logger.log(`Запуск validateLastReset, userId: ${model.userId}`);
		const dataNow: number = this.commonService.getCurrentTimeMillis();
		const nextAllowedResetTime: number =
			model.lastRestEmail.getTime() + resetInterval;
		if (dataNow < nextAllowedResetTime) {
			throw new HttpException(
				'Пожалуйста, подождите перед следующим сбросом.',
				HttpStatus.TOO_MANY_REQUESTS
			);
		}
	}

	protected checkTimeSennCode(
		resetModel: {
			userId: string;
			lastAttemptMessage: Date[];
		},
		maxAttempt: number,
		dailyAttemptsLimit: number,
		confirmationCodeInterval: number
	): void {
		this.logger.log(`Запуск checkTimeSennCode, userId: ${resetModel.userId}`);
		const checkAttemps: boolean =
			resetModel.lastAttemptMessage.length >= maxAttempt;
		if (checkAttemps) {
			this.processResetEmailRequest(resetModel, dailyAttemptsLimit);
		}
		this.checkResendInterval(resetModel, confirmationCodeInterval);
	}

	private processResetEmailRequest(
		resetModel: {
			userId: string;
			lastAttemptMessage: Date[];
		},
		dailyAttemptsLimit: number
	): void {
		this.logger.log(
			`Запуск processResetEmailRequest, userId: ${resetModel.userId}`
		);
		this.filterValidAttempts(resetModel, dailyAttemptsLimit);
		this.checkAttemptLimit(resetModel, dailyAttemptsLimit);
	}

	private checkAttemptLimit(
		resetModel: {
			userId: string;
			lastAttemptMessage: Date[];
		},
		dailyAttemptsLimit: number
	): void {
		this.logger.log(`Запуск checkAttemptLimit, userId: ${resetModel.userId}`);
		const isAttemptLimitReached: boolean =
			resetModel.lastAttemptMessage.length >= dailyAttemptsLimit;
		if (isAttemptLimitReached) {
			throw new HttpException(
				'Вы достигли лимита попыток отправки кода подтверждения. Пожалуйста, подождите час перед следующей попыткой.',
				HttpStatus.TOO_MANY_REQUESTS
			);
		}
	}

	private filterValidAttempts(
		resetModel: {
			userId: string;
			lastAttemptMessage: Date[];
		},
		dailyAttemptsLimit: number
	): void {
		this.logger.log(`Запуск filterValidAttempts, userId: ${resetModel.userId}`);
		const currentTime: number = this.commonService.getCurrentTimeMillis();
		resetModel.lastAttemptMessage = resetModel.lastAttemptMessage.filter(
			attempt => {
				const attemptTime: number = attempt.getTime();
				const expiryTime: number = attemptTime + dailyAttemptsLimit;
				return expiryTime > currentTime;
			}
		);
	}

	private checkResendInterval(
		resetModel: {
			userId: string;
			lastAttemptMessage: Date[];
		},
		confirmationCodeInterval: number
	): void {
		this.logger.log(`Запуск checkResendInterval, userId: ${resetModel.userId}`);
		const currentTime: number = this.commonService.getCurrentTimeMillis();
		const nextAllowedAttemptTime: number = this.calculateNextAttemptTime(
			resetModel.lastAttemptMessage,
			confirmationCodeInterval
		);
		if (currentTime < nextAllowedAttemptTime) {
			throw new HttpException(
				'Пожалуйста, подождите минуту перед тем как запросить новый код подтверждения.',
				HttpStatus.FORBIDDEN
			);
		}
	}

	protected pushResetAttempt(resetModel: {
		userId: string;
		lastAttemptMessage: Date[];
	}): void {
		this.logger.log(`Запуск pushResetAttempt, userId: ${resetModel.userId}`);
		resetModel.lastAttemptMessage.push(new Date());
	}

	protected validateUserId(user: User, userId: string) {
		this.logger.log(`Запуск validateUserId, userId: ${user.id}`);
		return this.validateService.validateUserId(user, userId);
	}

	protected ensureModelExists(
		model: OptionalEmailChangel | PasswordResetOrNull
	): void {
		this.logger.log(`Запуск ensureModelExists`);
		if (!model) {
			throw new HttpException(
				'Запрос на сброс не найден.',
				HttpStatus.NOT_FOUND
			);
		}
	}
}
