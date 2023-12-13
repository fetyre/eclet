import { Advertisement, Favourite } from '@prisma/client';

export type NullableFavourite = Favourite | null;

export type NullableAds = Advertisement | null;

export type FavouriteWithAds = Favourite & { ads: Advertisement[] };

export type NullableFavouriteWithAds = FavouriteWithAds | null;
