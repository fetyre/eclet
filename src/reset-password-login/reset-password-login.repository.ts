import { Injectable, Logger } from '@nestjs/common';
import { ForgotPassword } from '@prisma/client';
import { PrismaService } from 'src/settings/prisma.database/prisma.service';
import { PrismaTransaction } from 'src/types';
import {
	OptionalPasswordReset,
	UserPasswordResetTokenOrNull
} from './type/reset-password.type';

@Injectable()
export class ResetPasswordLoginRepository {
	readonly logger: Logger = new Logger(ResetPasswordLoginRepository.name);

	constructor(private readonly prisma: PrismaService) {}

	public async createResetPasswordTokenModel(
		id: string,
		token: string,
		prisma: PrismaTransaction
	): Promise<ForgotPassword> {
		this.logger.log(`Запуск createResetPasswordTokenModel, userID: ${id}`);
		return await prisma.forgotPassword.create({
			data: {
				resetPasswordToken: token,
				timeCreatetoken: [new Date()],
				user: {
					connect: { id }
				}
			}
		});
	}

	public async updateResetPasswordTokenModel(
		userId: string,
		id: string,
		token: string,
		checkPasswordResetAttempts: Date[],
		prisma: PrismaTransaction
	): Promise<ForgotPassword> {
		this.logger.log(`Запуск updateResetPasswordTokenModel, userId: ${userId}`);
		return prisma.forgotPassword.update({
			where: { id, userId },
			data: {
				resetPasswordToken: token,
				timeCreatetoken: checkPasswordResetAttempts
			}
		});
	}

	public async retrieveUniquePasswordResetToken(
		resetPasswordToken: string
	): Promise<OptionalPasswordReset> {
		this.logger.log(`Запуск в retrieveUniquePasswordResetToken`);
		return await this.prisma.forgotPassword.findUnique({
			where: { resetPasswordToken }
		});
	}

	public async updateResetPasswordToken(
		model: ForgotPassword
	): Promise<ForgotPassword> {
		this.logger.log('Запуск updateResetPasswordToken');
		return await this.prisma.forgotPassword.update({
			where: { id: model.id, userId: model.userId },
			data: { youResert: true }
		});
	}

	public async findUniqueResetToken(
		tokenHash: string
	): Promise<OptionalPasswordReset> {
		this.logger.log(`Запуск findUniqueResetToken`);
		return await this.prisma.forgotPassword.findUnique({
			where: { resetPasswordToken: tokenHash }
		});
	}

	public async getUserResetPasswordTokenByToken(
		token: string
	): Promise<UserPasswordResetTokenOrNull> {
		this.logger.log(`Запуск getUserResetPasswordTokenByToken.`);
		return await this.prisma.forgotPassword.findUnique({
			where: { resetPasswordToken: token },
			include: {
				user: {
					include: {
						credentials: true
					}
				}
			}
		});
	}
}
