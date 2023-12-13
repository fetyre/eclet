import { Module } from '@nestjs/common';
import { ResetUserEmailService } from './reset-user-email.service';
import { ResetUserEmailController } from './reset-user-email.controller';
import { ValidateService } from 'src/validate/validate.service';
import { EmailService } from 'src/email/email.service';
import { MailerService } from 'src/mailer/mailer.service';
import { BullModule } from '@nestjs/bull';

@Module({
	imports: [
		BullModule.registerQueue({
			name: 'mail'
		})
	],
	controllers: [ResetUserEmailController],
	providers: [
		ResetUserEmailService,
		ValidateService,
		EmailService,
		MailerService
	]
})
export class ResetUserEmailModule {}
