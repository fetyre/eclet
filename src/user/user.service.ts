import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { User, UserRole } from '@prisma/client';
import { PrismaService } from 'src/settings/prisma.database/prisma.service';
import { ISignUp, IUserUpdate, UserQueryParams } from './models/interface';
import { BooleanOrUndefined, UserWithToken } from './models/types/users.type';
import { ValidateService } from 'src/validate/validate.service';
import { ErrorHandlerService } from 'src/errro-catch/error-catch.service';
import {
	SaveUpdateUserData,
	UserQueryParamsDto,
	ValidateRegisterUserDto
} from './models/dto';
import { NullableUser, PrismaTransaction } from 'src/types';
import { TokenTypeEnum } from 'src/jwt/models/enums/token-type.enum';
import { MailerService } from 'src/mailer/mailer.service';
import { JwtService } from 'src/jwt/jwt.service';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { PageParametersService } from 'src/base-page/page-base.service';
import { CommonService } from 'src/common/common.service';
import { UsersRepository } from './user.repository';
import { PasswordService } from '../password/password.service';
import {
	BOOLEAN_STRING_TRUE,
	NO_UPDATES_LENGTH
} from 'src/constants/global-constants';

@Injectable()
export class UsersService extends PageParametersService {
	readonly logger: Logger = new Logger(UsersService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly validateService: ValidateService,
		private readonly errorHandlerService: ErrorHandlerService,
		private readonly mailerService: MailerService,
		private readonly jwtService: JwtService,
		private readonly i18n: I18nService,
		private readonly commonService: CommonService,
		private readonly usersRepository: UsersRepository,
		private readonly passwordService: PasswordService
	) {
		super();
	}

	/**
	 * Создание нового пользователя с сохранением в бд и отправкой письма подтверждения
	 * @param {ISignUp} createData -  для создания нового пользователя
	 * @returns {Promise<User>} Созданный пользователь
	 * @throws {BadRequestException} email адрес уже занят
	 * @throws {InternalServerErrorException} Если возникла внутренняя ошибка сервера
	 * @see {@link createRegularUser} хэширвоания пароля, валидация, создание токена и сохранение в бд
	 * @see {@link accountСonfirmationByCreateUser} метод генерации токена подтверждения почты и отправки сообщения
	 * @see {@link ErrorHandlerService.handleError} метод обработки ошибок в catch
	 * @since 2023-10-26
	 */
	public async signUp(createData: ISignUp): Promise<User> {
		try {
			this.logger.log(`Запуск createRegularUser, email:${createData.email}`);
			return await this.prisma.$transaction(async prisma => {
				const userWithToken: UserWithToken = await this.createRegularUser(
					createData,
					prisma
				);
				await this.accountСonfirmationByCreateUser(userWithToken);
				this.logger.log(
					`Создание пользователя прошло успешно ${userWithToken.user.id}`
				);
				return userWithToken.user;
			});
		} catch (error) {
			this.logger.error(
				`Ошибка в signUp, email: ${createData.email}, error: ${error.message}`
			);
			this.errorHandlerService.handleError(error);
		}
	}

	/**
	 * Создание нового пользователя с сохранением в бд, хэширования пароля
	 * @param {ISignUp} createData - для создания нового пользователя
	 * @param {PrismaTransaction} prisma - транзакция
	 * @returns {Promise<UserWithToken>} Созданный пользователь и токен uuid.v4 для письма подтверждения
	 * @throws {BadRequestException} email адрес уже занят
	 * @throws {InternalServerErrorException} Если возникла внутренняя ошибка сервера
	 * @see {@link checkAndfindByUserByEmailo} метод проверки и поиска пользователя по email
	 * @see {@link hashPassword} метод хэширования пароля
	 * @see {@link generateTokenV4Id} метод генерации токена uuid v4
	 * @see {@link validateDtoBeforeSave} метод валидации данных перед сохранением
	 * @see {@link saveRegularUser} метод сохранение в бд
	 * @since 2023-10-26
	 */
	private async createRegularUser(
		createData: ISignUp,
		prisma: PrismaTransaction
	): Promise<UserWithToken> {
		this.logger.log(`Запуск createRegularUser, email:${createData.email}`);
		await this.checkAndfindByUserByEmail(createData.email);
		await this.hashPassword(createData);
		const tokenV4Id: string = this.generateTokenV4Id();
		await this.validateDtoBeforeSave(createData, tokenV4Id);
		const user: User = await this.usersRepository.saveRegularUser(
			createData,
			tokenV4Id,
			prisma
		);
		this.logger.log(`Завершение createRegularUser, email:${user.email}`);
		return { user, tokenV4Id };
	}

	/**
	 * Валидация перед сохранением в бд
	 * @param {ISignUp} createData -  для валидации
	 * @param {string} tokenV4Id - v4 токен для валидации
	 * @returns {Promise<void>}
	 * @throws {InternalServerErrorException} Если возникла внутренняя ошибка сервера
	 * @see {@link ValidateService.validateDto} метод валидации перед
	 * @since 2023-10-26
	 */
	private async validateDtoBeforeSave(
		createData: ISignUp,
		tokenV4Id: string
	): Promise<void> {
		this.logger.log(`Запуск validateDtoBeforeSave, email:${createData.email}`);
		const validateObj: ValidateRegisterUserDto = {
			...createData,
			token: tokenV4Id
		};
		return this.validateService.validateDto(
			ValidateRegisterUserDto,
			validateObj
		);
	}

	/**
	 * Создания токена uuid v4
	 * @returns {string} Созданый токен uuid v4
	 * @throws {InternalServerErrorException} Если возникла внутренняя ошибка сервера
	 * @since 2023-10-26
	 */
	private generateTokenV4Id(): string {
		this.logger.log('Запуск generateTokenV4Id');
		return this.commonService.generateUuid();
	}

	/**
	 * Хэширования пароля
	 * @param {ISignUp} createData - пользователя для сохранения в бд
	 * @returns {Promise<CreateUserInterface>} Объект с хэшированным паролем
	 * @throws {InternalServerErrorException} Если возникла внутренняя ошибка сервера
	 * @since 2023-10-26
	 */
	private async hashPassword(createData: ISignUp): Promise<ISignUp> {
		this.logger.log(`Запуск hashPassword.`);
		createData.password = await this.passwordService.hashPassword(
			createData.password
		);
		return createData;
	}

	/**
	 * Поиск пользователя по email в бд и проверка его сущестования
	 * @param {string} email - email пользователя
	 * @returns {Promise<void>}
	 * @throws {InternalServerErrorException} Если возникла внутренняя ошибка сервера
	 * @see {@link findUserByEmail} метод поиска пользователя по email
	 * @see {@link checkUserBySignUp} метод проверки наличия пользователя
	 * @since 2023-10-26
	 */
	public async checkAndfindByUserByEmail(email: string): Promise<void> {
		this.logger.log(`Запуск findByEmailBysignUp. email: ${email}`);
		const user: User = await this.usersRepository.findUserByEmail(email);
		this.checkUserBySignUp(user);
	}

	/**
	 * Проверка наличия пользователя, если пользователь найден, отказ в регистрации
	 * @param {NullableUser} user - найденный объект пользователя (User) или null
	 * @returns {void}
	 * @throws {InternalServerErrorException} Если возникла внутренняя ошибка сервера
	 * @throws {BadRequestException} пользователь найден, email адрес занят
	 * @since 2023-10-26
	 */
	private checkUserBySignUp(user: NullableUser): void {
		this.logger.log(`Запуск checkUser`);
		if (user) {
			const message: string = this.i18n.t(
				'test.error.EMAIL_ALREADY_REGISTERED',
				{
					lang: I18nContext.current().lang
				}
			);
			throw new HttpException(message, HttpStatus.CONFLICT);
		}
	}

	/**
	 * Геренация токена подтвержения аккаунта, и отправка сообщения на почту
	 * @param {UserWithToken} userWithToken - объект пользователя (User) с токеном uuid
	 * @returns {Promise<void>}
	 * @throws {InternalServerErrorException} Если возникла внутренняя ошибка сервера
	 * @see {@link MailerService.sendConfirmationEmail} метод отправки сообщения
	 * @see {@link generateConfirmationToken} метод генерации токена
	 * @since 2023-10-26
	 */
	private async accountСonfirmationByCreateUser(
		userWithToken: UserWithToken
	): Promise<void> {
		this.logger.log(
			`Запуск accountConfirmationByCreateUser, userId: ${userWithToken.user.id}`
		);
		const confirmationToken: string =
			await this.generateConfirmationToken(userWithToken);
		await this.mailerService.sendConfirmationEmail(
			userWithToken.user,
			confirmationToken
		);
	}

	/**
	 * Геренация токена подтвержения аккаунта, вызов метода generateToken в JwtService
	 * @param {UserWithToken} userWithToken - объект пользователя (User) с токеном uuid
	 * @returns {Promise<string>} токен подтверждения
	 * @throws {InternalServerErrorException} Если возникла внутренняя ошибка сервера
	 * @see {@link JwtService.generateToken}
	 * @since 2023-10-26
	 */
	private async generateConfirmationToken(
		userWithToken: UserWithToken
	): Promise<string> {
		this.logger.log(
			`Запуск generateConfirmationToken, userId: ${userWithToken.user.id}`
		);
		return await this.jwtService.generateToken(
			userWithToken.user,
			TokenTypeEnum.CONFIRMATION,
			userWithToken.tokenV4Id
		);
	}

	public async findAll(
		user: User,
		queryParams: UserQueryParams
	): Promise<User[]> {
		try {
			this.logger.log(`Запуск findAll, id: ${user.id}`);
			await this.validateQueryParams(queryParams);
			await this.getUsers(queryParams);
			const emailVerificationStatus: BooleanOrUndefined =
				this.convertEmailVerificationStatus(queryParams);
			return await this.usersRepository.findManyUsers(
				queryParams,
				emailVerificationStatus
			);
		} catch (error) {
			this.logger.error(`Ошибка в updateUser, id: ${user.id}`);
			this.errorHandlerService.handleError(error);
		}
	}

	private convertEmailVerificationStatus(
		queryParams: UserQueryParams
	): BooleanOrUndefined {
		this.logger.log(`Запуск convertEmailVerificationStatus.`);
		if (queryParams.isEmailVerified) {
			return queryParams.isEmailVerified === BOOLEAN_STRING_TRUE;
		}
		return undefined;
	}

	private async getUsers(queryParams: UserQueryParams): Promise<void> {
		this.logger.log(`Запуск getUsers.`);
		const totalUsers: number = await this.usersRepository.getTotalUserCount();
		this.validatePageNumber(totalUsers, queryParams);
		this.validatePageSize(totalUsers, queryParams);
	}

	private async validateQueryParams(
		queryParams: UserQueryParams
	): Promise<void> {
		this.logger.log(`Запуск validateQueryParams`);
		const params: UserQueryParamsDto = { ...queryParams };
		return await this.validateService.validateDto(UserQueryParamsDto, params);
	}

	public async updateUser(
		updateData: IUserUpdate,
		user: User,
		id: string
	): Promise<User> {
		try {
			this.logger.log(`Запуск updateUser, id: ${user.id}`);
			this.validateUserId(id);
			return await this.updateUserBasedOnRole(user, updateData, id);
		} catch (error) {
			this.logger.error(`Ошибка в updateUser, id: ${user.id}`);
			this.errorHandlerService.handleError(error);
		}
	}

	private validateUserId(resetUserId: string): void {
		this.logger.log(`Запуск validateUserId`);
		return this.validateService.checkId(resetUserId);
	}

	private async updateUserBasedOnRole(
		user: User,
		updateData: IUserUpdate,
		id: string
	): Promise<User> {
		this.logger.log(`Запуск updateUserBasedOnRole, id: ${user.id}`);
		if (user.role === UserRole.superAdmin) {
			return await this.updateAsSuperAdmin(user, updateData, id);
		}
		return await this.checkAndUpdateUserIfAuthorized(user, updateData, id);
	}

	private async updateAsSuperAdmin(
		user: User,
		updateData: IUserUpdate,
		id: string
	): Promise<User> {
		this.logger.log(
			`Запуск updateAsSuperAdmin, userId: ${user.id}, userUpdateId: ${id}`
		);
		const updateUser: User = await this.checkAndFindUserById(id);
		return await this.updateUserIfAuthorized(updateUser, updateData);
	}

	private async checkAndUpdateUserIfAuthorized(
		user: User,
		updateData: IUserUpdate,
		id: string
	): Promise<User> {
		this.logger.log(`Запуск updateUserDefault, userId: ${user.id}`);
		if (user.id !== id) {
			const message: string = this.i18n.t('test.error.accessDenied', {
				lang: I18nContext.current().lang
			});
			throw new HttpException(message, HttpStatus.FORBIDDEN);
		}
		return await this.updateUserIfAuthorized(user, updateData);
	}

	private async updateUserIfAuthorized(
		user: User,
		updateData: IUserUpdate
	): Promise<User> {
		this.logger.log(`Запуск updateUserIfAuthorized, userId: ${user.id}`);
		const updatedFields: IUserUpdate = this.checkAndApplyUserUpdates(
			user,
			updateData
		);
		await this.validateUpdateData(updatedFields);
		return await this.usersRepository.updateSaveUser(updatedFields, user);
	}

	private async validateUpdateData(updateData: IUserUpdate): Promise<void> {
		this.logger.log(`Запуск validateUpdateData.`);
		const validateData: SaveUpdateUserData = { ...updateData };
		return await this.validateService.validateDto(
			SaveUpdateUserData,
			validateData
		);
	}

	private hasDataChanged(user: User, updateData: IUserUpdate): IUserUpdate {
		this.logger.log(`Запуск hasDataChanged, userId: ${user.id}`);
		return Object.keys(updateData).reduce((updatedFields, key) => {
			if (user[key] !== updateData[key]) {
				updatedFields[key] = updateData[key];
			}
			return updatedFields;
		}, {});
	}

	private checkAndApplyUserUpdates(
		user: User,
		updateData: IUserUpdate
	): IUserUpdate {
		this.logger.log(`Запуск checkAndApplyUserUpdates, userId: ${user.id}`);
		const updatedFields: IUserUpdate = this.hasDataChanged(user, updateData);
		this.updateIfChanged(updatedFields);
		return updatedFields;
	}

	private updateIfChanged(updatedFields: IUserUpdate): void {
		this.logger.log(`Запуск updateIfChanged`);
		if (Object.keys(updatedFields).length === NO_UPDATES_LENGTH) {
			const message: string = this.i18n.t('test.error.updateUnchanged', {
				lang: I18nContext.current().lang
			});
			throw new HttpException(message, HttpStatus.CONFLICT);
		}
	}

	public async delete(adminUser: User, id: string): Promise<User> {
		try {
			this.logger.log(
				`Запуск delete, adminId: ${adminUser.id}, deleteUserId: ${id}`
			);
			this.validateUserId(id);
			const deleteUser: User = await this.checkAndFindUserById(id);
			return await this.usersRepository.deleteUser(deleteUser);
		} catch (error) {
			this.logger.error(
				`Ошибка в delete, adminId: ${adminUser.id}, deleteUserId: ${id}, error: ${error.message}`
			);
			this.errorHandlerService.handleError(error);
		}
	}

	private async checkAndFindUserById(id: string): Promise<User> {
		this.logger.log(`Запуск checkAndFindUserById, userId:${id}`);
		const user: NullableUser = await this.usersRepository.findUserById(id);
		this.checkUserExistence(user);
		return user;
	}

	private checkUserExistence(user: NullableUser): void {
		if (!user) {
			const message: string = this.i18n.t('test.error.userNotFound', {
				lang: I18nContext.current().lang
			});
			throw new HttpException(message, HttpStatus.NOT_FOUND);
		}
	}

	public async findOne(id: string): Promise<User> {
		try {
			this.logger.log(`Запуск findOne, userId:${id}`);
			this.validateUserId(id);
			return await this.checkAndFindUserById(id);
		} catch (error) {
			this.logger.error(
				`Ошибка в findOne, userId:${id}, error: ${error.message}`
			);
			this.errorHandlerService.handleError(error);
		}
	}
}
