// import { Module } from '@nestjs/common';
// import { ElasticService } from './elastic.service';
// import { ElasticController } from './elastic.controller';
// import {
// 	ElasticsearchModule,
// 	ElasticsearchService
// } from '@nestjs/elasticsearch';

// @Module({
// 	imports: [
// 		ElasticsearchModule.registerAsync({
// 			useFactory: () => ({
// 				node: 'http://elasticsearch:9200',
// 				maxRetries: 10,
// 				requestTimeout: 60000,
// 				pingTimeout: 60000,
// 				sniffOnStart: true
// 			})
// 		})
// 	],
// 	controllers: [ElasticController],
// 	providers: [ElasticService, ElasticsearchService],
// 	exports: [ElasticService]
// })
// export class ElasticModule {}
