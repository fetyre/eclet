import { IErrorPointer } from './error-pointer.interface';

export interface IErrorResponse {
	status: number;
	source?: IErrorPointer;
	title: string;
	detail: string | object;
}
