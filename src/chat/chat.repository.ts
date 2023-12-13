import { Injectable, Logger } from '@nestjs/common';
import { Chat, User } from '@prisma/client';
import { PrismaService } from 'src/settings/prisma.database/prisma.service';
import { IChatParameters, ICreateChatDto } from './model/interface';
import { NullableChat } from './types/chat.types';
import { PrismaTransaction } from 'src/types';
import {
	ChatWithStatusOrNull,
	NullableChatWithUserStatus
} from 'src/messages/type/message-type';

@Injectable()
export class ChatRepository {
	readonly logger: Logger = new Logger(ChatRepository.name);
	constructor(private readonly prisma: PrismaService) {}

	public async findExistingChat(
		user: User,
		createData: ICreateChatDto
	): Promise<NullableChat> {
		this.logger.log(`Запуск findExistingChat, userId: ${user.id}`);
		return await this.prisma.chat.findFirst({
			where: {
				OR: [
					{ initiatorId: user.id, participantId: createData.userId },
					{ initiatorId: createData.userId, participantId: user.id }
				]
			}
		});
	}

	public async saveChat(
		user: User,
		roomName: string,
		createData: ICreateChatDto,
		prisma: PrismaTransaction
	): Promise<Chat> {
		this.logger.log(`Запуск saveChat, userId: ${user.id}`);
		return await prisma.chat.create({
			data: {
				chatName: roomName,
				initiatorId: user.id,
				participantId: createData.userId,
				userChatStatuses: {
					create: [
						{
							userId: user.id
						},
						{
							userId: createData.userId
						}
					]
				}
			}
		});
	}

	public async findChatById(chatId: string): Promise<Chat> {
		this.logger.log(`Запуск findChatById, chatId: ${chatId}.`);
		return this.prisma.chat.findUnique({
			where: { id: chatId }
		});
	}

	public async deleteChatById(
		chat: Chat,
		prisma: PrismaTransaction
	): Promise<Chat> {
		this.logger.log(`Запуск deleteChatById, chatId: ${chat.id}`);
		return await prisma.chat.delete({
			where: {
				id: chat.id,
				chatName: chat.chatName
			}
		});
	}

	public async findManyChats(queryParams: IChatParameters, user: User) {
		this.logger.log(`Запуск findManyChats, userId: ${user.id}`);
		const { page, pageSize, unread, sort } = queryParams;
		return await this.prisma.chat.findMany({
			skip: (page - 1) * pageSize,
			take: pageSize,
			where: {
				...(unread === false
					? {
							messages: {
								some: {
									isRead: false
								}
							}
					  }
					: {}),
				// userChatStatuses: {
				// 	some: {
				// 		chatStatus: status ? status : ChatStatus.active
				// 	}
				// },
				OR: [{ initiatorId: user.id }, { participantId: user.id }]
			},
			orderBy: { updatedAt: sort }
		});
	}

	public async getTotalChatCount(
		user: User,
		query: IChatParameters
	): Promise<number> {
		this.logger.log(`Запуск getTotalChatCount, userId: ${user.id}.`);
		return await this.prisma.chat.count({
			where: {
				OR: [{ initiatorId: user.id }, { participantId: user.id }],
				messages: {
					some: {
						isRead: query ? false : undefined
					}
				}
			}
		});
	}

	public async retrieveChatById(
		chatId: string,
		userId: string
	): Promise<ChatWithStatusOrNull> {
		this.logger.log(`Запуск retrieveChatById, userId: ${userId}`);
		return await this.prisma.chat.findUnique({
			where: {
				id: chatId,
				OR: [{ initiatorId: userId }, { participantId: userId }]
			},
			include: {
				userChatStatuses: true,
				initiator: true,
				participant: true
			}
		});
	}

	public async findChatByUser(
		chatId: string,
		user: User
	): Promise<NullableChatWithUserStatus> {
		this.logger.log(`Запуск findChatByUser, userId: ${user.id}.`);
		return await this.prisma.chat.findUnique({
			where: {
				id: chatId,
				OR: [{ initiatorId: user.id }, { participantId: user.id }]
			},
			include: {
				userChatStatuses: {
					where: {
						userId: user.id
					}
				}
			}
		});
	}
}
