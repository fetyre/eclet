export interface defaulOAuthInterface {
	id: string;
	secret: string;
	redirectUrl: string;
}

export interface OAuthInterface {
	google: defaulOAuthInterface;
	facebook: defaulOAuthInterface;
}
