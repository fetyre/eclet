import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Advertisement } from 'src/advertisement/entities/advertisement.entity';

@ObjectType()
export class Category {
	@Field(() => ID, { description: 'Уникальный идентификатор категории' })
	id: string;

	@Field(() => String, { description: 'Название категории' })
	name: string;

	@Field(() => String, { nullable: true, description: 'Описание категории' })
	description?: string;

	@Field(() => String, {
		nullable: true,
		description: 'Идентификатор родительской категории'
	})
	parentId?: string;

	@Field(() => Category, {
		nullable: true,
		description: 'Родительская категория'
	})
	parent?: Category;

	@Field(() => [Category], { description: 'Список дочерних категорий' })
	children: Category[];

	@Field(() => [Advertisement], { description: 'Список продуктов в категории' })
	ads: Advertisement[];

	@Field(() => Date, { description: 'Дата создания категории' })
	createdAt: Date;

	@Field(() => Date, { description: 'Дата последнего обновления категории' })
	updatedAt: Date;
}
