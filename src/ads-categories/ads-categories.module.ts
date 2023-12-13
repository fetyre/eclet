import { Module } from '@nestjs/common';
import { AdsCategoriesService } from './ads-categories.service';
import { AdsCategoriesResolver } from './ads-categories.resolver';
import { ValidateService } from 'src/validate/validate.service';

@Module({
  providers: [AdsCategoriesResolver, AdsCategoriesService, ValidateService],
})
export class AdsCategoriesModule {}
