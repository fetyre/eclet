import { ITokenBase } from './token-base.interface';

export interface IAccessPayload {
	id: string;
	role: string;
}
export interface IAccessToken extends IAccessPayload, ITokenBase {}
