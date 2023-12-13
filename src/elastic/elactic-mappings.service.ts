// import { Injectable, OnModuleInit } from '@nestjs/common';
// import { ElasticsearchService } from '@nestjs/elasticsearch';
// import { ConfigLoaderService } from 'src/settings/config/config-loader.service';

// @Injectable()
// export class ElasticsearchMappingService implements OnModuleInit {
// 	constructor(
// 		private readonly elasticsearchService: ElasticsearchService,
// 		private readonly configLoaderService: ConfigLoaderService
// 	) {}

// 	async onModuleInit() {
// 		await this.createAdvertisementMappings();
// 	}

// 	private async createAdvertisementMappings() {
// 		return await this.elasticsearchService.indices.create(
// 			{
// 				index: this.configLoaderService.elasticsearchAdsIndex,
// 				body: {
// 					mappings: {
// 						properties: {
// 							id: { type: 'keyword' },
// 							title: { type: 'text' },
// 							description: { type: 'text' },
// 							price: { type: 'float' },
// 							location: { type: 'geo_point' },
// 							status: { type: 'keyword' },
// 							type: { type: 'keyword' },
// 							postedAt: { type: 'date' },
// 							updatedAt: { type: 'date' },
// 							categoryId: { type: 'keyword' }
// 						}
// 					}
// 				}
// 			},
// 			{ ignore: [400] }
// 		);
// 	}
// }
