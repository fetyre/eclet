import { Controller, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { AnonymousUserService } from './anonymous-user.service';
import { Response, Request } from 'express';

@Controller('anonymous-user')
export class AnonymousUserController {
	constructor(private readonly anonymousUserService: AnonymousUserService) {}

	@Post()
	async create(@Req() req: Request, @Res() res: Response) {
		const sessionID: string = req.sessionID;
		const anonim = await this.anonymousUserService.create(sessionID);
		res.status(HttpStatus.CREATED).json(anonim);
	}
}
