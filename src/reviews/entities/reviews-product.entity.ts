import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'Отзыв о продукте' })
export class ReviewsProduct {
	@Field(() => ID, { description: 'Идентификатор отзыва' })
	id: string;

	@Field({ description: 'Текст отзыва' })
	text: string;

	@Field(() => Int, { description: 'Оценка отзыва' })
	rating: number;

	@Field(() => [String], { description: 'Массив URL-адресов фотографий' })
	image: string[];

	@Field(() => ID, { description: 'Идентификатор продукта' })
	productId: string;

	@Field(() => ID, { description: 'Идентификатор пользователя' })
	userId: string;

	@Field({ description: 'Время создания отзыва' })
	createdAt: string;
}
