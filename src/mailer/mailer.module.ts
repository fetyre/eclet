import { Module } from '@nestjs/common';
import { MailerService } from './mailer.service';
import { ConfigLoaderService } from 'src/settings/config/config-loader.service';
import { BullModule } from '@nestjs/bull';
import { MailProcessor } from './mailer.processor';

@Module({
	imports: [
		BullModule.registerQueue({
			name: 'mail'
		}),
		// BullBoardModule.forFeature({
		// 	name: 'mail',
		// 	adapter: BullMQAdapter
		// })
	],
	providers: [MailerService, ConfigLoaderService, MailProcessor],
	exports: [MailerService]
})
export class MailerModule {}
