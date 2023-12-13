import { ApiPropertyOptional } from '@nestjs/swagger';
import {
	IsNotEmpty,
	IsNumber,
	IsInt,
	Min,
	IsPositive,
	Max
} from 'class-validator';
import { IMessagePaginationParams } from '../interface';

export class FinldAllMessageDto implements IMessagePaginationParams {
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
}
