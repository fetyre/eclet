export interface IReviewsFilter {
	sortOrder?: string;
	sortField?: string;
	text?: boolean;
	recipientId?: string;
	authorId?: string;
	page: number;
	pageSize: number;
}
