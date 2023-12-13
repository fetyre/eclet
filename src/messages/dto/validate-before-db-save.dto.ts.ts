import { ApiProperty } from '@nestjs/swagger';
import {
	IsNotEmpty,
	IsString,
	Length,
	Matches,
	MinLength
} from 'class-validator';
import { ID_REGEX } from 'src/common/constss/regex.const';

export class ValidateBeforeDbSaveDto {
	@IsNotEmpty({ message: 'Содержимое сообщения не может быть пустым' })
	@IsString({ message: 'Содержимое сообщения должно быть строкой' })
	@MinLength(100, { message: 'Сообщение не должно быть пустым' })
	@ApiProperty({
		description: 'Содержимое сообщения',
		example: 'Привет, как дела?'
	})
	content: string;

	@IsNotEmpty({ message: 'ID отправителя не может быть пустым' })
	@IsString({ message: 'ID отправителя должен быть строкой' })
	@Length(25, 25, { message: 'ID отправителя должен быть длиною 25 символов' })
	@Matches(ID_REGEX, {
		message:
			'ID отправителя должен содержать только буквы (в обоих регистрах), цифры и дефисы'
	})
	@ApiProperty({
		description: 'ID отправителя',
		example: 'ckpfn8skk0000j29z3l9l4d1z'
	})
	senderId: string;

	@IsNotEmpty({ message: 'Имя комнаты не должно быть пустым' })
	@IsString({ message: 'Имя комнаты должно быть строкой' })
	@Length(60, 60, { message: 'Имя комнаты должно состоять из 38 символов' })
	@Matches(ID_REGEX, {
		message: 'Имя комнаты может содержать только буквы, цифры и дефисы'
	})
	@ApiProperty({
		description: 'Имя конматы',
		example: 'ch72gsb320007ldocl363eofy1619568998539'
	})
	chatName: string;
}
