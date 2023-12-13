import { Chat, User } from '@prisma/client';

export interface IUserAndChat {
	user: User;
	chat: Chat;
}
