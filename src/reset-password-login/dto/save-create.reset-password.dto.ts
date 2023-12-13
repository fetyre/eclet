import { ApiProperty } from '@nestjs/swagger';
import {
	IsNotEmpty,
	IsString,
	Length,
	Matches,
	MinLength
} from 'class-validator';
import { ID_REGEX } from 'src/common/constss/regex.const';
import { ICreatePasswordReset } from '../interfaces';

/**
 * @class SeveCreateResetPasswordDto
 * @classdesc DTO для валидации перед сохранением в бд после создания запроса на сброс пароля, создание новой модели
 * @throws {BadRequestException} Если возникла ошибка валидации
 * @since 2023-10-30
 */
export class SeveCreateResetPasswordDto implements ICreatePasswordReset {
	@IsNotEmpty({ message: 'ID пользователя не должен быть пустым' })
	@IsString({ message: 'ID пользователя должен быть строкой' })
	@Length(25, 25, { message: 'Длина ID пользователя должна быть 25 символов' })
	@Matches(ID_REGEX, {
		message:
			'ID пользователя должен содержать только буквы (в обоих регистрах), цифры и дефисы'
	})
	@ApiProperty({
		description: 'ID пользователя',
		example: 'ckpfn8skk0000j29z3l9l4d1z'
	})
	userId: string;

	@IsNotEmpty({ message: 'Токен не должен быть пустым' })
	@IsString({ message: 'Токен должен быть строкой' })
	@MinLength(64, { message: 'Длина токена должна быть не менее 64 символов' })
	token: string;
}
