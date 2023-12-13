import { Credentials, ForgotPassword, User } from '@prisma/client';

export type PasswordResetToken = {
	token: string;
	hashedToken: string;
};

export type UserWithPasswordReset = User & {
	forgotPassword: ForgotPassword;
};

export type NullableUserWithPasswordReset = UserWithPasswordReset | null;

export type OptionalPasswordReset = ForgotPassword | null;

export type UserPasswordResetToken = ForgotPassword & {
	user: User & {
		credentials: Credentials;
	};
};

export type UserPasswordResetTokenOrNull = UserPasswordResetToken | null;

export type UserWithCredentialsAndReset = User & {
	forgotPassword: ForgotPassword;
	credentials: Credentials;
};

export type OptionalUserWithCredentialsAndReset =
	UserWithCredentialsAndReset | null;
