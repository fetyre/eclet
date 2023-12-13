import { Injectable, Logger } from '@nestjs/common';
import { Advertisement, AdvertisementStatus } from '@prisma/client';
import { PrismaService } from 'src/settings/prisma.database/prisma.service';
import { PrismaTransaction } from 'src/types';
import { ICreateAdvertisement, IUpdateAdvertisement } from './interfaces';
import { IFindAllAds } from './interfaces/find-all-args.interface';
import {
	AdsWithCategory,
	AdsWithCategoryOrNull,
	AdvertisementOrNull
} from './types/advertisement.types';
import { BASE_PAGE } from 'src/constants/global-constants';

@Injectable()
export class AdvertisementRepository {
	readonly logger: Logger = new Logger(AdvertisementRepository.name);
	constructor(private readonly prisma: PrismaService) {}

	public async saveAdvertisement(
		dto: ICreateAdvertisement,
		prisma: PrismaTransaction
	): Promise<AdsWithCategory> {
		this.logger.log(`Запуск saveAdvertisement, userId: ${dto.userId}`);
		return await prisma.advertisement.create({
			data: { ...dto },
			include: { category: true }
		});
	}

	public async findMany(findArgs: IFindAllAds): Promise<Advertisement[]> {
		const {
			withImages,
			priceFrom,
			priceTo,
			type,
			status,
			description,
			page,
			pageSize,
			sortField,
			sortOrder,
			userId
		} = findArgs;
		return await this.prisma.advertisement.findMany({
			where: {
				AND: [
					{ images: withImages ? { isEmpty: true } : undefined },
					{
						price:
							priceFrom && priceTo
								? { gte: priceFrom, lte: priceTo }
								: undefined
					},
					{ type: type ? { equals: type } : undefined },
					{ status: status ? { equals: status } : undefined },
					{ description: description ? { not: { equals: null } } : undefined },
					{ userId: userId ? { equals: userId } : undefined }
				]
			},
			take: pageSize,
			skip: (page - BASE_PAGE) * pageSize,
			orderBy: sortField ? { [sortField]: sortOrder } : undefined
		});
	}

	public async findAdsWitchCategoryById(
		id: string
	): Promise<AdsWithCategoryOrNull> {
		this.logger.log(`Запуск findAdsWitchCategoryById, categoryId: ${id}`);
		return await this.prisma.advertisement.findUnique({
			where: { id },
			include: { category: true }
		});
	}

	public async updateAdsActive(
		updateData: IUpdateAdvertisement,
		prisma: PrismaTransaction
	): Promise<AdsWithCategory> {
		this.logger.log(
			`Запуск updateAdsActive, advertisementId: ${updateData.id}`
		);
		const { id, ...data } = updateData;
		return await prisma.advertisement.update({
			where: { id },
			data: { ...data, status: AdvertisementStatus.active },
			include: {
				category: true
			}
		});
	}

	public async updateAdsOnModeration(
		updateData: IUpdateAdvertisement,
		prisma: PrismaTransaction
	): Promise<AdsWithCategory> {
		this.logger.log(
			`Запуск updateAdsOnModeration, advertisementId: ${updateData.id}`
		);
		const { id, ...data } = updateData;
		return await prisma.advertisement.update({
			where: { id },
			data: { ...data, status: AdvertisementStatus.onModeration },
			include: {
				category: true
			}
		});
	}

	public async deleteAds(
		ads: Advertisement,
		prisma: PrismaTransaction
	): Promise<AdsWithCategory> {
		this.logger.log(`Запуск remove, adsId: ${ads.id}`);
		return await prisma.advertisement.delete({
			where: { id: ads.id },
			include: { category: true }
		});
	}

	public async findAdsById(id: string): Promise<AdvertisementOrNull> {
		this.logger.log(`Запуск findAdsById, adsId: ${id}`);
		return await this.prisma.advertisement.findUnique({ where: { id } });
	}

	public async getTotalAdsCount(): Promise<number> {
		this.logger.log(`Запуск getTotalAdsCount.`);
		return await this.prisma.advertisement.count();
	}

	public async updateAdvertisementStatus(
		id: string,
		status: AdvertisementStatus,
		prisma: PrismaTransaction
	): Promise<void> {
		this.logger.log(`Запуск updateAdvertisementStatus `);
		await prisma.advertisement.update({
			where: { id: id },
			data: { status }
		});
	}

	public async findAdvertisementById(id: string): Promise<AdvertisementOrNull> {
		this.logger.log(`Запуск findAdvertisementById, advertisementId: ${id}.`);
		return await this.prisma.advertisement.findUnique({
			where: { id, status: AdvertisementStatus.active }
		});
	}
}
