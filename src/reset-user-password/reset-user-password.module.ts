import { Module } from '@nestjs/common';
import { ResetUserPasswordService } from './reset-user-password.service';
import { ResetUserPasswordController } from './reset-user-password.controller';
import { ValidateService } from 'src/validate/validate.service';
import { EmailService } from 'src/email/email.service';
import { MailerService } from 'src/mailer/mailer.service';
import { BullModule } from '@nestjs/bull';
import { PasswordModule } from 'src/password/password.module';
import { ResetUserPasswordRepository } from './reset-user-password.repository';

@Module({
	imports: [
		BullModule.registerQueue({
			name: 'mail'
		}),
		PasswordModule
	],
	controllers: [ResetUserPasswordController],
	providers: [
		ResetUserPasswordService,
		ValidateService,
		EmailService,
		MailerService,
		ResetUserPasswordRepository
	]
})
export class ResetUserPasswordModule {}
