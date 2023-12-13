import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ICreateAdvertisement, IUpdateAdvertisement } from './interfaces';
import { Advertisement, User, UserRole } from '@prisma/client';
import { PrismaService } from 'src/settings/prisma.database/prisma.service';
import {
	AdsWithCategory,
	AdsWithCategoryOrNull,
	AdvertisementCategoryType,
	AdvertisementOrNull
} from './types/advertisement.types';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaTransaction } from 'src/types';
import { ValidateService } from 'src/validate/validate.service';
import { ErrorHandlerService } from 'src/errro-catch/error-catch.service';
// import { ElasticService } from 'src/elastic/elastic.service';
import { IFindAllAds } from './interfaces/find-all-args.interface';
import { PageParametersService } from 'src/base-page/page-base.service';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { AdvertisementRepository } from './advertisement.repository';
import { AdsCategoriesRepository } from 'src/ads-categories/ads-categories.repository';
import { INVALID_SORT_FIELD } from 'src/constants/global-constants';

@Injectable()
export class AdvertisementService extends PageParametersService {
	readonly logger: Logger = new Logger(AdvertisementService.name);

	constructor(
		private readonly prisma: PrismaService,
		@InjectQueue('advertisement') private mailQueue: Queue,
		private readonly validateService: ValidateService,
		private readonly i18n: I18nService,
		private readonly advertisementRepository: AdvertisementRepository,
		private readonly adsCategoriesRepository: AdsCategoriesRepository,
		private readonly errorHandlerService: ErrorHandlerService // private readonly elasticService: ElasticService
	) {
		super();
	}

	public async create(
		dto: ICreateAdvertisement,
		user: User
	): Promise<AdsWithCategory> {
		try {
			this.logger.log(`Запуск create, userId: ${user.id}`);
			this.checkUserId(dto.userId, user);
			await this.validateCategory(dto.categoryId);
			return await this.prisma.$transaction(async prisma => {
				const advertisement: AdsWithCategory =
					await this.advertisementRepository.saveAdvertisement(dto, prisma);
				await this.addToModerationQueue(user, advertisement);
				return advertisement;
			});
		} catch (error) {
			this.logger.error(
				`Ошибка в create, error: ${error.message}, userId: ${user.id}`
			);
			this.errorHandlerService.handleError(error);
		}
	}

	private async addToModerationQueue(
		user: User,
		advertisement: Advertisement
	): Promise<void> {
		this.logger.log(`Запуск addToModerationQueue, userId: ${user.id}`);
		await this.mailQueue.add(
			'moderation',
			{
				advertisement,
				user
			},
			{ attempts: 3, backoff: 5000 }
		);
	}

	private async validateCategory(id: string): Promise<void> {
		this.logger.log(`Запуск validateCategory, categoryId: ${id}`);
		const category: AdvertisementCategoryType =
			await this.adsCategoriesRepository.findCategoryById(id);
		this.checkCategory(category);
	}

	private checkCategory(category: AdvertisementCategoryType): void {
		this.logger.log(`Запуск checkCategory`);
		if (!category) {
			const message: string = this.i18n.t('test.error.notFound', {
				lang: I18nContext.current().lang
			});
			throw new HttpException(message, HttpStatus.NOT_FOUND);
		}
	}

	private checkUserId(adsUserId: string, user: User): void {
		this.logger.log(
			`Запуск checkUserId, dtoUserId: ${adsUserId}, userId: ${user.id}`
		);
		if (adsUserId !== user.id) {
			const message: string = this.i18n.t('test.error.accessDenied', {
				lang: I18nContext.current().lang
			});
			throw new HttpException(message, HttpStatus.FORBIDDEN);
		}
	}

	public async findAll(findArgs: IFindAllAds, user: User) {
		try {
			this.logger.log(`Запуск findAll, userId: ${user.id}`);
			this.validateUserAndQuery(findArgs, user);
			await this.getAds(findArgs);
			return await this.advertisementRepository.findMany(findArgs);
		} catch (error) {
			this.logger.error(
				`Ошибка в findAll, error: ${error.message}, userId: ${user.id}`
			);
			this.errorHandlerService.handleError(error);
		}
	}

	private async getAds(args: IFindAllAds): Promise<void> {
		this.logger.log(`Запуск getWords.`);
		const totalUsers: number =
			await this.advertisementRepository.getTotalAdsCount();
		this.validatePageNumber(totalUsers, args);
		this.validatePageSize(totalUsers, args);
	}

	private validateUserAndQuery(findArgs: IFindAllAds, user: User): void {
		this.logger.log(`Запуск validateUserAndQuery, userId: ${user.id}`);
		const isUserAdmin: boolean =
			user.role !== UserRole.superAdmin && user.role !== UserRole.admin;
		if (isUserAdmin) {
			return this.checkQueryParameters(findArgs);
		}
	}

	private checkQueryParameters(findArgs: IFindAllAds): void {
		this.logger.log(`Запуск checkQueryParameters`);
		const isInvalidQuery: boolean =
			findArgs.description &&
			findArgs.status &&
			findArgs.sortField === INVALID_SORT_FIELD;
		if (isInvalidQuery) {
			const message: string = this.i18n.t('test.error.accessDenied', {
				lang: I18nContext.current().lang
			});
			throw new HttpException(message, HttpStatus.FORBIDDEN);
		}
	}

	public async findOne(id: string): Promise<AdsWithCategory> {
		try {
			this.logger.log(`Запуск findOne, adsId: ${id}.`);
			this.validateId(id);
			return await this.checkAndFindAdsWithCategoryById(id);
		} catch (error) {
			this.logger.error(
				`Ошибка в findOne, error: ${error.message}, adsId: ${id}`
			);
			this.errorHandlerService.handleError(error);
		}
	}

	private async checkAndFindAdsWithCategoryById(
		id: string
	): Promise<AdsWithCategory> {
		this.logger.log(
			`Запуск checkAndFindAdsWithCategoryById, categoryId: ${id}.`
		);
		const advertisement: AdsWithCategoryOrNull =
			await this.advertisementRepository.findAdsWitchCategoryById(id);
		this.checkAdvertisement(advertisement);
		return advertisement;
	}

	private checkAdvertisement(
		advertisement: AdsWithCategoryOrNull | AdvertisementOrNull
	): void {
		this.logger.log(`Запуск checkAdvertisement.`);
		if (advertisement) {
			const message: string = this.i18n.t('test.error.notFound', {
				lang: I18nContext.current().lang
			});
			throw new HttpException(message, HttpStatus.NOT_FOUND);
		}
	}

	private validateId(id: string): void {
		this.logger.log(`Запуск validateId, id: ${id}`);
		this.validateService.checkId(id);
	}

	public async update(
		updateData: IUpdateAdvertisement,
		user: User
	): Promise<AdsWithCategory> {
		try {
			this.logger.log(`Запуск update, userId: ${user.id}`);
			const ads: Advertisement = await this.checkAndFindAdsById(updateData.id);
			this.validateUserRole(ads, user);
			this.minimizeUpdates(ads, updateData);
			await this.handleCategoryValidation(updateData);
			return this.prisma.$transaction(async prisma => {
				if (updateData.description || updateData.title) {
					return await this.updateWithModeration(updateData, user, prisma);
				}
				return await this.updateWithoutModeration(updateData, prisma);
			});
		} catch (error) {
			this.logger.error(
				`Ошибка в update, error: ${error.message}, userId: ${user.id}`
			);
			this.errorHandlerService.handleError(error);
		}
	}

	private async updateWithModeration(
		updateData: IUpdateAdvertisement,
		user: User,
		prisma: PrismaTransaction
	): Promise<AdsWithCategory> {
		this.logger.log(`Запуск updateWithModeration, userId: ${user.id}`);
		const updateAdsWithCategory: AdsWithCategory =
			await this.advertisementRepository.updateAdsOnModeration(
				updateData,
				prisma
			);
		const { category, ...updateAds } = updateAdsWithCategory;
		await this.addToModeration(updateAds, user);
		return updateAdsWithCategory;
	}

	private async updateWithoutModeration(
		updateData: IUpdateAdvertisement,
		prisma: PrismaTransaction
	): Promise<AdsWithCategory> {
		this.logger.log(
			`Запуск updateWithoutModeration, advertisementId: ${updateData.id}`
		);
		const updateAdsWithCategory: AdsWithCategory =
			await this.advertisementRepository.updateAdsActive(updateData, prisma);
		const { category, ...updateAds } = updateAdsWithCategory;
		await this.updateIndexAds(updateAds);
		return updateAdsWithCategory;
	}

	private async updateIndexAds(advertisement: Advertisement): Promise<void> {
		this.logger.log(
			`Запуск advertisement, advertisementId: ${advertisement.id}`
		);
		// await this.elasticService.updateAds(advertisement);
	}

	private async addToModeration(ads: Advertisement, user: User): Promise<void> {
		this.logger.log(
			`Запуск updateAdsaddToModerationActive, usernId: ${user.id}`
		);
		if (user.role !== UserRole.admin && user.role !== UserRole.superAdmin) {
			await this.addToModerationQueue(user, ads);
		}
	}

	private async handleCategoryValidation(
		updateData: IUpdateAdvertisement
	): Promise<void> {
		this.logger.log(
			`Запуск handleCategoryValidation, advertisementId: ${updateData.id}`
		);
		if (updateData.categoryId) {
			return await this.validateCategory(updateData.categoryId);
		}
	}

	private minimizeUpdates(
		ads: Advertisement,
		updateData: IUpdateAdvertisement
	): void {
		this.logger.log(
			`Запуск minimizeUpdates, advertisementId: ${updateData.id}`
		);
		minimizeAdsUpdates: for (const key in updateData) {
			if (ads.hasOwnProperty(key) && ads[key] === updateData[key]) {
				delete updateData[key];
			}
		}
	}

	public async remove(adsId: string, user: User): Promise<AdsWithCategory> {
		try {
			this.logger.log(`Запуск remove, userId: ${user.id}`);
			this.validateId(adsId);
			const ads: Advertisement = await this.checkAndFindAdsById(adsId);
			this.validateUserRole(ads, user);
			return await this.prisma.$transaction(async prisma => {
				const deleteAds: AdsWithCategory =
					await this.advertisementRepository.deleteAds(ads, prisma);
				await this.deleteIndex(deleteAds);
				return deleteAds;
			});
		} catch (error) {
			this.logger.error(
				`Ошибка в remove, userId: ${user.id}, error: ${error.message}, ads: ${adsId}`
			);
			this.errorHandlerService.handleError(error);
		}
	}

	private async deleteIndex(advertisement: Advertisement): Promise<void> {
		this.logger.log(
			`Запуск advertisement, advertisementId: ${advertisement.id}`
		);
		// await this.elasticService.deleteAds(advertisement.id);
	}

	private validateUserRole(ads: Advertisement, user: User): void {
		this.logger.log(`Запуск validateUserRole, userId: ${user.id}`);
		if (user.role !== UserRole.admin && user.role !== UserRole.superAdmin) {
			return this.checkUserId(ads.userId, user);
		}
	}

	private async checkAndFindAdsById(id: string): Promise<Advertisement> {
		this.logger.log(`Запуск checkAndFindAdsById, adsId: ${id}`);
		const ads: AdvertisementOrNull =
			await this.advertisementRepository.findAdsById(id);
		this.checkAdvertisement(ads);
		return ads;
	}
}
