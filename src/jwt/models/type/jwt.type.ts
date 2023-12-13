import {
	IAccessPayload,
	IResetPasswortPayload,
	IEmailPayload,
	IRefreshPayload,
	IAccessToken,
	IEmailToken,
	IRefreshToken,
	IResetPasswordToken
} from '../interfaces';

export type JwtPayloadType =
	| IAccessPayload
	| IEmailPayload
	| IRefreshPayload
	| IResetPasswortPayload;

export type JwtTokenType =
	| IAccessToken
	| IEmailToken
	| IRefreshToken
	| IResetPasswordToken;
