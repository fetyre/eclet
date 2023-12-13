import { ApiProperty } from '@nestjs/swagger';
import {
	IsNotEmpty,
	IsString,
	MinLength,
	MaxLength,
	Matches
} from 'class-validator';
import { IChatIdentifierDto } from './chat-id-socket.dto';

export class CreateChatSocketioDto extends IChatIdentifierDto {
	@IsNotEmpty({ message: 'Содержимое сообщения не может быть пустым' })
	@IsString({ message: 'Содержимое сообщения должно быть строкой' })
	@MinLength(1, { message: 'Сообщение не должно быть пустым' })
	@MaxLength(300, { message: 'Превышена длинна сообщения' })
	@Matches(
		/^[\x00-\x7F\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F923}-\u{1F92F}]*$/u,
		{ message: 'Значение должно содержать только символы ASCII и эмоции' }
	)
	@ApiProperty({
		description: 'Содержимое сообщения',
		example: 'Привет, как дела?'
	})
	message: string;
}
