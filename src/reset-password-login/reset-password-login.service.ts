import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ForgotPassword, User } from '@prisma/client';
import {
	NullableUserWithPasswordReset,
	OptionalPasswordReset,
	UserWithCredentialsAndReset,
	PasswordResetToken,
	UserPasswordResetToken,
	UserPasswordResetTokenOrNull,
	UserWithPasswordReset
} from './type/reset-password.type';
import { ErrorHandlerService } from 'src/errro-catch/error-catch.service';
import { MailerService } from 'src/mailer/mailer.service';
import { ConfigLoaderService } from 'src/settings/config/config-loader.service';
import { PrismaService } from 'src/settings/prisma.database/prisma.service';
import { ValidateService } from 'src/validate/validate.service';
import { NotFoundUserByResetPassword } from './error/not-found-user.error';
import {
	SeveCreateResetPasswordDto,
	SeveUpdateResetPasswordDto,
	TokenDto,
	ValidateAfterChangesReserPassword
} from './dto';
import { IResetPasswordLogin, IUpdatePasswordLogin } from './interfaces';
import { ResetPasswordLoginRepository } from './reset-password-login.repository';
import { PasswordService } from 'src/password/password.service';
import { UsersRepository } from 'src/user/user.repository';
import { SecurityService } from 'src/security/security.service';
import { CommonService } from 'src/common/common.service';

@Injectable()
export class ResetPasswordLoginService {
	private readonly logger: Logger = new Logger(ResetPasswordLoginService.name);

	constructor(
		private readonly errorHandlerService: ErrorHandlerService,
		private readonly prisma: PrismaService,
		private readonly mailerService: MailerService,
		private readonly configLoaderService: ConfigLoaderService,
		private readonly validateService: ValidateService,
		private readonly resetPasswordLoginRepository: ResetPasswordLoginRepository,
		private readonly passwordService: PasswordService,
		private readonly usersRepository: UsersRepository,
		private readonly securityService: SecurityService,
		private readonly commonService: CommonService
	) {}

	public async create(dto: IResetPasswordLogin) {
		try {
			this.logger.log(`Начало sendEmailToResetPassword, email: ${dto.email}`);
			const user: UserWithPasswordReset = await this.checkAndFindUserByEmail(
				dto.email
			);
			const tokenModel: ForgotPassword = user.forgotPassword;
			return await this.processResetPasswordToken(tokenModel, user);
		} catch (error) {
			this.logger.error(
				`Ошибка в sendEmailToResetPassword, email: ${dto.email}`
			);
			if (error instanceof NotFoundUserByResetPassword) {
				return;
			}
			this.errorHandlerService.handleError(error);
		}
	}

	private async checkAndFindUserByEmail(
		email: string
	): Promise<UserWithPasswordReset> {
		this.logger.log(`Запуск checkAndFindUserByEmail. email: ${email}`);
		const userWithResetToken: NullableUserWithPasswordReset =
			await this.usersRepository.findUserByEmailWithForgotPassword(email);
		this.checkUserExistence(userWithResetToken);
		return userWithResetToken;
	}

	private checkUserExistence(
		user: NullableUserWithPasswordReset | UserWithCredentialsAndReset
	): void {
		this.logger.log(`Запуск checkUserExistence.`);
		if (!user) {
			throw new NotFoundUserByResetPassword();
		}
	}

	private async processResetPasswordToken(
		tokenModel: ForgotPassword,
		user: UserWithPasswordReset
	): Promise<ForgotPassword> {
		this.logger.log(`Запуск processResetPasswordToken, userID: ${user.id}`);
		if (tokenModel) {
			return this.processExistingResetPasswordToken(tokenModel, user);
		}
		return this.processNewResetPasswordToken(user);
	}

	private async processNewResetPasswordToken(
		user: UserWithPasswordReset
	): Promise<ForgotPassword> {
		this.logger.log(`Запуск processNewResetPasswordToken, userID: ${user.id}`);
		const resetToken: PasswordResetToken =
			await this.generateResetPasswordToken();
		await this.validateCreateResetPasswordModel(
			user.id,
			resetToken.hashedToken
		);
		return await this.prisma.$transaction(async prisma => {
			const updatedTokenModel: ForgotPassword =
				await this.resetPasswordLoginRepository.createResetPasswordTokenModel(
					user.id,
					resetToken.hashedToken,
					prisma
				);
			await this.mailerService.sendLoginPasswordResetInstructionsEmail(
				user,
				resetToken.token
			);
			return updatedTokenModel;
		});
	}

	private async validateCreateResetPasswordModel(
		userId: string,
		token: string
	) {
		this.logger.log(
			`Запуск validateCreateResetPasswordModel, userID: ${userId}`
		);
		const updateDto: SeveCreateResetPasswordDto = {
			userId,
			token
		};
		await this.validateService.validateDto(
			SeveCreateResetPasswordDto,
			updateDto
		);
	}

	private async processExistingResetPasswordToken(
		tokenModel: ForgotPassword,
		user: UserWithPasswordReset
	): Promise<ForgotPassword> {
		this.logger.log(
			`Запуск processExistingResetPasswordToken, userID: ${user.id}`
		);
		this.checkLastResetPassword(user.forgotPassword);
		const checkPasswordResetAttempts: Date[] =
			this.handlePasswordResetAttempts(user);
		const resetToken: PasswordResetToken =
			await this.generateResetPasswordToken();
		await this.validateUpdateResetPasswordModel(
			user.id,
			tokenModel.id,
			resetToken.hashedToken,
			checkPasswordResetAttempts
		);
		return await this.prisma.$transaction(async prisma => {
			const updatedTokenModel: ForgotPassword =
				await this.resetPasswordLoginRepository.updateResetPasswordTokenModel(
					user.id,
					tokenModel.id,
					resetToken.hashedToken,
					checkPasswordResetAttempts,
					prisma
				);
			await this.mailerService.sendLoginPasswordResetInstructionsEmail(
				user,
				resetToken.token
			);
			return updatedTokenModel;
		});
	}

	private checkLastResetPassword(model: ForgotPassword): void {
		this.logger.log(`Запуск checkLastResetPassword, userId:${model.userId}`);
		const lastReset: Date | null = model.lastResetPasword;
		if (lastReset) {
			return this.checkPasswordResetRateLimit(lastReset);
		}
	}

	private checkPasswordResetRateLimit(lastReset: Date): void {
		this.logger.log(`Запуск checkPasswordResetRateLimit`);
		const nowDate: number = this.commonService.getCurrentTimeMillis();
		const lastResetUTC: number = lastReset.getTime();
		const resetThreshold: number =
			lastResetUTC + this.configLoaderService.lastResetPasswordTime;
		if (resetThreshold < nowDate) {
			throw new HttpException(
				'Вы уже запросили сброс пароля. Пожалуйста, подождите 20 минут, прежде чем делать новый запрос',
				HttpStatus.TOO_MANY_REQUESTS
			);
		}
	}

	private async validateUpdateResetPasswordModel(
		userId: string,
		id: string,
		token: string,
		checkPasswordResetAttempts: Date[]
	) {
		this.logger.log(
			`Запуск validateUpdateResetPasswordModel, userID: ${userId}`
		);
		const updateDto: SeveUpdateResetPasswordDto = {
			userId,
			tokenModelId: id,
			token,
			timeCreatetoken: checkPasswordResetAttempts
		};
		await this.validateService.validateDto(
			SeveUpdateResetPasswordDto,
			updateDto
		);
	}

	private async generateResetPasswordToken(): Promise<PasswordResetToken> {
		this.logger.log(`Запуск generateResetPasswordToken`);
		tokenGeneration: while (true) {
			const token: string = this.securityService.generateToken();
			const hashedToken: string = this.securityService.hashedToken(token);
			const isUnique: boolean = await this.checkUniqueHashedToken(hashedToken);
			if (isUnique) {
				this.logger.log(`Успешное завершение generateResetPasswordToken`);
				return { token, hashedToken };
			}
		}
	}

	private async checkUniqueHashedToken(hashedToken: string): Promise<boolean> {
		this.logger.log(`Запуск в checkUniqueHashedToken`);
		const resetModel: OptionalPasswordReset =
			await this.resetPasswordLoginRepository.retrieveUniquePasswordResetToken(
				hashedToken
			);
		return resetModel === null;
	}

	private handlePasswordResetAttempts(user: UserWithPasswordReset): Date[] {
		this.logger.log(`Запуск handlePasswordResetAttempts, userID: ${user.id}`);
		const checkPasswordResetAttempts: Date[] =
			this.checkPasswordResetAttempts(user);
		this.checkPasswordResetLimit(checkPasswordResetAttempts);
		checkPasswordResetAttempts.push(new Date());
		return checkPasswordResetAttempts;
	}

	private checkPasswordResetLimit(attempts: Date[]): void {
		this.logger.log(`Запуск checkPasswordResetLimit`);
		if (attempts.length >= this.configLoaderService.passwordResetLimit) {
			throw new HttpException(
				`Превышено количество попыток сброса пароля`,
				HttpStatus.TOO_MANY_REQUESTS
			);
		}
	}

	private checkPasswordResetAttempts(user: UserWithPasswordReset): Date[] {
		this.logger.log(`Запуск checkPasswordResetAttempts, userId: ${user.id}`);
		const timeCreateResetToken: Date[] = user.forgotPassword.timeCreatetoken;
		return this.getActiveTokens(
			timeCreateResetToken,
			this.configLoaderService.lifetimeOfOnePassworResetAttempt
		);
	}

	private getActiveTokens(timeCreateResetToken: Date[], time: number): Date[] {
		this.logger.log(`Запуск getActiveTokens`);
		const currentTime: Date = new Date();
		return timeCreateResetToken.filter(createTime => {
			const expirationTime: Date = new Date(createTime.getTime() + time);
			return expirationTime > currentTime;
		});
	}

	public async verifyResetToken(resetToken: string): Promise<ForgotPassword> {
		try {
			this.logger.log('Запуск verifyResetToken');
			await this.validateToken(resetToken);
			const tokenHash: string = this.securityService.hashedToken(resetToken);
			const model: ForgotPassword = await this.fetchResetToken(tokenHash);
			this.checkLastResetPassword(model);
			return await this.resetPasswordLoginRepository.updateResetPasswordToken(
				model
			);
		} catch (error) {
			this.logger.error(`Ошибка verifyResetToken: ${error.message}`);
			this.errorHandlerService.handleError(error);
		}
	}

	private async validateToken(token: string): Promise<void> {
		this.logger.log('Запуск validateToken');
		const resetToken: TokenDto = { token };
		await this.validateService.validateDto(TokenDto, resetToken);
	}

	private async fetchResetToken(tokenHash: string): Promise<ForgotPassword> {
		this.logger.log(`Запуск fetchResetToken`);
		const resetToken: OptionalPasswordReset =
			await this.resetPasswordLoginRepository.findUniqueResetToken(tokenHash);
		this.checkResetToken(resetToken);
		return resetToken;
	}

	private checkResetToken(model: OptionalPasswordReset): void {
		this.logger.log(`Запуск checkResetToken`);
		if (!model) {
			throw new HttpException('Ошибка сброса пароля', HttpStatus.NOT_FOUND);
		}
	}

	async update(torken: string, dto: IUpdatePasswordLogin): Promise<User> {
		try {
			this.logger.log(`Начало resserPassword`);
			await this.validateToken(torken);
			const tokenHash: string = this.securityService.hashedToken(torken);
			const passwordHash: string = await this.passwordService.hashPassword(
				dto.password
			);
			return await this.resetPasswordByUser(tokenHash, passwordHash);
		} catch (error) {
			this.logger.error(`Ошибка resserPassword, error:  ${error.message}`);
			this.errorHandlerService.handleError(error);
		}
	}

	private async resetPasswordByUser(
		passwordHash: string,
		token: string
	): Promise<User> {
		this.logger.log(`Начало resetPasswordByUser.`);
		const userWithResetToken: UserPasswordResetToken =
			await this.findUserWithCredentialsByToken(token);
		const {
			user: { credentials, ...user },
			...resetModel
		} = userWithResetToken;
		this.checkPasswordReset(
			resetModel,
			credentials.passwordLast,
			user.password
		);
		await this.validateAfterChangesResetPassrord(user.id, passwordHash);
		return await this.prisma.$transaction(async prisma => {
			const updatedUser: User =
				await this.usersRepository.updateUserByResetPassword(
					user.id,
					passwordHash,
					prisma
				);
			this.mailerService.sendEmailAfterPasswordResetAtLogin(user);
			return updatedUser;
		});
	}

	private async validateAfterChangesResetPassrord(
		userId: string,
		password: string
	): Promise<void> {
		this.logger.log(
			`Запуск validateAfterChangesResetPassrord. userId: ${userId}`
		);
		const resetPasswordData: ValidateAfterChangesReserPassword = {
			userId,
			password
		};
		await this.validateService.validateDto(
			ValidateAfterChangesReserPassword,
			resetPasswordData
		);
	}

	private checkPasswordReset(
		resetPasswordTokenModel: ForgotPassword,
		credentialsPassword: string,
		userPassword: string
	): void {
		this.logger.log(`Запуск checkPasswordReset`);
		this.passwordResetRequestCheck(resetPasswordTokenModel);
		this.passwordVersionComparison(credentialsPassword, userPassword);
		this.checkLastResetPassword(resetPasswordTokenModel);
	}

	private passwordResetRequestCheck(resetPasswordTokenModel: ForgotPassword) {
		this.logger.log(`Запуск passwordResetRequestCheck`);
		if (resetPasswordTokenModel.youResert === false) {
			throw new HttpException('Ошибка запроса', HttpStatus.BAD_REQUEST);
		}
	}

	private passwordVersionComparison(
		credentialsPassword: string,
		userPassword: string
	): void {
		this.logger.log(`Запуск passwordVersionComparison`);
		if (credentialsPassword !== userPassword) {
			throw new HttpException('Ошибка запроса', HttpStatus.BAD_REQUEST);
		}
	}

	private async findUserWithCredentialsByToken(
		token: string
	): Promise<UserPasswordResetToken> {
		this.logger.log(`Запуск findUserWithCredentialsById.`);
		const userWithResetToken: UserPasswordResetTokenOrNull =
			await this.resetPasswordLoginRepository.getUserResetPasswordTokenByToken(
				token
			);
		this.verifyUserExists(userWithResetToken);
		return userWithResetToken;
	}

	private verifyUserExists(
		userWithResetToken: UserPasswordResetTokenOrNull
	): void {
		this.logger.log(`Запуск verifyUserExists.`);
		if (!userWithResetToken) {
			throw new HttpException('Пользователь не найден', HttpStatus.NOT_FOUND);
		}
	}
}
