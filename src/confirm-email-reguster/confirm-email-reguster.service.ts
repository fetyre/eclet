import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { BlacklistedToken, EmailToken, User } from '@prisma/client';
import { ErrorHandlerService } from 'src/errro-catch/error-catch.service';
import { PrismaService } from 'src/settings/prisma.database/prisma.service';
import { PrismaTransaction } from 'src/types';
import { TokenTypeEnum } from 'src/jwt/models/enums/token-type.enum';
import { ConfirmEmailReqInterface } from './interface/confirm-email.interface';
import { ValidateService } from 'src/validate/validate.service';
import { BlackListService } from 'src/black-list/black-list.service';
import { UsersRepository } from 'src/user/user.repository';
import { EmailRepository } from './email.repository';

/**
 * @class ConfirmEmailAuthService
 * @classdesc Подтверждение почты при регистрации
 * @throws {InternalServerErrorException} Если возникла внутренняя ошибка сервера
 * @since 2023-10-27
 */
@Injectable()
export class ConfirmEmailRegusterService {
	private readonly logger: Logger = new Logger(
		ConfirmEmailRegusterService.name
	);

	constructor(
		private readonly errorHandlerService: ErrorHandlerService,
		private readonly prisma: PrismaService,
		private readonly validateService: ValidateService,
		private readonly blackListService: BlackListService,
		private readonly usersRepository: UsersRepository,
		private readonly emailRepository: EmailRepository
	) {}

	/**
	 * Подтверждение почты при регистрации
	 * @param {ConfirmEmailReqInterface} data - объект с jti, user,exp
	 * @returns {Promise<void>}  ничего
	 * @throws {InternalServerErrorException} - Если возникла внутренняя ошибка сервера
	 * @see {@link updateUser} - метод обновления пользоватля
	 * @see {@link deleteEmailToken} - удаление модели EmailToken
	 * @see {@link createBlacklistedToken} - добавление токена в черный список
	 * @since 2023-10-27
	 */
	public async confirmEmail(
		userId: string,
		data: ConfirmEmailReqInterface
	): Promise<void> {
		try {
			this.logger.log(`Запуск confirmEmail. userId: ${data.user.id}`);
			this.validateParamUserId(userId, data.user);
			await this.validateEmailToken(data);
			return await this.prisma.$transaction(async prisma => {
				await Promise.all([
					await this.usersRepository.updateUserActiveAccount(
						data.user.id,
						prisma
					),
					await this.emailRepository.deleteEmailTokenByUserId(
						data.user,
						prisma
					),
					await this.createBlacklistedToken(data, prisma)
				]);
			});
		} catch (error) {
			this.logger.error(`Ошибка в confirmEmail. userId${data.user.id}`);
			this.errorHandlerService.handleError(error);
		}
	}

	private async validateEmailToken(data: ConfirmEmailReqInterface) {
		this.logger.log(`Запуск validateEmailToken. userId ${data.user.id}`);
		this.validateEmailTokenExists(data.user.emailToken);
		this.validateTokenData(data);
	}

	private validateTokenData(data: ConfirmEmailReqInterface): void {
		this.logger.log(`Запуск validateTokenData. userId ${data.user.id}`);
		if (data.payload.jti !== data.user.emailToken.token) {
			throw new HttpException(
				'Доступ запрещен: идентификатор в токене не совпадает с идентификатором в базе данных',
				HttpStatus.FORBIDDEN
			);
		}
	}

	private validateEmailTokenExists(emailTokenModel: EmailToken): void {
		this.logger.log(`Запуск validateEmailTokenExists.`);
		if (!emailTokenModel) {
			throw new HttpException(
				'Запрос на подтверждение аккаунта не найден.',
				HttpStatus.NOT_FOUND
			);
		}
	}

	private validateParamUserId(userId: string, user: User): void {
		this.logger.log(`Запуск validateParamUserId. userId ${user.id}`);
		this.validateService.checkId(userId);
		this.validateUserIdMatch(userId, user);
	}

	private validateUserIdMatch(userId: string, user: User): void {
		this.logger.log(`Запуск validateUserIdMatch. userId ${user.id}`);
		if (userId !== user.id) {
			throw new HttpException(
				'Несоответствие ID пользователя в запросе и токене.',
				HttpStatus.FORBIDDEN
			);
		}
	}

	/**
	 * Добавление токена в черный список
	 * @param {ConfirmEmailReqInterface} data - объект пользователя с моделью email
	 * @param {PrismaTransaction} prisma - транзакция
	 * @returns {Promise<BlacklistedToken>}  созданая модель BlacklistedToken
	 * @throws {InternalServerErrorException} - Если возникла внутренняя ошибка сервера
	 * @since 2023-10-27
	 */
	private async createBlacklistedToken(
		data: ConfirmEmailReqInterface,
		prisma: PrismaTransaction
	): Promise<BlacklistedToken> {
		this.logger.log(`Запуск createBlacklistedToken. userId:${data.user.id}`);
		return await this.blackListService.createAndSaveBlacklistedToken(
			{
				userId: data.user.id,
				tokenV4Id: data.payload.jti,
				exp: data.payload.exp,
				tokenType: TokenTypeEnum.CONFIRMATION
			},
			prisma
		);
	}
}
