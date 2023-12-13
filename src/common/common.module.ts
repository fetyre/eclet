import { Global, Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { PrismaService } from 'src/settings/prisma.database/prisma.service';

@Global()
@Module({
	providers: [CommonService, PrismaService],
	exports: [CommonService]
})
export class CommonModule {}
