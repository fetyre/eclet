import { Injectable, Logger } from '@nestjs/common';
import { Favourite, Advertisement, User } from '@prisma/client';
import { PrismaService } from 'src/settings/prisma.database/prisma.service';
import { FavouriteWithAds } from './types/favourite.types';

@Injectable()
export class FavouriteRepository {
	readonly logger: Logger = new Logger(FavouriteRepository.name);
	constructor(private readonly prisma: PrismaService) {}

	public async addAdToFavourites(
		favourite: Favourite,
		ads: Advertisement
	): Promise<FavouriteWithAds> {
		this.logger.log(`Запуск addAdToFavourites, userId: ${favourite.userId}.`);
		return await this.prisma.favourite.update({
			where: { id: favourite.id },
			data: {
				ads: {
					connect: { id: ads.id }
				}
			},
			include: {
				ads: true
			}
		});
	}

	public async createFavouriteForUser(
		user: User,
		ads: Advertisement
	): Promise<FavouriteWithAds> {
		this.logger.log(`Запуск create, userId: ${user.id}.`);
		return await this.prisma.favourite.create({
			data: {
				userId: user.id,
				ads: {
					connect: {
						id: ads.id
					}
				}
			},
			include: {
				ads: true
			}
		});
	}

	public async findFavouriteAdsForUser(user: User): Promise<FavouriteWithAds> {
		this.logger.log(`Запуск findFavouriteAdsForUser, userId: ${user.id}.`);
		return await this.prisma.favourite.findUnique({
			where: { userId: user.id },
			include: {
				ads: true
			}
		});
	}

	public async deteleAdsByFavourite(
		favourite: Favourite,
		ads: Advertisement
	): Promise<FavouriteWithAds> {
		this.logger.log(
			`Запуск deteleAdsByFavourite, userId: ${favourite.userId}.`
		);
		return await this.prisma.favourite.update({
			where: { id: favourite.id },
			data: {
				ads: {
					disconnect: [{ id: ads.id }]
				}
			},
			include: {
				ads: true
			}
		});
	}
}
