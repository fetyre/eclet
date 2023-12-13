import { Module } from '@nestjs/common';
import { StrategyService } from './strategy.service';
import { ValidateService } from 'src/validate/validate.service';
import { BlackListService } from 'src/black-list/black-list.service';
import {
	JwtAccessStrategy,
	JwtAdminAccessStrategy,
	JwtConfirmationStrategy,
	JwtRefreshStrategy,
	JwtSuperAdminAccessStrategy
} from './strategies';

@Module({
	providers: [
		StrategyService,
		ValidateService,
		BlackListService,
		JwtAccessStrategy,
		JwtAdminAccessStrategy,
		JwtConfirmationStrategy,
		JwtRefreshStrategy,
		JwtSuperAdminAccessStrategy
		// LocalStrategy
	]
})
export class StrategyModule {}
