import { InputType, Field } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { ItemType } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
	IsString,
	IsNumber,
	IsArray,
	IsEnum,
	MaxLength,
	Matches,
	MinLength,
	ArrayMaxSize,
	ArrayMinSize,
	ArrayUnique,
	IsUrl,
	IsOptional,
	IsNotEmpty,
	IsPositive,
	Length
} from 'class-validator';
import { ICreateAdvertisement } from '../interfaces';
import { ID_REGEX } from 'src/common/constss/regex.const';

@InputType()
export class CreateAdvertisementInput implements ICreateAdvertisement {
	@Field({ description: 'Заголовок объявления' })
	@ApiProperty({ description: 'Заголовок объявления.', required: true })
	@IsString({ message: 'Заголовок должен быть строкой' })
	@MinLength(1)
	@MaxLength(100, { message: 'Заголовок слишком длинный' })
	@Matches(/^[a-zA-Zа-яА-Я\s.,-?!@#$%^&*()_+=\[\]{}<>\/\\]+$/, {
		message: 'Заголовок может содержать только буквы, символы и пробелы'
	})
	@Transform(({ value }) => value.replace(/\s+/g, ' ').trim())
	title: string;

	@Field({ nullable: true, description: 'Описание объявления' })
	@ApiProperty({ description: 'Описание объявления.', required: false })
	@IsString({ message: 'Описание должно быть строкой' })
	@MinLength(1)
	@IsOptional()
	@MaxLength(500, { message: 'Описание слишком длинное' })
	@Matches(/^[a-zA-Zа-яА-Я\s.,-?!@#$%^&*()_+=\[\]{}<>\/\\]+$/, {
		message: 'Описание может содержать только буквы, символы и пробелы'
	})
	@Transform(({ value }) => value.replace(/\s+/g, ' ').trim())
	description?: string;

	@Field({ nullable: true, description: 'Цена товара или услуги в объявлении' })
	@ApiProperty({
		description: 'Цена товара или услуги в объявлении.',
		required: false,
		example: 123.45
	})
	@IsNumber()
	@IsOptional()
	@IsPositive({ message: 'Цена должна быть положительной' })
	@Matches(/^[0-9]+(\.[0-9]{1,2})?$/, {
		message: 'Цена должна иметь не более двух знаков после запятой'
	})
	price?: number;

	@Field(() => String, { description: 'Локация объявления' })
	@IsString()
	location: string;

	@Field({ description: 'ID категории ' })
	@IsNotEmpty({ message: 'ID категории не может быть пустым' })
	@IsString({ message: 'ID категории должен быть строкой' })
	@Length(25, 25, {
		message: 'ID категории может быть длиною только 25 символов'
	})
	@Matches(ID_REGEX, {
		message:
			'ID категории должен содержать только буквы (в обоих регистрах), цифры и дефисы'
	})
	@ApiProperty({
		description: 'ID категории продуктов',
		example: 'ckpfn8skk0000j29z3l9l4d1z'
	})
	categoryId: string;

	@Field(() => [String], {
		description: 'Список URL-адресов изображений объявления'
	})
	@ApiProperty({
		description: 'Список URL-адресов изображений объявления.',
		required: true
	})
	@ArrayMinSize(1, { message: 'Требуется хотя бы одно изображение' })
	@ArrayMaxSize(10, { message: 'Максимальное количество фото 8' })
	@IsUrl(
		{ require_protocol: true },
		{ each: true, message: 'Каждое изображение должно быть действительным URL' }
	)
	@ArrayUnique({ message: 'Есть повторяющиеся фото' })
	@IsArray()
	images: string[];

	@Field(() => ItemType, { description: 'Тип товара или услуги в объявлении' })
	@ApiProperty({
		description: 'Тип товара или услуги в объявлении.',
		required: true,
		enum: ItemType
	})
	@IsOptional()
	@IsEnum(ItemType, { message: 'Тип должен быть одним из значений ItemType' })
	type: ItemType;

	@Field({ description: 'ID пользователя' })
	@IsNotEmpty({ message: 'ID пользователя не может быть пустым' })
	@IsString({ message: 'ID пользователя должен быть строкой' })
	@Length(25, 25, {
		message: 'ID пользователя может быть длиною только 25 символов'
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
