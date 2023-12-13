import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Transform } from 'class-transformer';
import {
	IsString,
	IsEmail,
	Length,
	Matches,
	IsNotEmpty
} from 'class-validator';
import { PASSWORD_REGEX, NAME_REGEX } from 'src/common/constss/regex.const';

export class CreateAdminDto {
	@IsString({ message: 'Электронная почта должна быть строкой.' })
	@IsEmail({}, { message: 'Некорректный формат электронной почты.' })
	@IsNotEmpty()
	@Length(5, 255, {
		message: 'Электронная почта должна содержать от 5 до 255 символов.'
	})
	@Matches(/^.+@.+\..+$/)
	@Transform(params => params.value.toLowerCase())
	public email!: string;

	@ApiProperty({ description: 'Первый пароль Администратора', required: true })
	@IsString({ message: 'пароль должен быть строкой' })
	@Length(8, 30, { message: 'Минимальная длина пароля должна быть 8 символов' })
	@Matches(PASSWORD_REGEX, {
		message:
			'Для пароля требуется строчная буква, заглавная буква и цифра или символ.'
	})
	@IsNotEmpty({ message: 'Пароль обязательно должен быть заполнен' })
	public password!: string;

	@Exclude({ toPlainOnly: true })
	@ApiProperty({ description: 'Второй пароль Администратора', required: true })
	@IsString({ message: 'пароль должен быть строкой' })
	@Matches(PASSWORD_REGEX, {
		message:
			'Для пароля требуется строчная буква, заглавная буква и цифра или символ.'
	})
	@Length(8, 30, { message: 'Минимальная длина пароля должна быть 8 символов' })
	@IsNotEmpty({ message: 'Пароль обязательно должен быть заполнен' })
	// @Validate(MatchPasswords)
	public confirmPassword!: string;

	@IsNotEmpty()
	@IsString({ message: 'Имя Администратора должно быть строкой.' })
	@Length(3, 100, {
		message: 'Имя Администратора должно содержать от 3 до 100 символов.'
	})
	@Matches(NAME_REGEX, {
		message:
			'Имя Администратора может содержать только буквы (как заглавные, так и строчные), цифры, апострофы, точки, пробелы и тире.'
	})
	public username: string;
}
