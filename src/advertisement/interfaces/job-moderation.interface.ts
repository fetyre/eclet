import { Advertisement, User } from '@prisma/client';

export interface IAdvertisementModeration {
	advertisement: Advertisement;
	user: User;
}
