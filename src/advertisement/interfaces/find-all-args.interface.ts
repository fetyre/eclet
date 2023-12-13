import { ItemType, AdvertisementStatus } from '@prisma/client';

export interface IFindAllAds {
	withImages?: boolean;
	priceFrom?: number;
	priceTo?: number;
	type?: ItemType;
	status?: AdvertisementStatus;
	description?: boolean;
	page: number;
	pageSize: number;
	sortField?: string;
	sortOrder?: string;
	userId?: string;
}
