export interface IUserResetsParams {
	email: IResetParams;
	password: IResetParams;
}

interface IResetParams {
	maxAttemptMessageReset: number;
	confirmationCodeResendInterval: number;
	dailyResetCodeAttemptsLimit: number;
	resetInterval: number;
	timeLiveReset: number;
}
