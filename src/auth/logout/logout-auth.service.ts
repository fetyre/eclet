import { Injectable, Logger } from '@nestjs/common';
import { BlacklistedToken, StatusEnum } from '@prisma/client';
import { BlackListService } from 'src/black-list/black-list.service';
import { ErrorHandlerService } from 'src/errro-catch/error-catch.service';
import { TokenTypeEnum } from 'src/jwt/models/enums/token-type.enum';
import { PrismaService } from 'src/settings/prisma.database/prisma.service';
import { PrismaTransaction } from 'src/types';
import { ILogoutReqDetalic } from '../models/interface';
import { UsersRepository } from 'src/user/user.repository';

/**
 * @class LogoutAuthService
 * @classdesc выход пользователя с аккаунта
 * @throws {InternalServerErrorException} Если возникла внутренняя ошибка сервера
 * @since 2023-10-26
 */
@Injectable()
export class LogoutAuthService {
	private readonly logger: Logger = new Logger(LogoutAuthService.name);
	constructor(
		private readonly blackListService: BlackListService,
		private readonly errorHandlerService: ErrorHandlerService,
		private readonly prisma: PrismaService,
		private readonly usersRepository: UsersRepository
	) {}

	/**
	 * Выход пользователя из аккаунта
	 * @param {ILogoutReqDetalic} data - объект с jti, user,exp
	 * @returns {Promise<void>}  ничего
	 * @throws {InternalServerErrorException} - Если возникла внутренняя ошибка сервера
	 * @see {@link createBlacklistedTokenByRefsesh} - метод создания записи в бд, помещение в черный список токена
	 * @see {@link updateUserStatus} - метод обновления статуса пользователя
	 * @since 2023-10-27
	 */
	public async logout(data: ILogoutReqDetalic): Promise<void> {
		try {
			this.logger.log(`Запуск logout. userID: ${data.user.id}`);
			return await this.prisma.$transaction(async prisma => {
				await this.createBlacklistedTokenByRefsesh(
					data.user.id,
					data.jti,
					data.exp,
					prisma
				);
				await this.usersRepository.updateUserStatus(
					data.user.id,
					StatusEnum.offline,
					prisma
				);
			});
		} catch (error) {
			this.logger.log(
				`Ошибка в logout. userID: ${data.user.id}, error:${error.message}`
			);
			this.errorHandlerService.handleError(error);
		}
	}

	/**
	 * Создание записи в бд, помещение в черный список
	 * @param {string} userId - id пользователя
	 * @param {string} tokenV4 - id токена
	 * @param {number} exp - время истечения жизни токена
	 * @param {PrismaTransaction} prisma - транзакция
	 * @returns {Promise<BlacklistedToken>} - объект созданной BlacklistedToken модели
	 * @throws {InternalServerErrorException} - Если возникла внутренняя ошибка сервера
	 * @see {@link BlackListService.createAndSaveBlacklistedToken} - метод помещение токена в черный список
	 * @since 2023-10-27
	 */
	private async createBlacklistedTokenByRefsesh(
		userId: string,
		tokenV4: string,
		exp: number,
		prisma: PrismaTransaction
	): Promise<BlacklistedToken> {
		this.logger.log(
			`Запуск createBlacklistedTokenByRefsesh, userID: ${userId}`
		);
		return await this.blackListService.createAndSaveBlacklistedToken(
			{
				userId,
				tokenV4Id: tokenV4,
				exp,
				tokenType: TokenTypeEnum.REFRESH
			},
			prisma
		);
	}
}
