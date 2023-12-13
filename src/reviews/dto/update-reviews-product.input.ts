import { ApiProperty } from '@nestjs/swagger';
import {
	IsOptional,
	IsString,
	MinLength,
	MaxLength,
	Matches,
	IsNotEmpty,
	IsInt,
	IsNumber,
	Max,
	Min,
	Length
} from 'class-validator';
import { InputType, Field, ID, Int } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { IUpdateReview } from '../interface';
import { ID_REGEX, CONTENT_REGEX } from 'src/common/constss/regex.const';

@InputType()
export class UpdateReviewsProductInput implements IUpdateReview {
	@Field({ description: 'Текст отзыва', nullable: true })
	@IsOptional()
	@IsString({ message: 'Текст отзыва должен быть строкой' })
	@MinLength(1, { message: 'Текст отзыва должен содержать хотя бы 1 символ' })
	@MaxLength(500, { message: 'Текст отзыва не должен превышать 500 символов' })
	@Matches(CONTENT_REGEX, {
		message: 'Текст отзыва должен содержать только символы ASCII и эмоции'
	})
	@Transform(({ value }) => value.replace(/\s+/g, ' ').trim())
	text?: string;

	@Field(() => Int, { description: 'Оценка отзыва' })
	@ApiProperty({
		description: 'Оценка продукта',
		example: 4
	})
	@IsNotEmpty({ message: 'Оценка не может быть пустой' })
	@IsNumber({}, { message: 'Оценка должна быть числом' })
	@IsInt({ message: 'Оценка должна быть целым числом' })
	@Min(1, { message: 'Оценка должна быть не меньше 1' })
	@Max(5, { message: 'Оценка должна быть не больше 5' })
	rating?: number;

	@Field(() => ID, { description: 'Идентификатор отзыва' })
	@IsNotEmpty({ message: 'ID отзыва не может быть пустым' })
	@IsString({ message: 'ID отзыва должен быть строкой' })
	@Length(25, 25, {
		message: 'ID отзыва может быть длиною только 25 символов'
	})
	@Matches(ID_REGEX, {
		message:
			'ID отзыва должен содержать только буквы (в обоих регистрах), цифры и дефисы'
	})
	@ApiProperty({
		description: 'ID отзыва',
		example: 'ckpfn8skk0000j29z3l9l4d1z'
	})
	reviewId: string;
}
