import { Test, TestingModule } from '@nestjs/testing';
import { BlackListController } from './black-list.controller';
import { BlackListService } from '../black-list.service';

describe('BlackListController', () => {
  let controller: BlackListController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BlackListController],
      providers: [BlackListService],
    }).compile();

    controller = module.get<BlackListController>(BlackListController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
