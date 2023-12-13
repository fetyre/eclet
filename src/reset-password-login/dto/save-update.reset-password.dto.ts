import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
	ArrayMaxSize,
	ArrayNotEmpty,
	IsArray,
	IsNotEmpty,
	IsString,
	Length,
	Matches,
	ValidateNested
} from 'class-validator';
import { ID_REGEX } from 'src/common/constss/regex.const';
import { SeveCreateResetPasswordDto } from './save-create.reset-password.dto';
import { IUpdatePasswordReset } from '../interfaces';

/**
 * @class SeveUpdateResetPasswordDto
 * @classdesc DTO для валидации перед сохранением в бд после создания запроса на обновлние, обновлние существующей модели
 * @throws {BadRequestException} Если возникла ошибка валидации
 * @since 2023-10-30
 * @see {SeveCreateResetPasswordDto} extends
 */
export class SeveUpdateResetPasswordDto
	extends SeveCreateResetPasswordDto
	implements IUpdatePasswordReset
{
	@IsNotEmpty({ message: 'ID модели токена не должен быть пустым' })
	@IsString({ message: 'ID модели токена должен быть строкой' })
	@Length(25, 25, { message: 'Длина ID модели токена должна быть 25 символов' })
	@Matches(ID_REGEX, {
		message:
			'ID модели токена должен содержать только буквы (в обоих регистрах), цифры и дефисы'
	})
	@ApiProperty({
		description: 'ID модели токена',
		example: 'ckpfn8skk0000j29z3l9l4d1z'
	})
	tokenModelId: string;

	@IsNotEmpty({ message: 'Массив дат создания токена не должен быть пустым' })
	@IsArray({ message: 'Должен быть массивом дат создания токена' })
	@ArrayMaxSize(3, {
		message: 'Массив дат создания токена должен содержать максимум 3 элемента'
	})
	@ArrayNotEmpty({
		message: 'Массив дат создания токена не должен быть пустым'
	})
	@ValidateNested({
		each: true,
		message: 'Каждый элемент массива дат создания токена должен быть датой'
	})
	@Type(() => Date)
	timeCreatetoken: Date[];
}
