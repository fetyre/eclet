import { Test, TestingModule } from '@nestjs/testing';
import { AdsCategoriesResolver } from '../ads-categories.resolver';
import { AdsCategoriesService } from '../ads-categories.service';

describe('AdsCategoriesResolver', () => {
	let resolver: AdsCategoriesResolver;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [AdsCategoriesResolver, AdsCategoriesService]
		}).compile();

		resolver = module.get<AdsCategoriesResolver>(AdsCategoriesResolver);
	});

	it('should be defined', () => {
		expect(resolver).toBeDefined();
	});
});
