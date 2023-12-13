import { PrismaClientOptions } from '@prisma/client/runtime/library';
import { IEmailConfig } from './email-config.interface';
import { IJwt } from './jwt.interface';
import { OAuthInterface } from './oauth-interface';
import { IMailerSubject } from './mailer-subject.interface';
import { IErrorConfig } from './error-config.inetrface';
import { IParamsId } from './id-config.interface';
import { IMessageConfig } from './message-config.inetrface';
import { IMailBullParams } from './mail-bull-params.interface';
import { IUserResetsParams } from './users.resets.config';

export interface IConfig {
	id: string;
	port: number;
	domain: string;
	passwordResetLimit: number;
	emailModelTokensLimit: number;
	lifetimeOfOnePassworResetAttempt: number;
	db: PrismaClientOptions;
	jwt: IJwt;
	emailService: IEmailConfig;
	oauth: OAuthInterface;
	mailerSubject: IMailerSubject;
	cryptoRandomBytes: number;
	emailTokenExpirattionTime: number;
	userResetParams: IUserResetsParams;
	message: IMessageConfig;
	// idParams: IParamsId;
	error: IErrorConfig;
	mailBullParams: IMailBullParams;
	lastResetPasswordTime: number;
	elasticsearchAdsIndex: string;
	elasticsearchLoggerErrorIndex: string;
	elasticsearchLoggerOtherIndex: string;
	googleRecaptchaSecret: string;
	i18nLanguage: string;
	i18nWatch: string;
}
