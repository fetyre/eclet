import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/settings/prisma.database/prisma.module';
import { JwtService } from 'src/jwt/jwt.service';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { CommonService } from 'src/common/common.service';
import { ConfigLoaderService } from 'src/settings/config/config-loader.service';
import { ConfigLoaderModule } from 'src/settings/config/config-loader.module';
import { ValidateService } from 'src/validate/validate.service';
import { ChatSocketGateway } from 'src/chat-socketio/chat-socketio.gateway';
import { ChatSocketioModule } from 'src/chat-socketio/chat-socketio.module';
import { ChatSocketService } from 'src/chat-socketio/chat-socketio.service';

@Module({
	imports: [PrismaModule, ConfigLoaderModule, ChatSocketioModule],
	controllers: [ChatController],
	providers: [
		ChatService,
		JwtService,
		CommonService,
		ConfigLoaderService,
		ValidateService,
		ChatSocketGateway,
		ChatSocketService
	]
})
export class ChatModule {}
