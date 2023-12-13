import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, IsNotEmpty, IsNumberString } from 'class-validator';
import { ICodeEmailReset } from '../interface';

export class UpdateResetUserEmailDto implements ICodeEmailReset {
	@ApiProperty({
		description: 'Код подтверждения (должен содержать только цифры)',
		example: '12345'
	})
	@IsString()
	@Length(5, 5, { message: 'Код подтверждения должен состоять из 5 символов' })
	@IsNotEmpty({ message: 'Код подтверждения не должен быть пустым' })
	@IsNumberString()
	public readonly code!: string;
}
