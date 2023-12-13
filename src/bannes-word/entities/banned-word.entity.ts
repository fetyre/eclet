import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class BannedWord {
	@Field(() => ID, {
		description: 'Уникальный идентификатор запрещенного слова'
	})
	id: string;

	@Field({ description: 'Запрещающее слово' })
	word: string;

	@Field({ description: 'Дата и время создание запиши в бд' })
	createdAt: Date;

	@Field({ description: 'Дата и время последнего обновления в бд' })
	updatedAt: Date;
}
