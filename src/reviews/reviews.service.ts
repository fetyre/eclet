import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Review, User, UserRole } from '@prisma/client';
import { IReviewCreate, IReviewsFilter, IUpdateReview } from './interface';
import { MaybeReview, NullableReview } from './type';
import { ValidateService } from 'src/validate/validate.service';
import { PrismaService } from 'src/settings/prisma.database/prisma.service';
import { PrismaTransaction, UserOrUndefined } from 'src/types';
import { ErrorHandlerService } from 'src/errro-catch/error-catch.service';
import { PageParametersService } from 'src/base-page/page-base.service';
import { I18nService, I18nContext } from 'nestjs-i18n';
import { UsersRepository } from 'src/user/user.repository';
import { ReviewsRepository } from './reviews.repository';
import {
	MIN_REVIEW_UPDATE_FIELDS_COUNT,
	RATING_DECREMENT,
	RATING_INCREMENT
} from 'src/constants/global-constants';

@Injectable()
export class ReviewsService extends PageParametersService {
	readonly logger: Logger = new Logger(ReviewsService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly validateService: ValidateService,
		private readonly errorHadleService: ErrorHandlerService,
		private readonly i18n: I18nService,
		private readonly usersRepository: UsersRepository,
		private readonly reviewsRepository: ReviewsRepository
	) {
		super();
	}

	public async create(createData: IReviewCreate, user: User): Promise<Review> {
		try {
			this.logger.log(`Запуск create, userId: ${user.id}.`);
			const recipientUser: User = await this.findAndCheckUserById(
				createData.recipientId
			);
			this.validateUserBeforeReview(recipientUser);
			await this.checkUserReview(user, createData);
			return await this.prisma.$transaction(async prisma => {
				const existingRatingsCount: number =
					await this.reviewsRepository.countUserReviews(recipientUser, prisma);
				const review: Review = await this.reviewsRepository.createReview(
					createData,
					user,
					prisma
				);
				await this.updateRecipientUserRating(
					recipientUser,
					createData.rating,
					existingRatingsCount,
					prisma
				);
				return review;
			});
		} catch (error) {
			this.logger.error(
				`Ошибка в create, userId: ${user.id}, error: ${error.message}.`
			);
			this.errorHadleService.handleError(error);
		}
	}

	private validateUserBeforeReview(user: User): void {
		if (!user.isEmailVerified) {
			const message: string = this.i18n.t(
				'test.error.EMAIL_ALREADY_REGISTERED',
				{
					lang: I18nContext.current().lang
				}
			);
			throw new HttpException(message, HttpStatus.FORBIDDEN);
		}
	}

	private async updateRecipientUserRating(
		recipientUser: User,
		newRating: number,
		existingRatingsCount: number,
		prisma: PrismaTransaction
	): Promise<User> {
		this.logger.log(
			`Запуск updateRecipientUserRating, recipientUserId: ${recipientUser.id}.`
		);
		const updatedRating: number = this.calculateUpdatedRating(
			recipientUser,
			newRating,
			existingRatingsCount
		);
		return await this.usersRepository.updateUserRatingInDatabase(
			recipientUser,
			updatedRating,
			prisma
		);
	}

	private calculateUpdatedRating(
		recipientUser: User,
		newRating: number,
		existingRatingsCount: number
	): number {
		this.logger.log(
			`Запуск calculateUpdatedRating, recipientUserId: ${recipientUser.id}.`
		);
		return (
			(recipientUser.rating * (existingRatingsCount - RATING_INCREMENT) +
				newRating) /
			(existingRatingsCount + RATING_INCREMENT)
		);
	}

	private async checkUserReview(
		user: User,
		createData: IReviewCreate
	): Promise<void> {
		this.logger.log(`Запуск checkUserReview, userId: ${user.id}.`);
		const existingReview: NullableReview =
			await this.reviewsRepository.findExistingReview(user, createData);
		return this.handleExistingReview(existingReview);
	}

	private handleExistingReview(review: NullableReview): void {
		this.logger.log(`Запуск handleExistingReview, reviewId: ${review.id}.`);
		if (review) {
			throw new HttpException('Отзыв уже существует', HttpStatus.CONFLICT);
		}
	}

	public async findAll(
		findData: IReviewsFilter,
		user: User
	): Promise<Review[]> {
		try {
			this.logger.log(`Запуск findAll, userId: ${user.id}.`);
			this.validateAndProcessRequest(findData, user);
			await this.checkReviewParticipants(findData);
			await this.getRevies(findData);
			return await this.reviewsRepository.findManyReviews(findData);
		} catch (error) {
			this.logger.error(
				`Ошибка в findAll, userId: ${user.id}, error: ${error.message}.`
			);
			this.errorHadleService.handleError(error);
		}
	}

	private async getRevies(args: IReviewsFilter): Promise<void> {
		this.logger.log(`Запуск getRevies.`);
		const totalUsers: number =
			await this.reviewsRepository.getTotalReviewsCount(args);
		this.validatePageSize(totalUsers, args);
		this.validatePageNumber(totalUsers, args);
	}

	private async checkReviewParticipants(
		findData: IReviewsFilter
	): Promise<void> {
		this.logger.log(`Запуск checkReviewParticipants.`);
		await Promise.all([
			this.checkReviewAuthor(findData),
			this.checkReviewRecipient(findData)
		]);
	}

	private async checkReviewRecipient(findData: IReviewsFilter): Promise<void> {
		this.logger.log(`Запуск checkReviewRecipient.`);
		if (findData.authorId) {
			await this.findAndCheckUserById(findData.recipientId);
		}
	}

	private async checkReviewAuthor(findData: IReviewsFilter): Promise<void> {
		this.logger.log(`Запуск checkReviewAuthor.`);
		if (findData.authorId) {
			await this.findAndCheckUserById(findData.authorId);
		}
	}

	private validateAndProcessRequest(
		findData: IReviewsFilter,
		user: User
	): void {
		this.logger.log(`Запуск validateAndProcessRequest, userId: ${user.id}.`);
		this.validateReviewRequest(findData);
		this.validateUserAccess(findData, user);
		this.validateSortFieldAccess(findData, user);
	}

	private validateSortFieldAccess(findData: IReviewsFilter, user: User): void {
		this.logger.log(`Запуск validateSortFieldAccess, userId: ${user.id}.`);
		const isUnauthorizedUser: boolean =
			user.role !== UserRole.admin &&
			user.role !== UserRole.superAdmin &&
			findData.sortField === 'rating';
		if (isUnauthorizedUser) {
			throw new HttpException(
				'Недостаточно прав для выполнения этого действия',
				HttpStatus.FORBIDDEN
			);
		}
	}

	private validateUserAccess(findData: IReviewsFilter, user: User): void {
		this.logger.log(`Запуск validateUserAccess.`);
		const isUnauthorizedUser: boolean =
			user.role !== UserRole.admin &&
			user.role !== UserRole.superAdmin &&
			findData.authorId !== undefined;
		if (isUnauthorizedUser) {
			throw new HttpException(
				'Недостаточно прав для выполнения этого действия',
				HttpStatus.FORBIDDEN
			);
		}
	}

	private validateReviewRequest(findData: IReviewsFilter): void {
		this.logger.log(`Запуск validateReviewRequest.`);
		const isSelfReview: boolean =
			findData.authorId !== undefined &&
			findData.recipientId !== undefined &&
			findData.recipientId === findData.authorId;
		if (isSelfReview) {
			throw new HttpException(
				'Пользователь не может запросить отзывы, которые он отправил сам себе',
				HttpStatus.BAD_REQUEST
			);
		}
	}

	private async findAndCheckUserById(userId: string): Promise<User> {
		this.logger.log(`Запуск findAndCheckUserById, userId: ${userId}.`);
		const user: UserOrUndefined =
			await this.usersRepository.findUserById(userId);
		this.checkUser(user);
		return user;
	}

	private checkUser(user: UserOrUndefined): void {
		this.logger.log(`Запуск checkUser.`);
		if (!user) {
			throw new HttpException('Пользователь не найден', HttpStatus.NOT_FOUND);
		}
	}

	public async findOne(id: string): Promise<Review> {
		try {
			this.logger.log(`Запуск findOne, reviewId: ${id}.`);
			this.validateId(id);
			return await this.findAndValidateReviewById(id);
		} catch (error) {
			this.logger.error(
				`Ошибка в findOne, reviewId: ${id}, error: ${error.message}.`
			);
			this.errorHadleService.handleError(error);
		}
	}

	public async update(user: User, updateData: IUpdateReview): Promise<Review> {
		try {
			this.logger.log(`Запуск update, userId: ${user.id}.`);
			const review: Review = await this.findAndValidateReviewById(
				updateData.reviewId
			);
			this.validateUserReviewAccess(user, review);
			this.minimizeUpdates(review, updateData);
			return await this.prisma.$transaction(async prisma => {
				const updateReview: Review = await this.updateReviewIfNeeded(
					updateData,
					review,
					prisma
				);
				await this.updateRecipientUserRatingIfNeeded(
					review.rating,
					updateReview,
					prisma
				);
				return updateReview;
			});
		} catch (error) {
			this.logger.error(
				`Ошибка в update, userId: ${user.id}, error: ${error.message}.`
			);
			this.errorHadleService.handleError(error);
		}
	}

	private async updateRecipientUserRatingIfNeeded(
		oldRating: number,
		updateReview: Review,
		prisma: PrismaTransaction
	) {
		this.logger.log(
			`Запуск updateRecipientUserRatingIfNeeded, reviewId: ${updateReview.id}.`
		);
		const recipientUser: User = await this.findAndCheckUserById(
			updateReview.recipientId
		);
		const existingRatingsCount: number =
			await this.reviewsRepository.countUserReviews(recipientUser, prisma);
		const updatedRating: number = this.calculateUpdatedRatingForReviewUpdate(
			recipientUser,
			oldRating,
			updateReview.rating,
			existingRatingsCount
		);
		return await this.usersRepository.updateUserRatingInDatabase(
			recipientUser,
			updatedRating,
			prisma
		);
	}

	private calculateUpdatedRatingForReviewUpdate(
		recipientUser: User,
		oldRating: number,
		newRating: number,
		existingRatingsCount: number
	): number {
		this.logger.log(
			`Запуск calculateUpdatedRatingForReviewUpdate, recipientUserId: ${recipientUser.id}.`
		);
		return (
			(recipientUser.rating * existingRatingsCount - oldRating + newRating) /
			existingRatingsCount
		);
	}

	private async updateReviewIfNeeded(
		updateData: IUpdateReview,
		review: Review,
		prisma: PrismaTransaction
	): Promise<Review> {
		this.logger.log(`Запуск updateReviewIfNeeded, reviewId: ${review.id}.`);
		if (Object.keys(updateData).length >= MIN_REVIEW_UPDATE_FIELDS_COUNT) {
			return await this.updateReview(updateData, review, prisma);
		}
		return review;
	}

	private minimizeUpdates(review: Review, updateData: IUpdateReview): void {
		this.logger.log(`Запуск minimizeUpdates, reviewId: ${review.id}.`);
		minimizeReviesUpdates: for (const key in updateData) {
			if (review.hasOwnProperty(key) && review[key] === updateData[key]) {
				delete updateData[key];
			}
		}
	}

	private async updateReview(
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

	private async findAndValidateReviewById(id: string): Promise<Review> {
		this.logger.log(`Запуск findAndValidateReviewById, reviewId: ${id}.`);
		const review: MaybeReview = await this.reviewsRepository.findReviewById(id);
		this.ensureReviewExists(review);
		return review;
	}

	public async remove(user: User, id: string): Promise<Review> {
		try {
			this.logger.log(`Запуск remove, userId: ${user.id}.`);
			this.validateId(id);
			const review: Review = await this.findAndValidateReviewById(id);
			return await this.prisma.$transaction(async prisma => {
				const existingRatingsCount: number =
					await this.reviewsRepository.countUserReviews(user, prisma);
				const deleteReview: Review = await this.deleteReviewIfHasAccess(
					user,
					review,
					prisma
				);
				await this.updateRatingAfterReviewDeletion(
					prisma,
					existingRatingsCount,
					deleteReview,
					user
				);
				return deleteReview;
			});
		} catch (error) {
			this.logger.error(
				`Ошибка в remove, userId: ${user.id}, error: ${error.message}.`
			);
			this.errorHadleService.handleError(error);
		}
	}

	private async updateRatingAfterReviewDeletion(
		prisma: PrismaTransaction,
		existingRatingsCount: number,
		deleteReview: Review,
		user: User
	): Promise<User> {
		this.logger.log(
			`Запуск updateRatingAfterReviewDeletion, reviewId: ${deleteReview.id}.`
		);
		const recipientUser: User = await this.getRecipientUser(user, deleteReview);
		const updatedRating: number = this.calculateUpdatedRatingForReviewDeletion(
			recipientUser,
			deleteReview.rating,
			existingRatingsCount
		);
		return await this.usersRepository.updateUserRatingInDatabase(
			recipientUser,
			updatedRating,
			prisma
		);
	}

	private calculateUpdatedRatingForReviewDeletion(
		recipientUser: User,
		oldRating: number,
		existingRatingsCount: number
	): number {
		this.logger.log(
			`Запуск updateRatingAfterReviewDeletion, recipientUserId: ${recipientUser.id}.`
		);
		return (
			(recipientUser.rating * existingRatingsCount - oldRating) /
			(existingRatingsCount - RATING_DECREMENT)
		);
	}

	private async getRecipientUser(
		user: User,
		deleteReview: Review
	): Promise<User> {
		this.logger.log(
			`Запуск updateRatingAfterReviewDeletion, recipientUserId: ${user.id}.`
		);
		if (user.id !== deleteReview.recipientId) {
			return await this.findAndCheckUserById(deleteReview.recipientId);
		}
		return user;
	}

	private validateId(id: string): void {
		this.logger.log(`Запуск validateId, validateId: ${id}.`);
		this.validateService.checkId(id);
	}

	private async deleteReviewIfHasAccess(
		user: User,
		review: Review,
		prisma: PrismaTransaction
	): Promise<Review> {
		this.logger.log(`Запуск deleteReviewIfHasAccess, userId: ${user.id}.`);
		switch (user.role) {
			case UserRole.admin:
			case UserRole.superAdmin:
				return await this.reviewsRepository.deleteReview(review, prisma);
			case UserRole.user:
				return await this.deleteReviewIfUserHasAccess(user, review, prisma);
			default:
				throw new HttpException(
					'Недопустимая роль пользователя',
					HttpStatus.UNAUTHORIZED
				);
		}
	}

	private async deleteReviewIfUserHasAccess(
		user: User,
		review: Review,
		prisma: PrismaTransaction
	): Promise<Review> {
		this.logger.log(`Запуск deleteReviewIfUserHasAccess, userId: ${user.id}.`);
		await this.validateUserReviewAccess(user, review);
		return await this.reviewsRepository.deleteReview(review, prisma);
	}

	private async validateUserReviewAccess(
		user: User,
		review: Review
	): Promise<void> {
		this.logger.log(`Запуск validateUserReviewAccess, userId: ${user.id}.`);
		if (user.id !== review.authorId) {
			throw new HttpException('Ошибка доступа', HttpStatus.CONFLICT);
		}
	}

	private ensureReviewExists(review: Review): void {
		this.logger.log(`Запуск review.`);
		if (!review) {
			throw new HttpException(
				'Отзыв не найден для указанного продукта',
				HttpStatus.BAD_REQUEST
			);
		}
	}
}
