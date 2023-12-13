import { Review } from '@prisma/client';
import { CreateReviewsProductInput, UpdateReviewsProductInput } from '../dto';

export type MaybeReview = Review | undefined;

export type ReviewsProductFormData =
	| CreateReviewsProductInput
	| UpdateReviewsProductInput;

export type NullableReview = Review | null;
