import { SortOrder } from 'src/types';

export interface IChatParameters {
	page: number;
	pageSize: number;
	unread?: boolean;
	sort?: SortOrder;
	// status?: ChatStatus;
}
