import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Post,
	Query,
	Res,
	UseGuards
} from '@nestjs/common';
import { Response } from 'express';
import { Chat, User } from '@prisma/client';
import { ChatService } from './chat.service';
import { GetUser } from 'src/decor/current-http-user.decorator';
import { JwtAccessAuthGuard } from 'src/guards';
import { ChatFindAllQueryDto, CreateChatDto } from './model/dto';

@Controller('chats')
export class ChatController {
	constructor(private readonly chatService: ChatService) {}

	@Post()
	@UseGuards(JwtAccessAuthGuard)
	async createChat(
		@GetUser() user: User,
		@Res() res: Response,
		@Body() dto: CreateChatDto
	) {
		const rest: Chat = await this.chatService.createChat(user, dto);
		res.status(HttpStatus.CREATED).json(rest);
	}

	@Get()
	@UseGuards(JwtAccessAuthGuard)
	async findAll(
		@GetUser() user: User,
		@Res() res: Response,
		@Query() queryParams: ChatFindAllQueryDto
	) {
		console.log(queryParams);
		const chats: Chat[] = await this.chatService.findAll(user, queryParams);
		res.status(HttpStatus.OK).json(chats);
	}

	@Get(':id')
	@UseGuards(JwtAccessAuthGuard)
	async findOne(
		@GetUser() user: User,
		@Param('id') id: string,
		@Res() res: Response
	) {
		const chat: Chat = await this.chatService.findOne(id, user);
		res.status(HttpStatus.OK).json(chat);
	}

	@Delete(':id')
	@UseGuards(JwtAccessAuthGuard)
	@HttpCode(HttpStatus.NO_CONTENT)
	async remove(
		@GetUser() user: User,
		@Param('id') id: string,
		@Res() res: Response
	) {
		await this.chatService.remove(user, id);
		res.send();
	}
}
