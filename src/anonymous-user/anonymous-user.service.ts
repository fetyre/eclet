import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from 'src/settings/prisma.database/prisma.service';
import { JwtService } from 'src/jwt/jwt.service';

@Injectable()
export class AnonymousUserService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly jwtService: JwtService
	) {}
	public async create(sessionID: string): Promise<User> {
		try {
			const anonymousUser: User = await this.createAnonUser(sessionID);
			return anonymousUser;
		} catch (error) {
			throw new HttpException(
				'Ошибка создания анонимного пользователя',
				HttpStatus.INTERNAL_SERVER_ERROR
			);
		}
	}

	private async createAnonUser(sessionID: string): Promise<User> {
		return await this.prisma.user.create({
			data: { role: 'anonim', sesionId: sessionID }
		});
	}
}
