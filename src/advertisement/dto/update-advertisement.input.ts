import { AdvertisementStatus, ItemType } from '@prisma/client';
import { InputType, Field } from '@nestjs/graphql';
import {
	ArrayMaxSize,
	ArrayMinSize,
	ArrayUnique,
	IsArray,
	IsEnum,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsPositive,
	IsString,
	IsUrl,
	Matches,
	MaxLength,
	MinLength
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IUpdateAdvertisement } from '../interfaces';
import { Transform } from 'class-transformer';

@InputType()
export class UpdateAdvertisementInput implements IUpdateAdvertisement {
	@Field({ description: 'ID объявления' })
	@IsNotEmpty({ message: 'ID объявления не может быть пустым' })
	@IsString({ message: 'ID объявления должен быть строкой' })
	@MinLength(25, { message: 'ID объявления не может быть короче 25 символов' })
	@MaxLength(25, {
		message: 'Превышена максимальная длина идентификатора объявления'
	})
	@Matches(/^[a-zA-Z0-9-]+$/, {
		message:
			'ID объявления должен содержать только буквы (в обоих регистрах), цифры и дефисы'
	})
	@ApiProperty({
		description: 'ID объявления',
		example: 'ckpfn8skk0000j29z3l9l4d1z'
	})
	id: string;

	@Field(() => AdvertisementStatus, { nullable: true })
	@IsEnum(AdvertisementStatus, {
		message: 'Статус должен быть одним из значений AdvertisementStatus'
	})
	@IsOptional()
	@ApiProperty({
		description: 'Статус объявления.',
		required: false,
		enum: AdvertisementStatus
	})
	status?: AdvertisementStatus;

	@Field({ description: 'Заголовок объявления', nullable: true })
	@ApiProperty({ description: 'Заголовок объявления.', required: false })
	@IsString({ message: 'Заголовок должен быть строкой' })
	@MinLength(1)
	@MaxLength(100, { message: 'Заголовок слишком длинный' })
	@Matches(/^[a-zA-Zа-яА-Я\s.,-?!@#$%^&*()_+=\[\]{}<>\/\\]+$/, {
		message: 'Заголовок может содержать только буквы, символы и пробелы'
	})
	@Transform(({ value }) => value.replace(/\s+/g, ' ').trim())
	@IsOptional()
	title?: string;

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

	@Field({ nullable: true })
	@IsString()
	@IsOptional()
	location?: string;

	@Field({ description: 'ID категории ', nullable: true })
	@IsNotEmpty({ message: 'ID категории не может быть пустым' })
	@IsString({ message: 'ID категории должен быть строкой' })
	@MinLength(25, { message: 'ID категории не может быть короче 25 символов' })
	@MaxLength(25, {
		message: 'Превышена максимальная длина идентификатора категории'
	})
	@Matches(/^[a-zA-Z0-9-]+$/, {
		message:
			'ID категории должен содержать только буквы (в обоих регистрах), цифры и дефисы'
	})
	@ApiProperty({
		description: 'ID категории продуктов',
		example: 'ckpfn8skk0000j29z3l9l4d1z'
	})
	@IsOptional()
	categoryId?: string;

	@Field(() => [String], {
		description: 'Список URL-адресов изображений объявления',
		nullable: true
	})
	@ApiProperty({
		description: 'Список URL-адресов изображений объявления.',
		required: false
	})
	@ArrayMinSize(1, { message: 'Требуется хотя бы одно изображение' })
	@ArrayMaxSize(10, { message: 'Максимальное количество фото 8' })
	@IsUrl(
		{ require_protocol: true },
		{ each: true, message: 'Каждое изображение должно быть действительным URL' }
	)
	@ArrayUnique({ message: 'Есть повторяющиеся фото' })
	@IsArray()
	@IsOptional()
	images?: string[];

	@Field(() => ItemType, {
		description: 'Тип товара или услуги в объявлении',
		nullable: true
	})
	@ApiProperty({
		description: 'Тип товара или услуги в объявлении.',
		required: false,
		enum: ItemType
	})
	@IsOptional()
	@IsEnum(ItemType, { message: 'Тип должен быть одним из значений ItemType' })
	type?: ItemType;
}
