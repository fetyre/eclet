import { Credentials, EmailToken, User } from '@prisma/client';

export type UserWithCredentials = User & {
	credentials: Credentials;
};

export type OptionalUserWithCredentials = UserWithCredentials | null;

export type UserWithToken = {
	user: User;
	tokenV4Id: string;
};

export type OptionalEmailToken = EmailToken | null;
