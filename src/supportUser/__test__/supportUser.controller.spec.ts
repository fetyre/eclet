import { Test, TestingModule } from '@nestjs/testing';
import { SupportUserController } from '../supportUser.controller';
import { SupportUserService } from '../supportUser.service';

describe('AdminController', () => {
	let controller: SupportUserController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [SupportUserController],
			providers: [SupportUserService]
		}).compile();

		controller = module.get<SupportUserController>(SupportUserController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});
});
