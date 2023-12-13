import {
	Controller,
	Get,
	Post,
	Put,
	Delete,
	Param,
	Body,
	HttpCode,
	UseGuards,
	HttpStatus,
	Res,
	Query
} from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessagesService } from './messages.service';
import { JwtAccessAuthGuard } from 'src/guards';
import { Response } from 'express';
import { Message, User } from '@prisma/client';
import { UpdateMessageDto } from './dto/update-message.dto';
import { IMessagePaginationParams } from './interface';
import { GetUser } from 'src/decor/current-http-user.decorator';
import { Counter, Histogram } from 'prom-client';

const createMessageCounter = new Counter({
	name: 'create_message_counter',
	help: 'Number of times the create message method is called'
});

const createMessageDurationHistogram = new Histogram({
	name: 'create_message_duration',
	help: 'Duration of create message method in ms',
	buckets: [0.1, 5, 15, 50, 100, 200, 300, 400, 500] // buckets for response time from 0.1ms to 500ms
});

@Controller('chats/:chatId/messages')
export class MessagesController {
	constructor(private readonly messagesService: MessagesService) {}

	@Post()
	@UseGuards(JwtAccessAuthGuard)
	@HttpCode(201)
	async create(
		@GetUser() user: User,
		@Param('chatId') chatId: string,
		@Body() createMessageDto: CreateMessageDto,
		@Res() res: Response
	) {
		const end = createMessageDurationHistogram.startTimer();
		createMessageCounter.inc();

		const createdMessage: Message = await this.messagesService.create(
			chatId,
			user,
			createMessageDto
		);
		end();
		res.status(HttpStatus.CREATED).json(createdMessage);
	}

	@Get()
	@UseGuards(JwtAccessAuthGuard)
	async findAll(
		@GetUser() user: User,
		@Res() res: Response,
		@Param('chatId') chatId: string,
		@Query() queryParams: IMessagePaginationParams
	) {
		const messages: Message[] = await this.messagesService.findAll(
			user,
			chatId,
			queryParams
		);
		res.status(HttpStatus.OK).json(messages);
	}

	@Get(':id')
	@UseGuards(JwtAccessAuthGuard)
	async findOne(
		@GetUser() user: User,
		@Res() res: Response,
		@Param('chatId') chatId: string,
		@Param('id') id: string
	) {
		const message: Message = await this.messagesService.findOne(
			chatId,
			id,
			user
		);
		res.status(HttpStatus.OK).json(message);
	}

	@Put(':id')
	@UseGuards(JwtAccessAuthGuard)
	async update(
		@GetUser() user: User,
		@Res() res: Response,
		@Param('chatId') chatId: string,
		@Param('id') id: string,
		@Body() updateMessageDto: UpdateMessageDto
	) {
		const updatedMessage: Message = await this.messagesService.update(
			chatId,
			id,
			updateMessageDto,
			user
		);
		res.status(HttpStatus.OK).json(updatedMessage);
	}

	@Delete(':id')
	@UseGuards(JwtAccessAuthGuard)
	@HttpCode(204)
	async remove(
		@Param('chatId') chatId: string,
		@Param('id') id: string,
		@GetUser() user: User,
		@Res() res: Response
	) {
		await this.messagesService.remove(user, chatId, id);
		res.status(HttpStatus.NO_CONTENT).send();
	}
}
