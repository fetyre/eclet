import { PartialType } from '@nestjs/mapped-types';
import { CreateChatSocketioDto } from './create-chat-socketio.dto';

export class UpdateChatSocketioDto extends PartialType(CreateChatSocketioDto) {
  id: number;
}
