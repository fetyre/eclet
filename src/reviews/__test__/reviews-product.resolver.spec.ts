import { Test, TestingModule } from '@nestjs/testing';
import { ReviewsProductResolver } from '../reviews.resolver';
import { ReviewsProductService } from '../reviews.service';

describe('ReviewsProductResolver', () => {
	let resolver: ReviewsProductResolver;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [ReviewsProductResolver, ReviewsProductService]
		}).compile();

		resolver = module.get<ReviewsProductResolver>(ReviewsProductResolver);
	});

	it('should be defined', () => {
		expect(resolver).toBeDefined();
	});
});
