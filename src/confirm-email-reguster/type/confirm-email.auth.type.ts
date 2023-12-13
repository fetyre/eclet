import { User, EmailToken } from '@prisma/client';

export type UserWithEmailToken = User & {
	emailToken: EmailToken;
};

export type UserWithEmailTokenOrNull = UserWithEmailToken | null;
