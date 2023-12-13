export interface ISingleJwt {
	secret: string;
	time: number;
}

// export interface IRefreshJwt {
// 	publicKey: Buffer | string;
// 	privateKey: Buffer | string;
// 	time: number;
// }

export interface IAccessRefreshJwt {
	publicKey: Buffer | string;
	privateKey: Buffer | string;
	time: number;
}

export interface IJwt {
	access: IAccessRefreshJwt;
	confirmation: IAccessRefreshJwt;
	resetPassword: IAccessRefreshJwt;
	refresh: IAccessRefreshJwt;
	// anon: IAccessRefreshJwt;
}
