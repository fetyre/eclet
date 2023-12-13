import { ChatStatus, NotificationStatus } from '@prisma/client';

export interface IUpdateUserChatStatus {
	chatStatus?: ChatStatus;
	notificationStatus?: NotificationStatus;
}
