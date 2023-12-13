import { Global, Module } from '@nestjs/common';
import { ValidateService } from './validate.service';
import { ConfigLoaderModule } from 'src/settings/config/config-loader.module';
import { ConfigLoaderService } from 'src/settings/config/config-loader.service';
// import { ConfigService } from '@nestjs/config';
// import { LoggerModule } from 'src/settings/logger/logger.module';

@Global()
@Module({
	imports: [ConfigLoaderModule],
	// imports: [LoggerModule],
	providers: [ValidateService, ConfigLoaderService]
})
export class ValidateModule {}
