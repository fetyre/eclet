import {
	Body,
	Controller,
	HttpStatus,
	Post,
	Delete,
	Res,
	UseGuards,
	Put,
	Req
} from '@nestjs/common';
import {
	ApiBadRequestResponse,
	ApiBody,
	ApiForbiddenResponse,
	ApiInternalServerErrorResponse,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiOperation,
	ApiTags,
	ApiTooManyRequestsResponse,
	ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { SignInDto } from './models/dto/sign-in.dto';
import { JwtRefreshAuthGuard } from '../guards/jwt-refresh-auth.guard';
import { User } from '@prisma/client';
import { LoginAuthService } from './login/login-auth.service';
import { LogoutAuthService } from './logout/logout-auth.service';
import { GetUser } from 'src/decor/current-http-user.decorator';
import { TokenAuthService } from './token/token-auth.service';
import { ILogoutReqDetalic } from './models/interface';
import { GetUserDetails } from './decor';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
	constructor(
		private readonly loginAuthService: LoginAuthService,
		private readonly logoutAuthService: LogoutAuthService,
		private readonly tokenAuthService: TokenAuthService
	) {}

	/**
	 * Вход пользователя в аккаунт
	 * @param {SignInDto} signInDto - DTO для входа в аккаунт
	 * @returns {Promise<void>} Возвращает промис без значения при успешном выполнении
	 * @throws {BadRequestException} Если email адрес уже занят или предоставлены некорректные данные для создания пользователя
	 * @throws {NotFoundException} Если пользователь с указанным email не найден
	 * @throws {ForbiddenException} Если пользователь еще не подтвердил свой аккаунт
	 * @throws {TooManyRequestsException} Если превышено количество попыток входа
	 * @throws {UnauthorizedException} Если учетные данные пользователя не найдены
	 * @throws {InternalServerErrorException} Если возникла внутренняя ошибка сервера
	 * @see {@link LoginAuthService.signIn}
	 * @since 2023-10-26
	 */
	@Post()
	@ApiOperation({ summary: 'Вход пользователя' })
	@ApiOkResponse({
		description: 'Пользователь успешно вошел в систему',
		schema: {
			type: 'array',
			items: {
				type: 'string',
				description: 'Токен'
			}
		}
	})
	@ApiBody({
		type: SignInDto,
		description: 'DTO входа пользователя'
	})
	@ApiBadRequestResponse({ description: 'Неверные учетные данные' })
	@ApiNotFoundResponse({
		description:
			'Ошибка входа: Неправильный email или пароль. Пожалуйста, проверьте правильность написания и попробуйте еще раз.'
	})
	@ApiTooManyRequestsResponse({
		description:
			'Превышено количество попыток входа. Пожалуйста, попробуйте снова позже.'
	})
	@ApiForbiddenResponse({
		description:
			'Пожалуйста, подтвердите свой адрес электронной почты, новое письмо было отправлено. Повторите вход'
	})
	@ApiUnauthorizedResponse({
		description: 'Учетные данные для этого пользователя не найдены'
	})
	@ApiInternalServerErrorResponse({
		description: 'Внутренняя ошибка сервера'
	})
	async signIn(
		@Body() signInDto: SignInDto,
		@Res() res: Response,
		@Req() req: Request
	): Promise<void> {
		const {
			ip,
			headers: { 'user-agent': userAgent }
		} = req;
		const response: void | string[] = await this.loginAuthService.signIn(
			signInDto,
			{ ip, userAgent }
		);
		res.status(HttpStatus.OK).json(response);
	}

	/**
	 * Генерация нового токена доступа
	 * @param {User} user - объект пользователя
	 * @returns {Promise<void>} ничего
	 * @throws {UnauthorizedException} Если ошибка валидации токена
	 * @throws {InternalServerErrorException} Если возникла внутренняя ошибка сервера
	 * @see {@link TokenAuthService.generateAccessToken}
	 * @since 2023-10-27
	 */
	@Put()
	@UseGuards(JwtRefreshAuthGuard)
	@ApiOperation({ summary: 'Генерация обновленного токена доступа' })
	@ApiOkResponse({
		status: 200,
		description: 'Успешная генерация обновленного токена доступа',
		schema: {
			type: 'object',
			properties: {
				accessToken: {
					type: 'string',
					description: 'Обновленный токен доступа'
				}
			}
		}
	})
	@ApiUnauthorizedResponse({ description: 'Ошибка валидации токена' })
	@ApiInternalServerErrorResponse({ description: 'внутреняя ошибка сервера' })
	async refreshToken(
		@GetUser() user: User,
		@Res() res: Response
	): Promise<void> {
		const newToken: string =
			await this.tokenAuthService.generateAccessToken(user);
		res.status(HttpStatus.OK).json({ accessToken: newToken });
	}

	/**
	 * Выход пользователя из аккаунта
	 * @param {ILogoutReqDetalic} detalic - объект с данными после проверки токена
	 * @returns {Promise<void>} ничего
	 * @throws {UnauthorizedException} Если ошибка валидации токена
	 * @throws {InternalServerErrorException} Если возникла внутренняя ошибка сервера
	 * @see {@link LogoutAuthService.logout}
	 * @since 2023-10-27
	 */
	@Delete()
	@UseGuards(JwtRefreshAuthGuard)
	@ApiOperation({ summary: 'Выход из системы' })
	@ApiOkResponse({
		status: 200,
		description: 'Успешный выход из системы',
		schema: {
			type: 'string',
			description: 'сообщение об успешном выходе'
		}
	})
	@ApiUnauthorizedResponse({ description: 'Ошибка валидации токена' })
	@ApiInternalServerErrorResponse({ description: 'Внутреняя ошибка сервера' })
	async logout(
		@GetUserDetails() detalic: ILogoutReqDetalic,
		@Res() res: Response
	): Promise<void> {
		await this.logoutAuthService.logout(detalic);
		res.status(HttpStatus.NO_CONTENT).json('Выход выполнен успешно');
	}
}
