import { UserGender } from '@prisma/client';

/**
 * @interface IUserUpdate
 * @description Интерфейс для определения структуры объекта при обновлении пользователя
 */
export interface IUserUpdate {
	username?: string;
	phoneNumber?: string;
	gender?: UserGender;
	dateOfBirth?: Date;
	// deliveryAddress?: IUserAddress;
}
