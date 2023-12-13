import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, IsNotEmpty, Matches } from 'class-validator';
import { ARGON2_HASH } from 'src/common/constss/regex.const';

export class ValidateUpdatePasswordDto {
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
}
