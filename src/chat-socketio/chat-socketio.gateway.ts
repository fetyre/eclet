import {
	WebSocketGateway,
	ConnectedSocket,
	WebSocketServer,
	OnGatewayConnection,
	OnGatewayDisconnect,
	OnGatewayInit,
	SubscribeMessage
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from 'src/jwt/jwt.service';
import { IChatIdentifierDto } from './dto/chat-id-socket.dto';
import { Chat, Message, User, UserChatStatus } from '@prisma/client';
import { ChatSocketService } from './chat-socketio.service';
import { OptionalString } from 'src/types';

@WebSocketGateway({ namespace: 'chats' })
export class ChatSocketGateway
	implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
	constructor(
		private readonly jwtService: JwtService,
		private readonly chatSocketService: ChatSocketService
	) {}

	@WebSocketServer()
	server: Server;

	afterInit() {}

	async handleConnection(@ConnectedSocket() client: Socket) {
		const token: OptionalString = client.handshake.headers.authorization;
		return await this.chatSocketService.handleNewConnection(token, client.id);
	}

	async handleDisconnect(client: Socket) {
		return await this.chatSocketService.handleDisconnect(client.id);
	}

	public createMessage(message: Message, chat: Chat): void {
		this.server.to(chat.chatName).emit('newChatMessage', message);
	}

	public createChat(chat: Chat): void {
		this.server.to(chat.id).emit('chatCreated', chat);
	}

	public chatDeleted(chatId: string): void {
		this.server.to(chatId).emit('chatDeleted', chatId);
	}

	public deleteMessage(message: Message, chat: Chat): void {
		this.server.to(chat.chatName).emit('deleteChatMessage', message);
	}

	public updateMessage(message: Message, chat: Chat): void {
		this.server.to(chat.chatName).emit('updateChatMessage', message);
	}

	public messageRead(message: Message) {
		this.server.to(message.chatId).emit('messageRead', message);
	}

	async updateUserChatStatus(
		user: User,
		chatStatus: UserChatStatus
	): Promise<void> {
		this.server.to(user.id).emit('updateUserChatStatus', chatStatus);
	}

	@SubscribeMessage('startTyping')
	async handleStartTyping(
		client: Socket,
		data: IChatIdentifierDto
	): Promise<void> {
		const userAndChat = await this.chatSocketService.handleStartTyping(
			client.id,
			data
		);
		const { user, chat } = userAndChat;
		client.to(chat.chatName).emit('userTyping', user, chat);
	}

	@SubscribeMessage('stopTyping')
	async handleStopTyping(
		client: Socket,
		data: IChatIdentifierDto
	): Promise<void> {
		const userAndChat = await this.chatSocketService.handleStopTyping(
			client.id,
			data
		);
		const { user, chat } = userAndChat;
		client.to(chat.chatName).emit('stopTyping', user, chat);
	}
}
