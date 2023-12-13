import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { User, Chat } from '@prisma/client';
import { PrismaService } from 'src/settings/prisma.database/prisma.service';
import {
	ICreateChatDto,
	IChatQueryParams,
	IChatParameters
} from './model/interface';
import { ErrorHandlerService } from 'src/errro-catch/error-catch.service';
import { NullableUser } from 'src/types';
import { ValidateService } from 'src/validate/validate.service';
import { ChatSocketGateway } from 'src/chat-socketio/chat-socketio.gateway';
import { NullableChat } from './types/chat.types';
import { ChatQueryParamsDto } from './model/dto';
import { PageParametersService } from 'src/base-page/page-base.service';
import { I18nService, I18nContext } from 'nestjs-i18n';
import { CommonService } from 'src/common/common.service';
import { ChatRepository } from './chat.repository';
import { UsersRepository } from 'src/user/user.repository';
import { DECIMAL_RADIX } from 'src/constants/global-constants';

@Injectable()
export class ChatService extends PageParametersService {
	readonly logger: Logger = new Logger(ChatService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly errorHandlerService: ErrorHandlerService,
		private readonly validateService: ValidateService,
		private readonly chatGateway: ChatSocketGateway,
		private readonly i18n: I18nService,
		private readonly commonService: CommonService,
		private readonly chatRepository: ChatRepository,
		private readonly usersRepository: UsersRepository
	) {
		super();
	}

	public async createChat(
		user: User,
		createData: ICreateChatDto
	): Promise<Chat> {
		try {
			this.logger.log(`Запуск createChat, userId: ${user.id}`);
			await this.checkUserById(createData.userId);
			await this.verifyChatExistence(user, createData);
			const roomName: string = await this.generateChatRoomName();
			return await this.prisma.$transaction(async prisma => {
				const chat: Chat = await this.chatRepository.saveChat(
					user,
					roomName,
					createData,
					prisma
				);
				this.chatGateway.createChat(chat);
				return chat;
			});
		} catch (error) {
			this.logger.error(
				`Ошибка в createChat, userId: ${user.id}, error: ${error.message}`
			);
			this.errorHandlerService.handleError(error);
		}
	}

	private async verifyChatExistence(
		user: User,
		createData: ICreateChatDto
	): Promise<void> {
		this.logger.log(`Запуск verifyChatExistence, userId: ${user.id}`);
		const existingChat: NullableChat =
			await this.chatRepository.findExistingChat(user, createData);
		this.throwIfChatExists(existingChat);
	}

	private throwIfChatExists(chat: NullableChat): void {
		this.logger.log(`Запуск throwIfChatExists`);
		if (chat) {
			throw new HttpException(
				'Чат между указанными пользователями уже существует',
				HttpStatus.CONFLICT
			);
		}
	}

	private async generateChatRoomName(): Promise<string> {
		this.logger.log(`Запуск generateChatRoomName.`);
		const cuid2Name: string = this.commonService.generateCuid();
		const uuidName: string = this.commonService.generateUuid();
		return `${cuid2Name}${uuidName}`;
	}

	public async findOne(chatId: string, user: User): Promise<Chat> {
		try {
			this.logger.log(`Запуск findOne, userId: ${user.id}.`);
			this.validateId(chatId);
			const chat: Chat = await this.findChatByIdAndCheck(chatId);
			this.validateChatParticipant(user, chat);
			return chat;
		} catch (error) {
			this.logger.error(
				`Ошибка в findOne, userId: ${user.id}, error: ${error.message}`
			);
			this.errorHandlerService.handleError(error);
		}
	}

	private validateChatParticipant(user: User, chat: Chat): void {
		this.logger.log(`Запуск validateChatParticipant, userId: ${user.id}.`);
		if (user.id !== chat.initiatorId && user.id !== chat.participantId) {
			throw new HttpException(
				'У вас нет доступа к этому чату, так как вы не являетесь участником',
				HttpStatus.FORBIDDEN
			);
		}
	}

	private async findChatByIdAndCheck(chatId: string): Promise<Chat> {
		this.logger.log(`Запуск findChatByIdAndCheck, chatId: ${chatId}.`);
		const chat: Chat = await this.chatRepository.findChatById(chatId);
		this.checkChatExistence(chat);
		return chat;
	}

	private checkChatExistence(chat: Chat): void {
		this.logger.log(`Запуск checkChatExistence.`);
		if (!chat) {
			throw new HttpException('Чат не найден', HttpStatus.NOT_FOUND);
		}
	}

	public async remove(user: User, chatId: string): Promise<Chat> {
		try {
			this.logger.log(`Запуск remove, userId: ${user.id}`);
			this.validateId(chatId);
			const chat: Chat = await this.findChatByIdAndCheck(chatId);
			this.checkChatAccessForUser(chat, user);
			return await this.prisma.$transaction(async prisma => {
				const deleteChat: Chat = await this.chatRepository.deleteChatById(
					chat,
					prisma
				);
				await this.chatGateway.chatDeleted(deleteChat.id);
				return deleteChat;
			});
		} catch (error) {
			this.logger.error(
				`Ошибка в remove, userId: ${user.id}, error: ${error.message}`
			);
			this.errorHandlerService.handleError(error);
		}
	}

	private validateId(id: string): void {
		this.logger.log(`Запуск validateId`);
		return this.validateService.checkId(id);
	}

	private checkChatAccessForUser(chat: Chat, user: User): void {
		this.logger.log(`Запуск remove, userId: ${user.id}`);
		if (chat.initiatorId !== user.id && chat.participantId !== user.id) {
			throw new HttpException(
				'У вас нет доступа к этому чату.',
				HttpStatus.FORBIDDEN
			);
		}
	}

	public async findAll(
		user: User,
		queryParams: IChatQueryParams
	): Promise<Chat[]> {
		try {
			this.logger.log(`Запуск findAll, userId: ${user.id}`);
			const query: IChatParameters = this.getChatParameters(queryParams);
			await this.validateQuery(query);
			// console.log('1');
			await this.getAds(query, user);
			const chats: Chat[] = await this.chatRepository.findManyChats(
				query,
				user
			);
			return chats;
		} catch (error) {
			this.logger.error(
				`Ошибка в findAll, userId: ${user.id}, error: ${error.message}`
			);
			this.errorHandlerService.handleError(error);
		}
	}

	private getChatParameters(queryParams: IChatQueryParams): IChatParameters {
		this.logger.log(`Запуск getChatParameters.`);
		const page: number = parseInt(queryParams.page, DECIMAL_RADIX);
		const pageSize: number = parseInt(queryParams.pageSize, DECIMAL_RADIX);
		const unread: boolean = this.parseUnreadStatus(queryParams);
		return {
			page,
			pageSize,
			unread,
			sort: queryParams.sort
			// status: queryParams.status
		};
	}

	private parseUnreadStatus(queryParams: IChatQueryParams): boolean {
		this.logger.log(`Запуск parseUnreadStatus.`);
		if (queryParams.unread) {
			const bool: boolean = JSON.parse(queryParams.unread);
			return bool;
		}
	}

	private async getAds(query: IChatParameters, user: User): Promise<void> {
		this.logger.log(`Запуск getAds, userId: ${user.id}`);
		const totalChats: number = await this.chatRepository.getTotalChatCount(
			user,
			query
		);
		console.log(totalChats);
		this.validatePageNumber(totalChats, query);
		this.validatePageSize(totalChats, query);
	}

	private async validateQuery(queryParams: IChatParameters) {
		this.logger.log(`Запуск validateQuery.`);
		const validateDto: ChatQueryParamsDto = { ...queryParams };
		await this.validateService.validateDto(ChatQueryParamsDto, validateDto);
	}

	private async checkUserById(userId: string): Promise<void> {
		this.logger.log(`Запуск checkUserById, userId: ${userId}.`);
		const user: NullableUser = await this.usersRepository.findUserById(userId);
		this.checkUserExistenceAndThrowException(user);
		return this.checkUserStatus(user);
	}

	private checkUserStatus(user: User): void {
		this.logger.log(`Запуск checkUserStatus, userId: ${user.id}.`);
		if (user.isEmailVerified !== true) {
			const message: string = this.i18n.t(
				'test.error.EMAIL_ALREADY_REGISTERED',
				{
					lang: I18nContext.current().lang
				}
			);
			throw new HttpException(message, HttpStatus.CONFLICT);
		}
	}

	private checkUserExistenceAndThrowException(user: User): void {
		this.logger.log(`Запуск checkUserExistenceAndThrowException.`);
		if (!user) {
			throw new HttpException('Повторите запрос', HttpStatus.BAD_REQUEST);
		}
	}
}
