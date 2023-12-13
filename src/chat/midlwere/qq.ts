import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { TokenTypeEnum } from 'src/jwt/models/enums/token-type.enum';
import { JwtService } from 'src/jwt/jwt.service';
import { IAccessToken } from 'src/jwt/models/interfaces/access-token.interface';

@Injectable()
export class WebsocketAuthGuard implements CanActivate {
	constructor(private readonly jwtService: JwtService) {}

	async canActivate(contextt: ExecutionContext): Promise<boolean> {
		console.log('qweqwe');
		const client: Socket = contextt.switchToWs().getClient<Socket>();
		const token: string = client.handshake.auth.token;
		try {
			const decodedToken: IAccessToken = await this.jwtService.verifyToken(
				token,
				TokenTypeEnum.ACCESS
			);
			client.data.user = decodedToken;
			return true;
		} catch (error) {
			client.disconnect();
			throw new WsException('Unauthorized');
		}
	}
}
