import { StatusEnum, UserGender, UserRole, UserStatus } from '@prisma/client';
import {
	IsOptional,
	IsString,
	IsNumber,
	IsIn,
	IsBooleanString,
	IsEnum,
	IsInt,
	IsPositive,
	Max,
	Min,
	IsNotEmpty
} from 'class-validator';
import { UserQueryParams } from '../interface';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { sortOrderValues } from 'src/types';

export class UserQueryParamsDto implements UserQueryParams {
	@ApiPropertyOptional({
		description: 'Статус подтверждения электронной почты',
		example: 'true',
		type: 'string'
	})
	@IsOptional()
	@IsBooleanString({ message: 'Значение должно быть булевой строкой' })
	public readonly isEmailVerified?: string;

	@ApiPropertyOptional({
		description: 'Пол пользователя',
		example: 'man',
		type: 'string'
	})
	@IsOptional()
	@IsEnum(UserGender, {
		message: 'Значение должно быть действительным значением UserGender'
	})
	public readonly gender?: UserGender;

	@ApiPropertyOptional({
		description: 'Онлайн-статус',
		example: 'online',
		type: 'string'
	})
	@IsOptional()
	@IsEnum(StatusEnum, {
		message: 'Значение должно быть действительным значением StatusEnum'
	})
	public readonly status?: StatusEnum;

	@ApiPropertyOptional({
		description: 'Статус учетной записи',
		example: 'active',
		type: 'string'
	})
	@IsOptional()
	@IsEnum(UserStatus, {
		message: 'Значение должно быть действительным значением UserStatus'
	})
	public readonly accountStatus?: UserStatus;

	@ApiPropertyOptional({
		description: 'Роль пользователя',
		example: 'user',
		type: 'string'
	})
	@IsOptional()
	@IsEnum(UserRole, {
		message: 'Значение должно быть действительным значением UserRole'
	})
	public readonly role?: UserRole;

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
	public readonly page: number;

	@ApiPropertyOptional({
		description: 'Размер страницы',
		example: 20,
		type: 'number'
	})
	@IsNotEmpty()
	@IsNumber({}, { message: 'Значение должно быть числом' })
	@IsInt({ message: 'Значение должно быть целым числом' })
	@Min(1, { message: 'Значение должно быть больше или равно 1' })
	@Max(150, { message: 'Значение должно быть меньше или равно 150' })
	@IsPositive({ message: 'Значение должно быть положительным числом' })
	public readonly pageSize: number;

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
	public readonly sortField?: string;

	@ApiPropertyOptional({
		description: 'Порядок сортировки',
		example: 'asc',
		type: 'string'
	})
	@IsOptional()
	@IsIn(sortOrderValues, {
		message: 'Значение должно быть либо "asc", либо "desc"'
	})
	public readonly sortOrder?: string;
}
