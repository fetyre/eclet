import { Chat, UserChatStatus } from '@prisma/client';

export type NullableChatStatus = UserChatStatus | null;

export type NullableChat = Chat | null;

export type ChatInfo = [UserChatStatus, Chat];
