import {
	HttpException,
	HttpStatus,
	Injectable,
	Logger,
	NestMiddleware
} from '@nestjs/common';
import { NextFunction } from 'express';
import { Socket } from 'socket.io';
import { JwtService } from 'src/jwt/jwt.service';
import { TokenTypeEnum } from 'src/jwt/models/enums/token-type.enum';
import { IAccessToken } from 'src/jwt/models/interfaces/access-token.interface';
import { PrismaService } from 'src/settings/prisma.database/prisma.service';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class WebsocketAuthMiddleware implements NestMiddleware {
	constructor(
		private readonly jwtService: JwtService,
		private readonly logger: Logger,
		private readonly prisma: PrismaService
	) {}
	async use(socket: Socket, next: NextFunction) {
		// this.logger.log({
		// 	level: 'info',
		// 	message: `запуск WebsocketAuthMiddleware`,
		// 	context: 'WebsocketAuthMiddleware'
		// });
		const token = socket.handshake.auth.token;
		try {
			const decoded: IAccessToken = await this.jwtService.verifyToken(
				token,
				TokenTypeEnum.ACCESS
			);
			socket['user'] = decoded;
			next();
		} catch (error) {
			throw new WsException('Unauthorized');
		}
	}
}
