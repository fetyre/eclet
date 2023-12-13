import { Module } from '@nestjs/common';
import { AdvertisementService } from './advertisement.service';
import { AdvertisementResolver } from './advertisement.resolver';
import { BullModule } from '@nestjs/bull';
import { ValidateService } from 'src/validate/validate.service';
import { ModerationProcessor } from './advertisement.processor';
import { MailerService } from 'src/mailer/mailer.service';
import { MailerModule } from 'src/mailer/mailer.module';
// import { ElasticService } from 'src/elastic/elastic.service';
// import { ElasticsearchService } from '@nestjs/elasticsearch';

@Module({
	imports: [
		BullModule.registerQueue({
			name: 'advertisement'
		}),
		BullModule.registerQueue({
			name: 'mail'
		}),
		MailerModule
	],
	providers: [
		AdvertisementResolver,
		AdvertisementService,
		ValidateService,
		ModerationProcessor,
		MailerService
		// ElasticService,
		// ElasticsearchService
	]
})
export class AdvertisementModule {}
