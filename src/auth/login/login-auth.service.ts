import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { EmailToken, StatusEnum, User } from '@prisma/client';
import { PrismaService } from 'src/settings/prisma.database/prisma.service';
import {
	OptionalEmailToken,
	OptionalUserWithCredentials,
	UserWithCredentials
} from './type/login-auth.type';
import { TokenTypeEnum } from 'src/jwt/models/enums/token-type.enum';
import { ErrorHandlerService } from 'src/errro-catch/error-catch.service';
import { JwtService } from 'src/jwt/jwt.service';
import { MailerService } from 'src/mailer/mailer.service';
import { ConfigLoaderService } from 'src/settings/config/config-loader.service';
import { ILoginRequest, ISignIn } from '../models/interface';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { PasswordService } from 'src/password/password.service';
import { CommonService } from 'src/common/common.service';
import { EmailRepository } from 'src/confirm-email-reguster/email.repository';
import { UsersRepository } from 'src/user/user.repository';

/**
 * @class LoginAuthService
 * @classdesc Вход пользователя в аккаунт
 * @throws {BadRequestException} Если email адрес уже занят или предоставлены некорректные данные для создания пользователя
 * @throws {NotFoundException} Если пользователь с указанным email не найден
 * @throws {ForbiddenException} Если пользователь еще не подтвердил свой аккаунт
 * @throws {TooManyRequestsException} Если превышено количество попыток входа
 * @throws {UnauthorizedException} Если учетные данные пользователя не найдены
 * @throws {InternalServerErrorException} Если возникла внутренняя ошибка сервера
 * @since 2023-10-26
 */
@Injectable()
export class LoginAuthService {
	private readonly logger: Logger = new Logger(LoginAuthService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly errorHandlerService: ErrorHandlerService,
		private readonly mailerService: MailerService,
		private readonly jwtService: JwtService,
		private readonly configLoaderService: ConfigLoaderService,
		@InjectQueue('login') private mailQueue: Queue,
		private readonly i18n: I18nService,
		private readonly passwordService: PasswordService,
		private readonly commonService: CommonService,
		private readonly usersRepository: UsersRepository,
		private readonly emailRepository: EmailRepository
	) {}

	/**
	 * Вход пользователя в аккаут или отпарвка письма потверждения в случае не подтвержедния аккаунта
	 * @param {ISignIn} signInData - DTO для создания нового пользователя
	 * @returns {Promise<void | string[]>} ничего или массив токенов
	 * @throws {BadRequestException} Если email адрес уже занят или предоставлены некорректные данные для создания пользователя
	 * @throws {NotFoundException} Если пользователь с указанным email не найден
	 * @throws {ForbiddenException} Если пользователь еще не подтвердил свой аккаунт
	 * @throws {TooManyRequestsException} Если превышено количество попыток входа
	 * @throws {UnauthorizedException} Если учетные данные пользователя не найдены
	 * @throws {InternalServerErrorException} Если возникла внутренняя ошибка сервера
	 * @see {@link checkAndFinedUserByEmail} поиск пользователя по email в  бд и проверка его наличия
	 * @see {@link accountСonfirmationByCreateUser} метод генерации токена подтверждения почты и отправки сообщения
	 * @see {@link ErrorHandlerService.handleError} метод обработки ошибок в catch
	 * @since 2023-10-26
	 */
	public async signIn(
		signInData: ISignIn,
		loginReq: ILoginRequest
	): Promise<void | string[]> {
		try {
			this.logger.log(`Запуск signIn, email: ${signInData.email}`);
			const userWithCredentials: UserWithCredentials =
				await this.checkAndFinedUserByEmail(signInData.email);
			await this.validatePassword(userWithCredentials, signInData.password);
			return await this.authenticateUser(userWithCredentials, loginReq);
		} catch (error) {
			this.logger.error(
				`Ошибка в signIn, email: ${signInData.email}, error: ${error.message}`
			);
			this.errorHandlerService.handleError(error);
		}
	}

	/**
	 * Аутентификация пользователя в зависимости от статуса аккаунта
	 * @param {UserWithCredentials} userWithCredentials - объект пользователя с учетными данными
	 * @returns {Promise<void | string[]>} Возвращает промис без значения или массив токенов
	 * @throws {ForbiddenException} Если аккаунт пользователя не активен
	 * @throws {InternalServerErrorException} Если возникла внутренняя ошибка сервера
	 * @throws {UnauthorizedException} Если учетные данные для этого пользователя не найдены
	 * @see {@link accountСonfirmationBySignIn} метод  отправки письма подтверждения аккаунта при входе в систему
	 * @see {@link authenticateAndGenerateTokens} метод аутентификации и генерации токенов
	 * @since 2023-10-26
	 */
	private async authenticateUser(
		userWithCredentials: UserWithCredentials,
		loginReq: ILoginRequest
	): Promise<void | string[]> {
		if (!userWithCredentials.isEmailVerified) {
			return await this.accountСonfirmationBySignIn(userWithCredentials);
		}
		return await this.authenticateAndGenerateTokens(
			userWithCredentials,
			loginReq
		);
	}

	/**
	 * Аутентификация и генерация токенов, обновление статуса пользователя
	 * @param {UserWithCredentials} userWithCredentials - объект пользователя с учетными данными
	 * @returns {Promise<string[]>} массив токенов
	 * @throws {InternalServerErrorException} Если возникла внутренняя ошибка сервера
	 * @throws {UnauthorizedException} Если учетные данные для этого пользователя не найдены
	 * @see {@link comparePasswordWithLastPassword} метод сравнения пароля с последним паролем
	 * @see {@link generateAuthTokens} метод генерации токенов аутентификации
	 * @see {@link updateUserStatus} метод обновления статуса пользователя
	 * @since 2023-10-26
	 */
	private async authenticateAndGenerateTokens(
		userWithCredentials: UserWithCredentials,
		loginReq: ILoginRequest
	): Promise<string[]> {
		this.logger.log(
			`Запуск authenticateAndGenerateTokens, userId:${userWithCredentials.id}`
		);
		this.comparePasswordWithLastPassword(
			userWithCredentials.password,
			userWithCredentials.credentials.passwordLast
		);
		const [accessToken, refreshToken] =
			await this.generateAuthTokens(userWithCredentials);
		return await this.prisma.$transaction(async prisma => {
			await this.usersRepository.updateUserStatus(
				userWithCredentials.id,
				StatusEnum.online,
				prisma
			);
			const { credentials, ...user } = userWithCredentials;
			await this.addLoginToQueue(user, loginReq);
			return [accessToken, refreshToken];
		});
	}

	private async addLoginToQueue(
		user: User,
		loginReq: ILoginRequest
	): Promise<void> {
		this.logger.log(`Запуск addLoginToQueue, userId:${user.id}`);
		await this.mailQueue.add(
			'signIn',
			{
				loginReq,
				user
			},
			{
				attempts: this.configLoaderService.mailBullConfig.mailQueueMaxAttempts,
				backoff:
					this.configLoaderService.mailBullConfig.mailQueueBackoffInterval
			}
		);
	}

	/**
	 * Проверка паролей сохраненных в бд
	 * @param {string} userPassword - пароль в модели User
	 * @param {string} credentialsPassword - пароль в модели Credentials
	 * @returns {boolean} Возвращает булево значение, указывающее, совпадают ли пароли
	 * @throws {InternalServerErrorException} Если возникла внутренняя ошибка сервера
	 * @throws {UnauthorizedException} Если учетные данные для этого пользователя не найдены
	 * @see {@link checkCredentialsPasswordLast} метод проверки последнего пароля в учетных данных в модели Credentials
	 * @see {@link comparePasswords} метод сравнения паролей в модели User и в модели Credentials
	 * @since 2023-10-26
	 */
	private comparePasswordWithLastPassword(
		userPassword: string,
		credentialsPassword: string
	): void {
		this.logger.log(`Запуск comparePasswordWithLastPassword`);
		this.checkCredentialsPasswordLast(credentialsPassword);
		return this.comparePasswords(userPassword, credentialsPassword);
	}

	/**
	 * Сравнение паролей
	 * @param {string} password - первый пароль для сравнения
	 * @param {string} password2 - второй пароль для сравнения
	 * @returns {boolean} Возвращает булево значение, указывающее, совпадают ли пароли
	 * @throws {InternalServerErrorException} Если возникла внутренняя ошибка сервера или пароли не совпадают
	 * @since 2023-10-26
	 */
	private comparePasswords(password: string, password2: string): void {
		this.logger.log(`Запуск метода comparePasswords`);
		if (!(password === password2)) {
			const message: string = this.i18n.t('test.error.errorDefaultMessage', {
				lang: I18nContext.current().lang
			});
			throw new HttpException(message, HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	/**
	 * Генерация токенов аутентификации
	 * @param {User} user - объект пользователя
	 * @param {string} tokenId - идентификатор токена (необязательный)
	 * @returns {Promise<string[]>} Возвращает промис с массивом токенов аутентификации (доступ и обновление)
	 * @throws {InternalServerErrorException} Если возникла внутренняя ошибка сервера
	 * @see {@link JwtService.generateToken} метод генерации токенов
	 * @since 2023-10-26
	 */
	private async generateAuthTokens(
		user: User,
		tokenId?: string
	): Promise<string[]> {
		this.logger.log(`Запуск generateAuthTokens, userID: ${user.id}`);
		return await Promise.all([
			this.jwtService.generateToken(user, TokenTypeEnum.ACCESS, tokenId),
			this.jwtService.generateToken(user, TokenTypeEnum.REFRESH, tokenId)
		]);
	}

	/**
	 * Проверка существования пароля в модели Credentials
	 * @param {string} password - последний пароль из учетных данных
	 * @returns {void}
	 * @throws {UnauthorizedException} Если учетные данные для этого пользователя не найдены
	 * @throws {InternalServerErrorException} Если возникла внутренняя ошибка сервера
	 * @since 2023-10-26
	 */
	private checkCredentialsPasswordLast(password: string): void {
		this.logger.log(`Запуск метода checkCredentialsPasswordLast`);
		if (!password) {
			this.logger.error(
				`Ошибка в checkCredentialsPasswordLast, password = ${password}`
			);
			const message: string = this.i18n.t('test.error.errorDefaultMessage', {
				lang: I18nContext.current().lang
			});
			throw new HttpException(message, HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	/**
	 * Подтверждение аккаунта при входе в систему
	 * @param {User} user - объект пользователя
	 * @returns {Promise<void>} Возвращает промис без значения при успешном выполнении
	 * @throws {ForbiddenException} Если пользователь еще не подтвердил свой аккаунт
	 * @throws {InternalServerErrorException} Если возникла внутренняя ошибка сервера
	 * @see {@link findEmailTokenByUserId} метод поиска токена электронной почты по идентификатору пользователя
	 * @see {@link handleEmailResendOnTokenExpiration} метод обработки повторной отправки электронной почты при истечении срока действия токена
	 * @since 2023-10-26
	 */
	private async accountСonfirmationBySignIn(user: User): Promise<void> {
		this.logger.log(`Начало accountСonfirmationBysignIn, userID:${user.id}`);
		const modelEmailToken: OptionalEmailToken =
			await this.emailRepository.findEmailTokenByUserId(user.id);
		return await this.handleEmailResendOnTokenExpiration(modelEmailToken, user);
	}

	/**
	 * Обработка повторной отправки электронной почты при истечении срока действия токена
	 * @param {OptionalEmailToken} modelEmailToken - модель токена электронной почты или null
	 * @param {User} user - объект пользователя
	 * @returns {Promise<void>}
	 * @throws {ForbiddenException} Если пользователь еще не подтвердил свой аккаунт
	 * @throws {InternalServerErrorException} Если возникла внутренняя ошибка сервера
	 * @see {@link handleEmailToken} метод обработки токена электронной почты
	 * @since 2023-10-26
	 */
	private async handleEmailResendOnTokenExpiration(
		modelEmailToken: OptionalEmailToken,
		user: User
	): Promise<void> {
		this.logger.log(
			`Запуск handleEmailResendOnTokenExpiration, userID:${user.id}`
		);
		await this.handleEmailToken(modelEmailToken, user);
		const message: string = this.i18n.t(
			'test.error.confirmEmailAndLoginAgain',
			{
				lang: I18nContext.current().lang
			}
		);
		throw new HttpException(message, HttpStatus.FORBIDDEN);
	}

	/**
	 * Обработка токена электронной почты
	 * @param {OptionalEmailToken} modelEmailToken - модель токена электронной почты или null
	 * @param {User} user - объект пользователя
	 * @returns {Promise<void>}
	 * @throws {TooManyRequestsException} Если пользователь еще не подтвердил свой аккаунт
	 * @throws {InternalServerErrorException} Если возникла внутренняя ошибка сервера
	 * @see {@link accountСonfirmationByCreateUser} метод подтверждения аккаунта создание новой модели EmailToken
	 * @see {@link handleEmailResendLimit} метод обработки лимита повторной отправки электронной почты
	 * @since 2023-10-26
	 */
	private async handleEmailToken(
		modelEmailToken: OptionalEmailToken,
		user: User
	): Promise<void> {
		this.logger.log(`Запуск handleEmailToken, userID:${user.id}`);
		if (!modelEmailToken) {
			const tokenV4Id: string = this.commonService.generateUuid();
			return await this.accountСonfirmationByCreateUser(user, tokenV4Id);
		}
		return await this.handleEmailResendLimit(modelEmailToken, user);
	}

	/**
	 * Обработка лимита повторной отправки электронной почты
	 * @param {EmailToken} emailTokenModel - модель токена электронной почты
	 * @param {User} user - объект пользователя
	 * @returns {Promise<void>}
	 * @throws {TooManyRequestsException} Если превышено количество попыток входа
	 * @throws {InternalServerErrorException} Если возникла внутренняя ошибка сервера
	 * @see {@link getActiveTokensEmailModel} метод получения активных токенов модели электронной почты
	 * @see {@link handleEmailTokenAndResendConfirmation} метод обработки токена электронной почты и повторного подтверждения
	 * @see {@link MailerService.sendConfirmationEmail} метод отправки письма подтверждения
	 * @since 2023-10-26
	 */
	private async handleEmailResendLimit(
		emailTokenModel: EmailToken,
		user: User
	): Promise<void> {
		this.logger.log(
			`Запуск handleEmailResendLimit, userID: ${emailTokenModel.userId} `
		);
		const arrayDate: Date[] = this.getActiveTokensEmailModel(
			emailTokenModel.emailResendAttempts
		);
		const token: string = await this.handleEmailTokenAndResendConfirmation(
			emailTokenModel,
			user,
			arrayDate
		);
		return await this.mailerService.sendConfirmationEmail(user, token);
	}

	/**
	 * Получение активных токенов модели электронной почты
	 * @param {Date[]} timeArray - массив дат создания токенов
	 * @returns {Date[]} Возвращает массив дат активных токенов
	 * @throws {TooManyRequestsException} Если превышено количество попыток входа
	 * @throws {InternalServerErrorException} Если возникла внутренняя ошибка сервера
	 * @see {@link getActiveTokens} метод получения активных токенов
	 * @see {@link checkEmailModelTokensLimit} метод проверки лимита токенов модели электронной почты
	 * @since 2023-10-26
	 */
	private getActiveTokensEmailModel(timeArray: Date[]): Date[] {
		this.logger.log(`Запуск getActiveTokensEmailModel в authService`);
		const checkActiveTokensEmailToken: Date[] = this.getActiveTokens(
			timeArray,
			this.configLoaderService.emailTokenExpirattionTime
		);
		this.checkEmailModelTokensLimit(checkActiveTokensEmailToken);
		const currentTime: Date = new Date();
		checkActiveTokensEmailToken.push(currentTime);
		return checkActiveTokensEmailToken;
	}

	/**
	 * Получение активных токенов
	 * @param {Date[]} timeCreateResetToken - массив дат создания токенов сброса
	 * @param {number} time - время в миллисекундах
	 * @returns {Date[]} Возвращает массив дат активных токенов
	 * @throws {InternalServerErrorException} Если возникла внутренняя ошибка сервера
	 * @since 2023-10-26
	 */
	private getActiveTokens(timeCreateResetToken: Date[], time: number): Date[] {
		this.logger.log(`Запуск метода getActiveTokens в authService`);
		const currentTime: Date = new Date();
		return timeCreateResetToken.filter(createTime => {
			const expirationTime: Date = new Date(createTime.getTime() + time);
			return expirationTime > currentTime;
		});
	}

	/**
	 * Проверка лимита токенов модели электронной почты
	 * @param {Date[]} timeArray - массив дат создания токенов
	 * @returns {void}
	 * @throws {TooManyRequestsException} Если превышено количество попыток входа
	 * @throws {InternalServerErrorException} Если возникла внутренняя ошибка сервера
	 * @since 2023-10-26
	 */
	private checkEmailModelTokensLimit(timeArray: Date[]): void {
		this.logger.log(`Запуск метода checkEmailModelTokensLimit в authService`);
		if (timeArray.length >= this.configLoaderService.emailModelTokensLimit) {
			const message: string = this.i18n.t('test.error.exceededLoginAttempts', {
				lang: I18nContext.current().lang
			});
			throw new HttpException(message, HttpStatus.TOO_MANY_REQUESTS);
		}
	}

	/**
	 * Обработка создания токена электронной почты и повторное подтверждение
	 * @param {EmailToken} emailTokenModel - модель токена электронной почты
	 * @param {User} user - объект пользователя
	 * @param {Date[]} arrayDate - массив дат создания токенов
	 * @returns {Promise<string>} токен подтверждения
	 * @throws {InternalServerErrorException} Если возникла внутренняя ошибка сервера
	 * @see {@link generateConfirmationToken} метод генерации подтверждающего токена
	 * @since 2023-10-26
	 */
	async handleEmailTokenAndResendConfirmation(
		emailTokenModel: EmailToken,
		user: User,
		arrayDate: Date[]
	): Promise<string> {
		this.logger.log(
			`Заупск метода handleEmailTokenAndResendConfirmation в authService, userID: ${user.id}`
		);
		const tokenV4Id: string = this.commonService.generateUuid();
		const confirmationToken: string = await this.generateConfirmationToken(
			user,
			tokenV4Id
		);
		await this.emailRepository.updateResendAttemptsAndCreateNewToken(
			emailTokenModel.id,
			arrayDate
		);
		return confirmationToken;
	}

	/**
	 * Подтверждение аккаунта при создании пользователя и сохранение в бд
	 * @param {User} user - объект пользователя
	 * @param {string} token - идентификатор токена
	 * @returns {Promise<void>}
	 * @throws {InternalServerErrorException} Если возникла внутренняя ошибка сервера
	 * @see {@link generateConfirmationToken} метод генерации подтверждающего токена
	 * @see {@link MailerService.sendConfirmationEmail} метод отпарвки письма подтвеждения
	 * @since 2023-10-26
	 */
	private async accountСonfirmationByCreateUser(
		user: User,
		token: string
	): Promise<void> {
		this.logger.log(
			`Запуск accountConfirmationByCreateUser, userId: $.user.id}`
		);
		const confirmationToken: string = await this.generateConfirmationToken(
			user,
			token
		);
		await this.mailerService.sendConfirmationEmail(user, confirmationToken);
	}

	/**
	 * Генерация подтверждающего токена
	 * @param {User} user - объект пользователя
	 * @param {string} token - идентификатор токена
	 * @returns {Promise<string>} токен подтвеждения
	 * @throws {InternalServerErrorException} Если возникла внутренняя ошибка сервера
	 * @see {@link JwtService.generateToken} метод генерации подтверждающего токена
	 * @since 2023-10-26
	 */
	private async generateConfirmationToken(
		user: User,
		token: string
	): Promise<string> {
		this.logger.log(`Запуск generateConfirmationToken, userId: ${user.id}`);
		return await this.jwtService.generateToken(
			user,
			TokenTypeEnum.CONFIRMATION,
			token
		);
	}

	/**
	 * Проверка пароля пользователя
	 * @param {User} user - объект пользователя
	 * @param {string} password - пароль для проверки
	 * @returns {Promise<boolean>} Возвращает промис с булевым значением, указывающим, является ли пароль действительным
	 * @throws {NotFoundException} Если пароль недействителен
	 * @throws {InternalServerErrorException} Если возникла внутренняя ошибка сервера
	 * @see {@link verifyPassword} метод проверки пароля
	 * @see {@link checkValidatePassword} метод проверки валидности пароля
	 * @since 2023-10-26
	 */
	private async validatePassword(
		user: User,
		password: string
	): Promise<boolean> {
		this.logger.log(`Запуск validatePassword, userID: ${user.id}`);
		const isValidPassword: boolean = await this.verifyPassword(
			user.password,
			password
		);
		this.checkValidatePassword(isValidPassword);
		return isValidPassword;
	}

	/**
	 * Проверка пароля пользователя
	 * @param {string} userPassword - пароль пользователя
	 * @param {string} inputPassword - введенный пароль для проверки
	 * @returns {Promise<boolean>} Возвращает промис с булевым значением, указывающим, является ли введенный пароль действительным
	 * @throws {InternalServerErrorException} Если возникла внутренняя ошибка сервера
	 * @since 2023-10-26
	 */
	private async verifyPassword(
		userPassword: string,
		inputPassword: string
	): Promise<boolean> {
		this.logger.log(`Запуск verifyPassword`);
		return await this.passwordService.verifyPassword(
			userPassword,
			inputPassword
		);
	}

	/**
	 * Проверка валидности пароля
	 * @param {boolean} isValid - булево значение, указывающее, является ли пароль действительным
	 * @returns {void}
	 * @throws {NotFoundException} Если пароль недействителен
	 * @throws {InternalServerErrorException} Если возникла внутренняя ошибка сервера
	 * @since 2023-10-26
	 */
	private checkValidatePassword(isValid: boolean): void {
		this.logger.log(`Запуск checkValidatePassword`);
		if (!isValid) {
			const message: string = this.i18n.t(
				'test.error.incorrectEmailOrPassword',
				{
					lang: I18nContext.current().lang
				}
			);
			throw new HttpException(message, HttpStatus.NOT_FOUND);
		}
	}

	/**
	 * Поиск пользователя по email и проверка его наличия
	 * @param {string} email - email для поиска
	 * @returns {Promise<UserWithCredentials>} объект пользователя с моделью Credentials
	 * @throws {NotFoundException} Если пользователь с указанным email не найден
	 * @throws {InternalServerErrorException} Если возникла внутренняя ошибка сервера
	 * @see {@link findUserByEmail} метод поиска пользователя по email в  бд и проверка его наличия
	 * @see {@link checkUserExistence} метод проверки  наличия пользователя
	 * @since 2023-10-26
	 */
	private async checkAndFinedUserByEmail(
		email: string
	): Promise<UserWithCredentials> {
		this.logger.log(`Запуск checkAndFinedUserByEmail. email: ${email}`);
		const userWithCredentials: OptionalUserWithCredentials =
			await this.usersRepository.findUserWithEmailAndCredentials(email);
		this.checkUserExistence(userWithCredentials);
		return userWithCredentials;
	}

	/**
	 * Проверка наличия пользователя
	 * @param {OptionalUserWithCredentials} userWithCredentials - объект пользователя с Credentials или null
	 * @returns {void}
	 * @throws {InternalServerErrorException} Если возникла внутренняя ошибка сервера
	 * @throws {NotFoundException} Если пользователь с указанным email не найден
	 * @since 2023-10-26
	 */
	private checkUserExistence(
		userWithCredentials: OptionalUserWithCredentials
	): void {
		this.logger.log(`Запуск checkUserExistence.`);
		if (!userWithCredentials) {
			const message: string = this.i18n.t(
				'test.error.incorrectEmailOrPassword',
				{
					lang: I18nContext.current().lang
				}
			);
			throw new HttpException(message, HttpStatus.NOT_FOUND);
		}
	}
}
