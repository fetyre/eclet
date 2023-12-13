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
import { ResetUserPasswordService } from './reset-user-password.service';
import { UpdateResetUserPasswordDto } from './dto/update-reset-user-password.dto';
import { GetUser } from 'src/decor/current-http-user.decorator';
import { Response } from 'express';
import { PasswordReset, User } from '@prisma/client';

@Controller('users/:userId/password-resets')
export class ResetUserPasswordController {
	constructor(
		private readonly resetUserPasswordService: ResetUserPasswordService
	) {}

	@Post()
	@HttpCode(201)
	async create(
		@GetUser() user: User,
		@Param('userId') userId: string,
		@Res() res: Response
	) {
		const passwordModel: PasswordReset =
			await this.resetUserPasswordService.create(user, userId);
		res.status(HttpStatus.CREATED).json(passwordModel);
	}

	@Patch(':id')
	@HttpCode(200)
	async update(
		@GetUser() user: User,
		@Param('userId') userId: string,
		@Param('id') id: string,
		@Body() dto: UpdateResetUserPasswordDto,
		@Res() res: Response
	) {
		await this.resetUserPasswordService.update(id, dto, userId, user);
		res.status(HttpStatus.OK);
	}
}
