import { AdvertisementStatus, ItemType } from '@prisma/client';

export interface IUpdateAdvertisement {
	id: string;
	status?: AdvertisementStatus;
	title?: string;
	description?: string;
	price?: number;
	location?: string;
	categoryId?: string;
	images?: string[];
	type?: ItemType;
}
