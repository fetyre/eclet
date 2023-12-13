import { UserGender } from '@prisma/client';
import {
	IsDate,
	IsEnum,
	IsOptional,
	IsPhoneNumber,
	IsString,
	Length,
	Matches,
	MaxDate,
	MinDate
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { NAME_REGEX } from 'src/common/constss/regex.const';
import { Transform } from 'class-transformer';
import { IUserUpdate } from '../interface';

/**
 * @class UpdateUserDto
 * @description DTO для валидации данных для обновлния
 * @extends IUserUpdate interface
 */
export class UpdateUserDto implements IUserUpdate {
	@ApiProperty({
		description: 'Имя пользователя',
		example: 'Иван',
		required: false,
		type: 'string'
	})
	@IsOptional()
	@IsString({ message: 'Имя пользователя должно быть строкой.' })
	@Length(3, 100, {
		message: 'Имя пользователя должно содержать от 3 до 100 символов.'
	})
	@Matches(NAME_REGEX, {
		message:
			'Имя пользователя может содержать только буквы (как заглавные, так и строчные), цифры, апострофы, точки, пробелы и тире.'
	})
	public readonly username?: string;

	@ApiProperty({
		description:
			"Телефонный номер пользователя. Он должен быть строкой, соответствовать формату телефонных номеров для Беларуси ('BY'), и иметь длину от 3 до 106 символов.",
		example: '+375291234567',
		required: false,
		type: 'string'
	})
	@IsPhoneNumber('BY', {
		message: 'Телефонный номер должен соответствовать формату для Беларуси'
	})
	@IsString({ message: 'Телефонный номер должен быть строкой' })
	@IsOptional({ message: 'Телефонный номер является необязательным полем' })
	@Length(3, 106, {
		message: 'Телефонный номер должен иметь длину от 3 до 106 символов'
	})
	public readonly phoneNumber?: string;

	@ApiProperty({
		description: 'Пол пользователя.',
		example: 'man',
		enum: UserGender,
		enumName: 'UserGender'
	})
	@Transform(value => value.value.toLowerCase())
	@IsString({ message: 'Пол должен быть строкой' })
	@IsOptional({ message: 'Пол является необязательным полем' })
	@IsEnum(UserGender, {
		message:
			'Пол должен быть одним из следующих значений: ' +
			Object.values(UserGender).join(', ')
	})
	public readonly gender?: UserGender;

	@ApiProperty({
		description: 'Дата рождения пользователя',
		type: 'string',
		format: 'date-time',
		example: '1990-01-01T00:00:00Z'
	})
	@IsDate({ message: 'Дата Рождения должна быть датой' })
	@MinDate(new Date('1900-01-01'), {
		message: 'Дата Рождения не может быть раньше 1 января 1900 года'
	})
	@MaxDate(new Date(), {
		message: 'Дата Рождения не может быть позже текущей даты'
	})
	@IsOptional({ message: 'Дата Рождения является необязательным полем' })
	public readonly dateOfBirth?: Date;
}
