import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { UpdateMessageDto } from './update-message.dto';

export class ValidateBeforeUpdateMessageDto extends UpdateMessageDto {
	@IsNotEmpty({ message: 'Содержимое сообщения не может быть пустым' })
	@IsString({ message: 'Содержимое сообщения должно быть строкой' })
	@MinLength(100, { message: 'Сообщение не должно быть пустым' })
	@ApiProperty({
		description: 'Содержимое сообщения',
		example: 'Привет, как дела?'
	})
	content: string;
}
