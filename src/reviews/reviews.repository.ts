import { Injectable, Logger } from '@nestjs/common';
import { Review, User } from '@prisma/client';
import { PrismaService } from 'src/settings/prisma.database/prisma.service';
import { PrismaTransaction } from 'src/types';
import { IReviewCreate, IReviewsFilter, IUpdateReview } from './interface';
import { MaybeReview, NullableReview } from './type';
import { SortField, SortOrderEnum } from 'src/enum/global.enum';
import { BASE_PAGE } from 'src/constants/global-constants';

@Injectable()
export class ReviewsRepository {
	readonly logger: Logger = new Logger(ReviewsRepository.name);
	constructor(private readonly prisma: PrismaService) {}

	public async countUserReviews(
		user: User,
		prisma: PrismaTransaction
	): Promise<number> {
		this.logger.log(`Запуск countUserReviews, recipientUserId: ${user.id}.`);
		return await prisma.review.count({
			where: { recipientId: user.id }
		});
	}

	public async findExistingReview(
		user: User,
		createData: IReviewCreate
	): Promise<NullableReview> {
		this.logger.log(`Запуск findExistingReview, userId: ${user.id}.`);
		return await this.prisma.review.findFirst({
			where: { recipientId: createData.recipientId, authorId: user.id }
		});
	}

	public async createReview(
		createData: IReviewCreate,
		user: User,
		prisma: PrismaTransaction
	): Promise<Review> {
		this.logger.log(`Запуск createReview, userId: ${user.id}.`);
		return await prisma.review.create({
			data: { ...createData, authorId: user.id }
		});
	}

	public async findManyReviews(findData: IReviewsFilter): Promise<Review[]> {
		this.logger.log(`Запуск findManyReviews.`);
		return await this.prisma.review.findMany({
			where: {
				authorId: findData.authorId || undefined,
				recipientId: findData.recipientId || undefined,
				text:
					findData.text !== undefined
						? findData.text
							? { not: null }
							: null
						: undefined
			},
			orderBy: {
				[findData.sortField || SortField.create]:
					findData.sortOrder || SortOrderEnum.desc
			},
			skip: (findData.page - BASE_PAGE) * findData.pageSize,
			take: findData.pageSize
		});
	}

	public async getTotalReviewsCount(args: IReviewsFilter): Promise<number> {
		this.logger.log(`Запуск getTotalReviewsCount.`);
		const idToUse = args.recipientId || args.authorId;
		return await this.prisma.review.count({ where: { id: idToUse } });
	}

	public async updateReview(
		updateData: IUpdateReview,
		review: Review,
		prisma: PrismaTransaction
	): Promise<Review> {
		this.logger.log(`Запуск updateReview, reviewId: ${review.id}.`);
		return await prisma.review.update({
			where: { id: review.id },
			data: { text: updateData.text, rating: updateData.rating }
		});
	}

	public async findReviewById(id: string): Promise<MaybeReview> {
		this.logger.log(`Запуск findReviewById, reviewId: ${id}.`);
		return await this.prisma.review.findUnique({
			where: { id }
		});
	}

	public async deleteReview(
		review: Review,
		prisma: PrismaTransaction
	): Promise<Review> {
		this.logger.log(`Запуск deleteReview, reviewId: ${review.id}.`);
		return await prisma.review.delete({
			where: { id: review.id, authorId: review.authorId }
		});
	}
}
