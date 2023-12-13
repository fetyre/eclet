import { User } from '@prisma/client';

export interface ILogoutReqDetalic {
	jti: string;
	user: User;
	exp: number;
}
