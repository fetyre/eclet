import {
	ObjectType,
	Field,
	Int,
	ID,
	Float,
	registerEnumType
} from '@nestjs/graphql';
import { AdvertisementStatus, ItemType } from '@prisma/client';
import { Category } from 'src/ads-categories/entities/ads-category.entity';

registerEnumType(AdvertisementStatus, {
	name: 'AdvertisementStatus' // это имя будет использоваться в схеме GraphQL
});

registerEnumType(ItemType, {
	name: 'ItemType' // это имя будет использоваться в схеме GraphQL
});

@ObjectType()
export class Advertisement {
	@Field(() => ID, { description: 'Уникальный идентификатор объявления' })
	id: string;

	@Field({ description: 'Заголовок объявления' })
	title: string;

	@Field({ nullable: true, description: 'Описание объявления' })
	description?: string;

	@Field(() => Float, {
		nullable: true,
		description: 'Цена товара или услуги в объявлении'
	})
	price?: number;

	@Field({ description: 'Местоположение товара или услуги' })
	location: string;

	@Field({ description: 'Идентификатор категории объявления' })
	categoryId: string;

	@Field(() => Category, { description: 'Категория объявления' })
	category: Category;

	@Field(() => [String], {
		description: 'Список URL-адресов изображений для объявления'
	})
	images: string[];

	@Field(() => Int, { description: 'Количество просмотров объявления' })
	views: number;

	@Field(() => AdvertisementStatus, {
		description: 'Статус объявления (активно, неактивно и т.д.)'
	})
	status: AdvertisementStatus;

	@Field(() => ItemType, { description: 'Тип товара или услуги в объявлении' })
	type: ItemType;

	@Field(() => Int, {
		description: 'Количество добавлений объявления в избранное'
	})
	favorites: number;

	@Field({ description: 'Дата и время публикации объявления' })
	postedAt: Date;

	@Field({ description: 'Дата и время последнего обновления объявления' })
	updatedAt: Date;

	@Field({
		description: 'Идентификатор пользователя, разместившего объявление'
	})
	userId: string;
}
