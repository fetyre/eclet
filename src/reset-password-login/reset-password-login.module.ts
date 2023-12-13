import { Module } from '@nestjs/common';
import { ResetPasswordLoginService } from './reset-password-login.service';
import { ResetPasswordLoginController } from './reset-password-login.controller';
import { MailerService } from 'src/mailer/mailer.service';
import { ValidateService } from 'src/validate/validate.service';
import { BullModule } from '@nestjs/bull';

@Module({
	imports: [
		BullModule.registerQueue({
			name: 'mail'
		})
	],
	controllers: [ResetPasswordLoginController],
	providers: [ResetPasswordLoginService, MailerService, ValidateService]
})
export class ResetPasswordLoginModule {}
