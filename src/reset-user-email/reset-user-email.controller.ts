import {
	Controller,
	Post,
	Body,
	Patch,
	Param,
	Res,
	HttpStatus,
	HttpCode
} from '@nestjs/common';
import { ResetUserEmailService } from './reset-user-email.service';
import { GetUser } from 'src/decor/current-http-user.decorator';
import { EmailChange, User } from '@prisma/client';
import { Response } from 'express';
import { CreateResetUserEmailDto, UpdateResetUserEmailDto } from './dto';

@Controller('users/:userId/email-resets')
export class ResetUserEmailController {
	constructor(private readonly resetUserEmailService: ResetUserEmailService) {}

	@Post()
	@HttpCode(201)
	async create(
		@GetUser() user: User,
		@Param('userId') userId: string,
		@Res() res: Response,
		@Body() dto?: CreateResetUserEmailDto
	): Promise<void> {
		const resetModel: EmailChange = await this.resetUserEmailService.create(
			user,
			userId,
			dto
		);
		res.status(HttpStatus.CREATED).json(resetModel);
	}

	@Patch(':id')
	async update(
		@GetUser() user: User,
		@Param('id') id: string,
		@Param('userId') userId: string,
		@Body() dto: UpdateResetUserEmailDto,
		@Res() res: Response
	): Promise<void> {
		await this.resetUserEmailService.update(id, dto, user, userId);
		res.status(HttpStatus.OK);
	}
}
