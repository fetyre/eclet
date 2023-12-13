import { ApiProperty } from '@nestjs/swagger';
import { CreateBannedWordInput } from './create-banned-word.input';
import { InputType, Field } from '@nestjs/graphql';
import {
	IsNotEmpty,
	IsString,
	MinLength,
	MaxLength,
	Matches
} from 'class-validator';

@InputType()
export class UpdateBannedWordInput extends CreateBannedWordInput {
	@Field({ description: 'ID запрещенного слова' })
	@IsNotEmpty({ message: 'ID запрещенного слова не может быть пустым' })
	@IsString({ message: 'ID запрещенного слова должен быть строкой' })
	@MinLength(25, {
		message: 'ID запрещенного слова не может быть короче 25 символов'
	})
	@MaxLength(25, {
		message: 'Превышена максимальная длина идентификатора запрещенного слова'
	})
	@Matches(/^[a-zA-Z0-9-]+$/, {
		message:
			'ID запрещенного слова должен содержать только буквы (в обоих регистрах), цифры и дефисы'
	})
	@ApiProperty({
		description: 'ID запрещенного слова',
		example: 'ckpfn8skk0000j29z3l9l4d1z'
	})
	id: string;
}
