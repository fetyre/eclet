import { Module } from '@nestjs/common';
import { ConfirmEmailRegusterService } from './confirm-email-reguster.service';
import { ConfirmEmailRegusterController } from './confirm-email-reguster.controller';
import { ValidateService } from 'src/validate/validate.service';
import { BlackListService } from 'src/black-list/black-list.service';

@Module({
	controllers: [ConfirmEmailRegusterController],
	providers: [ConfirmEmailRegusterService, ValidateService, BlackListService]
})
export class ConfirmEmailRegusterModule {}
