// import { Controller, Get, HttpStatus, Query, Res } from '@nestjs/common';
// import { ElasticService } from './elastic.service';
// import { Response } from 'express';

// @Controller('ads/search')
// export class ElasticController {
// 	constructor(private readonly elasticService: ElasticService) {}

// 	@Get()
// 	async findAll(@Query('searchTerm') searchTerm: string, @Res() res: Response) {
// 		const ads = await this.elasticService.searchAds(searchTerm);
// 		res.status(HttpStatus.OK).json(ads);
// 	}
// }
