import { SortOrder } from 'src/types';

export interface IChatQueryParams {
	page: string;
	pageSize: string;
	unread?: string;
	sort?: SortOrder;
	// status?: ChatStatus;
}
