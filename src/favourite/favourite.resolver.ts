import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { FavouriteService } from './favourite.service';
import { Favourite } from './entities/favourite.entity';
import { UseGuards } from '@nestjs/common';
import { CurrentUserGraphQl } from 'src/decor';
import { User } from '@prisma/client';
import { GqlAuthGuard } from 'src/guards';
import { CreateFavouriteInput } from './dto';
import { FavouriteWithAds } from './types/favourite.types';

@Resolver(() => Favourite)
export class FavouriteResolver {
	constructor(private readonly favouriteService: FavouriteService) {}

	@Mutation(() => Favourite)
	@UseGuards(GqlAuthGuard)
	async createFavourite(
		@Args('createFavouriteInput') dto: CreateFavouriteInput,
		@CurrentUserGraphQl() user: User
	): Promise<FavouriteWithAds> {
		return await this.favouriteService.create(user, dto);
	}

	@Query(() => [Favourite], { name: 'favourite' })
	@UseGuards(GqlAuthGuard)
	async findAll(@CurrentUserGraphQl() user: User): Promise<FavouriteWithAds> {
		return await this.favouriteService.findAll(user);
	}

	@Mutation(() => Favourite)
	@UseGuards(GqlAuthGuard)
	async removeFavourite(
		@Args('id') id: string,
		@CurrentUserGraphQl() user: User
	): Promise<FavouriteWithAds> {
		return await this.favouriteService.remove(id, user);
	}
}
