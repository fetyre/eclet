import { IBannedWord } from './banned-words.interface';

export interface IUpdateBannedWord extends IBannedWord {
	id: string;
}
