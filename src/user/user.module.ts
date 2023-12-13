import { Module } from '@nestjs/common';
import { UsersService } from './user.service';
import { UserController } from './user.controller';
import { PrismaModule } from 'src/settings/prisma.database/prisma.module';
import { PrismaService } from 'src/settings/prisma.database/prisma.service';
import { BlackListService } from 'src/black-list/black-list.service';
import { BlackListModule } from 'src/black-list/black-list.module';
import { MailerModule } from 'src/mailer/mailer.module';
import { JwtModule } from 'src/jwt/jwt.module';
import { EmailService } from 'src/email/email.service';
import { ConfigLoaderService } from 'src/settings/config/config-loader.service';
import { ValidateService } from 'src/validate/validate.service';
import { UsersRepository } from './user.repository';
import { PasswordModule } from '../password/password.module';

@Module({
	controllers: [UserController],
	providers: [
		UsersService,
		PrismaService,
		BlackListService,
		EmailService,
		ConfigLoaderService,
		ValidateService,
		UsersRepository
	],
	imports: [
		PrismaModule,
		BlackListModule,
		MailerModule,
		JwtModule,
		PasswordModule
	],
	exports: [UsersService]
})
export class UserModule {}
