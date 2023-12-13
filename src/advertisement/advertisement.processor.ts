import { Processor, Process } from '@nestjs/bull';
import { Advertisement, AdvertisementStatus, User } from '@prisma/client';
import { Job } from 'bull';
// import { ElasticService } from 'src/elastic/elastic.service';
import { MailerService } from 'src/mailer/mailer.service';
import { PrismaService } from 'src/settings/prisma.database/prisma.service';
import { IAdvertisementModeration } from './interfaces';
import { Logger } from '@nestjs/common';
import { BannedWordRepository } from 'src/bannes-word/banned-word.repository';
import { AdvertisementRepository } from './advertisement.repository';

@Processor('advertisement')
export class ModerationProcessor {
	private readonly logger: Logger = new Logger(ModerationProcessor.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly bannedWordRepository: BannedWordRepository,
		private readonly advertisementRepository: AdvertisementRepository,
		private readonly mailerService: MailerService // private readonly elasticService: ElasticService
	) {}

	@Process('moderation')
	async checkText(job: Job<IAdvertisementModeration>): Promise<void> {
		try {
			this.logger.log(`Запуск checkText `);
			const { advertisement, user } = job.data;

			const bannedWords: string[] = await this.getBannedWords();
			const words: string[] = this.getWordsFromAdvertisement(advertisement);

			for (const word of words) {
				if (this.isWordBanned(word, bannedWords)) {
					return await this.rejectAdvertisement(advertisement.id, user);
				}
			}
			return await this.processAdvertisementIfApproved(advertisement);
		} catch (error) {
			this.logger.log(`Ошибка error${error.message}`);
		}
	}

	private async processAdvertisementIfApproved(
		advertisement: Advertisement
	): Promise<void> {
		this.logger.log(`Запуск processAdvertisementIfApproved `);
		return await this.prisma.$transaction(async prisma => {
			await this.advertisementRepository.updateAdvertisementStatus(
				advertisement.id,
				AdvertisementStatus.active,
				prisma
			);
			await this.indexAds(advertisement);
		});
	}

	private async indexAds(advertisement: Advertisement): Promise<void> {
		this.logger.log(`Запуск indexAds `);
		// await this.elasticService.indexAds(advertisement);
	}

	private async rejectAdvertisement(id: string, user: User): Promise<void> {
		this.logger.log(`Запуск rejectAdvertisement `);
		return await this.prisma.$transaction(async prisma => {
			await this.advertisementRepository.updateAdvertisementStatus(
				id,
				AdvertisementStatus.moderationRejected,
				prisma
			);
			await this.sendAdModerationStatus(user);
		});
	}

	private async getBannedWords(): Promise<string[]> {
		this.logger.log(`Запуск getBannedWords `);
		const bannedWordsFromDB: {
			word: string;
		}[] = await this.bannedWordRepository.getBannedWordsFromDB();
		return this.toLowerCase(bannedWordsFromDB);
	}

	private toLowerCase(words: { word: string }[]): string[] {
		this.logger.log(`Запуск toLowerCase `);
		return words.map(word => word.word.toLowerCase());
	}

	private getWordsFromAdvertisement(advertisement: Advertisement): string[] {
		this.logger.log(`Запуск getWordsFromAdvertisement `);
		return (advertisement.title + ' ' + advertisement.description)
			.toLowerCase()
			.split(/\s+/);
	}

	private isWordBanned(word: string, bannedWords: string[]): boolean {
		this.logger.log(`Запуск isWordBanned `);
		return word.length >= 3 && bannedWords.includes(word);
	}

	private async sendAdModerationStatus(user: User): Promise<void> {
		this.logger.log(`Запуск sendAdModerationStatus `);
		await this.mailerService.sendAdModerationStatus(user);
	}
}
