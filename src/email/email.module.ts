import { Logger, Module } from '@nestjs/common'
import { EmailService } from './email.service'
import { PrismaModule } from 'src/settings/prisma.database/prisma.module'
// import { MyLogger } from 'nestjs-pino'

@Module({
	imports: [PrismaModule],
	providers: [EmailService],
	exports: [EmailService]
})
export class EmailModule {}
