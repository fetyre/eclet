import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { AdsCategoriesService } from './ads-categories.service';

import { UseGuards, UseInterceptors } from '@nestjs/common';
import { User } from '@prisma/client';
import { CurrentUserGraphQl } from 'src/decor';
import { GqlAuthGuard } from 'src/guards';
import {
	CreateProductCategoryInput,
	AllProdcutCategoryInput,
	UpdateProductCategoryInput
} from 'src/ads-categories/dto';
import { EmptyUpdateInterceptorCategory } from 'src/ads-categories/interseptor/empty-dto.update.interceptor';
import { CategoryWithChildren } from 'src/ads-categories/type/product-categoru.type';
import { Category } from './entities/ads-category.entity';

@Resolver(() => Category)
export class AdsCategoriesResolver {
	constructor(private readonly adsCategoriesService: AdsCategoriesService) {}

	@Mutation(() => Category)
	@UseGuards(GqlAuthGuard)
	async createProductCategory(
		@Args('createProductCategoryInput')
		createProductCategoryInput: CreateProductCategoryInput,
		@CurrentUserGraphQl() user: User
	): Promise<CategoryWithChildren> {
		return await this.adsCategoriesService.create(
			createProductCategoryInput,
			user
		);
	}

	@Query(() => [Category], { name: 'productCategories' })
	@UseGuards(GqlAuthGuard)
	async findAll(
		@Args('AllProdcutCategoryInput')
		dto: AllProdcutCategoryInput,
		@CurrentUserGraphQl() user: User
	): Promise<CategoryWithChildren[]> {
		return this.adsCategoriesService.findAll(dto, user);
	}

	@Query(() => Category, { name: 'productCategory' })
	@UseGuards(GqlAuthGuard)
	async findOne(@Args('id') id: string): Promise<CategoryWithChildren> {
		return this.adsCategoriesService.findOne(id);
	}

	@Mutation(() => Category)
	@UseGuards(GqlAuthGuard)
	@UseInterceptors(EmptyUpdateInterceptorCategory)
	async updateProductCategory(
		@Args('updateProductCategoryInput')
		updateProductCategoryInput: UpdateProductCategoryInput,
		@CurrentUserGraphQl() user: User
	): Promise<CategoryWithChildren> {
		return this.adsCategoriesService.update(updateProductCategoryInput, user);
	}

	@Mutation(() => Category)
	@UseGuards(GqlAuthGuard)
	async removeProductCategory(
		@Args('id') id: string,
		@CurrentUserGraphQl() user: User
	) {
		return this.adsCategoriesService.remove(id, user);
	}
}
