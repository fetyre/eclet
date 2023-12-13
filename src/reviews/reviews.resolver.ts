import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { ReviewsService } from './reviews.service';
import { ReviewsProduct } from './entities/reviews-product.entity';
import { CreateReviewsProductInput } from './dto/create-reviews-product.input';
import { UpdateReviewsProductInput } from './dto/update-reviews-product.input';
import { User } from '@prisma/client';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from 'src/guards/jwt-graphql-access-auth.guard';
import { CurrentUserGraphQl } from 'src/decor';
import { ReviewsFilterInput } from './dto';

@Resolver(() => ReviewsProduct)
export class ReviewsResolver {
	constructor(private readonly reviewsService: ReviewsService) {}

	@Mutation(() => ReviewsProduct)
	@UseGuards(GqlAuthGuard)
	createReviewsProduct(
		@Args('createReviewsProductInput')
		dto: CreateReviewsProductInput,
		@CurrentUserGraphQl() user: User
	) {
		return this.reviewsService.create(dto, user);
	}

	@Mutation(() => [ReviewsProduct], { name: 'findAllreviews' })
	@UseGuards(GqlAuthGuard)
	findAll(
		@Args('fildAll') dto: ReviewsFilterInput,
		@CurrentUserGraphQl() user: User
	) {
		return this.reviewsService.findAll(dto, user);
	}

	@Query(() => ReviewsProduct, { name: 'reviewProduct' })
	findOne(@Args('id') id: string) {
		return this.reviewsService.findOne(id);
	}

	@Mutation(() => ReviewsProduct)
	updateReviewsProduct(
		@Args('updateReviewsProductInput')
		dto: UpdateReviewsProductInput,
		@CurrentUserGraphQl() user: User
	) {
		return this.reviewsService.update(user, dto);
	}

	@Mutation(() => ReviewsProduct)
	@UseGuards(GqlAuthGuard)
	removeReviewsProduct(
		@Args('id') id: string,
		@CurrentUserGraphQl() user: User
	) {
		return this.reviewsService.remove(user, id);
	}
}
