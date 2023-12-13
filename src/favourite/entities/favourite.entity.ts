import { ObjectType, Field } from '@nestjs/graphql';
import { Advertisement } from 'src/advertisement/entities/advertisement.entity';

@ObjectType()
export class Favourite {
	@Field(() => String, { description: 'Уникальный идентификатор избранного' })
	id: string;

	@Field(() => String, { description: 'Уникальный идентификатор пользователя' })
	userId: string;

	@Field(() => [Advertisement], {
		description: 'Список объявлений, добавленных в избранное'
	})
	ads: Advertisement[];

	@Field(() => Date, { description: 'Дата и время создания записи' })
	createdAt: Date;

	@Field(() => Date, {
		description: 'Дата и время последнего обновления записи'
	})
	updateAt: Date;
}
