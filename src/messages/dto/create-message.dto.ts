import { ApiProperty } from '@nestjs/swagger';
import {
	IsNotEmpty,
	IsString,
	Matches,
	MaxLength,
	MinLength
} from 'class-validator';
import { ICreateMessage } from '../interface/createMessage.interface';
import { CONTENT_REGEX } from 'src/common/constss/regex.const';
// import { RoomNameDto } from './room-name.dto';

export class CreateMessageDto implements ICreateMessage {
	@IsNotEmpty({ message: 'Содержимое сообщения не может быть пустым' })
	@IsString({ message: 'Содержимое сообщения должно быть строкой' })
	@MinLength(1, { message: 'Сообщение не должно быть пустым' })
	@MaxLength(500, { message: 'Превышена длинна сообщения' })
	@Matches(CONTENT_REGEX, {
		message: 'Значение должно содержать только символы ASCII и эмоции'
	})
	@ApiProperty({
		description: 'Содержимое сообщения',
		example: 'Привет, как дела?'
	})
	content: string;
}
