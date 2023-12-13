import {
	IsHexadecimal,
	Length,
	IsString,
	IsNotEmpty,
	IsDefined
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ITokenData } from '../interfaces';

/**
 * @class TokenDto
 * @classdesc DTO токена для валидации
 * @throws {BadRequestException} Если возникла ошибка валидации
 * @since 2023-10-29
 */
export class TokenDto implements ITokenData {
	@ApiProperty({ description: 'Токен для сброса пароля' })
	@IsDefined({ message: 'Токен должен быть определен' })
	@IsString({ message: 'Токен должен быть строкой' })
	@IsNotEmpty({ message: 'Токен не должен быть пустым' })
	@IsHexadecimal({ message: 'Токен должен быть шестнадцатеричной строкой' })
	@Length(64, 64, { message: 'Длина токена должна быть 64 символа' })
	public readonly token!: string;
}
