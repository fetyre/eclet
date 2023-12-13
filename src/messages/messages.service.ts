import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/settings/prisma.database/prisma.service';
import {
	Chat,
	ChatStatus,
	Message,
	NotificationStatus,
	User,
	UserChatStatus
} from '@prisma/client';
import { ChatSocketGateway } from 'src/chat-socketio/chat-socketio.gateway';
import { ConfigLoaderService } from 'src/settings/config/config-loader.service';
import { ValidateService } from 'src/validate/validate.service';
import {
	ChatWithStatusOrNull,
	ChatWithUserStatus,
	ChatWithUsersAndTheirStatuses,
	NullableChatWithUserStatus,
	NullbleMessage
} from './type/message-type';
import {
	FinldAllMessageDto,
	ValidateBeforeDbSaveDto,
	ValidateBeforeUpdateMessageDto
} from './dto';
import { ErrorHandlerService } from 'src/errro-catch/error-catch.service';
import {
	ChatWithReceiver,
	ICreateMessage,
	IMessagePaginationParams,
	IUpdateMessage
} from './interface';
import { MailerService } from 'src/mailer/mailer.service';
import { MessageRepository } from './message.repository';
import { UserChatStatusRepository } from 'src/user-chat-status/user-chat-status.repository';
import { ChatRepository } from 'src/chat/chat.repository';
import {
	BASE_PAGE,
	EMPTY_ARRAY_LENGTH,
	FIRST_ELEMENT,
	MAX_CHAT_STATUS_COUNT,
	MIN_ITEMS_PER_PAGE,
	SINGLE_STATUS_COUNT
} from 'src/constants/global-constants';
import { CommonService } from 'src/common/common.service';
import { SecurityService } from 'src/security/security.service';

@Injectable()
export class MessagesService {
	private readonly logger: Logger = new Logger(MessagesService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly chatMessageGateway: ChatSocketGateway,
		private readonly configLoaderService: ConfigLoaderService,
		private readonly securityService: SecurityService,
		private readonly validateService: ValidateService,
		private readonly errorHandlerService: ErrorHandlerService,
		private readonly mailerService: MailerService,
		private readonly messageRepository: MessageRepository,
		private readonly userChatStatusRepository: UserChatStatusRepository,
		private readonly chatRepository: ChatRepository,
		private readonly commonService: CommonService
	) {}

	public async create(
		chatId: string,
		user: User,
		dto: ICreateMessage
	): Promise<Message> {
		try {
			this.logger.log(`Запуск create, userId: ${user.id}`);
			// this.verifyUserStatusAndEmail(user);
			this.validateId(chatId);
			const chatWithReceiver: ChatWithReceiver =
				await this.examineAndRetrieveChatById(chatId, user);
			// this.verifyUserStatusAndEmail(chatWithReceiver.receiver);
			const receiverChatStatus: UserChatStatus = this.validateChatIsActive(
				chatWithReceiver.chatStatuses,
				chatWithReceiver.receiver,
				user
			);
			const content: string = this.encrypt(dto.content);
			await this.validateBeforeSave(user, chatWithReceiver.chat, content);
			return await this.prisma.$transaction(async prisma => {
				const message: Message = await this.messageRepository.saveMessage(
					chatWithReceiver.chat,
					content,
					user,
					prisma
				);
				await this.updateReceiverChatStatusIfHidden(receiverChatStatus);
				this.chatMessageGateway.createMessage(message, chatWithReceiver.chat);
				await this.notifyUserIfUnmuted(
					receiverChatStatus,
					chatWithReceiver.receiver
				);
				return { ...message, message: dto.content };
			});
		} catch (error) {
			this.logger.error(
				`Ошибка в create, userId: ${user.id}, error: ${error.message}`
			);
			this.errorHandlerService.handleError(error);
		}
	}

	private validateId(id: string): void {
		return this.validateService.checkId(id);
	}

	private async updateReceiverChatStatusIfHidden(
		receiverChatStatus: UserChatStatus
	): Promise<UserChatStatus> {
		this.logger.log(
			`Запуск updateReceiverChatStatusIfHidden, userId: ${receiverChatStatus.userId}`
		);
		if (receiverChatStatus.chatStatus === ChatStatus.hidden) {
			return await this.userChatStatusRepository.updateChatStatus(
				receiverChatStatus
			);
		}
	}

	private findUserChatStatus(
		userChatStatuses: UserChatStatus[],
		userId: string
	): UserChatStatus {
		this.logger.log(`Запуск findUserChatStatus, userId: ${userId}`);
		return userChatStatuses.find(status => status.userId === userId);
	}

	private validateChatIsActive(
		userChatStatuses: UserChatStatus[],
		receiver: User,
		user: User
	): UserChatStatus {
		this.logger.log(`Запуск validateChatIsActive, userId: ${user.id}`);
		this.validateSenderChatStatus(userChatStatuses, user);
		return this.validateReceiverChatStatus(userChatStatuses, receiver);
	}

	private validateReceiverChatStatus(
		userChatStatuses: UserChatStatus[],
		receiver: User
	): UserChatStatus {
		this.logger.log(`Запуск validateChatIsActive, receiverId: ${receiver.id}`);
		const userChatStatus: UserChatStatus = this.findUserChatStatus(
			userChatStatuses,
			receiver.id
		);
		this.verifyUserChatStatusExists(userChatStatus);
		this.ensureChatIsAccessible(userChatStatus);
		return userChatStatus;
	}

	private ensureChatIsAccessible(userChatStatus: UserChatStatus): void {
		this.logger.log(
			`Запуск ensureChatIsAccessible, receiverId: ${userChatStatus.userId}`
		);
		const isChatInactive: boolean =
			userChatStatus.chatStatus !== ChatStatus.active &&
			userChatStatus.chatStatus !== ChatStatus.hidden;
		if (isChatInactive) {
			throw new HttpException('Чат не активен', HttpStatus.FORBIDDEN);
		}
	}

	private validateSenderChatStatus(
		userChatStatuses: UserChatStatus[],
		user: User
	): void {
		this.logger.log(`Запуск validateSenderChatStatus, userId: ${user.id}`);
		const userChatStatus: UserChatStatus = this.findUserChatStatus(
			userChatStatuses,
			user.id
		);
		this.verifyUserChatStatusExists(userChatStatus);
		return this.ensureChatIsActive(userChatStatus);
	}

	private verifyUserChatStatusExists(userChatStatus: UserChatStatus): void {
		this.logger.log(`Запуск verifyUserChatStatusExists`);
		if (!userChatStatus) {
			throw new HttpException(
				'Статус чата пользователя не найден',
				HttpStatus.NOT_FOUND
			);
		}
	}

	private ensureChatIsActive(userChatStatus: UserChatStatus): void {
		this.logger.log(
			`Запуск ensureChatIsActive, userId: ${userChatStatus.userId}`
		);
		if (userChatStatus.chatStatus !== ChatStatus.active) {
			throw new HttpException('Чат не активен', HttpStatus.FORBIDDEN);
		}
	}

	private async validateBeforeSave(
		user: User,
		chat: Chat,
		content: string
	): Promise<void> {
		this.logger.log(`Запуск validateBeforeSave, userId: ${user.id}`);
		const validDto: ValidateBeforeDbSaveDto = {
			content,
			senderId: user.id,
			chatName: chat.chatName
		};
		return await this.validateService.validateDto(
			ValidateBeforeDbSaveDto,
			validDto
		);
	}

	private async notifyUserIfUnmuted(
		receiverChatStatus: UserChatStatus,
		receiver: User
	): Promise<void> {
		this.logger.log(`Запуск notifyUserIfUnmuted, receiverId: ${receiver.id}`);
		if (receiverChatStatus.notificationStatus === NotificationStatus.unmuted) {
			return await this.mailerService.sendNotificationEmail(receiver);
		}
	}

	private encrypt(data: string): string {
		this.logger.log(`Запуск encrypt`);
		return this.securityService.encrypt(
			data,
			this.configLoaderService.messageConfig.messagePublicKey
		);
	}

	private decrypt(data: string): string {
		this.logger.log(`Запуск decrypt`);
		return this.securityService.decrypt(
			data,
			this.configLoaderService.messageConfig.messagePrivateKey
		);
	}

	private async examineAndRetrieveChatById(
		chatId: string,
		user: User
	): Promise<ChatWithReceiver> {
		this.logger.log(`Запуск examineAndRetrieveChatById, userId: ${user.id}`);
		const chat: ChatWithStatusOrNull =
			await this.chatRepository.retrieveChatById(chatId, user.id);
		this.ensureChatExists(chat);
		const chatWithReceiver: ChatWithReceiver = this.removeSenderFromChat(
			chat,
			user.id
		);
		this.ensureUserChatStatusExists(chatWithReceiver.chatStatuses);
		this.ensureSingleUserChatStatus(chatWithReceiver.chatStatuses);
		return chatWithReceiver;
	}

	private removeSenderFromChat(
		chat: ChatWithUsersAndTheirStatuses,
		userId: string
	): ChatWithReceiver {
		this.logger.log(`Запуск removeSenderFromChat, userId: ${userId}`);
		const receiver: User =
			chat.initiator.id === userId ? chat.participant : chat.initiator;
		const {
			userChatStatuses,
			initiator,
			participant,
			...remainingChatProperties
		} = chat;
		return {
			receiver,
			chat: remainingChatProperties,
			chatStatuses: userChatStatuses
		};
	}

	private ensureChatExists(
		chat: ChatWithStatusOrNull | NullableChatWithUserStatus
	): void {
		this.logger.log(`Запуск ensureChatExists.`);
		if (!chat) {
			throw new HttpException('Чат не найден', HttpStatus.NOT_FOUND);
		}
	}

	private ensureUserChatStatusExists(userChatStatuses: UserChatStatus[]): void {
		this.logger.log(`Запуск ensureUserChatStatusExists.`);
		if (!userChatStatuses || userChatStatuses.length === EMPTY_ARRAY_LENGTH) {
			throw new HttpException(
				'Статус чата пользователя не найден',
				HttpStatus.NOT_FOUND
			);
		}
	}

	private ensureSingleUserChatStatus(userChatStatuses: UserChatStatus[]): void {
		this.logger.log(`Запуск ensureSingleUserChatStatus.`);
		if (userChatStatuses.length > MAX_CHAT_STATUS_COUNT) {
			throw new HttpException(
				'Внутренняя ошибка',
				HttpStatus.INTERNAL_SERVER_ERROR
			);
		}
	}

	public async findAll(
		user: User,
		chatId: string,
		query: IMessagePaginationParams
	): Promise<Message[]> {
		try {
			this.logger.log(`Запуск findAll, userId: ${user.id}`);
			this.validateId(chatId);
			await this.validateQueryParam(query);
			const chatWithUserStatus: ChatWithUserStatus = await this.getChatByUser(
				chatId,
				user
			);
			this.validateChatStatus(chatWithUserStatus.userChatStatuses);
			const { userChatStatuses, ...chatWithoutStatuses } = chatWithUserStatus;
			const skip: number = await this.getMessage(chatId, query);
			const messages: Message[] =
				await this.messageRepository.findManyMessageByChatId(
					chatWithoutStatuses,
					query,
					skip
				);
			return await Promise.all(this.decryptMessages(messages));
		} catch (error) {
			this.logger.error(
				`Ошибка в findAll, userId: ${user.id}, error:${error.message}`
			);
			this.errorHandlerService.handleError(error);
		}
	}

	private async validateQueryParam(
		query: IMessagePaginationParams
	): Promise<void> {
		this.logger.log(`Запуск validateQueryParam.`);
		const validDtoQuery: FinldAllMessageDto = { ...query };
		return await this.validateService.validateDto(
			FinldAllMessageDto,
			validDtoQuery
		);
	}

	private async getMessage(
		chatId: string,
		args: IMessagePaginationParams
	): Promise<number> {
		this.logger.log(`Запуск getMessage, chatId: ${chatId}.`);
		const totalUsers: number =
			await this.messageRepository.getTotalMessageCount(chatId);
		this.validatePageSize(totalUsers, args);
		return this.validatePageNumber(totalUsers, args);
	}

	private validatePageNumber(
		totalMessage: number,
		queryParams: IMessagePaginationParams
	): number {
		this.logger.log(`Запуск validatePageNumber.`);
		const skip: number = this.calculateSkip(queryParams);
		if (totalMessage < skip + MIN_ITEMS_PER_PAGE) {
			throw new HttpException(
				'Запрашиваемая страница не существует. Пожалуйста, укажите другую страницу.',
				HttpStatus.NOT_FOUND
			);
		}
		return skip;
	}

	private calculateSkip(queryParams: IMessagePaginationParams): number {
		this.logger.log(`Запуск calculateSkip.`);
		return (queryParams.page - BASE_PAGE) * queryParams.pageSize;
	}

	private validatePageSize(
		totalMessage: number,
		queryParams: IMessagePaginationParams
	): void {
		this.logger.log(`Запуск validatePageSize.`);
		if (queryParams.pageSize > totalMessage) {
			throw new HttpException(
				'Размер страницы не может быть больше общего количества пользователей.',
				HttpStatus.BAD_REQUEST
			);
		}
	}

	private decryptMessages(messages: Message[]): Promise<Message>[] {
		this.logger.log(`Завершнеие decryptMessages`);
		return messages.map(async message => {
			const decryptedContent: string = this.decrypt(message.message);
			message.message = decryptedContent;
			return message;
		});
	}

	public async findOne(
		chatId: string,
		messageId: string,
		user: User
	): Promise<Message> {
		try {
			this.logger.log(`Запуск findOne, userId: ${user.id}`);
			await this.validateChatAndMessageIds(chatId, messageId);
			// this.verifyUserStatusAndEmail(user);
			const chatWithUserStatus: ChatWithUserStatus = await this.getChatByUser(
				chatId,
				user
			);
			this.validateChatStatus(chatWithUserStatus.userChatStatuses);
			const { userChatStatuses, ...chatWithoutStatuses } = chatWithUserStatus;
			const message: Message = await this.verifyMessageInChat(
				chatWithoutStatuses,
				user,
				messageId
			);
			return await this.decryptTextMessage(message);
		} catch (error) {
			this.logger.error(
				`Ошибка в findOne, userId: ${user.id}, error:${error.message}`
			);
			this.errorHandlerService.handleError(error);
		}
	}

	private async verifyMessageInChat(
		chat: Chat,
		user: User,
		messageId: string
	): Promise<Message> {
		this.logger.log(`Запуск verifyMessageInChat, userId: ${user.id}`);
		const message: NullbleMessage =
			await this.messageRepository.findMessageInChatByUser(
				user,
				chat,
				messageId
			);
		this.ensureMessageExists(message);
		return message;
	}

	private ensureMessageExists(message: NullbleMessage): void {
		this.logger.log(`Запуск ensureMessageExists, userId: ${message.senderId}`);
		if (!message) {
			throw new HttpException('Сообщение не найдено', HttpStatus.NOT_FOUND);
		}
	}

	public async update(
		chatId: string,
		messageId: string,
		updateData: IUpdateMessage,
		user: User
	): Promise<Message> {
		try {
			this.logger.log(`Запуск update, userId: ${user.id}`);
			await this.validateChatAndMessageIds(chatId, messageId);
			// this.verifyUserStatusAndEmail(user);
			const chatWithUserStatus: ChatWithUserStatus = await this.getChatByUser(
				chatId,
				user
			);
			this.validateChatStatus(chatWithUserStatus.userChatStatuses);
			const { userChatStatuses, ...chatWithoutStatuses } = chatWithUserStatus;
			const message: Message = await this.verifyMessageInChat(
				chatWithoutStatuses,
				user,
				messageId
			);
			this.processMessage(message, updateData);
			const encryptData: IUpdateMessage = this.encryptUpdateMessage(updateData);
			this.updateMessageStatus(message, updateData);
			await this.validateDtoByUpdateMessage(encryptData);
			return await this.prisma.$transaction(async prisma => {
				const updateMessage: Message =
					await this.messageRepository.updateMessage(
						message,
						encryptData,
						updateData.isRead,
						prisma
					);
				console.log(updateMessage);
				this.chatMessageGateway.updateMessage(message, chatWithoutStatuses);
				updateMessage.message = updateData.content;
				return updateMessage;
			});
		} catch (error) {
			this.logger.error(
				`Ошибка в update, userId: ${user.id}, error:${error.message}`
			);
			this.errorHandlerService.handleError(error);
		}
	}

	private encryptUpdateMessage(updateData: IUpdateMessage): IUpdateMessage {
		this.logger.log(`Запуск encryptUpdateMessage.`);
		const text: string = this.encrypt(updateData.content);
		return { content: text };
	}

	private updateMessageStatus(
		message: Message,
		updateData: IUpdateMessage
	): void {
		this.logger.log(`Запуск updateMessageStatus, userId: ${message.id}.`);
		if (message.isRead === updateData.isRead) {
			updateData.isRead = undefined;
		}
	}

	private async validateDtoByUpdateMessage(
		dto: ValidateBeforeUpdateMessageDto
	): Promise<void> {
		this.logger.log(`Запуск validateDtoByUpdateMessage.`);
		return await this.validateService.validateDto(
			ValidateBeforeUpdateMessageDto,
			dto
		);
	}

	private processMessage(message: Message, dto: IUpdateMessage): void {
		this.logger.log(`Запуск processMessage, userId: ${message.senderId}.`);
		this.checkTimeCreateMessage(message);
		return this.decryptAndCompareWithNewMessage(dto, message);
	}

	private decryptAndCompareWithNewMessage(
		dto: IUpdateMessage,
		message: Message
	): void {
		this.logger.log(
			`Запуск decryptAndCompareWithNewMessage, userId: ${message.senderId}.`
		);
		const text: string = this.decrypt(message.message);
		this.verifyMessageChange(dto, text);
	}

	private verifyMessageChange(dto: IUpdateMessage, text: string): void {
		this.logger.log(`Запуск verifyMessageChange.`);
		if (dto.content === text) {
			throw new HttpException(
				'Сообщение не изменилось',
				HttpStatus.BAD_REQUEST
			);
		}
	}

	private async validateChatAndMessageIds(
		chatId: string,
		messageId: string
	): Promise<void> {
		this.logger.log(
			`Запуск verifyMessageChange, chatId: ${chatId}, messageId: ${messageId}.`
		);
		await Promise.all([this.validateId(chatId), this.validateId(messageId)]);
	}

	private checkTimeCreateMessage(message: Message): void {
		this.logger.log(
			`Запуск checkTimeCreateMessage, userId: ${message.senderId}`
		);
		const messageTime: number = this.calculateMessageTime(message);
		this.verifyMessageUpdateTime(messageTime);
	}

	private calculateMessageTime(message: Message): number {
		this.logger.log(`Запуск calculateMessageTime, userId: ${message.senderId}`);
		return (
			message.createdAt.getTime() +
			this.configLoaderService.messageConfig.messageUpdateTime
		);
	}

	private verifyMessageUpdateTime(messageTime: number): void {
		this.logger.log(`Запуск verifyMessageUpdateTime.`);
		const data: number = this.commonService.getCurrentTimeMillis()
		if (data > messageTime) {
			throw new HttpException(
				'Сообщение невозможно обновить',
				HttpStatus.CONFLICT
			);
		}
	}

	public async remove(
		user: User,
		chatId: string,
		messageId: string
	): Promise<Message> {
		try {
			this.logger.log(`Запуск remove, userId: ${user.id}`);
			await this.validateChatAndMessageIds(chatId, messageId);
			// this.verifyUserStatusAndEmail(user);
			const chatWithUserStatus: ChatWithUserStatus = await this.getChatByUser(
				chatId,
				user
			);
			this.validateChatStatus(chatWithUserStatus.userChatStatuses);
			const { userChatStatuses, ...chatWithoutStatuses } = chatWithUserStatus;
			const message: Message = await this.verifyMessageInChat(
				chatWithoutStatuses,
				user,
				messageId
			);
			return await this.prisma.$transaction(async prisma => {
				const deleteMessage: Message =
					await this.messageRepository.deleteMessage(message, prisma);
				this.chatMessageGateway.deleteMessage(
					deleteMessage,
					chatWithoutStatuses
				);
				return await this.decryptTextMessage(deleteMessage);
			});
		} catch (error) {
			this.logger.error(
				`Ошибка в remove, userId: ${user.id}, error:${error.message}`
			);
			this.errorHandlerService.handleError(error);
		}
	}

	private validateChatStatus(chatStatus: UserChatStatus[] | []): void {
		this.logger.log(`Запуск validateChatStatus.`);
		this.ensureSingleChatStatus(chatStatus);
		this.ensureActiveChatStatus(chatStatus);
	}

	private ensureActiveChatStatus(chatStatus: UserChatStatus[] | []): void {
		this.logger.log(`Запуск ensureActiveChatStatus.`);
		if (chatStatus[FIRST_ELEMENT].chatStatus !== ChatStatus.active) {
			throw new HttpException('Статус чата не активен', HttpStatus.CONFLICT);
		}
	}

	private ensureSingleChatStatus(chatStatus: UserChatStatus[] | []): void {
		this.logger.log(`Запуск ensureSingleChatStatus.`);
		if (!chatStatus || chatStatus.length !== SINGLE_STATUS_COUNT) {
			throw new HttpException(
				'Недопустимое количество статусов чата',
				HttpStatus.BAD_REQUEST
			);
		}
	}

	private async getChatByUser(
		chatId: string,
		user: User
	): Promise<ChatWithUserStatus> {
		this.logger.log(`Запуск getChatByUser, userId: ${user.id}.`);
		const chat: NullableChatWithUserStatus =
			await this.chatRepository.findChatByUser(chatId, user);
		this.ensureChatExists(chat);
		return chat;
	}

	private async decryptTextMessage(message: Message): Promise<Message> {
		this.logger.log(`Запуск decryptTextMessage, messageId: ${message.id}.`);
		message.message = this.decrypt(message.message);
		return message;
	}
}
