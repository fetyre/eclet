import { Field, InputType, Int } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import {
	IsOptional,
	IsString,
	Matches,
	IsInt,
	IsPositive,
	Max,
	Min,
	IsBoolean,
	IsIn,
	Length
} from 'class-validator';
import { ID_REGEX } from 'src/common/constss/regex.const';

@InputType()
export class ReviewsFilterInput {
	// тут
	@Field(() => String, {
		nullable: true,
		description: 'Направление сортировки'
	})
	@ApiProperty({
		description: 'Направление сортировки.',
		required: false,
		enum: String
	})
	@IsOptional()
	@IsIn(['asc', 'desc'], {
		message: 'Значение должно быть либо "asc", либо "desc"'
	})
	@IsString()
	readonly sortOrder?: string;

	// тут
	@Field(() => String, {
		nullable: true,
		description: 'Критерий сортировки'
	})
	@ApiProperty({
		description: 'Критерий сортировки.',
		required: false,
		enum: String
	})
	@IsOptional()
	@IsIn(['createdAt', 'updatedAt', 'rating'], {
		message: 'Значение должно быть либо "createdAt", либо "updatedAt"'
	})
	@IsString()
	readonly sortField?: string;

	@Field({
		nullable: true,
		description: 'Направление сортировки'
	})
	@IsOptional()
	@IsBoolean()
	text?: boolean;

	@Field({
		nullable: true,
		description: 'Направление сортировки'
	})
	@IsOptional()
	@IsString({ message: 'ID пользователя должен быть строкой' })
	@Length(25, 25, {
		message: 'ID пользователя может быть длиною только 25 симловов'
	})
	@Matches(ID_REGEX, {
		message:
			'ID пользователя должен содержать только буквы (в обоих регистрах), цифры и дефисы'
	})
	@ApiProperty({
		description: 'ID пользователя ',
		example: 'ckpfn8skk0000j29z3l9l4d1z'
	})
	recipientId?: string;

	@Field({
		nullable: true,
		description: 'Направление сортировки'
	})
	@IsOptional()
	@IsString({ message: 'ID пользователя должен быть строкой' })
	@Length(25, 25, {
		message: 'ID пользователя может быть длиною только 25 симловов'
	})
	@Matches(ID_REGEX, {
		message:
			'ID пользователя должен содержать только буквы (в обоих регистрах), цифры и дефисы'
	})
	@ApiProperty({
		description: 'ID пользователя ',
		example: 'ckpfn8skk0000j29z3l9l4d1z'
	})
	authorId?: string;

	@Field(() => Int, { nullable: true, description: 'Номер страницы' })
	@ApiProperty({ description: 'Номер страницы.', required: false })
	@IsOptional()
	@IsInt({ message: 'Номер страницы должен быть целым числом' })
	@IsPositive({ message: 'Номер страницы должен быть положительным числом' })
	@Min(1, { message: 'Номер страницы должен быть не меньше 1' })
	readonly page: number;

	@Field(() => Int, {
		nullable: true,
		description: 'Количество элементов на странице'
	})
	@ApiProperty({
		description: 'Количество элементов на странице.',
		required: false
	})
	@IsOptional()
	@IsInt({
		message: 'Количество элементов на странице должно быть целым числом'
	})
	@IsPositive({
		message: 'Количество элементов на странице должно быть положительным числом'
	})
	@Min(1, {
		message: 'Количество элементов на странице должно быть не меньше 1'
	})
	@Max(100, {
		message: 'Превышено максимальное количество элементов на странице'
	})
	readonly pageSize: number;
}
