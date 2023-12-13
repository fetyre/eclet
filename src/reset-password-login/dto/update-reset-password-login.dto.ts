import { PasswordsDto } from 'src/model/dto';
import { IUpdatePasswordLogin } from '../interfaces';

/**
 * @class UpdateResetPasswordLoginDto
 * @classdesc DTO обнолвнияя пароля
 * @throws {BadRequestException} Если возникла ошибка валидации
 * @since 2023-10-30
 * @see {PasswordsDto} extends
 */
export class UpdateResetPasswordLoginDto
	extends PasswordsDto
	implements IUpdatePasswordLogin {}
