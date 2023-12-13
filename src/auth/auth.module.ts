import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { UserModule } from 'src/user/user.module';
import { PrismaModule } from 'src/settings/prisma.database/prisma.module';
import { JwtService } from 'src/jwt/jwt.service';
import { MailerService } from 'src/mailer/mailer.service';
import { AuthController } from './auth.controller';
import { BlackListService } from 'src/black-list/black-list.service';
import { EmailModule } from 'src/email/email.module';
import { ConfigLoaderModule } from 'src/settings/config/config-loader.module';
import { ConfigLoaderService } from 'src/settings/config/config-loader.service';
import { BullModule } from '@nestjs/bull';
import { ValidateService } from 'src/validate/validate.service';
import { LoginAuthService } from './login/login-auth.service';
import { LogoutAuthService } from './logout/logout-auth.service';
import { TokenAuthService } from './token/token-auth.service';
import { LoginProcessor } from './login/login.processor';

// import { SessionSerializer } from './strategies/SessionSerializer';

@Module({
	imports: [
		BullModule.registerQueue({
			name: 'mail'
		}),
		BullModule.registerQueue({
			name: 'login'
		}),
		UserModule,
		PrismaModule,
		PassportModule,
		EmailModule,
		ConfigLoaderModule
	],
	providers: [
		ValidateService,
		LoginAuthService,
		LogoutAuthService,
		TokenAuthService,
		JwtService,
		MailerService,
		BlackListService,
		ConfigLoaderService,
		LoginProcessor
	],
	exports: [],
	controllers: [AuthController]
})
export class AuthModule {}
