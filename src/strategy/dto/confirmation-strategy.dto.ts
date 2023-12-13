import { ApiProperty } from '@nestjs/swagger';
import {
	IsString,
	IsBoolean,
	IsNumber,
	IsNotEmpty,
	Matches,
	MaxLength,
	MinLength,
	IsUUID,
	Length,
	IsIn,
	IsOptional
} from 'class-validator';
import { ID_REGEX } from 'src/common/constss/regex.const';
import { ConfirmPayload } from '../interface';

export class ValidateConfirmPayload implements ConfirmPayload {
	@IsNotEmpty({ message: 'ID отправителя не может быть пустым' })
	@IsString({ message: 'ID отправителя должен быть строкой' })
	@MinLength(25, { message: 'ID отправителя не может быть короче 25 символов' })
	@MaxLength(25, {
		message: 'Превышена максимальная длина идентификатора категории'
	})
	@Matches(ID_REGEX, {
		message:
			'ID отправителя должен содержать только буквы (в обоих регистрах), цифры и дефисы'
	})
	@ApiProperty({
		description: 'ID отправителя',
		example: 'ckpfn8skk0000j29z3l9l4d1z'
	})
	public readonly id: string;

	@IsString()
	@IsNotEmpty()
	@IsIn(['admin', 'user', 'superAdmin'])
	public readonly role: string;

	@IsBoolean()
	@IsOptional()
	public readonly active?: boolean;

	@IsNumber()
	@IsNotEmpty()
	public readonly iat: number;

	@IsNumber()
	@IsOptional()
	public readonly nbf?: number;

	@IsNumber()
	@IsNotEmpty()
	public readonly exp: number;

	@IsString()
	@IsNotEmpty()
	public readonly aud: string;

	@IsString()
	@IsNotEmpty()
	public readonly iss: string;

	@ApiProperty({
		description: 'Токен',
		example: '123e4567-e89b-12d3-a456-426614174000'
	})
	@IsNotEmpty({ message: 'Токен не может быть пустым.' })
	@Length(36, 36, { message: 'Длина токена должна быть 36 символов.' })
	@IsString({ message: 'Токен должен быть строкой.' })
	@IsUUID(4, { message: 'Токен должен соответствовать формату UUID v4.' })
	public readonly jti: string;
}
