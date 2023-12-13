import { ITokenBase } from './token-base.interface';

export interface IResetPasswortPayload {
	id: string;
	active: boolean;
}

export interface IResetPasswordToken
	extends IResetPasswortPayload,
		ITokenBase {}
