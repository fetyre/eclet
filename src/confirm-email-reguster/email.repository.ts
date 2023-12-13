import { Injectable, Logger } from '@nestjs/common';
import { EmailToken } from '@prisma/client';
import { PrismaService } from 'src/settings/prisma.database/prisma.service';
import { PrismaTransaction } from 'src/types';
import { UserWithEmailToken } from './type/confirm-email.auth.type';
import { OptionalEmailToken } from 'src/auth/login/type/login-auth.type';

@Injectable()
export class EmailRepository {
	readonly logger: Logger = new Logger(EmailRepository.name);
	constructor(private readonly prisma: PrismaService) {}

	/**
	 * Уделания моедли EmailToken по id пользователя
	 * @param {UserWithEmailToken} user - объект пользователя с моделью EmailToken
	 * @param {PrismaTransaction} prisma - транзакция
	 * @returns {Promise<EmailToken>}  удаленная модель EmailToken
	 * @throws {InternalServerErrorException} - Если возникла внутренняя ошибка сервера
	 * @since 2023-10-27
	 */
	public async deleteEmailTokenByUserId(
		user: UserWithEmailToken,
		prisma: PrismaTransaction
	): Promise<EmailToken> {
		this.logger.log(`Запуск deleteEmailToken. userId:${user.id}`);
		return await prisma.emailToken.delete({
			where: { id: user.emailToken.id }
		});
	}

	public async deleteEmailToken(
		id: string,
		prisma: PrismaTransaction
	): Promise<EmailToken> {
		this.logger.log(`Запуск deleteEmailToken, emailTokenID: ${id}`);
		return await prisma.emailToken.delete({
			where: { id }
		});
	}

	public async updateResendAttemptsAndCreateNewToken(
		emailModelId: string,
		arrayDate: Date[],
		tokenV4Id?: string
	): Promise<EmailToken> {
		this.logger.log(
			`Запуск updateResendAttemptsAndCreateNewToken, emailModelId: ${emailModelId}`
		);
		return await this.prisma.emailToken.update({
			where: { id: emailModelId },
			data: {
				emailResendAttempts: arrayDate,
				token: tokenV4Id
			}
		});
	}

	/**
	 * Поиск модели EmailToken в бд по идентификатору пользователя
	 * @param {string} userId - идентификатор пользователя
	 * @returns {Promise<OptionalEmailToken>} Возвращает модель EmailToken или null
	 * @throws {InternalServerErrorException} Если возникла внутренняя ошибка сервера
	 * @since 2023-11-11
	 */
	public async findEmailTokenByUserId(
		userId: string
	): Promise<OptionalEmailToken> {
		this.logger.log(`Запуск findEmailTokenByUserId, userID: ${userId}`);
		return await this.prisma.emailToken.findUnique({
			where: { userId }
		});
	}
}
