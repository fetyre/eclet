import { ApiPropertyOptional } from '@nestjs/swagger';
import {
	IsNotEmpty,
	IsNumber,
	IsInt,
	Min,
	IsPositive,
	Max,
	IsOptional,
	IsString,
	IsIn
} from 'class-validator';
import { IBannedWordArgs } from '../interfaces';
import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class ArgsBannedWordsDto implements IBannedWordArgs {
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
	@IsIn(['createdAt', 'updatedAt'], {
		message: 'Значение должно быть либо "createdAt", либо "updatedAt"'
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
}
