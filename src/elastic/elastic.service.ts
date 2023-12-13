// import { WriteResponseBase } from '@elastic/elasticsearch/lib/api/types';
// import { Injectable } from '@nestjs/common';
// import { ElasticsearchService } from '@nestjs/elasticsearch';
// import { Advertisement, AdvertisementStatus } from '@prisma/client';
// import { IndexBody } from './interface';
// import { ConfigLoaderService } from 'src/settings/config/config-loader.service';

// @Injectable()
// export class ElasticService {
// 	constructor(
// 		private readonly elasticsearchService: ElasticsearchService,
// 		private readonly configLoaderService: ConfigLoaderService
// 	) {}

// 	public async indexAds(ads: Advertisement): Promise<any> {
// 		const body: IndexBody = this.advertisementToIndexBody(ads);
// 		const result: WriteResponseBase = await this.indexDataInElasticsearch(body);
// 		return result;
// 	}

// 	private async indexDataInElasticsearch(body: IndexBody) {
// 		return await this.elasticsearchService.index({
// 			index: this.configLoaderService.elasticsearchAdsIndex,
// 			body
// 		});
// 	}

// 	private advertisementToIndexBody(ads: Advertisement): IndexBody {
// 		return {
// 			id: ads.id,
// 			title: ads.title,
// 			description: ads.description,
// 			price: ads.price,
// 			location: ads.location,
// 			status: ads.status,
// 			type: ads.type,
// 			postedAt: ads.postedAt,
// 			updatedAt: ads.updatedAt,
// 			categoryId: ads.categoryId
// 		};
// 	}

// 	public async updateAds(ads: Advertisement): Promise<any> {
// 		const body: IndexBody = this.advertisementToIndexBody(ads);
// 		const result: WriteResponseBase = await this.updateDataInElasticsearch(
// 			ads.id,
// 			body
// 		);
// 		return result;
// 	}

// 	private async updateDataInElasticsearch(id: string, body: IndexBody) {
// 		return await this.elasticsearchService.update({
// 			index: this.configLoaderService.elasticsearchAdsIndex,
// 			id: id,
// 			body: {
// 				doc: body
// 			}
// 		});
// 	}

// 	public async deleteAds(adsId: string): Promise<any> {
// 		const result: WriteResponseBase = await this.elasticsearchService.delete({
// 			index: this.configLoaderService.elasticsearchAdsIndex,
// 			id: adsId
// 		});
// 		return result;
// 	}

// 	public async searchAds(query: string): Promise<any> {
// 		const result = await this.elasticsearchService.search({
// 			index: this.configLoaderService.elasticsearchAdsIndex,
// 			body: {
// 				query: {
// 					function_score: {
// 						query: {
// 							bool: {
// 								must: [
// 									{ multi_match: { query, fields: ['description', 'title'] } },
// 									{ match: { status: AdvertisementStatus.active } }
// 								]
// 							}
// 						},
// 						functions: [
// 							{
// 								random_score: {}
// 							}
// 						]
// 					}
// 				}
// 			}
// 		});
// 		return result;
// 	}
// }
