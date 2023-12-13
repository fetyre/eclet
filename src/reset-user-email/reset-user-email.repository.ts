import { Injectable, Logger } from '@nestjs/common';
import { EmailChange, User } from '@prisma/client';
import { PrismaService } from 'src/settings/prisma.database/prisma.service';
import { PrismaTransaction } from 'src/types';
import { IResetEmail } from './interface';
import { OptionalEmailChangel } from './types/reset-user-email.type';

@Injectable()
export class ResetUserEmailRepository {
	readonly logger: Logger = new Logger(ResetUserEmailRepository.name);

	constructor(private readonly prisma: PrismaService) {}

	public async updateResetEmail(
		resetEmailModel: EmailChange,
		code: string,
		resetData: IResetEmail,
		prisma: PrismaTransaction
	): Promise<EmailChange> {
		this.logger.log(
			`Запуск updateResetEmail, userId: ${resetEmailModel.userId}`
		);
		return await prisma.emailChange.update({
			where: { id: resetEmailModel.id, userId: resetEmailModel.userId },
			data: {
				code,
				...resetData,
				lastAttemptMessage: resetEmailModel.lastAttemptMessage
			}
		});
	}

	public async createResetEmailEntry(
		resetData: IResetEmail,
		code: string,
		user: User,
		prisma: PrismaTransaction
	): Promise<EmailChange> {
		this.logger.log(`Запуск createResetEmailEntry, userId: ${user.id}`);
		return await prisma.emailChange.create({
			data: {
				userId: user.id,
				code,
				...resetData,
				lastAttemptMessage: [new Date()]
			}
		});
	}

	public async updateEmailResetModel(
		resetEmailModel: EmailChange,
		code: string,
		prisma: PrismaTransaction
	): Promise<EmailChange> {
		this.logger.log(
			`Запуск updateEmailResetModel, userId: ${resetEmailModel.userId}`
		);
		return await prisma.emailChange.update({
			where: { id: resetEmailModel.id, userId: resetEmailModel.userId },
			data: { code, lastAttemptMessage: resetEmailModel.lastAttemptMessage }
		});
	}

	public async findResetEmailModelByUserId(
		user: User
	): Promise<OptionalEmailChangel> {
		this.logger.log(`Запуск findResetEmailModelByUserId, userId: ${user.id}`);
		return await this.prisma.emailChange.findUnique({
			where: { userId: user.id }
		});
	}

	public async updateResetEmailAfterTokenConfirm(
		resetEmailModel: EmailChange,
		prisma: PrismaTransaction
	): Promise<EmailChange> {
		this.logger.log(
			`Запуск updateResetEmailAfterTokenConfirm, userId: ${resetEmailModel.userId}`
		);
		return prisma.emailChange.update({
			where: { id: resetEmailModel.id },
			data: { email: null, lastRestEmail: new Date(), lastAttemptMessage: [] }
		});
	}

	public async fetchModelById(id: string): Promise<OptionalEmailChangel> {
		this.logger.log(`Запуск fetchResetEmailModelById, resetId: ${id}`);
		return await this.prisma.emailChange.findUnique({ where: { id } });
	}
}
