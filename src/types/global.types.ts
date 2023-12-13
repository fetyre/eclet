import { Prisma, PrismaClient, User } from '@prisma/client';
import { DefaultArgs } from '@prisma/client/runtime/library';

export type UserOrUndefined = User | undefined;

export type PrismaTransaction = Omit<
	PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>,
	'$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export type NullableUser = User | null;

export type SortOrder = 'asc' | 'desc';

export type OptionalString = string | undefined;

export const sortOrderValues: SortOrder[] = ['asc', 'desc'];

