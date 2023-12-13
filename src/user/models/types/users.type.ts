import { User } from '@prisma/client';

export type BooleanOrUndefined = boolean | undefined;

export type UserWithToken = {
	user: User;
	tokenV4Id: string;
};
