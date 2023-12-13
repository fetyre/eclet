import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, Length } from 'class-validator';
import { ID_REGEX } from 'src/common/constss/regex.const';
import { ICreateChatDto } from '../interface';

export class CreateChatDto implements ICreateChatDto {
	@IsNotEmpty({ message: 'ID пользователя с кем будет создан чат' })
	@IsString({ message: 'ID пользователя должен быть строкой' })
	@Length(25, 25, {
		message: 'ID пользователя должен быть длиною 25 символов'
	})
	@Matches(ID_REGEX, {
		message:
			'ID пользователя должен содержать только буквы (в обоих регистрах), цифры и дефисы'
	})
	@ApiProperty({
		description: 'ID пользователя',
		example: 'ckpfn8skk0000j29z3l9l4d1z'
	})
	userId: string;
}
