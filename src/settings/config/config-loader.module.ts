import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConfigLoaderService } from './config-loader.service';

@Global()
@Module({
	imports: [ConfigModule],
	providers: [ConfigLoaderService],
	exports: [ConfigLoaderService]
})
export class ConfigLoaderModule {}
