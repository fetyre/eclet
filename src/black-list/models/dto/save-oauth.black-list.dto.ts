import { ApiProperty } from '@nestjs/swagger';
import {
	IsNotEmpty,
	IsString,
	Matches,
	Length,
	IsPositive,
	IsInt,
	IsNumber,
	IsEnum,
	IsUUID
} from 'class-validator';
import { ID_REGEX } from 'src/common/constss/regex.const';
import { TokenTypeEnum } from 'src/jwt/models/enums/token-type.enum';

export class CreateBlacklistedTokenDto {
	@IsNotEmpty({ message: 'ID отправителя не может быть пустым' })
	@IsString({ message: 'ID отправителя должен быть строкой' })
	@Length(25, 25, {
		message: 'ID пользователя может быть длиною только 25 символов'
	})
	@Matches(ID_REGEX, {
		message:
			'ID отправителя должен содержать только буквы (в обоих регистрах), цифры и дефисы'
	})
	@ApiProperty({
		description: 'ID отправителя',
		example: 'ckpfn8skk0000j29z3l9l4d1z'
	})
	readonly userId: string;

	@ApiProperty({
		description: 'Токен',
		example: '123e4567-e89b-12d3-a456-426614174000'
	})
	@IsNotEmpty({ message: 'Токен не может быть пустым.' })
	@Length(36, 36, { message: 'Длина токена должна быть 36 символов.' })
	@IsString({ message: 'Токен должен быть строкой.' })
	@IsUUID(4, { message: 'Токен должен соответствовать формату UUID v4.' })
	readonly tokenV4Id: string;

	@IsNotEmpty()
	@IsNumber()
	@IsPositive()
	@IsInt()
	readonly exp: number;

	@IsEnum(TokenTypeEnum)
	readonly tokenType: TokenTypeEnum;
}
