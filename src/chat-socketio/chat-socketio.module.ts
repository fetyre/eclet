import { Module } from '@nestjs/common';
import { ChatSocketGateway } from './chat-socketio.gateway';
import { JwtService } from 'src/jwt/jwt.service';
import { PrismaService } from 'src/settings/prisma.database/prisma.service';
import { ConfigLoaderService } from 'src/settings/config/config-loader.service';
import { ChatSocketService } from './chat-socketio.service';
import { ValidateService } from 'src/validate/validate.service';
import { UserChatStatusService } from 'src/user-chat-status/user-chat-status.service';

@Module({
	imports: [],
	providers: [
		ChatSocketGateway,
		JwtService,
		PrismaService,
		ConfigLoaderService,
		ChatSocketService,
		ValidateService,
		UserChatStatusService
	]
})
export class ChatSocketioModule {}
