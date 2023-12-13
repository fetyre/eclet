import { Injectable, Logger } from '@nestjs/common';
import { Chat, User, Message } from '@prisma/client';
import { PrismaService } from 'src/settings/prisma.database/prisma.service';
import { PrismaTransaction } from 'src/types';
import { IMessagePaginationParams, IUpdateMessage } from './interface';
import { NullbleMessage } from './type/message-type';
import { SortOrderEnum } from 'src/enum/global.enum';

@Injectable()
export class MessageRepository {
	readonly logger: Logger = new Logger(MessageRepository.name);
	constructor(private readonly prisma: PrismaService) {}

	public async saveMessage(
		chat: Chat,
		content: string,
		user: User,
		prisma: PrismaTransaction
	): Promise<Message> {
		this.logger.log(`Запуск saveMessage, userId: ${user.id}`);
		return await prisma.message.create({
			data: {
				chatName: chat.chatName,
				message: content,
				senderId: user.id,
				chatId: chat.id
			}
		});
	}

	public async findManyMessageByChatId(
		chat: Chat,
		query: IMessagePaginationParams,
		skip: number
	): Promise<Message[]> {
		this.logger.log(`Завершнеие findManyMessageByChatId, chatId: ${chat.id}`);
		return await this.prisma.message.findMany({
			where: { chatName: chat.chatName, chatId: chat.id },
			skip,
			take: query.pageSize,
			orderBy: {
				createdAt: SortOrderEnum.desc
			}
		});
	}

	public async getTotalMessageCount(chatId: string): Promise<number> {
		this.logger.log(`Запуск getTotalBannedWordsCount, chatId: ${chatId}.`);
		return await this.prisma.message.count({ where: { chatId } });
	}

	public async findMessageInChatByUser(
		user: User,
		chat: Chat,
		messageId: string
	): Promise<NullbleMessage> {
		this.logger.log(`Запуск findMessageInChatByUser, userId: ${user.id}`);
		return await this.prisma.message.findUnique({
			where: {
				id: messageId,
				chatId: chat.id,
				chatName: chat.chatName,
				senderId: user.id
			}
		});
	}

	public async updateMessage(
		message: Message,
		dto: IUpdateMessage,
		isRead: boolean | undefined,
		prisma: PrismaTransaction
	): Promise<Message> {
		this.logger.log(`Запуск updateMessage, userId: ${message.senderId}`);
		return await prisma.message.update({
			where: {
				id: message.id,
				chatName: message.chatName,
				chatId: message.chatId,
				senderId: message.senderId
			},
			data: { message: dto.content, isRead }
		});
	}

	public async deleteMessage(
		message: Message,
		prisma: PrismaTransaction
	): Promise<Message> {
		this.logger.log(`Запуск deleteMessage, userId: ${message.senderId}`);
		return await prisma.message.delete({
			where: {
				id: message.id,
				chatName: message.chatName,
				chatId: message.chatId,
				senderId: message.senderId
			}
		});
	}
}
