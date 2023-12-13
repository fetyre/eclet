import { ItemType } from '@prisma/client';

export interface ICreateAdvertisement {
	title: string;
	description?: string;
	price?: number;
	location: string;
	categoryId: string;
	images: string[];
	type: ItemType;
	userId: string;
}
