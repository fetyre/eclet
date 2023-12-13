import { InputType, Field } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, Length } from 'class-validator';
import { ICreateFavourite } from '../interfaces';
import { ID_REGEX } from 'src/common/constss/regex.const';

@InputType()
export class CreateFavouriteInput implements ICreateFavourite {
	@Field(() => String, { description: 'Уникальный идентификатор объявления' })
	@IsNotEmpty({ message: 'ID объявления не может быть пустым' })
	@IsString({ message: 'ID объявления должен быть строкой' })
	@Length(25, 25, {
		message: 'ID объявления может быть длиною только 25 символов'
	})
	@Matches(ID_REGEX, {
		message:
			'ID объявления должен содержать только буквы (в обоих регистрах), цифры и дефисы'
	})
	@ApiProperty({
		description: 'ID объявления',
		example: 'ckpfn8skk0000j29z3l9l4d1z'
	})
	adsId: string;
}
