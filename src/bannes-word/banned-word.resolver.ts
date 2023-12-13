import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { BannedWord } from './entities/banned-word.entity';
import {
	ArgsBannedWordsDto,
	CreateBannedWordInput,
	UpdateBannedWordInput
} from './dto';
import { BannedWordService } from './banned-word.service';
import { CurrentUserGraphQl } from 'src/decor';
import { User } from '@prisma/client';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from 'src/guards';

@Resolver(() => BannedWord)
export class BannedWordResolver {
	constructor(private readonly bannesWordService: BannedWordService) {}

	@Mutation(() => BannedWord)
	@UseGuards(GqlAuthGuard)
	createBannesWord(
		@Args('createBannesWordInput') dto: CreateBannedWordInput,
		@CurrentUserGraphQl() user: User
	) {
		return this.bannesWordService.create(dto, user);
	}

	@Query(() => [BannedWord], { name: 'getAllBannesWord' })
	@UseGuards(GqlAuthGuard)
	findAll(
		@Args('args') args: ArgsBannedWordsDto,
		@CurrentUserGraphQl() user: User
	) {
		return this.bannesWordService.findAll(args, user);
	}

	@Query(() => BannedWord, { name: 'bannesWord' })
	@UseGuards(GqlAuthGuard)
	findOne(@Args('id') id: string, @CurrentUserGraphQl() user: User) {
		return this.bannesWordService.findOne(id, user);
	}

	@Mutation(() => BannedWord)
	@UseGuards(GqlAuthGuard)
	updateBannesWord(
		@Args('updateBannesWordInput') dto: UpdateBannedWordInput,
		@CurrentUserGraphQl() user: User
	) {
		return this.bannesWordService.update(dto, user);
	}

	@Mutation(() => BannedWord)
	@UseGuards(GqlAuthGuard)
	removeBannesWord(@Args('id') id: string, @CurrentUserGraphQl() user: User) {
		return this.bannesWordService.remove(id, user);
	}
}
