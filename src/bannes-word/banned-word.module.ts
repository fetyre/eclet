import { Module } from '@nestjs/common';
import { BannedWordService } from './banned-word.service';
import { BannedWordResolver } from './banned-word.resolver';
import { ValidateService } from 'src/validate/validate.service';

@Module({
	providers: [BannedWordResolver, BannedWordService, ValidateService]
})
export class BannedWordModule {}
