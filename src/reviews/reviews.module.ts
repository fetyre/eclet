import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewsResolver } from './reviews.resolver';
import { PrismaModule } from 'src/settings/prisma.database/prisma.module';

import { ValidateService } from 'src/validate/validate.service';
import { PrismaService } from 'src/settings/prisma.database/prisma.service';
import { EncryptionModule } from 'src/encryption/security.module';
import { ConfigLoaderService } from 'src/settings/config/config-loader.service';
import { EncryptionService } from 'src/encryption/security.service';

@Module({
	imports: [
		PrismaModule,
		// LoggerModule,
		EncryptionModule
		// ConfigLoaderModule
	],
	providers: [
		ReviewsResolver,
		ReviewsService,
		ValidateService,
		PrismaService,
		EncryptionService,
		ConfigLoaderService
	]
})
export class ReviewsModule {}
