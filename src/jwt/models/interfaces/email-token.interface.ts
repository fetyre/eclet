import { IAccessPayload } from './access-token.interface';
import { ITokenBase } from './token-base.interface';

export interface IEmailPayload extends IAccessPayload {
	id: string;
	role: string;
	active: boolean;
}
export interface IEmailToken extends IEmailPayload, ITokenBase {}
