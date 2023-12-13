import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { MailerService } from './mailer.service';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
@Processor('mail')
export class MailProcessor {
	private readonly logger: Logger = new Logger(MailProcessor.name);
	constructor(private readonly mailerService: MailerService) {}

	@Process('send')
	async sendMail(job: Job) {
		try {
			this.logger.log('Запуск sendMail');
			const { to, subject, text } = job.data;
			await this.mailerService.sendEmail(to, subject, text);
		} catch (error) {
			this.logger.error(`Ошибка в sendMail, error:${error.message}`);
			throw error;
		}
	}
}
