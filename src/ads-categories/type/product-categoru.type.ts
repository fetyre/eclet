import { Category } from '@prisma/client';

export type CategotyOrNull = Category | null;

export type CategoryWithChildren = Category & { children: Category[] };

export type OptionalCategoryWithChildren = CategoryWithChildren | null;

export type NestedCategory = Category & {
	children: (Category & { children: Category[] })[];
};

export type NestedCategoryOrNull = NestedCategory | null;

// export type CategoryArrayWithChildren = Category & { children: Category[] };
