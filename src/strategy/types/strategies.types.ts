import { EmailToken, User } from '@prisma/client';

export type UserWithEmailToken = User & { emailToken: EmailToken };

export type OptionalUserWithEmailToken = UserWithEmailToken | undefined;
