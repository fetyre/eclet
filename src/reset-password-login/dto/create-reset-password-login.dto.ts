import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, IsNotEmpty, IsEmail, Length } from 'class-validator';
import { IResetPasswordLogin } from '../interfaces';

/**
 * @class CreateResetPasswordLoginDto
 * @classdesc DTO для создание запроса на сброс пароля
 * @throws {BadRequestException} Если возникла ошибка валидации
 * @since 2023-10-29
 */
export class CreateResetPasswordLoginDto implements IResetPasswordLogin {
	@ApiProperty({
		description: 'email пользователя для сброса пароля ',
		required: true
	})
	@IsString({ message: 'email должен быть строкой' })
	@IsNotEmpty({ message: 'email обязателен' })
	@IsEmail()
	@Length(3, 255, { message: 'минимальная длина 3 символа' })
	@Transform(params => params.value.toLowerCase())
	public readonly email!: string;
}
