import { Test, TestingModule } from '@nestjs/testing';
import { AdsCategoriesService } from '../ads-categories.service';

describe('AdsCategoriesService', () => {
	let service: AdsCategoriesService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [AdsCategoriesService]
		}).compile();

		service = module.get<AdsCategoriesService>(AdsCategoriesService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});
});
