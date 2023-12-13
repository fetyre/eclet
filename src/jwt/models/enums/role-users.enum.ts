import { UserRole } from '@prisma/client';

export type UserRoleEnum = {
	[key in keyof typeof UserRole]: key;
};

export type UserRoleEnumType = keyof typeof UserRole;
