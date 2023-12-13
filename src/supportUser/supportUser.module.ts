import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/settings/prisma.database/prisma.module';
import { SupportUserService } from './supportUser.service';
import { SupportUserController } from './supportUser.controller';
import { MailerModule } from 'src/mailer/mailer.module';

@Module({
	imports: [PrismaModule, MailerModule],
	controllers: [SupportUserController],
	providers: [SupportUserService]
})
export class SupportChat {}
