import { Injectable, Logger } from '@nestjs/common';
import { ChatStatus, UserChatStatus } from '@prisma/client';
import { PrismaService } from 'src/settings/prisma.database/prisma.service';
import { PrismaTransaction } from 'src/types';
import { IUpdateUserChatStatus } from './interfaces';
import { NullableChatStatus } from './types/chat-status.type';

@Injectable()
export class UserChatStatusRepository {
	readonly logger: Logger = new Logger(UserChatStatusRepository.name);
	constructor(private readonly prisma: PrismaService) {}

	public async performChatStatusUpdate(
		updateData: IUpdateUserChatStatus,
		chatStatus: UserChatStatus,
		prisma: PrismaTransaction
	): Promise<UserChatStatus> {
		this.logger.log(
			`Запуск performChatStatusUpdate, userId: ${chatStatus.userId}, chatId:${chatStatus.chatId}`
		);
		return await prisma.userChatStatus.update({
			where: { id: chatStatus.id },
			data: { ...updateData }
		});
	}

	public async findUserChatStatusById(id: string): Promise<NullableChatStatus> {
		this.logger.log(`Запуск findUserChatStatusById, userChatStatusIs: ${id}`);
		return await this.prisma.userChatStatus.findUnique({ where: { id } });
	}

	public async updateChatStatus(
		userChatStatus: UserChatStatus
	): Promise<UserChatStatus> {
		this.logger.log(
			`Запуск updateChatStatus, userId: ${userChatStatus.userId}`
		);
		return await this.prisma.userChatStatus.update({
			where: { id: userChatStatus.id },
			data: { chatStatus: ChatStatus.active }
		});
	}
}
