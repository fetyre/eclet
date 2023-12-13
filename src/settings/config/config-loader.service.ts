import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
	IJwt,
	IEmailConfig,
	OAuthInterface,
	IErrorConfig,
	IMailBullParams,
	IMailerSubject,
	IMessageConfig,
	IParamsId
} from './interface';
import { PrismaClientOptions } from '@prisma/client/runtime/library';
import { IUserResetsParams } from './interface/users.resets.config';
import { BOOLEAN_STRING_TRUE } from 'src/constants/global-constants';

@Injectable()
export class ConfigLoaderService {
	readonly issuer: string;
	readonly port: number;
	readonly domain: string;
	readonly passwordResetLimit: number;
	readonly emailModelTokensLimit: number;
	readonly lifetimeOfOnePassworResetAttempt: number;
	readonly db: PrismaClientOptions;
	readonly jwtConfig: IJwt;
	readonly emailConfig: IEmailConfig;
	readonly oauthConfig: OAuthInterface;
	readonly mailerSubjectConfig: IMailerSubject;
	readonly cryptoRandomBytes: number;
	readonly emailTokenExpirattionTime: number;
	readonly userResetConfig: IUserResetsParams;
	readonly messageConfig: IMessageConfig;
	// readonly idConfig: IParamsId;
	readonly errorConfig: IErrorConfig;
	readonly mailBullConfig: IMailBullParams;
	readonly lastResetPasswordTime: number;
	readonly elasticsearchAdsIndex: string;
	readonly elasticsearchLoggerErrorIndex: string;
	readonly elasticsearchLoggerOtherIndex: string;
	readonly googleRecaptchaSecret: string;
	readonly i18nLanguage: string;
	readonly i18nWatch: boolean;

	constructor(private readonly configService: ConfigService) {
		this.jwtConfig = this.configService.get<IJwt>('jwt');
		this.issuer = this.getStringConfig('id');
		this.domain = this.getStringConfig('domain');
		this.passwordResetLimit = this.getNumberConfig('passwordResetLimit');
		this.emailModelTokensLimit = this.getNumberConfig('emailModelTokensLimit');
		this.lifetimeOfOnePassworResetAttempt = this.getNumberConfig(
			'lifetimeOfOnePassworResetAttempt'
		);
		this.cryptoRandomBytes = this.getNumberConfig('cryptoRandomBytes');
		this.emailTokenExpirattionTime = this.getNumberConfig(
			'emailTokenExpirattionTime'
		);
		this.emailConfig = this.configService.get<IEmailConfig>('emailService');
		this.messageConfig = this.configService.get<IMessageConfig>('emailService');
		this.mailerSubjectConfig =
			this.configService.get<IMailerSubject>('mailerSubject');
		// this.idConfig = this.configService.get<IParamsId>('idParams');
		this.mailBullConfig =
			this.configService.get<IMailBullParams>('mailBullParams');
		this.userResetConfig =
			this.configService.get<IUserResetsParams>('userResetParams');
		this.errorConfig = this.configService.get<IErrorConfig>('error');
		this.oauthConfig = this.configService.get<OAuthInterface>('oauth');
		this.lastResetPasswordTime = this.getNumberConfig('lastResetPasswordTime');
		this.elasticsearchAdsIndex = this.getStringConfig('elasticsearchAdsIndex');
		this.elasticsearchLoggerErrorIndex = this.getStringConfig(
			'elasticsearchLoggerErrorIndex'
		);
		this.elasticsearchLoggerOtherIndex = this.getStringConfig(
			'elasticsearchLoggerOtherIndex'
		);
		this.googleRecaptchaSecret = this.getStringConfig('googleRecaptchaSecret');
		this.i18nLanguage = this.getStringConfig('i18nLanguage');
		this.i18nWatch = this.getStringConfig('i18nWatch') === BOOLEAN_STRING_TRUE;
	}

	private getNumberConfig(key: string): number {
		return this.configService.get<number>(key);
	}

	private getStringConfig(key: string): string {
		return this.configService.get<string>(key);
	}
}
