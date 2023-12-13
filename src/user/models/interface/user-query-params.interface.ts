import { StatusEnum, UserGender, UserRole, UserStatus } from '@prisma/client';

export interface UserQueryParams {
	isEmailVerified?: string;
	gender?: UserGender;
	status?: StatusEnum;
	accountStatus?: UserStatus;
	role?: UserRole;
	page: number;
	pageSize: number;
	sortField?: string;
	sortOrder?: string;
}
