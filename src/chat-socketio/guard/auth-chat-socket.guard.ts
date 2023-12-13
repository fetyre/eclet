// jwt-auth.guard.ts
import {
	Injectable,
	CanActivate,
	ExecutionContext,
	UnauthorizedException
} from '@nestjs/common';
import { TokenTypeEnum } from 'src/jwt/models/enums/token-type.enum';
import { JwtService } from 'src/jwt/jwt.service';
import { IAccessToken } from 'src/jwt/models/interfaces/access-token.interface';

@Injectable()
export class ChatSocketAuthGuard implements CanActivate {
	constructor(private readonly jwtService: JwtService) {}

	async canActivate(contextt: ExecutionContext): Promise<boolean> {
		console.log('qweqweqwe');
		const client = contextt.switchToWs().getClient();
		const token = client.handshake.query.token as string;

		if (!token) {
			throw new UnauthorizedException('Токен отсутствует.');
		}

		try {
			const decodedToken: IAccessToken = await this.jwtService.verifyToken(
				token,
				TokenTypeEnum.ACCESS
			);
			console.log(decodedToken);
			client.user = decodedToken; // Сохраняем информацию о пользователе в объекте клиента
			return true;
		} catch (error) {
			throw new UnauthorizedException('Токен недействителен.');
		}
	}
}
