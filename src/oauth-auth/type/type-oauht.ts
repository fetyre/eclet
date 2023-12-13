import { User, ProviderModel, EmailToken } from '@prisma/client';

export type UserWithProvider = User & {
	providerModel: ProviderModel[];
	emailToken: EmailToken;
};

export type UserWithProviderOrNull = UserWithProvider | null;
