export interface ConfirmPayload {
	id: string;
	role: string;
	active?: boolean;
	iat: number;
	nbf?: number;
	exp: number;
	aud: string;
	iss: string;
	jti: string;
}
