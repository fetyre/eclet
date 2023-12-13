import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import {
	User,
	ProviderModel,
	EmailToken,
	BlacklistedToken,
	Provider
} from '@prisma/client';
import { OAuthProvider } from 'src/auth/models/enums/oauth.provide.emun';
import { BlackListService } from 'src/black-list/black-list.service';
import { ErrorHandlerService } from 'src/errro-catch/error-catch.service';
import { TokenTypeEnum } from 'src/jwt/models/enums/token-type.enum';
import { PrismaService } from 'src/settings/prisma.database/prisma.service';
import { PrismaTransaction } from 'src/types';
import { ValidateService } from 'src/validate/validate.service';
import { UserWithProviderOrNull, UserWithProvider } from './type/type-oauht';
import {
	OAuthProviderCreationDto,
	ValidateOAuthRegisterUserDto
} from './models/dto';
import { OAuthCreateUser, OAuthTokens } from './models/interface';
import { TokenAuthService } from 'src/auth/token/token-auth.service';
import { OAuthReqInterface } from './models/interface/oauth-req.interface';
import { UsersRepository } from 'src/user/user.repository';
import { OAuthRepository } from './oauth.repository';
import { EmailRepository } from 'src/confirm-email-reguster/email.repository';
import { MailerService } from 'src/mailer/mailer.service';
import { CommonService } from 'src/common/common.service';

@Injectable()
export class OAuthService {
	private readonly logger: Logger = new Logger(OAuthService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly errorHandlerService: ErrorHandlerService,
		private readonly validateService: ValidateService,
		private readonly blackList: BlackListService,
		private readonly tokenAuthService: TokenAuthService,
		private readonly usersRepository: UsersRepository,
		private readonly oauthRepository: OAuthRepository,
		private readonly emailRepository: EmailRepository,
		private readonly mailerService: MailerService,
		private readonly commonService: CommonService
	) {}

	public async createOAuthUser(data: OAuthReqInterface): Promise<OAuthTokens> {
		try {
			this.logger.log(`Запуск createOAuthUser, email: ${data.email}`);
			const { provider, ...dto } = data;
			const user: User = await this.findUserWithOAuthProvider(dto, provider);
			const [access_token, refresh_token] =
				await this.tokenAuthService.generateAuthTokens(user);
			return { accessToken: access_token, refreshToken: refresh_token };
		} catch (error) {
			this.logger.error(
				`Ошибка createOAuthUser, email: ${data.email}, error: ${error.message}`
			);
			this.errorHandlerService.handleError(error);
		}
	}

	private async findUserWithOAuthProvider(
		dto: OAuthCreateUser,
		provider: OAuthProvider
	): Promise<User> {
		this.logger.log(`Запуск findUserWithOAuthProvider, email: ${dto.email}`);
		const providerValue: Provider = this.getProviderValue(provider);
		const searchUserByEmail: UserWithProviderOrNull =
			await this.usersRepository.findUserWithEmailProviderAndToken(dto.email);
		return this.processUser(providerValue, searchUserByEmail, dto);
	}

	private async processUser(
		providerValue: Provider,
		searchUserByEmail: UserWithProviderOrNull,
		dto: OAuthCreateUser
	): Promise<User> {
		this.logger.log(`Запуск processUser.`);
		if (searchUserByEmail) {
			return this.processOAuthUserRegistration(
				providerValue,
				searchUserByEmail,
				dto
			);
		}
		return await this.validateAndCreateOAuthUser(dto, providerValue);
	}

	private async validateAndCreateOAuthUser(
		createUserDto: OAuthCreateUser,
		providerValue: Provider
	): Promise<User> {
		this.logger.log(
			`Начало validateAndCreateOAuthUser. email: ${createUserDto.email}, provider: ${providerValue}`
		);
		await this.validateOAuthUser(createUserDto, providerValue);
		return await this.prisma.$transaction(async prisma => {
			const user: User = await this.usersRepository.createUserWithOAuthProvider(
				createUserDto,
				providerValue,
				prisma
			);
			await this.mailerService.sendSingUpOAuth(user);
			return user;
		});
	}

	private async validateOAuthUser(
		dto: OAuthCreateUser,
		providerValue: Provider
	) {
		this.logger.log(`Начало validateOAuthUser. email: ${dto.email}`);
		const oauthRegisterUserDto: ValidateOAuthRegisterUserDto = {
			...dto,
			provider: providerValue
		};
		await this.validateService.validateByDto(oauthRegisterUserDto);
	}

	private async processOAuthUserRegistration(
		providerValue: Provider,
		searchUserByEmail: UserWithProvider,
		createUserDto: OAuthCreateUser
	): Promise<User> {
		this.logger.log(
			`Запуск processOAuthUserRegistration, userID: ${searchUserByEmail.id}`
		);
		const matchedProviderModel: ProviderModel =
			this.checkIfUserAlreadyRegisteredWithProvider(
				searchUserByEmail,
				providerValue
			);
		return this.processUserWithProvider(
			matchedProviderModel,
			createUserDto,
			searchUserByEmail,
			providerValue
		);
	}

	private async processUserWithProvider(
		matchedProviderModel: ProviderModel,
		createUserDto: OAuthCreateUser,
		searchUserByEmail: UserWithProvider,
		providerValue: Provider
	): Promise<User> {
		this.logger.log(
			`Начало processUserWithProvider. email: ${createUserDto.email}, provider: ${providerValue}`
		);
		if (matchedProviderModel) {
			return this.processExistingUser(
				matchedProviderModel,
				createUserDto,
				searchUserByEmail
			);
		}
		return await this.createOAuthUserByNewProvideModel(
			{
				providerId: createUserDto.oauthId,
				providerName: providerValue,
				userId: searchUserByEmail.id
			},
			searchUserByEmail.emailToken
		);
	}

	private async createOAuthUserByNewProvideModel(
		providerDto: OAuthProviderCreationDto,
		emailModel: EmailToken
	): Promise<User> {
		this.logger.log(
			`запуск createOAuthUserByNewProvideModel, userID: ${providerDto.userId}`
		);
		const result: User = await this.prisma.$transaction(async prisma => {
			await this.createAndValidateProvider(providerDto, prisma);
			return await this.processEmailTokenForOAuthUserCreation(
				emailModel,
				providerDto,
				prisma
			);
		});
		this.logger.log(
			`Завершение метода createOAuthUserByNewProvideModel, userID: ${providerDto.userId}`
		);
		return result;
	}

	private async processEmailTokenForOAuthUserCreation(
		emailModel: EmailToken,
		createDto: OAuthProviderCreationDto,
		prisma: PrismaTransaction
	): Promise<User> {
		this.logger.log(
			`Запуск processEmailTokenForOAuthUserCreation. userID:${createDto.userId}`
		);
		if (emailModel) {
			return this.validateAndProcessEmailToken(emailModel, createDto, prisma);
		}
		return await this.usersRepository.updateUserActiveAccount(
			createDto.userId,
			prisma
		);
	}

	private async validateAndProcessEmailToken(
		emailModel: EmailToken,
		createDto: OAuthProviderCreationDto,
		prisma: PrismaTransaction
	): Promise<User> {
		this.logger.log(
			`Запуск validateAndProcessEmailToken, userID: ${emailModel.userId}`
		);
		const validateToken: boolean =
			this.validationTimeCheckEmailTokenByOAuth(emailModel);
		return this.processEmailTokenForOAuthUserUpdate(
			validateToken,
			emailModel,
			createDto,
			prisma
		);
	}

	private async handleTokenValidation(
		validateToken: boolean,
		emailModel: EmailToken,
		createDto: OAuthProviderCreationDto,
		prisma: PrismaTransaction
	): Promise<void> {
		this.logger.log(
			`Запуск handleTokenValidation, userID: ${emailModel.userId}`
		);
		if (validateToken) {
			await this.createBlackListedTokenByOauthCreateUser(
				createDto.userId,
				emailModel.token,
				emailModel.expiresIn,
				prisma
			);
		}
	}

	private async processEmailTokenForOAuthUserUpdate(
		validateToken: boolean,
		emailModel: EmailToken,
		createDto: OAuthProviderCreationDto,
		prisma: PrismaTransaction
	): Promise<User> {
		this.logger.log(
			`Запуск processEmailTokenForOAuthUserUpdate,  userID: ${createDto.userId}`
		);
		const updateUser: User = await this.usersRepository.updateUserActiveAccount(
			createDto.userId,
			prisma
		);
		await this.emailRepository.deleteEmailToken(emailModel.id, prisma);
		await this.handleTokenValidation(
			validateToken,
			emailModel,
			createDto,
			prisma
		);
		return updateUser;
	}

	private async createBlackListedTokenByOauthCreateUser(
		id: string,
		token: string,
		exp: number,
		prisma: PrismaTransaction
	): Promise<BlacklistedToken> {
		this.logger.log(
			`Запуск createBlackListedTokenByOauthCreateUser, userID: ${id}`
		);
		return await this.blackList.createAndSaveBlacklistedToken(
			{
				userId: id,
				tokenV4Id: token,
				exp,
				tokenType: TokenTypeEnum.CONFIRMATION
			},
			prisma
		);
	}

	private validationTimeCheckEmailTokenByOAuth(
		emailToken: EmailToken
	): boolean {
		this.logger.log(
			`Запуск validationTimeCheckEmailTokenByOAuth, userID: ${emailToken.userId}`
		);
		const now: number = this.commonService.getCurrentTimeMillis();
		const tokenExpiresAt: number = new Date(
			emailToken.createdAt.getTime() + emailToken.expiresIn
		).getTime();
		return now > tokenExpiresAt ? false : true;
	}

	async createAndValidateProvider(
		createDto: OAuthProviderCreationDto,
		prisma: PrismaTransaction
	): Promise<ProviderModel> {
		this.logger.log(
			`Запуск createAndValidateProvider, userID: ${createDto.userId}`
		);
		await this.validateProviderCreationDto(createDto);
		return await this.oauthRepository.createProviderModel(createDto, prisma);
	}

	async validateProviderCreationDto(
		createDto: OAuthProviderCreationDto
	): Promise<void> {
		this.logger.log(
			`Запуск validateProviderCreationDto, userID: ${createDto.userId}`
		);
		await this.validateService.validateByDto(createDto);
	}

	private processExistingUser(
		matchedProviderModel: ProviderModel,
		createUserDto: OAuthCreateUser,
		searchUserByEmail: UserWithProvider
	): User {
		this.logger.log(
			`Запуск processExistingUser, userID: ${searchUserByEmail.id}`
		);
		const isSameProviderAndEmail: boolean =
			matchedProviderModel.providerId === createUserDto.oauthId &&
			searchUserByEmail.email === createUserDto.email;
		if (!isSameProviderAndEmail) {
			this.logger.error(
				`Ошибка в processExistingUser, userID: ${searchUserByEmail.id}`
			);
			throw new HttpException(
				'Пользователь с этим провайдером уже зарегистрирован с другим OAuth ID',
				HttpStatus.CONFLICT
			);
		}
		return this.getUserWithoutProvider(searchUserByEmail);
	}

	private getUserWithoutProvider(userWithProvider: UserWithProvider): User {
		const { providerModel, emailToken, ...user } = userWithProvider;
		return user;
	}

	private checkIfUserAlreadyRegisteredWithProvider(
		user: UserWithProvider,
		providerValue: Provider
	): ProviderModel {
		this.logger.log(
			`Запуск checkIfUserAlreadyRegisteredWithProvider. userID: ${user.id}`
		);
		return user.providerModel.find(
			model => model.providerName === providerValue
		);
	}

	private getProviderValue(provider: OAuthProvider): Provider {
		this.logger.log(`Запуск getProviderValue, provider: ${provider}`);
		this.validateProvider(provider);
		const providerMap: Record<OAuthProvider, Provider> = this.getProviderMap();
		return providerMap[provider];
	}

	private getProviderMap(): Record<OAuthProvider, Provider> {
		this.logger.log(`Запуск getProviderMap`);
		return {
			[OAuthProvider.GOOGLE]: Provider.GOOGLE,
			[OAuthProvider.FACEBOOK]: Provider.FACEBOOK,
			[OAuthProvider.GITHUB]: Provider.GITHUB
		};
	}

	private validateProvider(provider: OAuthProvider): void {
		this.logger.log(`Запуск validateProvider, provider: ${provider}`);
		if (!Object.values(OAuthProvider).includes(provider)) {
			throw new HttpException(
				`Неизвестный провайдер OAuth`,
				HttpStatus.BAD_REQUEST
			);
		}
	}
}
