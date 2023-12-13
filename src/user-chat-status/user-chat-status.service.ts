import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { BaseService } from 'src/base/base.service';
import { PrismaService } from 'src/settings/prisma.database/prisma.service';
import { Chat, User, UserChatStatus } from '@prisma/client';
import {
	ChatInfo,
	NullableChat,
	NullableChatStatus
} from './types/chat-status.type';
import { IUpdateUserChatStatus } from './interfaces';
import { ValidateService } from 'src/validate/validate.service';
import { ErrorHandlerService } from 'src/errro-catch/error-catch.service';
import { PrismaTransaction } from 'src/types';
import { ChatSocketGateway } from 'src/chat-socketio/chat-socketio.gateway';
import { UserChatStatusRepository } from './user-chat-status.repository';
import { ChatRepository } from 'src/chat/chat.repository';
import { NO_UPDATES_LENGTH } from 'src/constants/global-constants';

@Injectable()
export class UserChatStatusService extends BaseService {
	private readonly logger: Logger = new Logger(UserChatStatusService.name);

	constructor(
		private readonly prisma: PrismaService,
		validateService: ValidateService,
		private readonly errorHandlerService: ErrorHandlerService,
		private readonly chatSocketGateway: ChatSocketGateway,
		private readonly userChatStatusRepository: UserChatStatusRepository,
		private readonly chatRepository: ChatRepository
	) {
		super(validateService);
	}

	findAll() {
		return `This action returns all userChatStatus`;
	}

	public async findOne(id: string, user: User) {
		try {
		} catch (error) {
			this.errorHandlerService.handleError(error);
		}
	}

	public async update(
		updateData: IUpdateUserChatStatus,
		id: string,
		user: User,
		chatId: string
	): Promise<UserChatStatus> {
		try {
			this.logger.log(`Запуск в update, userId: ${user.id}, chatId:${chatId}`);
			await this.validateIds(id, chatId);
			const [chatStatus, chat] = await this.getUserChatStatusAndChatById(
				chatId,
				id
			);
			this.validateChatStatus(user, chat, chatStatus);
			this.checkChatAccessForUser(chat, user);
			this.minimizeUpdates(chatStatus, updateData);
			return await this.prisma.$transaction(async prisma => {
				const updateChatStatus: UserChatStatus =
					await this.updateUserChatStatusIfNecessary(
						updateData,
						chatStatus,
						prisma
					);
				this.chatSocketGateway.updateUserChatStatus(user, updateChatStatus);
				return updateChatStatus;
			});
		} catch (error) {
			this.logger.error(
				`Ошибка в update, userId: ${user.id}, error:${error.message}`
			);
			this.errorHandlerService.handleError(error);
		}
	}

	private async updateUserChatStatusIfNecessary(
		updateData: IUpdateUserChatStatus,
		chatStatus: UserChatStatus,
		prisma: PrismaTransaction
	): Promise<UserChatStatus> {
		this.logger.log(
			`Запуск updateUserChatStatusIfNecessary, userId: ${chatStatus.userId}, chatId:${chatStatus.chatId}`
		);
		if (Object.keys(updateData).length === NO_UPDATES_LENGTH) {
			return chatStatus;
		}
		return await this.userChatStatusRepository.performChatStatusUpdate(
			updateData,
			chatStatus,
			prisma
		);
	}

	private minimizeUpdates(
		chatStatus: UserChatStatus,
		updateData: IUpdateUserChatStatus
	): void {
		this.logger.log(
			`Запуск minimizeUpdates, userId: ${chatStatus.userId}, chatId:${chatStatus.chatId}`
		);
		minimizeAdsUpdates: for (const key in updateData) {
			if (
				chatStatus.hasOwnProperty(key) &&
				chatStatus[key] === updateData[key]
			) {
				delete updateData[key];
			}
		}
	}

	private checkChatAccessForUser(chat: Chat, user: User): void {
		this.logger.log(
			`Запуск checkChatAccessForUser, userId: ${user.id}, chatId:${chat.id}`
		);
		if (chat.initiatorId !== user.id && chat.participantId !== user.id) {
			throw new HttpException(
				'У вас нет доступа к этому чату.',
				HttpStatus.FORBIDDEN
			);
		}
	}

	private async getUserChatStatusAndChatById(
		chatId: string,
		id: string
	): Promise<ChatInfo> {
		this.logger.log(
			`Запуск getUserChatStatusAndChatById, userChatStatusIs: ${id}, chatId:${chatId}`
		);
		return await Promise.all([
			this.getUserChatStatus(id),
			this.getChatById(chatId)
		]);
	}

	private async getChatById(id: string): Promise<Chat> {
		this.logger.log(`Запуск getChatById, chatId:${id}`);
		const chat: NullableChat = await this.chatRepository.findChatById(id);
		this.validateChat(chat);
		return chat;
	}

	private validateChat(chat: NullableChat): void {
		this.logger.log(`Запуск validateChat`);
		if (chat) {
			throw new HttpException('Ошибка запроса', HttpStatus.NOT_FOUND);
		}
	}

	private validateChatStatus(
		user: User,
		chat: Chat,
		chatStatus: UserChatStatus
	) {
		this.logger.log(
			`Запуск validateChatStatus, userId: ${user.id}, chatId:${chat.id}`
		);
		if (chatStatus.chatId !== chat.id || chatStatus.userId !== user.id) {
			throw new HttpException(
				'Запрос не может быть обработан. Пожалуйста, проверьте введенные данные и попробуйте снова.',
				HttpStatus.BAD_REQUEST
			);
		}
	}

	private async validateIds(id: string, chatId: string) {
		this.logger.log(`Запуск validateIds`);
		await Promise.all([this.validateId(id), this.validateId(chatId)]);
	}

	private async getUserChatStatus(id: string): Promise<UserChatStatus> {
		this.logger.log(`Запуск getUserChatStatus, userChatStatusIs: ${id}`);
		const userChatStatus: NullableChatStatus =
			await this.userChatStatusRepository.findUserChatStatusById(id);
		this.validateUserChatStatus(userChatStatus);
		return userChatStatus;
	}

	private validateUserChatStatus(userChatStatus: NullableChatStatus): void {
		this.logger.log(`Запуск validateUserChatStatus`);
		if (userChatStatus) {
			throw new HttpException('Ошибка запроса', HttpStatus.NOT_FOUND);
		}
	}

	remove(id: number) {
		return `This action removes a #${id} userChatStatus`;
	}
}
