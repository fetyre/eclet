import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/settings/prisma.database/prisma.service';
import { JwtService } from 'src/jwt/jwt.service';
import { TokenTypeEnum } from 'src/jwt/models/enums/token-type.enum';
import { IAccessToken } from 'src/jwt/models/interfaces/access-token.interface';
import {
	Chat,
	ChatStatus,
	User,
	UserChatStatus,
	UserRole
} from '@prisma/client';
import { UserNetworksStatus } from './enum/user-networks-status.enum';
import { WsException } from '@nestjs/websockets';
import { ConfigLoaderService } from 'src/settings/config/config-loader.service';
import { NullableUser, OptionalString } from 'src/types';
import { ValidateService } from 'src/validate/validate.service';

import { IUserAndChat } from './interface/user-chat.interface';
import {
	ChatWithUserStatus,
	NullableChatWithUserStatus
} from 'src/messages/type/message-type';
import { IChatTypung } from './interface';

@Injectable()
export class ChatSocketService {
	// create(createChatSocketioDto: CreateChatSocketioDto) {
	// 	throw new Error('Method not implemented.');
	// }
	private readonly logger: Logger = new Logger(ChatSocketService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly jwtService: JwtService,
		private readonly configLoaderService: ConfigLoaderService,
		private readonly validateService: ValidateService
	) {}

	public async handleNewConnection(token: OptionalString, socketId: string) {
		try {
			this.logger.log(`Запуск handleConnection, socketId:${socketId}`);
			this.validateAuthorizationToken(token);
			const payload: IAccessToken = await this.verifyAndDecodeToken(token);
			this.verifyUserRole(payload.role);
			this.validateUserId(payload.id);
			const user: User = await this.validateAndFetchUserByToken(payload);
			return await this.setUserOnlineStatus(user, socketId);
		} catch (error) {
			this.logger.error(
				`Ошибка в handleConnection, socketId:${socketId}, error:${error.message}`
			);
			if (error instanceof WsException) {
				throw error;
			}
			throw new WsException('Ошибка подключения');
		}
	}

	private validateAuthorizationToken(token: OptionalString): void {
		this.logger.log(`Запуск validateAuthorizationToken`);
		if (token) {
			throw new WsException('Токен авторизации отсуствует');
		}
	}

	private async setUserOnlineStatus(
		user: User,
		socketId: string
	): Promise<User> {
		this.logger.log(
			`Запуск setUserOnlineStatus, userId:${user.id}, role: ${user.role}`
		);
		return await this.prisma.user.update({
			where: { id: user.id, email: user.email },
			data: { status: UserNetworksStatus.ONLINE, socketId }
		});
	}

	private async validateAndFetchUserByToken(
		payload: IAccessToken
	): Promise<User> {
		this.logger.log(
			`Запуск validateAndFetchUserByToken, userId: ${payload.id}`
		);
		const userRole: UserRole = UserRole[payload.role];
		const user: NullableUser = await this.fetchUserByIdAndRole(
			payload.id,
			userRole
		);
		this.validateUser(user);
		return user;
	}

	private validateUser(user: NullableUser): void {
		this.logger.log(`Запуск validateUser`);
		if (!user) {
			throw new WsException('Пользователь не найден');
		}
	}

	private validateUserId(id: string): void {
		this.logger.log(`Запуск validateUserId`);
		return this.validateService.checkId(id);
	}

	private verifyUserRole(role: string): void {
		this.logger.log(`Запуск verifyUserRole`);
		if (!(role in UserRole)) {
			throw new WsException('Недействительная роль в токене');
		}
	}

	private async fetchUserByIdAndRole(
		id: string,
		role: UserRole
	): Promise<NullableUser> {
		this.logger.log(`Запуск fetchUserByIdAndRole, userId: ${id}`);
		return await this.prisma.user.findUnique({
			where: { id, role }
		});
	}

	private async verifyAndDecodeToken(token: string): Promise<IAccessToken> {
		this.logger.log(`Запуск verifyAndDecodeToken`);
		const accessToken: string = token.replace('Bearer ', '');
		return await this.jwtService.verifyToken(accessToken, TokenTypeEnum.ACCESS);
	}

	public async handleDisconnect(socketId: string) {
		try {
			this.logger.log(`Запуск handleDisconnect, socketId: ${socketId}`);
			const user: User = await this.getUserBySocketId(socketId);
			return await this.updateOfflineStatusUser(user);
		} catch (error) {
			this.logger.error(
				`Ошибка в handleDisconnect, socketId:${socketId}, error:${error.message}`
			);
			if (error instanceof WsException) {
				throw error;
			}
			throw new WsException('Ошибка выполнения');
		}
	}

	private async updateOfflineStatusUser(user: User): Promise<User> {
		this.logger.log(`Запуск updateOfflineStatusUser, userId:${user.id}`);
		return await this.prisma.user.update({
			where: { id: user.id, email: user.email },
			data: { status: UserNetworksStatus.OFFLINE, socketId: null }
		});
	}

	private async findUserBySocketId(socketId: string): Promise<NullableUser> {
		this.logger.log(`Запуск findUserBySocketId, socketId: ${socketId}`);
		return await this.prisma.user.findUnique({ where: { socketId } });
	}

	private async getUserBySocketId(socketId: string): Promise<User> {
		const user: NullableUser = await this.findUserBySocketId(socketId);
		this.validateUser(user);
		return user;
	}

	// public async createChatMessage(
	// 	socketId: string,
	// 	chatId: string
	// ): Promise<string> {
	// 	try {
	// 		this.logger.log({
	// 			level: 'info',
	// 			message: `Запуск createChatMessage, socketId: ${socketId}`,
	// 			context: 'ChatSocketioService'
	// 		});
	// 		const userAndChat: UserAndChatInterface =
	// 			await this.validateUserAccessToChat(socketId, chatId);
	// 		return userAndChat.chat.chatName;
	// 	} catch (error) {
	// 		this.logger.error({
	// 			level: 'error',
	// 			message: `Ошибка в методе  handleConnection, socketId: ${socketId}, error:${error.message}`,
	// 			context: 'ChatSocketioService'
	// 		});
	// 		throw new WsException('Ошибка аунтификации');
	// 	}
	// }

	// private async validateUserAccessToChat(
	// 	socketId: string,
	// 	chatId: string
	// ): Promise<UserAndChatInterface> {
	// 	this.logger.log(`Запуск validateUserAccessToChat, socketId: ${socketId}`);
	// 	const userAndChat: UserAndChatInterface =
	// 		await this.findUserBySocketIdAndChatById(socketId, chatId);
	// 	await this.accessCheckUserByChat(userAndChat);
	// 	return userAndChat;
	// }

	// private async accessCheckUserByChat(
	// 	userAndChat: UserAndChatInterface
	// ): Promise<void> {
	// 	this.logger.log({
	// 		level: 'info',
	// 		message: `Запуск accessCheckUserByChat, userId: ${userAndChat.user.id}, chatId: ${userAndChat.chat.id}`,
	// 		context: 'ChatSocketioService'
	// 	});
	// 	switch (userAndChat.user.role) {
	// 		case UserRole.admin:
	// 		case UserRole.superAdmin:
	// 			return this.checkAdminIdByChat(userAndChat);
	// 		case UserRole.user:
	// 			return this.checkUserIdByChat(userAndChat);
	// 		default:
	// 			return this.checkAnonimIdByChat(userAndChat);
	// 	}
	// }

	// private checkAdminIdByChat(userAndChat: UserAndChatInterface): void {
	// 	this.logger.log({
	// 		level: 'info',
	// 		message: `Запуск checkAdminIdByChat, userId: ${userAndChat.user.id}, chatId: ${userAndChat.chat.id}`,
	// 		context: 'ChatSocketioService'
	// 	});
	// 	if (userAndChat.user.id !== userAndChat.chat.supportUserId) {
	// 		throw new WsException('Ошибка аунтификации');
	// 	}
	// }

	// private checkUserIdByChat(userAndChat: UserAndChatInterface): void {
	// 	this.logger.log({
	// 		level: 'info',
	// 		message: `Запуск checkUserIdByChat, userId: ${userAndChat.user.id}, chatId: ${userAndChat.chat.id}`,
	// 		context: 'ChatSocketioService'
	// 	});
	// 	if (userAndChat.user.id !== userAndChat.chat.userId) {
	// 		throw new WsException('Ошибка аунтификации');
	// 	}
	// }

	// private checkAnonimIdByChat(userAndChat: UserAndChatInterface): void {
	// 	this.logger.log({
	// 		level: 'info',
	// 		message: `Запуск checkAnonimIdByChat, userId: ${userAndChat.user.id}, chatId: ${userAndChat.chat.id}`,
	// 		context: 'ChatSocketioService'
	// 	});
	// 	if (userAndChat.user.id !== userAndChat.chat.anonimId) {
	// 		throw new WsException('Ошибка аунтификации');
	// 	}
	// }

	// private async findUserBySocketIdAndChatById(
	// 	socketId: string,
	// 	chatId: string
	// ): Promise<UserAndChatInterface> {
	// 	this.logger.log(
	// 		`Запуск findUserBySocketIdAndChatById, socketId: ${socketId}`
	// 	);
	// 	const [user, chat] = await Promise.all([
	// 		this.getUserBySocketId(socketId),
	// 		this.validateAndRetrieveChatByChatId(chatId)
	// 	]);
	// 	return { user, chat };
	// }

	private async validateChatAndFetchDetails(
		chatId: string,
		user: User
	): Promise<ChatWithUserStatus> {
		this.logger.log(`Запуск checkAndFindUserBySocketId, chatId: ${chatId}`);
		const chat: NullableChatWithUserStatus =
			await this.fetchChatDetailsByChatId(chatId, user);
		this.verifyChatExists(chat);
		this.verifySingleChatStatus(chat.userChatStatuses);
		this.verifyChatIsActive(chat.userChatStatuses);
		return chat;
	}

	private verifyChatIsActive(chatStatus: UserChatStatus[] | []): void {
		this.logger.log(`Запуск ensureActiveChatStatus.`);
		if (chatStatus[0].chatStatus !== ChatStatus.active) {
			throw new WsException('Статус чата не активен');
		}
	}

	private verifySingleChatStatus(chatStatus: UserChatStatus[] | []): void {
		this.logger.log(`Запуск ensureSingleChatStatus.`);
		if (!chatStatus || chatStatus.length !== 1) {
			throw new WsException('Неверное количество статусов чата');
		}
	}

	private verifyChatExists(chat: NullableChatWithUserStatus): void {
		this.logger.log(`Запуск checkStatusChat`);
		if (!chat) {
			throw new WsException('Чат не найден');
		}
	}

	private async fetchChatDetailsByChatId(
		chatId: string,
		user: User
	): Promise<NullableChatWithUserStatus> {
		this.logger.log(`Запуск findChatByChatId, chatId: ${chatId}`);
		return await this.prisma.chat.findUnique({
			where: { id: chatId },
			include: {
				userChatStatuses: {
					where: {
						userId: user.id,
						chatId
					}
				}
			}
		});
	}

	public async handleStartTyping(
		socketId: string,
		data: IChatTypung
	): Promise<IUserAndChat> {
		try {
			this.logger.log(`Запуск handleStartTyping, socketId:${socketId}`);
			const user: User = await this.getUserBySocketId(socketId);
			const сhatWithUserStatus: ChatWithUserStatus =
				await this.validateChatAndFetchDetails(data.chatId, user);
			const { userChatStatuses, ...chat } = сhatWithUserStatus;
			this.validateUserInChat(user, chat);
			return { user, chat };
		} catch (error) {
			this.logger.error(
				`Ошибка в методе handleStartTyping, socketId:${socketId}, error:${error.message}`
			);
			if (error instanceof WsException) {
				throw error;
			}
			throw new WsException('Ошибка выполнения');
		}
	}

	private validateUserInChat(user: User, chat: Chat): void {
		if (user.id !== chat.initiatorId && user.id !== chat.participantId) {
			throw new WsException('Пользователь не является участником чата');
		}
	}

	public async handleStopTyping(
		socketId: string,
		data: IChatTypung
	): Promise<IUserAndChat> {
		try {
			this.logger.log(`Запуск handleStopTyping, socketId:${socketId}`);
			const user: User = await this.getUserBySocketId(socketId);
			const сhatWithUserStatus: ChatWithUserStatus =
				await this.validateChatAndFetchDetails(data.chatId, user);
			const { userChatStatuses, ...chat } = сhatWithUserStatus;
			this.validateUserInChat(user, chat);
			return { user, chat };
		} catch (error) {
			this.logger.error(
				`Ошибка в методе handleStartTyping, socketId:${socketId}, error:${error.message}`
			);
			if (error instanceof WsException) {
				throw error;
			}
			throw new WsException('Ошибка выполнения');
		}
	}
}
