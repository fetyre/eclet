import { Test, TestingModule } from '@nestjs/testing';
import { ConfirmEmailRegusterController } from '../confirm-email-reguster.controller';
import { ConfirmEmailRegusterService } from '../confirm-email-reguster.service';

describe('ConfirmEmailRegusterController', () => {
	let controller: ConfirmEmailRegusterController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [ConfirmEmailRegusterController],
			providers: [ConfirmEmailRegusterService]
		}).compile();

		controller = module.get<ConfirmEmailRegusterController>(
			ConfirmEmailRegusterController
		);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});
});
