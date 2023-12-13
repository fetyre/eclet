import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, IsNotEmpty, IsEmail, Length } from 'class-validator';
import { IResetEmail } from '../interface';

/**
 * @class CreateResetUserEmailDto
 * @description Класс DTO для создания запроса на сброс электронной почты пользователя.
 */
export class CreateResetUserEmailDto implements IResetEmail {
	@ApiProperty({ description: 'новый email пользователя', required: true })
	@IsString({ message: 'email должен быть строкой' })
	@IsNotEmpty({ message: 'email обязателен' })
	@IsEmail()
	@Length(3, 255, { message: 'минимальная длина 3 символа' })
	@Transform(params => params.value.toLowerCase())
	public readonly email!: string;
}
