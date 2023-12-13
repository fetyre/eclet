import { ICreateMessage } from './createMessage.interface';

export interface IUpdateMessage extends ICreateMessage {
	isRead?: boolean;
}
