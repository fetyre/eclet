import { Test, TestingModule } from '@nestjs/testing';
import { SupportUserService } from '../supportUser.service';

describe('AdminService', () => {
	let service: SupportUserService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [SupportUserService]
		}).compile();

		service = module.get<SupportUserService>(SupportUserService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});
});
