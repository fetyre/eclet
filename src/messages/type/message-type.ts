import { Chat, Message, User, UserChatStatus } from '@prisma/client';

export type ChatWithStatusOrNull = ChatWithUsersAndTheirStatuses | null;

export type ChatWithUserStatus = Chat & {
	userChatStatuses: UserChatStatus[];
};

export type NullableChatWithUserStatus = ChatWithUserStatus | null;

export type ChatWithUsersAndTheirStatuses = Chat & {
	userChatStatuses: UserChatStatus[];
	initiator: User;
	participant: User;
};

export type NullbleMessage = Message | null;
