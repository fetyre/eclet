import {
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Res,
	UseGuards
} from '@nestjs/common';
import { ConfirmEmailRegusterService } from './confirm-email-reguster.service';
import {
	ApiOperation,
	ApiOkResponse,
	ApiUnauthorizedResponse,
	ApiInternalServerErrorResponse
} from '@nestjs/swagger';
import { GetUserAndPayload } from 'src/confirm-email-reguster/decor/confirm-email.decorator';
import { JwtConfirmationAuthGuard } from 'src/guards';
import { Response } from 'express';
import { ConfirmEmailReqInterface } from './interface/confirm-email.interface';

@Controller('users/:userId/confirm-email')
export class ConfirmEmailRegusterController {
	constructor(
		private readonly confirmEmailRegusterService: ConfirmEmailRegusterService
	) {}

	/**
	 * Подтверждение почты аккаунта
	 * @param {ConfirmEmailReqInterface} data - объект пользователя с моделью email и payload токена
	 * @returns {Promise<void>} ничего
	 * @throws {UnauthorizedException} Если ошибка валидации токена
	 * @throws {InternalServerErrorException} Если возникла внутренняя ошибка сервера
	 * @see {@link ConfirmEmailRegusterController.confirmEmail} метод подтверждения почты
	 * @since 2023-10-27
	 */
	@Get(':token')
	@UseGuards(JwtConfirmationAuthGuard)
	@HttpCode(200)
	@ApiOperation({ summary: 'Подтверждение почты' })
	@ApiOkResponse({
		status: 200,
		description: 'Успешное подтверждение почты',
		schema: {
			type: 'string',
			description: 'сообщение об успешном подтверждении аккаунта'
		}
	})
	@ApiUnauthorizedResponse({ description: 'Ошибка валидации токена' })
	@ApiInternalServerErrorResponse({ description: 'Внутреняя ошибка сервера' })
	async confirmEmail(
		@Param('userId') userId: string,
		@GetUserAndPayload() data: ConfirmEmailReqInterface,
		@Res() res: Response
	): Promise<void> {
		await this.confirmEmailRegusterService.confirmEmail(userId, data);
		res.status(HttpStatus.OK).json('акканут подтвержден');
	}
}
