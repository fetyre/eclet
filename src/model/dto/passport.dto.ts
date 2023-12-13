import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import { PASSWORD_REGEX } from 'src/common/constss/regex.const';
import { ApiProperty } from '@nestjs/swagger';

/**
 * @abstract
 * @class PasswordsDto
 * @description Абстрактный класс DTO для паролей пользователя.
 */
export abstract class PasswordsDto {
	@ApiProperty({
		description: 'Первый пароль пользователя',
		example: 'Password123!',
		required: true,
		type: 'string'
	})
	@IsString({ message: 'пароль должен быть строкой' })
	@Length(8, 30, { message: 'Минимальная длина пароля должна быть 8 символов' })
	@Matches(PASSWORD_REGEX, {
		message:
			'Для пароля требуется строчная буква, заглавная буква и цифра или символ.'
	})
	@IsNotEmpty({ message: 'Пароль обязательно должен быть заполнен' })
	public password!: string;
}
