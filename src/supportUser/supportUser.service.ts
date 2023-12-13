import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { CreateAdminDto } from './dto/create-supportUser.dto';
import { SupportUserModel } from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from 'src/settings/prisma.database/prisma.service';
import * as speakeasy from 'speakeasy';
import { MailerService } from 'src/mailer/mailer.service';
import { PrismaTransaction } from 'src/types';
import { ErrorHandlerService } from 'src/errro-catch/error-catch.service';

@Injectable()
export class SupportUserService {
	private readonly logger: Logger = new Logger(SupportUserService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly mailerService: MailerService,
		private readonly errorHandlerService: ErrorHandlerService
	) {}

	public async createSupportUser(
		createAdminDto: CreateAdminDto
	): Promise<SupportUserModel> {
		try {
			this.logger.log(
				`Запуск createSupportUser. email: ${createAdminDto.email}`
			);
			await this.findSupportUserByEmail(createAdminDto.email);
			const code: string = await this.createCodeByСonfirmationEmail();
			return await this.prisma.$transaction(async prisma => {
				const supportUser: SupportUserModel = await this.saveSupportUserModel(
					createAdminDto,
					prisma
				);
				await this.mailerService.sendAdminRegistrationConfirmationEmail(
					createAdminDto.email,
					code
				);
				return supportUser;
			});
		} catch (error) {
			this.logger.error(
				`Ошибка в createSupportUser. email: ${createAdminDto.email}`
			);
			this.errorHandlerService.handleError(error);
		}
	}

	private async saveSupportUserModel(
		dto: CreateAdminDto,
		prisma: PrismaTransaction
	): Promise<SupportUserModel> {
		this.logger.log(`Запуск метода saveAdminModel. email: ${dto.email}`);
		const hashedPassword: string = await this.createHashPassword(dto.password);
		const code: string = await this.createCodeByСonfirmationEmail();
		return await this.saveSupportUser(
			dto.email,
			dto.username,
			hashedPassword,
			code,
			prisma
		);
	}

	private async createCodeByСonfirmationEmail(): Promise<string> {
		const secret: speakeasy.GeneratedSecret = speakeasy.generateSecret({
			length: 20
		});
		const otp: string = speakeasy.totp({
			secret: secret.base32,
			digits: 5
		});
		return otp;
	}

	private async saveSupportUser(
		email: string,
		username: string,
		password: string,
		code: string,
		prisma: PrismaTransaction
	): Promise<SupportUserModel> {
		this.logger.log(`Запуск saveSupportUser. email: ${email}`);
		return await prisma.supportUserModel.create({
			data: { email, username, password, confirmEmail: { create: { code } } }
		});
	}

	private async createHashPassword(password: string) {
		this.logger.log({
			level: 'info',
			message: `Запуск метода createHashPassword`,
			context: 'adminService'
		});
		return await argon2.hash(password);
	}

	private async findSupportUserByEmail(
		email: string
	): Promise<SupportUserModel> {
		this.logger.log(`Запуск findSupportUserByEmail. email: ${email}`);
		const admin: SupportUserModel =
			await this.prisma.supportUserModel.findUnique({
				where: { email }
			});
		this.checkSupportUserModel(admin);
		return admin;
	}

	private checkSupportUserModel(admin: SupportUserModel): void {
		this.logger.log(`Запуск checkSupportUserModel`);
		if (admin) {
			throw new HttpException(
				'Этот email занят, попробуйте другой',
				HttpStatus.CONFLICT
			);
		}
	}
}
