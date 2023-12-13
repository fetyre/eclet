import {
	IsEmail,
	IsOptional,
	IsString,
	Length,
	Matches
} from 'class-validator';
import { NAME_REGEX } from 'src/common/constss/regex.const';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { PasswordsDto } from 'src/model/dto';
import { ISignUp } from '../interface';

/**
 * @class SignUpDto
 * @extends {PasswordsDto} пароли для регистрации
 * @description DTO для регистрации нового пользователя.
 */
export class SignUpDto extends PasswordsDto implements ISignUp {
	@ApiProperty({
		description: 'Имя пользователя',
		example: 'Иван',
		required: false,
		type: 'string'
	})
	@IsOptional()
	@IsString({ message: 'Имя пользователя должно быть строкой.' })
	@Length(3, 100, {
		message: 'Имя пользователя должно содержать от 3 до 100 символов.'
	})
	@Matches(NAME_REGEX, {
		message:
			'Имя пользователя может содержать только буквы (как заглавные, так и строчные), цифры, апострофы, точки, пробелы и тире.'
	})
	public readonly username?: string;

	@ApiProperty({
		description: 'Электронная почта',
		example: 'ivan@example.com',
		required: true,
		type: 'string'
	})
	@IsString({ message: 'Электронная почта должна быть строкой.' })
	@IsEmail({}, { message: 'Некорректный формат электронной почты.' })
	@Length(5, 255, {
		message: 'Электронная почта должна содержать от 5 до 255 символов.'
	})
	@Matches(/^.+@.+\..+$/, {
		message: 'Электронная почта должна соответствовать формату email.'
	})
	@Transform(params => params.value.toLowerCase())
	public readonly email!: string;
}
