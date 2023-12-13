import { Module } from '@nestjs/common';
import { FavouriteService } from './favourite.service';
import { FavouriteResolver } from './favourite.resolver';
import { ValidateService } from 'src/validate/validate.service';

@Module({
  providers: [FavouriteResolver, FavouriteService, ValidateService],
})
export class FavouriteModule {}
