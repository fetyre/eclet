import { Injectable, Logger } from '@nestjs/common';
import { Category, User } from '@prisma/client';
import { SortOrderEnum } from 'src/enum/global.enum';
import { PrismaService } from 'src/settings/prisma.database/prisma.service';
import { ICreateAdsCategory, IUpdateAdsCategory } from './interface';
import {
	CategotyOrNull,
	CategoryWithChildren,
	NestedCategoryOrNull,
	OptionalCategoryWithChildren
} from './type/product-categoru.type';

@Injectable()
export class AdsCategoriesRepository {
	readonly logger: Logger = new Logger(AdsCategoriesRepository.name);
	constructor(private readonly prisma: PrismaService) {}

	public async findCategoryById(id: string): Promise<CategotyOrNull> {
		this.logger.log(`Запуск findCategoryById`);
		return await this.prisma.category.findUnique({ where: { id } });
	}

	public async createCategory(
		createData: ICreateAdsCategory
	): Promise<CategoryWithChildren> {
		this.logger.log(`Начало метода createCategory`);
		return await this.prisma.category.create({
			data: { ...createData },
			include: { children: true }
		});
	}

	public async findCategoryByName(name: string): Promise<CategotyOrNull> {
		this.logger.log(`Запуск findCategoryByName`);
		return await this.prisma.category.findUnique({ where: { name } });
	}

	public async findRootCategories(): Promise<CategoryWithChildren[]> {
		this.logger.log(`Начало findRootCategories`);
		return await this.prisma.category.findMany({
			orderBy: { name: SortOrderEnum.asc },
			include: { children: true }
		});
	}

	public async findCategoryWithChildrenById(
		id: string
	): Promise<NestedCategoryOrNull> {
		this.logger.log(`Начало findCategoryWithChildrenById, categoryId: ${id}`);
		return await this.prisma.category.findUnique({
			where: { id },
			include: {
				children: {
					orderBy: { name: SortOrderEnum.asc },
					include: { children: true }
				}
			}
		});
	}

	public async findOneCategory(
		id: string
	): Promise<OptionalCategoryWithChildren> {
		this.logger.log(`Начало метода findOneCategory, categoryId: ${id}`);
		return await this.prisma.category.findUnique({
			where: { id },
			include: {
				children: {
					orderBy: {
						name: SortOrderEnum.asc
					}
				},
				ads: true
			}
		});
	}

	public async updateCategory(
		category: Category,
		dto: IUpdateAdsCategory
	): Promise<CategoryWithChildren> {
		this.logger.log(`Начало updateCategory, categoryId: ${category.id}`);
		delete dto.id;
		return await this.prisma.category.update({
			where: { id: category.id },
			data: { ...dto },
			include: {
				children: true
			}
		});
	}

	public async deleteCategory(
		category: Category,
		admin: User
	): Promise<Category> {
		this.logger.log(
			`Запуск deleteCategory, adminId:${admin.id}, categoryId: ${category.id}`
		);
		return await this.prisma.category.delete({
			where: { id: category.id },
			include: { children: true }
		});
	}
}
