import { InputType, Field } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import {
	IsString,
	MinLength,
	MaxLength,
	Matches,
	IsOptional
} from 'class-validator';

@InputType({ description: 'Входные данные ID родительского категории' })
export class AllProdcutCategoryInput {
	@Field({ description: 'ID категории родительноой категории', nullable: true })
	@IsOptional({ message: 'ID категории  не может быть пустым' })
	@IsString({ message: 'ID категории  должен быть строкой' })
	@MinLength(25, { message: 'ID категории  не может быть короче 25 символов' })
	@MaxLength(25, {
		message: 'Превышена максимальная длина идентификатора категории'
	})
	@Matches(/^[a-zA-Z0-9-]+$/, {
		message:
			'ID категории должен содержать только буквы (в обоих регистрах), цифры и дефисы'
	})
	@ApiProperty({
		description: 'ID родительноой категории',
		example: 'ckpfn8skk0000j29z3l9l4d1z'
	})
	parentId?: string;
}
