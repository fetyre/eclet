import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable, Logger } from '@nestjs/common';
import { IBrowserInfo, IGeoLocation, ILoginRequest } from '../models/interface';
import * as geoip from 'geoip-lite';
import * as UAParser from 'ua-parser-js';
import { User } from '@prisma/client';
import { MailerService } from 'src/mailer/mailer.service';
import * as moment from 'moment-timezone';

@Injectable()
@Processor('login')
export class LoginProcessor {
	private readonly logger: Logger = new Logger(LoginProcessor.name);
	constructor(private readonly mailerService: MailerService) {}

	@Process('signIn')
	async sendMail(
		job: Job<{ loginReq: ILoginRequest; user: User }>
	): Promise<void> {
		try {
			this.logger.log(`Запуск sendMail, userId: ${job.data.user.id}`);
			const { ip, userAgent } = job.data.loginReq;
			const user: User = job.data.user;
			const geo: IGeoLocation = this.getGeoLocationByIp(ip);
			const browserInfo: IBrowserInfo = this.getBrowserInfo(userAgent);
			const time: string = this.getCurrentTime();
			return await this.sendAppropriateNotification(
				geo,
				browserInfo,
				user,
				time
			);
		} catch (error) {
			this.logger.error(
				`Ошибка в sendMail, error:${error.message}, userId: ${job.data.user.id}`
			);
			throw error;
		}
	}

	private getCurrentTime(): string {
		this.logger.log(`Запуск getCurrentTime.`);
		return moment.tz('Europe/Minsk').format('YYYY-MM-DD HH:mm:ss Z');
	}

	private async sendAppropriateNotification(
		geo: IGeoLocation,
		browserInfo: IBrowserInfo,
		user: User,
		time: string
	): Promise<void> {
		this.logger.log(`Запуск sendAppropriateNotification, userId: ${user.id}.`);
		const allProperties = { ...geo, ...browserInfo };
		const allValues: string[] = Object.values(allProperties);
		if (allValues.every(value => value === undefined)) {
			return await this.mailerService.sendGenericLoginInfo(user, time);
		}
		return await this.mailerService.sendDetailedLoginInfo(
			allProperties,
			user,
			time
		);
	}

	private getBrowserInfo(userAgent: string): IBrowserInfo {
		this.logger.log(`Запуск getBrowserInfo`);
		const parser: UAParser.UAParserInstance = new UAParser(userAgent);
		const browserName: string = parser.getBrowser().name;
		const browserVersion: string = parser.getBrowser().version;
		const osName: string = parser.getOS().name;
		const osVersion: string = parser.getOS().version;
		return { browserName, browserVersion, osName, osVersion };
	}

	private getGeoLocationByIp(ip: string): IGeoLocation {
		try {
			this.logger.log(`Запуск getGeoLocationByIp`);
			const geo: geoip.Lookup = geoip.lookup(ip);
			const { city, country } = geo;
			return { city, country };
		} catch (error) {
			return { city: undefined, country: undefined };
		}
	}
}
