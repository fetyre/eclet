import { Field, InputType } from '@nestjs/graphql';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AdvertisementStatus, ItemType } from '@prisma/client';
import {
	IsOptional,
	IsBoolean,
	IsNumber,
	IsString,
	IsPositive,
	Min,
	IsEnum,
	IsInt,
	IsNotEmpty,
	Max,
	IsIn,
	Matches,
	MaxLength,
	MinLength
} from 'class-validator';
import { IFindAllAds } from '../interfaces/find-all-args.interface';

@InputType()
export class FindAllAdsInput implements IFindAllAds {
	@Field({ description: 'Фильтр по наличию изображений' })
	@ApiPropertyOptional({
		description: 'Фильтр по наличию изображений',
		example: true,
		type: 'boolean'
	})
	@IsOptional()
	@IsBoolean({ message: 'Значение должно быть логическим' })
	withImages?: boolean;

	@Field({ description: 'Минимальная цена' })
	@ApiPropertyOptional({
		description: 'Минимальная цена',
		example: 100,
		type: 'number'
	})
	@IsOptional()
	@IsNumber({}, { message: 'Значение должно быть числом' })
	@Min(0, { message: 'Значение должно быть больше или равно 0' })
	@IsPositive({ message: 'Значение должно быть положительным числом' })
	priceFrom?: number;

	@Field({ description: 'Максимальная цена' })
	@ApiPropertyOptional({
		description: 'Максимальная цена',
		example: 1000,
		type: 'number'
	})
	@IsOptional()
	@IsNumber({}, { message: 'Значение должно быть числом' })
	priceTo?: number;

	@Field({ description: 'Тип товара' })
	@ApiPropertyOptional({
		description: 'Тип товара',
		example: ItemType.new,
		type: 'string'
	})
	@IsOptional()
	@IsEnum(ItemType, { message: 'Значение должно быть одним из типов товара' })
	type?: ItemType;

	@Field({ description: 'Статус объявления' })
	@ApiPropertyOptional({
		description: 'Статус объявления',
		example: AdvertisementStatus.active,
		type: 'string'
	})
	@IsOptional()
	@IsEnum(AdvertisementStatus, {
		message: 'Значение должно быть одним из статусов объявления'
	})
	status?: AdvertisementStatus;

	@Field({ description: 'Фильтр по наличию описания' })
	@ApiPropertyOptional({
		description: 'Фильтр по наличию описания',
		example: true,
		type: 'boolean'
	})
	@IsOptional()
	@IsBoolean({ message: 'Значение должно быть логическим' })
	description?: boolean;

	@Field({ description: 'Номер страницы' })
	@ApiPropertyOptional({
		description: 'Номер страницы',
		example: 1,
		type: 'number'
	})
	@IsNotEmpty()
	@IsNumber({}, { message: 'Значение должно быть числом' })
	@IsInt({ message: 'Значение должно быть целым числом' })
	@Min(1, { message: 'Значение должно быть больше или равно 1' })
	@IsPositive({ message: 'Значение должно быть положительным числом' })
	page: number;

	@Field({ description: 'Размер страницы' })
	@ApiPropertyOptional({
		description: 'Размер страницы',
		example: 20,
		type: 'number'
	})
	@IsNotEmpty()
	@IsNumber({}, { message: 'Значение должно быть числом' })
	@IsInt({ message: 'Значение должно быть целым числом' })
	@Min(1, { message: 'Значение должно быть больше или равно 1' })
	@Max(80, { message: 'Значение должно быть меньше или равно 80' })
	@IsPositive({ message: 'Значение должно быть положительным числом' })
	pageSize: number;

	@Field({ description: 'Поле сортировки', nullable: true })
	@ApiPropertyOptional({
		description: 'Поле сортировки',
		example: 'createdAt',
		type: 'string'
	})
	@IsOptional()
	@IsString({ message: 'Значение должно быть строкой' })
	@IsIn(['postedAt', 'updatedAt', 'views'], {
		message:
			'Значение должно быть либо "createdAt", либо "updatedAt", либо "views" '
	})
	sortField?: string;

	@Field({ description: 'Порядок сортировки', nullable: true })
	@ApiPropertyOptional({
		description: 'Порядок сортировки',
		example: 'asc',
		type: 'string'
	})
	@IsOptional()
	@IsIn(['asc', 'desc'], {
		message: 'Значение должно быть либо "asc", либо "desc"'
	})
	sortOrder?: string;

	@Field({ description: 'ID пользователя' })
	@IsOptional()
	@IsString({ message: 'ID пользователя должен быть строкой' })
	@MinLength(25, {
		message: 'ID пользователя не может быть короче 25 символов'
	})
	@MaxLength(25, {
		message: 'Превышена максимальная длина идентификатора пользователя'
	})
	@Matches(/^[a-zA-Z0-9-]+$/, {
		message:
			'ID пользователя должен содержать только буквы (в обоих регистрах), цифры и дефисы'
	})
	@ApiProperty({
		description: 'ID пользователя',
		example: 'ckpfn8skk0000j29z3l9l4d1z'
	})
	userId?: string;
}
