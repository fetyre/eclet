import { ChatStatus, NotificationStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class UpdateUserChatStatusDto {
	@IsEnum(NotificationStatus)
	@IsOptional()
	public readonly chatStatus?: ChatStatus;

	@IsEnum(NotificationStatus)
	@IsOptional()
	public readonly notificationStatus?: NotificationStatus;
}
