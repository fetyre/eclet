import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Credentials, PasswordReset, User } from '@prisma/client';
import { ErrorHandlerService } from 'src/errro-catch/error-catch.service';
import { MailerService } from 'src/mailer/mailer.service';
import { ConfigLoaderService } from 'src/settings/config/config-loader.service';
import { PrismaService } from 'src/settings/prisma.database/prisma.service';
import { ValidateService } from 'src/validate/validate.service';
import {
	CredentialsOrNull,
	PasswordResetOrNull
} from './types/reset-user-password.type';
import { IPasswordUpdate } from './interface';
import { ValidateUpdatePasswordDto } from './dto';
import { ResetUserBaseService } from 'src/reset-user-base/reset-user-base';
import { PasswordService } from 'src/password/password.service';
import { ResetUserPasswordRepository } from './reset-user-password.repository';
import { CommonService } from 'src/common/common.service';
import { UsersRepository } from 'src/user/user.repository';

@Injectable()
export class ResetUserPasswordService extends ResetUserBaseService {
	protected readonly logger: Logger = new Logger(ResetUserPasswordService.name);

	constructor(
		readonly validateService: ValidateService,
		private readonly prisma: PrismaService,
		private readonly configLoaderService: ConfigLoaderService,
		private readonly mailerService: MailerService,
		private readonly errorHandlerService: ErrorHandlerService,
		private readonly passwordService: PasswordService,
		private readonly resetUserPasswordRepository: ResetUserPasswordRepository,
		readonly commonService: CommonService,
		private readonly usersRepository: UsersRepository
	) {
		super(validateService, commonService);
	}

	public async create(user: User, userId: string): Promise<PasswordReset> {
		try {
			this.logger.log(`Запуск create, userId: ${user.id}`);
			this.validateUserId(user, userId);
			const resetModel: PasswordReset =
				await this.resetUserPasswordRepository.findPasswordResetModelByUserId(
					user
				);
			if (resetModel) {
				return await this.updateResetPasswordIfExist(user, resetModel);
			}
			return await this.createNewPasswordReset(user);
		} catch (error) {
			this.logger.error(
				`Ошибка в create, userId: ${user.id}, error: ${error.message}`
			);
			this.errorHandlerService.handleError(error);
		}
	}

	private async updateResetPasswordIfExist(
		user: User,
		resetModel: PasswordReset
	): Promise<PasswordReset> {
		this.logger.log(`Запуск updateResetPasswordIfExist, userId: ${user.id}`);
		this.validateLastResetPassword(resetModel);
		this.checkTimeSennCode(
			resetModel,
			this.configLoaderService.userResetConfig.password.maxAttemptMessageReset,
			this.configLoaderService.userResetConfig.password
				.dailyResetCodeAttemptsLimit,
			this.configLoaderService.userResetConfig.password
				.confirmationCodeResendInterval
		);
		const code: string = this.commonService.generate5DigitCode();
		this.pushResetAttempt(resetModel);
		return await this.updateResetPasswordCode(resetModel, code, user);
	}

	private async updateResetPasswordCode(
		resetModel: PasswordReset,
		code: string,
		user: User
	): Promise<PasswordReset> {
		this.logger.log(
			`Запуск updateResetEmailCode, userId: ${resetModel.userId}`
		);
		return await this.prisma.$transaction(async prisma => {
			const updateModel: PasswordReset =
				await this.resetUserPasswordRepository.updatePasswordResetModel(
					resetModel,
					code,
					prisma
				);
			await this.mailerService.sendSettingsPasswordChangeCodeEmail(user, code);
			return updateModel;
		});
	}

	private async createNewPasswordReset(user: User) {
		const code: string = this.commonService.generate5DigitCode();
		return await this.createPasswordReset(code, user);
	}

	private async createPasswordReset(
		code: string,
		user: User
	): Promise<PasswordReset> {
		this.logger.log(`Запуск createPasswordReset, userId: ${user.id}`);
		return await this.prisma.$transaction(async prisma => {
			const resetModel: PasswordReset =
				await this.resetUserPasswordRepository.createResetPasswordEntry(
					code,
					user,
					prisma
				);
			await this.mailerService.sendSettingsPasswordChangeCodeEmail(user, code);
			return resetModel;
		});
	}

	public async update(
		resetId: string,
		updateData: IPasswordUpdate,
		userId: string,
		user: User
	) {
		try {
			this.logger.log(`Запуск update, userId: ${user.id}`);
			this.validateService.checkId(resetId);
			const resetPasswordModel: PasswordReset =
				await this.validatePasswordResetProcedure(resetId, user, userId);
			this.validateLastResetPassword(resetPasswordModel);
			this.verifyUserAccess(user, resetPasswordModel);
			this.validateResetCode(updateData, resetPasswordModel);
			this.validateTimeLiveResetCode(
				resetPasswordModel,
				this.configLoaderService.userResetConfig.password.timeLiveReset
			);
			await this.checkPassword(user, updateData);
			await this.hashedPassword(updateData);
			await this.validateBeforeSave(updateData);
			return this.prisma.$transaction(async prisma => {
				await this.usersRepository.updateUserPassword(updateData, user, prisma);
				await this.resetUserPasswordRepository.updateCredentials(
					updateData,
					user,
					prisma
				);
				const updateModel: PasswordReset =
					await this.resetUserPasswordRepository.updateResetPasswordModel(
						resetPasswordModel,
						prisma
					);
				await this.mailerService.sendPasswordChangeConfirmationEmail(user);
				return updateModel;
			});
		} catch (error) {
			this.logger.log(
				`Ошибка в update, userId: ${user.id}, error: ${error.message}`
			);
			this.errorHandlerService.handleError(error);
		}
	}

	private async validateBeforeSave(updateData: IPasswordUpdate): Promise<void> {
		this.logger.log(`Запуск validateBeforeSave`);
		const validateData: ValidateUpdatePasswordDto = {
			password: updateData.password
		};
		await this.validateService.validateDto(
			ValidateUpdatePasswordDto,
			validateData
		);
	}

	private async hashedPassword(updateData: IPasswordUpdate): Promise<void> {
		this.logger.log(`Запуск hashedPassword`);
		updateData.password = await this.passwordService.hashPassword(
			updateData.password
		);
	}

	private async checkPassword(
		user: User,
		updateData: IPasswordUpdate
	): Promise<void> {
		this.logger.log(`Запуск checkPassword, userId: ${user.id}`);
		const credentials: Credentials =
			await this.checkAndFindCredentialsByUserId(user);
		this.validateModelsPassword(user, credentials);
		return await this.validatePasswordUniqueness(user, updateData);
	}

	private async validatePasswordUniqueness(
		user: User,
		updateData: IPasswordUpdate
	): Promise<void> {
		this.logger.log(`Запуск validatePasswordUniqueness, userId: ${user.id}`);
		const isPasswordMatch: boolean = await this.passwordService.verifyPassword(
			user.password,
			updateData.password
		);
		if (isPasswordMatch) {
			throw new HttpException(
				'Новый пароль не может быть таким же, как текущий. Пожалуйста, выберите другой пароль.',
				HttpStatus.CONFLICT
			);
		}
	}

	private validateModelsPassword(user: User, credentials: Credentials): void {
		this.logger.log(`Запуск validateModelsPassword, userId: ${user.id}`);
		if (user.password !== credentials.passwordLast) {
			throw new HttpException(
				'Внутренняя ошибка сервера',
				HttpStatus.INTERNAL_SERVER_ERROR
			);
		}
	}

	private async checkAndFindCredentialsByUserId(
		user: User
	): Promise<Credentials> {
		this.logger.log(
			`Запуск checkAndFindCredentialsByUserId, userId: ${user.id}`
		);
		const credentials: CredentialsOrNull =
			await this.resetUserPasswordRepository.findCredentialsByUserId(user);
		this.checkCredentials(credentials);
		return credentials;
	}

	private checkCredentials(credentials: CredentialsOrNull): void {
		this.logger.log(`Запуск checkCredentials`);
		if (!credentials) {
			throw new HttpException(
				'Внутренняя ошибка сервера',
				HttpStatus.INTERNAL_SERVER_ERROR
			);
		}
	}

	private validateLastResetPassword(resetPasswordModel: PasswordReset) {
		this.logger.log(
			`Запуск validateLastResetPassword, userId: ${resetPasswordModel.userId}`
		);
		const dataNow: number = this.commonService.getCurrentTimeMillis();
		const nextAllowedResetTime: number =
			resetPasswordModel.lastRestEmail.getTime() +
			this.configLoaderService.userResetConfig.password.resetInterval;
		if (dataNow < nextAllowedResetTime) {
			throw new HttpException(
				'Пожалуйста, подождите 12 часа перед следующим сбросом пароля.',
				HttpStatus.TOO_MANY_REQUESTS
			);
		}
	}

	private async validatePasswordResetProcedure(
		resetId: string,
		user: User,
		userId: string
	): Promise<PasswordReset> {
		this.logger.log(
			`Запуск validatePasswordResetProcedure, userId: ${user.id}`
		);
		this.validateUserId(user, userId);
		return await this.retrieveAndValidateResetPasswordModel(resetId);
	}

	private async retrieveAndValidateResetPasswordModel(
		resetId: string
	): Promise<PasswordReset> {
		this.logger.log(
			`Запуск retrieveAndValidateResetModel, resetId: ${resetId}`
		);
		const resetEmailModel: PasswordResetOrNull =
			await this.resetUserPasswordRepository.fetchModelById(resetId);
		this.ensureModelExists(resetEmailModel);
		return resetEmailModel;
	}
}
