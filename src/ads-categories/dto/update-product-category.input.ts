import { CreateProductCategoryInput } from './create-product-category.input';
import { InputType, Field, PartialType } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, Length } from 'class-validator';
import { IUpdateAdsCategory } from '../interface';

@InputType()
export class UpdateProductCategoryInput
	extends PartialType(CreateProductCategoryInput)
	implements IUpdateAdsCategory
{
	@Field({ description: 'ID обновляемой категории' })
	@IsNotEmpty({ message: 'ID категории не может быть пустым' })
	@IsString({ message: 'ID категории должен быть строкой' })
	@Length(25, 25, {
		message: 'ID категории должен быть длиной 25 символов'
	})
	@Matches(/^[a-zA-Z0-9-]+$/, {
		message:
			'ID категории должен содержать только буквы (в обоих регистрах), цифры и дефисы'
	})
	@ApiProperty({
		description: 'ID категории ',
		example: 'ckpfn8skk0000j29z3l9l4d1z',
		maxLength: 25,
		required: true
	})
	public readonly id!: string;
}
