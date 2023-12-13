import { Injectable, Logger } from '@nestjs/common';
import { User } from '@prisma/client';
import { ErrorHandlerService } from 'src/errro-catch/error-catch.service';
import { JwtService } from 'src/jwt/jwt.service';
import { TokenTypeEnum } from 'src/jwt/models/enums/token-type.enum';

/**
 * @class TokenAuthService
 * @classdesc генерация auth токенов
 * @throws {InternalServerErrorException} Если возникла внутренняя ошибка сервера
 * @since 2023-10-26
 */
@Injectable()
export class TokenAuthService {
	private readonly logger: Logger = new Logger(TokenAuthService.name);
	constructor(
		private readonly jwtService: JwtService,
		private readonly errorHandlerService: ErrorHandlerService
	) {}

	/**
	 * Генерация нового токена доступа
	 * @param {User} user - объект пользователя
	 * @returns {Promise<string>} обновленный токен доступа
	 * @throws {InternalServerErrorException} - Если возникла внутренняя ошибка сервера
	 * @see {@link JwtService.generateToken} - метод генерации токена доступа
	 * @see {@link ErrorHandlerService.handleError} - метод обработки ошибок
	 * @since 2023-10-27
	 */
	public async generateAccessToken(user: User): Promise<string> {
		try {
			this.logger.log(`Запуск generateAccessToken, userId:${user.id}`);
			return await this.jwtService.generateToken(user, TokenTypeEnum.ACCESS);
		} catch (error) {
			this.logger.error(`Ошибка в generateAccessToken, userId:${user.id}`);
			this.errorHandlerService.handleError(error);
		}
	}

	/**
	 * Генерация токенов доступа и обновления
	 * @param {User} user - объект пользователя
	 * @param {string} tokenId - необязательный id токена uuid
	 * @returns {Promise<string[]>}  массив токенов доступа и обновления
	 * @throws {InternalServerErrorException} - Если возникла внутренняя ошибка сервера
	 * @see {@link JwtService.generateToken} - метод генерации токена доступа
	 * @since 2023-10-28
	 */
	public async generateAuthTokens(
		user: User,
		tokenId?: string
	): Promise<string[]> {
		this.logger.log(`Запуск generateAuthTokens, userID: ${user.id}`);
		const [accessToken, refreshToken] = await Promise.all([
			this.jwtService.generateToken(user, TokenTypeEnum.ACCESS, tokenId),
			this.jwtService.generateToken(user, TokenTypeEnum.REFRESH, tokenId)
		]);
		this.logger.log(`Завернешние generateAuthTokens, userID: ${user.id}`);
		return [accessToken, refreshToken];
	}
}
