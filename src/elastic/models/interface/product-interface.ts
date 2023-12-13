export interface ElasticsearchProductInterface {
	id: string;
	name: string;
	description?: string;
	price: number;
	seller: string;
	categories: string[];
	rating?: number;
}
