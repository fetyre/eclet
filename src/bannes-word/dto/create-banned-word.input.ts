import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsString, Length } from 'class-validator';
import { IsEnglishOrRussian } from '../validator/langue.validator';
import { IBannedWord } from '../interfaces/banned-words.interface';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

@InputType()
export class CreateBannedWordInput implements IBannedWord {
	@ApiProperty({
		description: 'Запрещающее слово',
		minLength: 3,
		maxLength: 10,
		example: 'недопустимо'
	})
	@Field({ description: 'Запрещающее слово' })
	@IsString({ message: 'Слово должно быть строкой' })
	@IsNotEmpty({ message: 'Слово не может быть пустым' })
	@Transform(({ value }) => value.replace(/\s+/g, ''), { toClassOnly: true })
	@Length(3, 10, { message: 'Слово должно содержать от 3 до 10 символов' })
	@IsEnglishOrRussian({
		message: 'Слово должно содержать только английские или русские буквы'
	})
	public readonly word: string;
}
