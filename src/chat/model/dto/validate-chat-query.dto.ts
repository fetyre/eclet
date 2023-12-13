import { ApiPropertyOptional } from '@nestjs/swagger';
import {
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsIn,
	IsInt,
	IsPositive,
	Min,
	Max,
	IsBoolean
} from 'class-validator';
import { SortOrder, sortOrderValues } from 'src/types';
import { IChatParameters } from '../interface';

export class ChatQueryParamsDto implements IChatParameters {
	@ApiPropertyOptional({
		description: 'Номер страницы',
		example: 1,
		type: 'number'
	})
	@IsNotEmpty({ message: 'Параметр "page" не должен быть пустым' })
	@IsNumber({}, { message: 'Параметр "page" должен быть числом' })
	@IsInt({ message: 'Параметр "page" должен быть целым числом' })
	@Min(1, { message: 'Параметр "page" должен быть больше или равен 1' })
	@IsPositive({ message: 'Параметр "page" должен быть положительным числом' })
	page: number;

	@ApiPropertyOptional({
		description: 'Размер страницы',
		example: 20,
		type: 'number'
	})
	@IsNotEmpty({ message: 'Параметр "pageSize" не должен быть пустым' })
	@IsNumber({}, { message: 'Параметр "pageSize" должен быть числом' })
	@IsInt({ message: 'Параметр "pageSize" должен быть целым числом' })
	@Min(1, { message: 'Параметр "pageSize" должен быть больше или равен 1' })
	@Max(100, { message: 'Параметр "pageSize" должен быть меньше или равен 100' })
	@IsPositive({
		message: 'Параметр "pageSize" должен быть положительным числом'
	})
	pageSize: number;

	@ApiPropertyOptional({
		description: 'Фильтр непрочитанных сообщений',
		example: true,
		type: 'boolean'
	})
	@IsOptional()
	@IsBoolean({
		message: 'Параметр "unread" должен быть булевым значением'
	})
	unread?: boolean;

	@ApiPropertyOptional({
		description: 'Порядок сортировки',
		example: 'asc',
		type: 'string'
	})
	@IsOptional()
	@IsIn(sortOrderValues, {
		message: 'Параметр "sort" должен быть либо "asc", либо "desc"'
	})
	sort?: SortOrder;

	// @IsEnum(ChatStatus)
	// @IsOptional()
	// status?: ChatStatus;
}
