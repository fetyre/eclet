import { Module } from '@nestjs/common';
import { UserChatStatusService } from './user-chat-status.service';
import { UserChatStatusController } from './user-chat-status.controller';
import { ValidateService } from 'src/validate/validate.service';
import { ChatSocketGateway } from 'src/chat-socketio/chat-socketio.gateway';
import { JwtService } from 'src/jwt/jwt.service';
import { ChatSocketService } from 'src/chat-socketio/chat-socketio.service';

@Module({
  controllers: [UserChatStatusController],
	providers: [UserChatStatusService, ValidateService, ChatSocketGateway, JwtService, ChatSocketService]
})
export class UserChatStatusModule {}
