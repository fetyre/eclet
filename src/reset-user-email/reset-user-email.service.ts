import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ICodeEmailReset, IResetEmail } from './interface';
import { ValidateService } from 'src/validate/validate.service';
import { EmailChange, User } from '@prisma/client';
import { PrismaService } from 'src/settings/prisma.database/prisma.service';
import { OptionalEmailChangel } from './types/reset-user-email.type';
import { ConfigLoaderService } from 'src/settings/config/config-loader.service';
import { NullableUser } from 'src/types';
import { MailerService } from '../mailer/mailer.service';
import { ErrorHandlerService } from '../errro-catch/error-catch.service';
import { ResetUserBaseService } from '../reset-user-base/reset-user-base';
import { CommonService } from 'src/common/common.service';
import { ResetUserEmailRepository } from './reset-user-email.repository';
import { UsersRepository } from 'src/user/user.repository';

@Injectable()
export class ResetUserEmailService extends ResetUserBaseService {
	protected readonly logger: Logger = new Logger(ResetUserEmailService.name);

	constructor(
		validateService: ValidateService,
		private readonly prisma: PrismaService,
		private readonly configLoaderService: ConfigLoaderService,
		private readonly mailerService: MailerService,
		private readonly errorHandlerService: ErrorHandlerService,
		readonly commonService: CommonService,
		private readonly resetUserEmailRepository: ResetUserEmailRepository,
		private readonly usersRepository: UsersRepository
	) {
		super(validateService, commonService);
	}

	public async create(
		user: User,
		resetUserId: string,
		resetData?: IResetEmail
	) {
		try {
			this.logger.log(`Запуск create, userId: ${user.id}`);
			this.validateUserId(user, resetUserId);
			if (resetData) {
				return await this.handleResetEmailProcedure(user, resetData);
			}
			return await this.generateNewResetCode(user);
		} catch (error) {
			this.logger.error(
				`Ошибка в create, userId: ${user.id}, error: ${error.message}`
			);
			this.errorHandlerService.handleError(error);
		}
	}

	private async handleResetEmailProcedure(
		user: User,
		resetData: IResetEmail
	): Promise<EmailChange> {
		this.logger.log(`Запуск create, handleResetEmailProcedure: ${user.id}`);
		await this.verifyUserAndEmail(resetData);
		const resetEmailModel: OptionalEmailChangel =
			await this.resetUserEmailRepository.findResetEmailModelByUserId(user);
		if (resetEmailModel) {
			return await this.handleExistingResetRequest(resetData, resetEmailModel);
		}
		return await this.createNewResetRequest(user, resetData);
	}

	private async handleExistingResetRequest(
		resetData: IResetEmail,
		resetEmailModel: EmailChange
	): Promise<EmailChange> {
		this.logger.log(
			`Запуск handleExistingResetRequest, userId: ${resetEmailModel.userId}`
		);
		this.validateLastReset(
			resetEmailModel,
			this.configLoaderService.userResetConfig.email.resetInterval
		);
		this.checkTimeSennCode(
			resetEmailModel,
			this.configLoaderService.userResetConfig.email.maxAttemptMessageReset,
			this.configLoaderService.userResetConfig.email
				.dailyResetCodeAttemptsLimit,
			this.configLoaderService.userResetConfig.email
				.confirmationCodeResendInterval
		);
		const code: string = this.commonService.generate5DigitCode();
		this.pushResetAttempt(resetEmailModel);
		if (resetData.email === resetEmailModel.email) {
			return await this.updateResetEmailCode(resetEmailModel, code);
		}
		return await this.updateResetEmailAndSendCode(
			resetEmailModel,
			code,
			resetData
		);
	}

	private async updateResetEmailAndSendCode(
		resetEmailModel: EmailChange,
		code: string,
		resetData: IResetEmail
	): Promise<EmailChange> {
		this.logger.log(
			`Запуск updateResetEmailAndSendCode, userId: ${resetEmailModel.userId}`
		);
		return await this.prisma.$transaction(async prisma => {
			const updateModel: EmailChange =
				await this.resetUserEmailRepository.updateResetEmail(
					resetEmailModel,
					code,
					resetData,
					prisma
				);
			await this.mailerService.sendEmailChangeConfirmationEmail(
				updateModel.email,
				code
			);
			return updateModel;
		});
	}

	private async createNewResetRequest(user: User, resetData: IResetEmail) {
		this.logger.log(`Запуск createNewResetRequest, userId: ${user.id}`);
		const code: string = this.commonService.generate5DigitCode();
		return await this.createResetRequest(resetData, code, user);
	}

	private async verifyUserAndEmail(resetData: IResetEmail): Promise<void> {
		this.logger.log(`Запуск verifyUserAndEmail, findEmail: ${resetData.email}`);
		const user: NullableUser = await this.usersRepository.findUserByEmail(
			resetData.email
		);
		this.validateUser(user);
	}

	private validateUser(user: User): void {
		this.logger.log(`Запуск validateUser`);
		if (user) {
			throw new HttpException(
				'Адрес электронной почты уже используется. Пожалуйста, выберите другой адрес электронной почты.',
				HttpStatus.CONFLICT
			);
		}
	}

	private async createResetRequest(
		resetData: IResetEmail,
		code: string,
		user: User
	): Promise<EmailChange> {
		this.logger.log(`Запуск createResetRequest, userId: ${user.id}`);
		return await this.prisma.$transaction(async prisma => {
			const resetModel: EmailChange =
				await this.resetUserEmailRepository.createResetEmailEntry(
					resetData,
					code,
					user,
					prisma
				);
			await this.mailerService.sendEmailChangeConfirmationEmail(
				resetModel.email,
				code
			);
			return resetModel;
		});
	}

	private async generateNewResetCode(user: User): Promise<EmailChange> {
		this.logger.log(`Запуск generateNewResetCode, userId: ${user.id}`);
		const resetEmailModel: EmailChange =
			await this.findAndCheckResetEmailModelByUserId(user);
		// нужна ли это
		this.validateLastReset(
			resetEmailModel,
			this.configLoaderService.userResetConfig.email.resetInterval
		);
		//
		this.checkTimeSennCode(
			resetEmailModel,
			this.configLoaderService.userResetConfig.email.maxAttemptMessageReset,
			this.configLoaderService.userResetConfig.email
				.dailyResetCodeAttemptsLimit,
			this.configLoaderService.userResetConfig.email
				.confirmationCodeResendInterval
		);
		this.pushResetAttempt(resetEmailModel);
		const code: string = this.commonService.generate5DigitCode();
		return await this.updateResetEmailCode(resetEmailModel, code);
	}

	private async updateResetEmailCode(
		resetEmailModel: EmailChange,
		code: string
	): Promise<EmailChange> {
		this.logger.log(
			`Запуск updateResetEmailCode, userId: ${resetEmailModel.userId}`
		);
		return await this.prisma.$transaction(async prisma => {
			const updateModel: EmailChange =
				await this.resetUserEmailRepository.updateEmailResetModel(
					resetEmailModel,
					code,
					prisma
				);
			await this.mailerService.sendEmailChangeConfirmationEmail(
				updateModel.email,
				code
			);
			return updateModel;
		});
	}

	private async findAndCheckResetEmailModelByUserId(
		user: User
	): Promise<EmailChange> {
		this.logger.log(
			`Запуск findAndCheckResetEmailModelByUserId, userId: ${user.id}`
		);
		const resetEmailModel: OptionalEmailChangel =
			await this.resetUserEmailRepository.findResetEmailModelByUserId(user);
		this.checkResetEmailModel(resetEmailModel);
		return resetEmailModel;
	}

	private checkResetEmailModel(resetEmailModel: OptionalEmailChangel) {
		this.logger.log(`Запуск checkResetEmailModel`);
		if (!resetEmailModel) {
			throw new HttpException(
				'Запрос на сброс электронной почты не найден.',
				HttpStatus.NOT_FOUND
			);
		}
	}

	async update(
		resetId: string,
		codeData: ICodeEmailReset,
		user: User,
		userId: string
	): Promise<EmailChange> {
		try {
			this.logger.log(`Запуск update, userId: ${user.id}`);
			const resetEmailModel: EmailChange = await this.validateResetProcedure(
				resetId,
				user,
				userId
			);
			this.validateLastReset(
				resetEmailModel,
				this.configLoaderService.userResetConfig.email.resetInterval
			);
			this.verifyUserAccess(user, resetEmailModel);
			this.validateResetCode(codeData, resetEmailModel);
			this.validateTimeLiveResetCode(
				resetEmailModel,
				this.configLoaderService.userResetConfig.email.timeLiveReset
			);
			return this.prisma.$transaction(async prisma => {
				await this.usersRepository.updateUserEmail(resetEmailModel, prisma);
				return await this.resetUserEmailRepository.updateResetEmailAfterTokenConfirm(
					resetEmailModel,
					prisma
				);
			});
		} catch (error) {
			this.logger.log(
				`Ошибка в update, userId: ${user.id}, error: ${error.message}`
			);
			this.errorHandlerService.handleError(error);
		}
	}

	private async validateResetProcedure(
		resetId: string,
		user: User,
		userId: string
	) {
		this.logger.log(`Запуск validateResetProcedure, userId: ${user.id}`);
		this.validateUserId(user, userId);
		return await this.checkResetEmailId(resetId);
	}

	private async checkResetEmailId(resetId: string): Promise<EmailChange> {
		this.logger.log(`Запуск checkResetEmailId, resetId: ${resetId}`);
		this.validateService.checkId(resetId);
		return await this.retrieveAndValidateResetModel(resetId);
	}

	private async retrieveAndValidateResetModel(
		resetId: string
	): Promise<EmailChange> {
		this.logger.log(
			`Запуск retrieveAndValidateResetModel, resetId: ${resetId}`
		);
		const resetEmailModel: OptionalEmailChangel =
			await this.resetUserEmailRepository.fetchModelById(resetId);
		this.ensureModelExists(resetEmailModel);
		return resetEmailModel;
	}
}
