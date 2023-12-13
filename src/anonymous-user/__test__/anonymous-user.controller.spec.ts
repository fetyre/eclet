import { Test, TestingModule } from '@nestjs/testing';
import { AnonymousUserController } from '../anonymous-user.controller';
import { AnonymousUserService } from '../anonymous-user.service';

describe('AnonymousUserController', () => {
	let controller: AnonymousUserController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [AnonymousUserController],
			providers: [AnonymousUserService]
		}).compile();

		controller = module.get<AnonymousUserController>(AnonymousUserController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});
});
