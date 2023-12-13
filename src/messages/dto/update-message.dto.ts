import { IsBoolean, IsIn, IsOptional } from 'class-validator';
import { CreateMessageDto } from './create-message.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IUpdateMessage } from '../interface';

export class UpdateMessageDto
	extends CreateMessageDto
	implements IUpdateMessage
{
	@IsOptional()
	@IsBoolean()
	@IsIn([true], {
		message: 'Сообщение должно быть в состоянии true.'
	})
	@ApiProperty({
		description: 'Статус прочтения сообщения',
		type: 'boolean',
		required: false,
		default: false,
		example: true,
		readOnly: true
	})
	public readonly isRead?: boolean;
}
