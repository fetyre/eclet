import { Controller, Get, Body, Patch, Param, Delete } from '@nestjs/common';
import { UserChatStatusService } from './user-chat-status.service';
import { UpdateUserChatStatusDto } from './dto/update-user-chat-status.dto';
import { User } from '@prisma/client';
import { GetUser } from 'src/decor/current-http-user.decorator';

@Controller('chat/:chatId/status')
export class UserChatStatusController {
	constructor(private readonly userChatStatusService: UserChatStatusService) {}

	@Get()
	findAll() {
		return this.userChatStatusService.findAll();
	}

	@Get()
	findOne(@Param('chatId') id: string, @GetUser() user: User) {
		return this.userChatStatusService.findOne(id, user);
	}

	@Patch(':id')
	update(
		@Param('id') id: string,
		@Body() dto: UpdateUserChatStatusDto,
		@Param('chatId') chatId: string,
		@GetUser() user: User
	) {
		return this.userChatStatusService.update(dto, id, user, chatId);
	}

	@Delete(':id')
	remove(@Param('id') id: string) {
		return this.userChatStatusService.remove(+id);
	}
}
