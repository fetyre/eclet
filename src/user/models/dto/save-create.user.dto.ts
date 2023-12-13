import { Transform } from 'class-transformer';
import {
	IsEmail,
	IsNotEmpty,
	IsOptional,
	IsString,
	IsUUID,
	Length,
	Matches
} from 'class-validator';
import {
	ARGON2_HASH,
	EMAIL_REGEX,
	NAME_REGEX
} from 'src/common/constss/regex.const';
import { ApiProperty } from '@nestjs/swagger';

/**
 * @class ValidateRegisterUserDto
 * @description DTO для валидации данных перед сохранением.
 */
export class ValidateRegisterUserDto {
	@ApiProperty({
		description: 'Имя пользователя',
		example: 'Иван'
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
	@Transform(({ value }) => value.toLowerCase().trim())
	public readonly username?: string;

	@ApiProperty({
		description: 'Электронная почта',
		example: 'ivan@example.com'
	})
	@IsString({ message: 'Электронная почта должна быть строкой.' })
	@IsEmail({}, { message: 'Некорректный формат электронной почты.' })
	@Length(5, 255, {
		message: 'Электронная почта должна содержать от 5 до 255 символов.'
	})
	@Matches(EMAIL_REGEX, {
		message: 'Электронная почта должна соответствовать формату email.'
	})
	@Transform(params => params.value.toLowerCase())
	public readonly email!: string;

	@ApiProperty({
		description: 'Хэшированный пароль',
		example:
			'$argon2id$v=19$m=65536,t=3,p=4$y/Yi8yGSEWYBSdVQyXiC6g$PEyu0o+XeOz634DIPWeGy1Z5igigcX+I806jD06GE+E'
	})
	@IsString({ message: 'Пароль должен быть строкой.' })
	@Length(97, 97, { message: 'Длина пароля должна быть 97 символа.' })
	@IsNotEmpty({ message: 'Пароль не может быть пустым.' })
	@Matches(ARGON2_HASH, {
		message: 'Пароль должен соответствовать формату хэша Argon2.'
	})
	public readonly password!: string;

	@ApiProperty({
		description: 'Токен',
		example: '123e4567-e89b-12d3-a456-426614174000'
	})
	@IsNotEmpty({ message: 'Токен не может быть пустым.' })
	@Length(36, 36, { message: 'Длина токена должна быть 36 символов.' })
	@IsString({ message: 'Токен должен быть строкой.' })
	@IsUUID(4, { message: 'Токен должен соответствовать формату UUID v4.' })
	public readonly token!: string;
}
