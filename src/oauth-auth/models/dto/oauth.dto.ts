import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { OAuthCreateUser } from '../interface';

export class OAuthCreateDto implements OAuthCreateUser {
	@ApiProperty({ description: 'Имя пользователя oauth', required: false })
	@IsString({ message: 'Имя должно быть сткорой' })
	@IsNotEmpty({ message: 'email обязателен' })
	public readonly username: string;

	@ApiProperty({ description: 'email пользователя oauth', required: false })
	@IsString({ message: 'email должно быть сткорой' })
	@MinLength(3, { message: 'минимальная длина 3 символа' })
	@IsNotEmpty({ message: 'email обязателен' })
	@IsEmail({}, { message: 'строка должна быть email' })
	@Transform(params => params.value.toLowerCase())
	public readonly email: string;

	@ApiProperty({ description: 'OAUTHID пользователя', required: false })
	@IsString({ message: 'OAUTHID должно быть строкойй ' })
	@IsNotEmpty({ message: 'OAUTHID обязателен' })
	public readonly oauthId: string;
}
