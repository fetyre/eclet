import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
	IsEmail,
	IsNotEmpty,
	IsString,
	Length,
	Matches,
	MaxLength,
	MinLength
} from 'class-validator';
import { PASSWORD_REGEX } from 'src/common/constss/regex.const';
import { ISignIn } from '../interface';

export class SignInDto implements ISignIn {
	@ApiProperty({ description: 'Имя пользователя', required: true })
	@IsNotEmpty({ message: 'email обязателен' })
	@IsEmail({}, { message: 'email должен быть строкой' })
	@IsString({ message: 'email должно быть сткорой' })
	@Length(3, 255, { message: 'минимальная длина 3 символа' })
	@Matches(/^.+@.+\..+$/)
	@Transform(params => params.value.toLowerCase())
	public readonly email: string;

	@ApiProperty({ description: 'пароль пользователя', required: true })
	@IsNotEmpty({ message: 'Пароль обязателен' })
	@Matches(PASSWORD_REGEX, {
		message:
			'Для пароля требуется строчная буква, заглавная буква и цифра или символ.'
	})
	@MinLength(8, { message: 'Минимальная длина пароля должна быть 8 символов' })
	@IsString({ message: 'Парооль должно быть сткорой' })
	@MaxLength(30)
	public password: string;
}
