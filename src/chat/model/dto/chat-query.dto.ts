import {
	IsOptional,
	IsIn,
	IsNotEmpty,
	IsBooleanString,
	IsNumberString
} from 'class-validator';
import { IChatQueryParams } from '../interface';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SortOrder, sortOrderValues } from 'src/types';

export class ChatFindAllQueryDto implements IChatQueryParams {
	@ApiPropertyOptional({
		description: 'Номер страницы',
		example: '1',
		type: 'string'
	})
	@IsNumberString({}, { message: 'Параметр "pageSize" должен быть числом' })
	@IsNotEmpty({ message: 'Параметр "page" не должен быть пустым' })
	page: string;

	@ApiPropertyOptional({
		description: 'Размер страницы',
		example: '20',
		type: 'string'
	})
	@IsNumberString({}, { message: 'Параметр "pageSize" должен быть числом' })
	@IsNotEmpty({ message: 'Параметр "pageSize" не должен быть пустым' })
	pageSize: string;

	@ApiPropertyOptional({
		description: 'Фильтр непрочитанных сообщений',
		example: 'true',
		type: 'string'
	})
	@IsOptional()
	@IsBooleanString({
		message: 'Параметр "unread" должен быть булевым значением'
	})
	unread?: string;

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
