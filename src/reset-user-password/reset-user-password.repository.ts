import { Injectable, Logger } from '@nestjs/common';
import { PasswordReset, User, Credentials } from '@prisma/client';
import { PrismaService } from 'src/settings/prisma.database/prisma.service';
import { PrismaTransaction } from 'src/types';
import { IPasswordUpdate } from './interface';
import {
	CredentialsOrNull,
	PasswordResetOrNull
} from './types/reset-user-password.type';
import { INCREMENT_VALUE } from 'src/constants/global-constants';

@Injectable()
export class ResetUserPasswordRepository {
	readonly logger: Logger = new Logger(ResetUserPasswordRepository.name);
	constructor(private readonly prisma: PrismaService) {}

	public async updatePasswordResetModel(
		resetModel: PasswordReset,
		code: string,
		prisma: PrismaTransaction
	): Promise<PasswordReset> {
		this.logger.log(
			`Запуск updateEmailResetModel, userId: ${resetModel.userId}`
		);
		return await prisma.emailChange.update({
			where: { id: resetModel.id, userId: resetModel.userId },
			data: { code, lastAttemptMessage: resetModel.lastAttemptMessage }
		});
	}

	public async createResetPasswordEntry(
		code: string,
		user: User,
		prisma: PrismaTransaction
	): Promise<PasswordReset> {
		this.logger.log(`Запуск createResetPasswordEntry, userId: ${user.id}`);
		return await prisma.passwordReset.create({
			data: {
				userId: user.id,
				code,
				lastAttemptMessage: [new Date()]
			}
		});
	}

	public async findPasswordResetModelByUserId(
		user: User
	): Promise<PasswordReset> {
		this.logger.log(
			`Запуск findPasswordResetModelByUserId, userId: ${user.id}`
		);
		return await this.prisma.passwordReset.findUnique({
			where: { userId: user.id }
		});
	}

	public async updateResetPasswordModel(
		resetPasswordModel: PasswordReset,
		prisma: PrismaTransaction
	): Promise<PasswordReset> {
		this.logger.log(
			`Запуск updateResetPasswordModel, userId: ${resetPasswordModel.userId}`
		);
		return await prisma.passwordReset.update({
			where: { id: resetPasswordModel.id },
			data: {
				code: null,
				lastRestEmail: new Date()
			}
		});
	}

	public async updateCredentials(
		updateData: IPasswordUpdate,
		user: User,
		prisma: PrismaTransaction
	): Promise<Credentials> {
		this.logger.log(`Запуск updateCredentials, userId: ${user.id}`);
		return await prisma.credentials.update({
			where: { id: user.id },
			data: {
				passwordLast: updateData.password,
				passwordVersion: {
					increment: INCREMENT_VALUE
				},
				version: {
					increment: INCREMENT_VALUE
				}
			}
		});
	}

	public async fetchModelById(id: string): Promise<PasswordResetOrNull> {
		this.logger.log(`Запуск fetchModelById, resetId: ${id}`);
		return await this.prisma.passwordReset.findUnique({ where: { id } });
	}

	public async findCredentialsByUserId(user: User): Promise<CredentialsOrNull> {
		this.logger.log(`Запуск findCredentialsByUserId, userId: ${user.id}`);
		return await this.prisma.credentials.findUnique({
			where: { userId: user.id }
		});
	}
}
