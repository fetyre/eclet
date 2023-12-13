import { Injectable, Logger } from '@nestjs/common';
import { User } from '@prisma/client';
import { readFileSync } from 'fs';
import { Transporter, createTransport } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import { ConfigLoaderService } from 'src/settings/config/config-loader.service';
import {
	ITemplates,
	ITemplatedData,
	ILofinGenericInfo,
	ILoginDetaildeInfo
} from './interface';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ILoginInfo } from 'src/auth/models/interface';
import { I18nContext } from 'nestjs-i18n';

@Injectable()
export class MailerService {
	private readonly transport: Transporter<SMTPTransport.SentMessageInfo>;
	private readonly email: string;
	private readonly templates: ITemplates;
	private readonly logger: Logger = new Logger(MailerService.name);

	constructor(
		private readonly configLoaderService: ConfigLoaderService,
		@InjectQueue('mail') private mailQueue: Queue,
		// private readonly i18n: I18nContext
	) {
		// const emailConfig = this.configLoaderService.emailConfig
		this.transport = createTransport({
			host: 'mailcatcher',
			port: 1025,
			secure: false,
			tls: {
				rejectUnauthorized: false
			}
		});
		// this.transport = createTransport(emailConfig);
		this.email = `"My App" <${this.configLoaderService.emailConfig.auth.user}>`;
		this.templates = {
			confirmation: MailerService.parseTemplate('confirmation.hbs'),
			resetPassword: MailerService.parseTemplate('reset-password.hbs'),
			afterPasswordResetAtLogin: MailerService.parseTemplate(
				'after-reset-password.hbs'
			),
			afterUserResetPassword: MailerService.parseTemplate(
				'after-user-reset-password.hbs'
			),
			afterUserResetEmail: MailerService.parseTemplate(
				'after-reset-email-user.hbs'
			),
			confirmationAdminEmail: MailerService.parseTemplate(
				'confirmation-admin-email.hbs'
			),
			userReserPasswordCode: MailerService.parseTemplate(
				'user-reset-password-code.hbs'
			),
			adModerationStatus: MailerService.parseTemplate(
				'ad-moderation-status.hbs'
			),
			informMessage: MailerService.parseTemplate('info-message.hbs'),
			loginInfoDetailed: MailerService.parseLoginInfo(
				'login-info-detailed.hbs'
			),
			loginInfoGeneric: MailerService.parseGenericLoginInfo(
				'login-info-generic.hbs'
			),
			singUpOAuth: MailerService.parseGenericLoginInfo('sing-up-oauth.hbs')
		};
	}

	private static parseGenericLoginInfo(
		templateName: string
	): Handlebars.TemplateDelegate<ILofinGenericInfo> {
		const templatePath: string = path.resolve(
			process.cwd(),
			'src',
			'mailer',
			'templates',
			templateName
		);
		const templateText: string = readFileSync(templatePath, 'utf-8');
		return Handlebars.compile<ILofinGenericInfo>(templateText, {
			strict: true
		});
	}

	private static parseLoginInfo(
		templateName: string
	): Handlebars.TemplateDelegate<ILoginDetaildeInfo> {
		const templatePath: string = path.resolve(
			process.cwd(),
			'src',
			'mailer',
			'templates',
			templateName
		);
		const templateText: string = readFileSync(templatePath, 'utf-8');
		return Handlebars.compile<ILoginDetaildeInfo>(templateText, {
			strict: true
		});
	}

	private static parseTemplate(
		templateName: string
	): Handlebars.TemplateDelegate<ITemplatedData> {
		const templatePath: string = path.resolve(
			process.cwd(),
			'src',
			'mailer',
			'templates',
			templateName
		);
		const templateText: string = readFileSync(templatePath, 'utf-8');
		return Handlebars.compile<ITemplatedData>(templateText, { strict: true });
	}

	public async sendEmail(
		to: string,
		subject: string,
		html: string
	): Promise<void> {
		this.logger.log('Запуск sendEmail');
		await this.transport.sendMail({
			from: this.email,
			to,
			subject,
			html
		});
		this.logger.log('Было отправлено новое электронное письмо.');
		return;
	}

	public async sendSingUpOAuth(user: User): Promise<void> {
		this.logger.log(`Запуск sendSingUpOAuth, userID: ${user.id}`);
		const html: string = this.templates.singUpOAuth({});
		return await this.sendEmailWithRetry(
			user.email,
			this.configLoaderService.mailerSubjectConfig.meilerSubjectMessageInfo,
			html
		);
	}

	public async sendNotificationEmail(user: User): Promise<void> {
		this.logger.log(`Запуск sendNotificationEmail, userID: ${user.id}`);
		const html: string = this.templates.informMessage({});
		return await this.sendEmailWithRetry(
			user.email,
			this.configLoaderService.mailerSubjectConfig.meilerSubjectMessageInfo,
			html
		);
	}

	public async sendGenericLoginInfo(user: User, time: string): Promise<void> {
		this.logger.log(`Запуск sendGenericLoginInfo, userID: ${user.id}`);
		const html: string = this.templates.loginInfoGeneric({ time });
		// console.log(
		// 	this.configLoaderService.mailerSubjectConfig.mailerSubjectLoginInfo
		// );
		const subject: string = I18nContext.current().translate(
			'mailerSubject.mailerSubjectConfirmation'
		);
		return await this.sendEmailWithRetry(user.email, subject, html);
	}

	public async sendDetailedLoginInfo(
		loginInfo: ILoginInfo,
		user: User,
		time: string
	): Promise<void> {
		this.logger.log(`Запуск sendDetailedLoginInfo, userID: ${user.id}`);
		const html: string = this.templates.loginInfoDetailed({
			...loginInfo,
			time
		});
		return await this.sendEmailWithRetry(
			user.email,
			this.configLoaderService.mailerSubjectConfig.mailerSubjectLoginInfo,
			html
		);
	}

	public async sendAdModerationStatus(user: User): Promise<void> {
		this.logger.log(`Запуск sendAdModerationStatus, userID: ${user.id}`);
		const html: string = this.templates.adModerationStatus({});
		return await this.sendEmailWithRetry(
			user.email,
			this.configLoaderService.mailerSubjectConfig
				.mailerSubjectAdsModerationStatus,
			html
		);
	}

	public async sendSettingsPasswordChangeCodeEmail(
		user: User,
		code: string
	): Promise<void> {
		this.logger.log(
			`Запуск sendSettingsPasswordChangeCodeEmail, userID: ${user.id}`
		);
		const html: string = this.templates.userReserPasswordCode({ link: code });
		return await this.sendEmailWithRetry(
			user.email,
			this.configLoaderService.mailerSubjectConfig
				.mailerSubjectUserResetPasswordCode,
			html
		);
	}

	public async sendConfirmationEmail(user: User, token: string): Promise<void> {
		this.logger.log(`Запуск sendConfirmationEmail, userID: ${user.id}`);
		const html: string = this.generateConfirmationHtml(token, user);
		return await this.sendEmailWithRetry(
			user.email,
			this.configLoaderService.mailerSubjectConfig.mailerSubjectConfirmation,
			html
		);
	}

	private generateConfirmationHtml(token: string, user: User): string {
		const link: string = `http://${this.configLoaderService.domain}/api/users/${user.id}/confirm-email/${token}`;
		return this.templates.confirmation({ link });
	}

	private async sendEmailWithRetry(
		email: string,
		subject: string,
		text: string
	): Promise<void> {
		this.logger.log('Запуск sendEmailWithRetry');
		await this.mailQueue.add(
			'send',
			{
				to: email,
				subject,
				text
			},
			{
				attempts: this.configLoaderService.mailBullConfig.mailQueueMaxAttempts,
				backoff:
					this.configLoaderService.mailBullConfig.mailQueueBackoffInterval
			}
		);
	}

	public async sendLoginPasswordResetInstructionsEmail(
		user: User,
		token: string
	) {
		this.logger.log(
			`Запуск sendLoginPasswordResetInstructionsEmail, userId: ${user.id}`
		);
		const { email } = user;
		const html: string = this.generateResetPasswordHtml(token);
		return await this.sendEmailWithRetry(
			email,
			this.configLoaderService.mailerSubjectConfig.mailerSubjectResetPassword,
			html
		);
	}

	private generateResetPasswordHtml(token: string): string {
		const link: string = `http://${this.configLoaderService.domain}/api/auth/password-resets/${token}`;
		return this.templates.resetPassword({ link });
	}

	public async sendEmailAfterPasswordResetAtLogin(user: User) {
		this.logger.log(`Запуск sendAfterResetPassword, userId: ${user.id}`);
		const { email } = user;
		const html: string = this.templates.afterPasswordResetAtLogin({});
		return await this.sendEmailWithRetry(
			email,
			this.configLoaderService.mailerSubjectConfig.mailerSubjectAfterReset,
			html
		);
	}

	public async sendPasswordChangeConfirmationEmail(user: User) {
		this.logger.log(
			`Запуск sendPasswordChangeConfirmationEmail, userId: ${user.id}`
		);
		const html: string = this.templates.afterUserResetPassword({});
		return await this.sendEmailWithRetry(
			user.email,
			this.configLoaderService.mailerSubjectConfig
				.mailerSubjectAfterResetInSettings,
			html
		);
	}

	public async sendEmailChangeConfirmationEmail(
		email: string,
		code: string
	): Promise<void> {
		this.logger.log(`Запуск sendEmailChangeConfirmationEmail, email: ${email}`);
		const html: string = this.templates.afterUserResetEmail({
			link: code
		});
		return await this.sendEmailWithRetry(
			email,
			this.configLoaderService.mailerSubjectConfig
				.mailerSubjectConfirmationChangeInSettings,
			html
		);
	}

	public async sendAdminRegistrationConfirmationEmail(
		email: string,
		code: string
	): Promise<void> {
		this.logger.log(`Запуск sendConfirmationAdminEmail, email: ${email}`);
		const html: string = this.templates.confirmationAdminEmail({
			link: code
		});
		return await this.sendEmailWithRetry(
			email,
			this.configLoaderService.mailerSubjectConfig.mailerSubjectConfirmation,
			html
		);
	}
}
