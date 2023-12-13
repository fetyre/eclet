import { Chat, User, UserChatStatus } from '@prisma/client';

export interface ChatWithReceiver {
	receiver: User;
	chat: Chat;
	chatStatuses: UserChatStatus[];
}
