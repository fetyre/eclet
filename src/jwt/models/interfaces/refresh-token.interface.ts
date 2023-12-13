import { IEmailPayload } from './email-token.interface';
import { ITokenBase } from './token-base.interface';

export interface IRefreshPayload extends IEmailPayload {
	token: string;
	// randomname: string;
	role: string;
	active: boolean;
}

export interface IRefreshToken extends IRefreshPayload, ITokenBase {}
