import { ICreatePasswordReset } from './create-password-reset.interface';

export interface IUpdatePasswordReset extends ICreatePasswordReset {
	tokenModelId: string;
	timeCreatetoken: Date[];
}
