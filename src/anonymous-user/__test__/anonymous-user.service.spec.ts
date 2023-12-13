import { Test, TestingModule } from '@nestjs/testing';
import { AnonymousUserService } from '../anonymous-user.service';

describe('AnonymousUserService', () => {
	let service: AnonymousUserService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [AnonymousUserService]
		}).compile();

		service = module.get<AnonymousUserService>(AnonymousUserService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});
});
