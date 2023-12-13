import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { AdvertisementService } from './advertisement.service';
import { Advertisement } from './entities/advertisement.entity';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from 'src/guards';
import { CurrentUserGraphQl } from 'src/decor';
import { User } from '@prisma/client';
import {
	CreateAdvertisementInput,
	FindAllAdsInput,
	UpdateAdvertisementInput
} from './dto';
// import { GraphQLErrorFilter } from 'src/error/global-graph-error';

@Resolver(() => Advertisement)
export class AdvertisementResolver {
	constructor(private readonly advertisementService: AdvertisementService) {}

	@Mutation(() => Advertisement)
	@UseGuards(GqlAuthGuard)
	createAdvertisement(
		@Args('createAdvertisementInput')
		dto: CreateAdvertisementInput,
		@CurrentUserGraphQl() user: User
	) {
		return this.advertisementService.create(dto, user);
	}

	@Query(() => [Advertisement], { name: 'findAllAdvertisement' })
	@UseGuards(GqlAuthGuard)
	findAll(@CurrentUserGraphQl() user: User, @Args('dto') dto: FindAllAdsInput) {
		return this.advertisementService.findAll(dto, user);
	}

	@Query(() => Advertisement, { name: 'findOneAdvertisement' })
	findOne(@Args('id') id: string) {
		return this.advertisementService.findOne(id);
	}

	@Mutation(() => Advertisement)
	@UseGuards(GqlAuthGuard)
	async updateAdvertisement(
		@Args('updateAdvertisementInput')
		dto: UpdateAdvertisementInput,
		@CurrentUserGraphQl() user: User
	) {
		return await this.advertisementService.update(dto, user);
	}

	@Mutation(() => Advertisement)
	@UseGuards(GqlAuthGuard)
	removeAdvertisement(
		@Args('id') id: string,
		@CurrentUserGraphQl() user: User
	) {
		return this.advertisementService.remove(id, user);
	}
}
