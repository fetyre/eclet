import { Module } from '@nestjs/common';
import { SecurityService } from './security.service';
import { ConfigLoaderService } from 'src/settings/config/config-loader.service';

@Module({
	providers: [SecurityService, ConfigLoaderService]
})
export class SecurityModule {}
