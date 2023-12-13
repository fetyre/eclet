import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { CommonService } from 'src/common/common.service';
import { JwtService } from 'src/jwt/jwt.service';
import { ChatSocketGateway } from 'src/chat-socketio/chat-socketio.gateway';
import { ChatSocketioModule } from 'src/chat-socketio/chat-socketio.module';
import { EncryptionModule } from 'src/encryption/security.module';
import { EncryptionService } from 'src/encryption/security.service';
import { ValidateService } from 'src/validate/validate.service';
import { PrismaService } from 'src/settings/prisma.database/prisma.service';
import { BullModule } from '@nestjs/bull';
import { MailerService } from 'src/mailer/mailer.service';
import { ChatSocketService } from 'src/chat-socketio/chat-socketio.service';

@Module({
	imports: [
		BullModule.registerQueue({
			name: 'mail'
		}),
		ChatSocketioModule,
		EncryptionModule
	],
	controllers: [MessagesController],
	providers: [
		MessagesService,
		JwtService,
		CommonService,
		ChatSocketGateway,
		EncryptionService,
		ValidateService,
		PrismaService,
		MailerService,
		ChatSocketService
	]
})
export class MessagesModule {}
