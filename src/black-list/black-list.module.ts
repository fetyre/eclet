import { Module } from '@nestjs/common';
import { BlackListService } from './black-list.service';
import { PrismaModule } from 'src/settings/prisma.database/prisma.module';
import { ValidateService } from 'src/validate/validate.service';

@Module({
	imports: [PrismaModule],
	providers: [BlackListService, ValidateService]
})
export class BlackListModule {}
