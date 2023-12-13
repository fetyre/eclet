import { NestMiddleware } from '@nestjs/common';
import { IncomingHttpHeaders } from 'http';
import { Socket } from 'socket.io';

export class AuthSocketMiddleware implements NestMiddleware {
	use(socket: Socket & { token?: string }, next: () => void) {
		const headers: IncomingHttpHeaders = socket.handshake.headers;
		const authorizationHeader: string = headers.authorization;
		if (authorizationHeader && authorizationHeader.startsWith('Bearer ')) {
			const token: string = authorizationHeader.split(' ')[1];
			console.log(token);
			socket.token = token;
		}
		next();
	}
}
