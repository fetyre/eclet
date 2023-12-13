import { Controller, Post, Body, Res, HttpStatus } from '@nestjs/common';
import { SupportUserService } from './supportUser.service';
import { CreateAdminDto } from './dto/create-supportUser.dto';
import { Response } from 'express';

@Controller('support-user')
export class SupportUserController {
	constructor(private readonly supportUserService: SupportUserService) {}

	@Post('createSupportUser')
	async create(@Body() createAdminDto: CreateAdminDto, @Res() res: Response) {
		const supportUser =
			await this.supportUserService.createSupportUser(createAdminDto);
		res.status(HttpStatus.OK).json(supportUser);
	}
}
