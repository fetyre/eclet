import { Logger, Module } from '@nestjs/common';
import { AnonymousUserService } from './anonymous-user.service';
import { AnonymousUserController } from './anonymous-user.controller';
import { PrismaModule } from 'src/settings/prisma.database/prisma.module';
import { JwtService } from 'src/jwt/jwt.service';
import { ConfigLoaderService } from 'src/settings/config/config-loader.service';
import { ConfigLoaderModule } from 'src/settings/config/config-loader.module';

@Module({
	imports: [PrismaModule ,ConfigLoaderModule],
	controllers: [AnonymousUserController],
	providers: [AnonymousUserService, Logger, JwtService, ConfigLoaderService]
})
export class AnonymousUserModule {}
