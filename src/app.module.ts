import {
	Logger,
	MiddlewareConsumer,
	Module,
	NestModule,
	RequestMethod
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { config } from './settings/config';
import { validationSchema } from './settings/config/config.schema';
import { UserModule } from './user/user.module';
import { CommonModule } from './common/common.module';
import { JwtModule } from './jwt/jwt.module';
import { MailerModule } from './mailer/mailer.module';
import { CacheModule } from '@nestjs/cache-manager';
import { PrismaModule } from './settings/prisma.database/prisma.module';
import { EmailModule } from './email/email.module';
import { BlackListModule } from './black-list/black-list.module';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullModule } from '@nestjs/bull';
import { ExpressAdapter } from '@bull-board/express';
import { ScheduleModule } from '@nestjs/schedule';
import { ChatModule } from './chat/chat.module';
import { AnonymousUserModule } from './anonymous-user/anonymous-user.module';
import { SupportChat } from './supportUser/supportUser.module';
import { MessagesModule } from './messages/messages.module';
import { ChatSocketioModule } from './chat-socketio/chat-socketio.module';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ValidateModule } from './validate/validate.module';
import { EncryptionModule } from './encryption/security.module';
import { ConfigLoaderModule } from './settings/config/config-loader.module';
import { DevtoolsModule } from '@nestjs/devtools-integration';
import { ErrorHandlerModule } from './errro-catch/error-catch.module';
import { ResetPasswordLoginModule } from './reset-password-login/reset-password-login.module';
import { ConfirmEmailRegusterModule } from './confirm-email-reguster/confirm-email-reguster.module';
import { OauthAuthModule } from './oauth-auth/oauth-auth.module';
import { ResetUserEmailModule } from './reset-user-email/reset-user-email.module';
import { ResetUserPasswordModule } from './reset-user-password/reset-user-password.module';
import { StrategyModule } from './strategy/strategy.module';
import { AdvertisementModule } from './advertisement/advertisement.module';
import { BannedWordModule } from './bannes-word/banned-word.module';
import { UserChatStatusModule } from './user-chat-status/user-chat-status.module';
import { AdsCategoriesModule } from './ads-categories/ads-categories.module';
import { FavouriteModule } from './favourite/favourite.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { GoogleRecaptchaModule } from '@nestlab/google-recaptcha';
import { ConfigLoaderService } from './settings/config/config-loader.service';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { gqlErrorHandler } from './error/q';
import {
	AcceptLanguageResolver,
	CookieResolver,
	HeaderResolver,
	I18nModule,
	QueryResolver
} from 'nestjs-i18n';
import path, { join } from 'path';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			validationSchema,
			load: [config]
		}),
		I18nModule.forRootAsync({
			useFactory: (configLoaderService: ConfigLoaderService) => ({
				fallbackLanguage: configLoaderService.i18nLanguage,
				loaderOptions: {
					path: join(__dirname, '/i18n/'),
					watch: true
				}
			}),
			resolvers: [
				new QueryResolver(['lang', 'l']),
				new HeaderResolver(['x-custom-lang']),
				new CookieResolver(),
				AcceptLanguageResolver
			],
			inject: [ConfigLoaderService]
		}),
		PrometheusModule.register({
			defaultMetrics: {
				enabled: true
			},
			defaultLabels: {
				app: 'eclet'
			}
		}),
		ThrottlerModule.forRoot([
			{
				ttl: 800,
				limit: 10
			}
		]),
		GoogleRecaptchaModule.forRootAsync({
			inject: [ConfigLoaderService],
			useFactory: (configLoaderService: ConfigLoaderService) => ({
				secretKey: configLoaderService.googleRecaptchaSecret,
				response: req => req.body.recaptha,
				action: 'Send',
				score: 0.8
			})
		}),
		ConfigLoaderModule,
		DevtoolsModule.register({
			http: process.env.NODE_ENV !== 'production'
		}),
		BullModule.forRoot({
			redis: {
				host: 'redis',
				port: 6379
			}
		}),
		BullBoardModule.forRoot({
			route: '/queues',
			adapter: ExpressAdapter
		}),
		ScheduleModule.forRoot(),
		CacheModule.register({
			isGlobal: true
		}),
		GraphQLModule.forRoot<ApolloDriverConfig>({
			driver: ApolloDriver,
			autoSchemaFile: true
			// formatError: gqlErrorHandler
		}),
		UserModule,
		ErrorHandlerModule,
		AuthModule,
		JwtModule,
		CommonModule,
		MailerModule,
		PrismaModule,
		EmailModule,
		BlackListModule,
		ChatModule,
		AnonymousUserModule,
		SupportChat,
		MessagesModule,
		ChatSocketioModule,
		ValidateModule,
		EncryptionModule,
		ResetPasswordLoginModule,
		ConfirmEmailRegusterModule,
		OauthAuthModule,
		ResetUserEmailModule,
		ResetUserPasswordModule,
		StrategyModule,
		AdvertisementModule,
		BannedWordModule,
		UserChatStatusModule,
		FavouriteModule,
		AdsCategoriesModule
	],
	providers: [ConfigService]
})
export class AppModule implements NestModule {
	private readonly logger = new Logger(AppModule.name);
	configure(consumer: MiddlewareConsumer) {
		consumer
			.apply((req, res, next) => {
				this.logger.debug(`Incoming request: ${req.method} ${req.url}`);
				next();
			})
			.forRoutes({ path: '*', method: RequestMethod.ALL });
	}
}
