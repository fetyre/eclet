import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, IsNotEmpty, Matches } from 'class-validator';
import { ARGON2_HASH, ID_REGEX } from 'src/common/constss/regex.const';
import { IValidateAfterPasswordChange } from '../interfaces';

/**
 * @class ValidateAfterChangesReserPassword
 * @classdesc DTO для валидации перед сохранением в бд после обновлния пароля
 * @throws {BadRequestException} Если возникла ошибка валидации
 * @since 2023-10-30
 */
export class ValidateAfterChangesReserPassword
	implements IValidateAfterPasswordChange
{
	@ApiProperty({
		description: 'Хэшированный пароль',
		example: '$argon2i$v=19$m=4096,t=3,p=1$Rm9vYmFy$PzIufrl4A11ZImQxMjM0NQ'
	})
	@IsString({ message: 'Пароль должен быть строкой.' })
	@Length(44, 44, { message: 'Длина пароля должна быть 44 символа.' })
	@IsNotEmpty({ message: 'Пароль не может быть пустым.' })
	@Matches(ARGON2_HASH, {
		message: 'Пароль должен соответствовать формату хэша Argon2.'
	})
	public readonly password!: string;

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
	public readonly userId!: string;
}
