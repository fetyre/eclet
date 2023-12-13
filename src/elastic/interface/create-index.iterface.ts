import { AdvertisementStatus, ItemType } from '@prisma/client';

export interface IndexBody {
	id: string;
	title: string;
	description: string;
	price: number;
	location: string;
	status: AdvertisementStatus;
	type: ItemType;
	postedAt: Date;
	updatedAt: Date;
	categoryId: string;
}
