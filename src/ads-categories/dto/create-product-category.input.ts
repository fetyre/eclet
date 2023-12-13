import {
	IsString,
	IsOptional,
	IsNotEmpty,
	MaxLength,
	Matches,
	MinLength,
	Length
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { InputType, Field } from '@nestjs/graphql';
import { ICreateAdsCategory } from '../interface';
import { Transform } from 'class-transformer';

@InputType({ description: 'Входные данные для создания категории объявлений' })
export class CreateProductCategoryInput implements ICreateAdsCategory {
	@Field(() => String, { description: 'Название категории' })
	@IsString({ message: 'Название категории должно быть строкой' })
	@IsNotEmpty({ message: 'Название категории не может быть пустым' })
	@MinLength(2, {
		message: 'Название категории должно содержать как минимум 2 символа'
	})
	@MaxLength(50, {
		message: 'Название категории не может превышать 50 символов'
	})
	@Matches(/^[а-яА-Яa-zA-Z0-9]*$/, {
		message:
			'Название категории должно содержать только русские и английские буквы, а также цифры'
	})
	@ApiProperty({
		description:
			'Строка, представляющая название категории. Должна быть уникальной, содержать только русские и английские буквы, а также цифры, и иметь длину от 2 до 50 символов.',
		example: 'exampleCategory',
		type: 'string',
		maxLength: 50,
		required: true
	})
	@Transform(({ value }) => value.toLowerCase().trim())
	public readonly name!: string;

	@Field(() => String, { nullable: true, description: 'Описание категории' })
	@IsOptional()
	@IsString({ message: 'Описание категории должно быть строкой' })
	@MinLength(5, {
		message: 'Описание категории должно содержать как минимум 5 символов'
	})
	@MaxLength(200, {
		message: 'Описание категории не может превышать 200 символов'
	})
	@Matches(/^[а-яА-Яa-zA-Z0-9]*$/, {
		message:
			'Описание категории должно содержать только русские и английские буквы, а также цифры'
	})
	@ApiProperty({
		description:
			'Строка, представляющая описание категории. Должна содержать только русские и английские буквы, а также цифры, и иметь длину от 5 до 200 символов.',
		example: 'exampleDescription',
		type: 'string',
		maxLength: 200,
		required: false
	})
	@Transform(({ value }) => (value ? value.toLowerCase().trim() : value))
	public readonly description?: string;

	@Field(() => String, {
		nullable: true,
		description: 'ID родительской категории'
	})
	@IsOptional()
	@IsString({ message: 'ID родительской категории должен быть строкой' })
	@Length(25, 25, {
		message: 'ID родительской категории должен быть длиной 25 символов'
	})
	@Matches(/^[a-zA-Z0-9-]+$/, {
		message:
			'ID родительской категории должен содержать только буквы (в обоих регистрах), цифры и дефисы'
	})
	@ApiProperty({
		description: 'ID родительской категории продуктов',
		example: 'ckpfn8skk0000j29z3l9l4d1z',
		maxLength: 25,
		required: false
	})
	public readonly parentId?: string;
}
