import { PrismaClientOptions } from '@prisma/client/runtime/library';
import { IConfig } from './interface/config.interface';

export function config(): IConfig {
	return {
		id: process.env.APP_ID,
		port: parseInt(process.env.PORT, 10),
		domain: process.env.DOMAIN,
		passwordResetLimit: parseInt(process.env.PASSWORD_RESET_LIMIT, 10),
		emailModelTokensLimit: parseInt(process.env.EMAIL_MODEL_TOKENS_LIMIT, 10),
		i18nLanguage: process.env.I18N_LANGUAGE,
		i18nWatch: process.env.I18N_LANGUAGE,
		lifetimeOfOnePassworResetAttempt: parseInt(
			process.env.LIFETIME_OF_ONE_PASSWORD_RESET_ATTEMPT,
			10
		),
		cryptoRandomBytes: parseInt(process.env.CRYPTO_RANDOM_BYTES, 10),
		emailTokenExpirattionTime: parseInt(
			process.env.EMAIL_TOKEN_EXPIRATION_TIME,
			10
		),
		lastResetPasswordTime: parseInt(
			process.env.EMAIL_TOKEN_EXPIRATION_TIME,
			10
		),
		elasticsearchAdsIndex: process.env.ELASTICSEARCH_ADS_INDEX,
		elasticsearchLoggerErrorIndex: process.env.ELASTICSEARCH_LOGGER_ERROR_INDEX,
		elasticsearchLoggerOtherIndex: process.env.ELASTICSEARCH_LOGGER_OTHER_INDEX,
		googleRecaptchaSecret: process.env.GOOGLE_RECAPTCHA_SECRET,
		userResetParams: {
			email: {
				maxAttemptMessageReset: parseInt(
					process.env.MAX_ATTEMPT_MESSAGE_RESET_EMAIL,
					10
				),
				confirmationCodeResendInterval: parseInt(
					process.env.CONFIRMATION_CODE_RESEND_EMAIL_INTERVAL,
					10
				),
				dailyResetCodeAttemptsLimit: parseInt(
					process.env.DAILY_RESET_EMAIL_CODE_ATTEMPTS_LIMIT,
					10
				),
				resetInterval: parseInt(process.env.EMAIL_RESET_INTERVAL, 10),
				timeLiveReset: parseInt(process.env.TIME_LIVE_RESET_EMAIL_CODE, 10)
			},
			password: {
				maxAttemptMessageReset: parseInt(
					process.env.MAX_ATTEMPT_MESSAGE_RESET_PASSWORD,
					10
				),
				confirmationCodeResendInterval: parseInt(
					process.env.CONFIRMATION_CODE_RESEND_PASSWORD_INTERVAL,
					10
				),
				dailyResetCodeAttemptsLimit: parseInt(
					process.env.DAILY_RESET_PASSWORD_CODE_ATTEMPTS_LIMIT,
					10
				),
				resetInterval: parseInt(process.env.PASSWORD_RESET_INTERVAL, 10),
				timeLiveReset: parseInt(process.env.TIME_LIVE_RESET_PASSWORD_CODE, 10)
			}
		},
		mailBullParams: {
			mailQueueMaxAttempts: 3,
			mailQueueBackoffInterval: 5000
		},
		message: {
			messageUpdateTime: parseInt(process.env.MESSAGE_UPDATE_TIME, 10),
			messagePrivateKey: process.env.MESSAGE_PRIVATE_KEY,
			messagePublicKey: process.env.MESSAGE_PUBLIC_KEY
		},
		// idParams: {
		// 	idLenght: 25,
		// 	idRegex: '^[a-zA-Z0-9-]+$'
		// },
		error: {
			errorDefaultMessage: 'Внутренняя ошибка сервера',
			errorDefaultStatus: 500
		},
		mailerSubject: {
			mailerSubjectConfirmation: 'Подтвердите ваш адрес электронной почты',
			mailerSubjectResetPassword: 'Инстуркция сброса пароля',
			mailerSubjectAfterReset: 'Пароль успешно сброшен',
			mailerSubjectAfterResetInSettings: 'Ваш пароль был сброшен',
			mailerSubjectConfirmationChangeInSettings: 'Подтвержение смены почты',
			mailerSubjectConfirmationInSettingsAfterReset: 'Подтвержение почты',
			mailerSubjectUserResetPasswordCode: 'Подтвержение смены пароля',
			mailerSubjectAdsModerationStatus: 'Ваше объявление не прошло модерацию',
			mailerSubjectLoginInfo: 'Успешный вход в ваш аккаунт',
			meilerSubjectMessageInfo: 'У вас новое сообщение'
		},
		jwt: {
			access: {
				privateKey: process.env.JWT_ACCESS_PRIVATE_KEY,
				publicKey: process.env.JWT_ACCESS_PUBLIC_KEY,
				time: parseInt(process.env.JWT_ACCESS_TIME, 10)
			},
			confirmation: {
				privateKey: process.env.JWT_CONFIRMATION_PRIVATE_KEY,
				publicKey: process.env.JWT_CONFIRMATION_PUBLIC_KEY,
				time: parseInt(process.env.JWT_CONFIRMATION_TIME, 10)
			},
			refresh: {
				privateKey: process.env.JWT_REFRESH_PRIVATE_KEY,
				publicKey: process.env.JWT_REFRESH_PUBLIC_KEY,
				time: parseInt(process.env.JWT_REFRESH_TIME, 10)
			},
			resetPassword: {
				privateKey: process.env.JWT_RESET_PASSWORD_PRIVATE_KEY,
				publicKey: process.env.JWT_RESET_PASSWORD_PUBLIC_KEY,
				time: parseInt(process.env.JWT_RESET_PASSWORD_TIME, 10)
			}
		},
		emailService: {
			host: process.env.EMAIL_HOST,
			port: parseInt(process.env.EMAIL_PORT, 10),
			secure: process.env.EMAIL_SECURE === 'true',
			auth: {
				user: process.env.EMAIL_USER,
				pass: process.env.EMAIL_PASSWORD
			}
		},
		oauth: {
			google: {
				id: process.env.OAUTH_GOOGLE_ID,
				secret: process.env.OAUTH_GOOGLE_SECRET,
				redirectUrl: process.env.OAUTH_GOOGLE_REDIRECT_URL
			},
			facebook: {
				id: process.env.OAUTH_FACEBOOK_ID,
				secret: process.env.OAUTH_FACEBOOK_SECRET,
				redirectUrl: process.env.OAUTH_FACEBOOK_REDIRECT_URL
			}
		},
		db: {
			clientUrl: process.env.DATABASE_URL,
			log: ['query', 'error', 'warn'],
			errorFormat: 'pretty',
			datasources: {
				db: {
					url: process.env.DATABASE_URL
				}
			}
		} as PrismaClientOptions
	};
}

// redis: redisUrlParser(process.env.REDIS_URL)
