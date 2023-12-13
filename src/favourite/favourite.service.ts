import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Advertisement, User } from '@prisma/client';
import { ICreateFavourite } from './interfaces';
import {
	FavouriteWithAds,
	NullableAds,
	NullableFavouriteWithAds
} from './types/favourite.types';
import { ValidateService } from 'src/validate/validate.service';
import { ErrorHandlerService } from 'src/errro-catch/error-catch.service';
import { FavouriteRepository } from './favourite.repository';
import { AdvertisementRepository } from 'src/advertisement/advertisement.repository';

@Injectable()
export class FavouriteService {
	private readonly logger: Logger = new Logger(FavouriteService.name);

	constructor(
		private readonly validateService: ValidateService,
		private readonly errorHandlerService: ErrorHandlerService,
		private readonly favouriteRepository: FavouriteRepository,
		private readonly advertisementRepository: AdvertisementRepository
	) {}

	public async create(
		user: User,
		createData: ICreateFavourite
	): Promise<FavouriteWithAds> {
		try {
			this.logger.log(`Запуск create, userId: ${user.id}.`);
			// this.verifyUserStatusAndEmail(user);
			const ads: Advertisement = await this.findAds(createData.adsId);
			this.validateUserIsNotAdOwner(ads, user);
			const favourite: NullableFavouriteWithAds =
				await this.favouriteRepository.findFavouriteAdsForUser(user);
			if (favourite) {
				return await this.checkAndAddToFavourites(ads, favourite);
			}
			return await this.favouriteRepository.createFavouriteForUser(user, ads);
		} catch (error) {
			this.logger.error(
				`Ошибка в create, userId: ${user.id}, error: ${error.message}`
			);
			this.errorHandlerService.handleError(error);
		}
	}

	private async checkAndAddToFavourites(
		advertisement: Advertisement,
		favourite: FavouriteWithAds
	): Promise<FavouriteWithAds> {
		this.logger.log(
			`Запуск checkAndAddToFavourites, userId: ${favourite.userId}.`
		);
		const isAdInFavourites: boolean = this.isAdInFavourites(
			advertisement,
			favourite
		);
		this.checkAndThrowIfInFavourites(isAdInFavourites);
		const { ads, ...favouriteWithoutAds } = favourite;
		return await this.favouriteRepository.addAdToFavourites(
			favouriteWithoutAds,
			advertisement
		);
	}

	private checkAndThrowIfInFavourites(isAdInFavourites: boolean): void {
		this.logger.log(`Запуск checkAndThrowIfInFavourites.`);
		if (isAdInFavourites) {
			throw new HttpException(
				'Это объявление уже добавлено в избранное',
				HttpStatus.CONFLICT
			);
		}
	}

	private isAdInFavourites(
		ads: Advertisement,
		favourite: FavouriteWithAds
	): boolean {
		this.logger.log(`Запуск isAdInFavourites, userId: ${favourite.userId}.`);
		return favourite.ads.some(ad => ad.id === ads.id);
	}

	private validateUserIsNotAdOwner(ads: Advertisement, user: User): void {
		this.logger.log(`Запуск validateUserIsNotAdOwner, userId: ${user.id}.`);
		if (ads.userId === user.id) {
			throw new HttpException(
				'Вы не можете добавить свое объявление в избранное',
				HttpStatus.FORBIDDEN
			);
		}
	}

	private async findAds(adsId: string): Promise<Advertisement> {
		this.logger.log(`Запуск findAds, adsId: ${adsId}.`);
		const ads: NullableAds =
			await this.advertisementRepository.findAdvertisementById(adsId);
		this.validateAdvertisementExists(ads);
		return ads;
	}

	private validateAdvertisementExists(ads: NullableAds): void {
		this.logger.log(`Запуск validateAdvertisementExists.`);
		if (!ads) {
			throw new HttpException(
				'Указанного объявления не найдено',
				HttpStatus.NOT_FOUND
			);
		}
	}

	public async findAll(user: User): Promise<FavouriteWithAds> {
		try {
			this.logger.log(`Запуск findAll, userId: ${user.id}.`);
			return await this.findUserFavouriteById(user);
		} catch (error) {
			this.logger.error(
				`Ошибка в findAll, userId: ${user.id}, error: ${error.message}`
			);
			this.errorHandlerService.handleError(error);
		}
	}

	private async findUserFavouriteById(user: User): Promise<FavouriteWithAds> {
		this.logger.log(`Запуск findUserFavouriteById, userId: ${user.id}.`);
		const favourite: NullableFavouriteWithAds =
			await this.favouriteRepository.findFavouriteAdsForUser(user);
		this.validateFavouriteExists(favourite);
		return favourite;
	}

	private validateFavouriteExists(favourite: NullableFavouriteWithAds): void {
		this.logger.log(`Запуск validateFavouriteExists.`);
		if (!favourite) {
			throw new HttpException('Избранное не найдено', HttpStatus.NOT_FOUND);
		}
	}

	private validateId(id: string): void {
		this.logger.log(`Запуск validateId.`);
		return this.validateService.checkId(id);
	}

	public async remove(id: string, user: User): Promise<FavouriteWithAds> {
		try {
			this.logger.log(`Запуск remove, userId: ${user.id}.`);
			this.validateId(id);
			const [ads, favourite] = await this.findAdvertisementAndFavourite(
				id,
				user
			);
			// const { favouriteAds, ...favouriteWithoutAds } = favourite;
			this.validateAdvertisementAndFavourite(ads, favourite);
			return await this.favouriteRepository.deteleAdsByFavourite(
				favourite,
				ads
			);
		} catch (error) {
			this.logger.error(
				`Ошибка в remove, userId: ${user.id}, error: ${error.message}`
			);
			this.errorHandlerService.handleError(error);
		}
	}

	private validateAdvertisementAndFavourite(
		ads: Advertisement,
		favourite: FavouriteWithAds
	): void {
		this.logger.log(
			`Запуск validateAdvertisementAndFavourite, userId: ${favourite.userId}.`
		);
		const isAdInFavourites: boolean = this.isAdInFavourites(ads, favourite);
		return this.handleAdInFavourites(isAdInFavourites);
	}

	private handleAdInFavourites(isAdInFavourites: boolean): void {
		this.logger.log(`Запуск handleAdInFavourites.`);
		if (!isAdInFavourites) {
			throw new HttpException(
				'Объявление не найдено в избранном',
				HttpStatus.NOT_FOUND
			);
		}
	}

	private async findAdvertisementAndFavourite(
		id: string,
		user: User
	): Promise<[Advertisement, FavouriteWithAds]> {
		this.logger.log(`Запуск create, userId: ${user.id}.`);
		return await Promise.all([
			this.findAds(id),
			this.findUserFavouriteById(user)
		]);
	}
}
