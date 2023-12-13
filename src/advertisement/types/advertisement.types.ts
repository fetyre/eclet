import { Advertisement, Category } from '@prisma/client';

export type AdvertisementCategoryType = Category | null;

export type AdvertisementOrNull = Advertisement | null;

export type AdsWithCategory = Advertisement & { category: Category };

export type AdsWithCategoryOrNull = AdsWithCategory | null;
