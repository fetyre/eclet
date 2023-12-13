import {
	Controller,
	Get,
	Post,
	Body,
	Patch,
	Param,
	HttpStatus,
	Res,
	HttpCode
} from '@nestjs/common';
import { ResetPasswordLoginService } from './reset-password-login.service';
import { CreateResetPasswordLoginDto } from './dto/create-reset-password-login.dto';
import { UpdateResetPasswordLoginDto } from './dto/update-reset-password-login.dto';
import {
	ApiBadRequestResponse,
	ApiBody,
	ApiCreatedResponse,
	ApiInternalServerErrorResponse,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiOperation,
	ApiTooManyRequestsResponse
} from '@nestjs/swagger';
import { Response } from 'express';

@Controller('password-resets')
export class ResetPasswordLoginController {
	constructor(
		private readonly resetPasswordLoginService: ResetPasswordLoginService
	) {}

	@Post()
	@HttpCode(201)
	@ApiOperation({ summary: 'Отправить электронное письмо для сброса пароля' })
	@ApiBody({
		type: CreateResetPasswordLoginDto,
		description: 'DTO с электронной почтой пользователя'
	})
	@ApiCreatedResponse({
		status: 201,
		description: 'Электронное письмо для сброса пароля отправлено',
		schema: {
			type: 'string',
			description: 'сообщение об успешной отправки сообщения'
		}
	})
	@ApiTooManyRequestsResponse({
		description: 'Превышено количетво попыток сброса пароля'
	})
	@ApiNotFoundResponse({ description: 'Пользователь не найден' })
	@ApiBadRequestResponse({ description: 'Неверные учетные данные' })
	@ApiInternalServerErrorResponse({ description: 'Внутреняя ошибка сервера' })
	async create(@Body() dto: CreateResetPasswordLoginDto, @Res() res: Response) {
		await this.resetPasswordLoginService.create(dto);
		res.status(HttpStatus.CREATED).json('Проверьте ваш почту');
	}

	@Get(':token')
	@ApiOperation({ summary: 'Проверка токена сброса пароля' })
	@HttpCode(200)
	@ApiOkResponse({
		status: 200,
		description: 'проверка токена прошла успешна'
	})
	@ApiInternalServerErrorResponse({ description: 'Внутреняя ошибка сервера' })
	@ApiNotFoundResponse({ description: 'токена не существует' })
	async findOne(@Param('token') token: string, @Res() res: Response) {
		await this.resetPasswordLoginService.verifyResetToken(token);
		res.status(HttpStatus.OK);
	}

	@Patch(':token')
	@HttpCode(200)
	@ApiOkResponse({
		status: 200,
		description: 'Пароль успешно изменен'
	})
	@ApiInternalServerErrorResponse({ description: 'Внутреняя ошибка сервера' })
	@ApiNotFoundResponse({
		description: 'токена не существует или пользователь не найден '
	})
	@ApiBadRequestResponse({ description: 'пароли в бд не совпадают' })
	async update(
		@Param('token') token: string,
		@Body() updateResetPasswordLoginDto: UpdateResetPasswordLoginDto,
		@Res() res: Response
	) {
		await this.resetPasswordLoginService.update(
			token,
			updateResetPasswordLoginDto
		);
		res.status(HttpStatus.OK).json('Пароль успешно изменен');
	}
}
