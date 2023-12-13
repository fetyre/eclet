import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { User, Category } from '@prisma/client';
import { ErrorHandlerService } from 'src/errro-catch/error-catch.service';
import { AllProdcutCategoryInput } from 'src/ads-categories/dto';
import {
	ICreateAdsCategory,
	IUpdateAdsCategory
} from 'src/ads-categories/interface';
import {
	CategotyOrNull,
	OptionalCategoryWithChildren,
	CategoryWithChildren,
	NestedCategoryOrNull
} from 'src/ads-categories/type/product-categoru.type';
import { ValidateService } from 'src/validate/validate.service';
import { I18nService, I18nContext } from 'nestjs-i18n';
import { AdsCategoriesRepository } from './ads-categories.repository';

@Injectable()
export class AdsCategoriesService {
	private readonly logger: Logger = new Logger(AdsCategoriesService.name);

	constructor(
		private readonly errorHandlerService: ErrorHandlerService,
		private readonly validateService: ValidateService,
		private readonly i18n: I18nService,
		private readonly adsCategoriesRepository: AdsCategoriesRepository
	) {}

	public async create(
		createData: ICreateAdsCategory,
		user: User
	): Promise<CategoryWithChildren> {
		try {
			this.logger.log(`Запуск create, adminId:${user.id}`);
			await this.validateAndFindCategory(createData);
			return await this.adsCategoriesRepository.createCategory(createData);
		} catch (error) {
			this.logger.error(
				`Ошибка в create, adminId:${user.id}, error: ${error.message}`
			);
			this.errorHandlerService.handleError(error);
		}
	}

	private async validateAndFindCategory(
		data: ICreateAdsCategory | IUpdateAdsCategory
	): Promise<void> {
		await Promise.all([
			this.checkAndFindCategoryByName(data.name),
			this.findCategoryByParentId(data.parentId)
		]);
	}

	private async findCategoryByParentId(parentId: string): Promise<Category> {
		this.logger.log(`Запуск findCategoryByParentId, categoryId:${parentId} `);
		return parentId ? await this.checkAndFindCategoryId(parentId) : undefined;
	}

	private async checkAndFindCategoryId(categoryId: string): Promise<Category> {
		this.logger.log(`Запуск checkAndFindCategoryId, categoryId:${categoryId} `);
		const category: CategotyOrNull =
			await this.adsCategoriesRepository.findCategoryById(categoryId);
		this.checkCategory(category);
		return category;
	}

	private checkCategory(
		category: CategotyOrNull | OptionalCategoryWithChildren
	): void {
		this.logger.log(`Запуск checkCategory`);
		if (!category) {
			const message: string = this.i18n.t('test.error.accessDenied', {
				lang: I18nContext.current().lang
			});
			throw new HttpException(message, HttpStatus.BAD_REQUEST);
		}
	}

	private async checkAndFindCategoryByName(name: string): Promise<void> {
		this.logger.log(`Заупск checkAndFindCategoryByName`);
		const category: CategotyOrNull =
			await this.adsCategoriesRepository.findCategoryByName(name);
		this.validateCategoryDoesNotExist(category);
	}

	private validateCategoryDoesNotExist(category: CategotyOrNull): void {
		this.logger.log(`Запуск validateCategoryDoesNotExist`);
		if (category) {
			const message: string = this.i18n.t('test.error.accessDenied', {
				lang: I18nContext.current().lang
			});
			throw new HttpException(message, HttpStatus.CONFLICT);
		}
	}

	public async findAll(
		dto: AllProdcutCategoryInput,
		user: User
	): Promise<CategoryWithChildren[]> {
		try {
			this.logger.log(`Начало метода findAll, userId:${user.id}`);
			if (dto.parentId) {
				return await this.findCategoriesByParentId(dto.parentId);
			}
			return await this.findAdnCheckRootCategories();
		} catch (error) {
			this.logger.error(
				`Ошибка в findAll, userId:${user.id}, error: ${error.message}`
			);
			this.errorHandlerService.handleError(error);
		}
	}

	private async findAdnCheckRootCategories(): Promise<CategoryWithChildren[]> {
		this.logger.log(`Начало findAdnCheckRootCategories`);
		const categories: CategoryWithChildren[] =
			await this.adsCategoriesRepository.findRootCategories();
		this.checkCategories(categories.length);
		return categories;
	}

	private checkCategories(categories: number): void {
		this.logger.log(`Начало checkCategories`);
		if (categories === 0) {
			const message: string = this.i18n.t('test.error.categoriesNotFound', {
				lang: I18nContext.current().lang
			});
			throw new HttpException(message, HttpStatus.BAD_REQUEST);
		}
	}

	private async findCategoriesByParentId(
		parentId: string
	): Promise<CategoryWithChildren[]> {
		this.logger.log(`Начало findCategoriesByParentId, categoryId: ${parentId}`);
		const category: NestedCategoryOrNull =
			await this.adsCategoriesRepository.findCategoryWithChildrenById(parentId);
		await Promise.all([
			this.validateCategory(category),
			this.checkCategories(category.children.length)
		]);
		return category.children;
	}

	private validateCategory(category: NestedCategoryOrNull): void {
		this.logger.log(`Начало findCategoriesByParentId`);
		if (!category) {
			const message: string = this.i18n.t('test.error.categoryNotFound', {
				lang: I18nContext.current().lang
			});
			throw new HttpException(message, HttpStatus.BAD_REQUEST);
		}
	}

	public async findOne(id: string): Promise<CategoryWithChildren> {
		try {
			this.logger.log(`Начало findOne`);
			this.validateId(id);
			return await this.findAndCheckOneCategory(id);
		} catch (error) {
			this.logger.error(`Ошибка в create, error: ${error.message}`);
			this.errorHandlerService.handleError(error);
		}
	}

	private validateId(id: string): void {
		return this.validateService.checkId(id);
	}

	private async findAndCheckOneCategory(
		id: string
	): Promise<CategoryWithChildren> {
		this.logger.log(`Начало findAndCheckOneCategory, categoryId: ${id}`);
		const categories: OptionalCategoryWithChildren =
			await this.adsCategoriesRepository.findOneCategory(id);
		this.checkCategory(categories);
		return categories;
	}

	public async update(
		updateData: IUpdateAdsCategory,
		user: User
	): Promise<CategoryWithChildren> {
		try {
			this.logger.log(`Начало update, adminId: ${user.id}`);
			const category: Category = await this.checkAndFindCategoryId(
				updateData.id
			);
			this.minimizeUpdates(category, updateData);
			await this.validateAndUpdateCategoryData(updateData);
			return await this.adsCategoriesRepository.updateCategory(
				category,
				updateData
			);
		} catch (error) {
			this.logger.error(
				`Ошибка в update, adminId:${user.id}, error: ${error.message}`
			);
			this.errorHandlerService.handleError(error);
		}
	}

	private minimizeUpdates(ads: Category, updateData: IUpdateAdsCategory): void {
		this.logger.log(
			`Запуск minimizeUpdates, advertisementId: ${updateData.id}`
		);
		minimizeAdsUpdates: for (const key in updateData) {
			if (ads.hasOwnProperty(key) && ads[key] === updateData[key]) {
				delete updateData[key];
			}
		}
	}

	private async validateAndUpdateCategoryData(
		updateData: IUpdateAdsCategory
	): Promise<void> {
		if (updateData.name && updateData.parentId) {
			return await this.validateAndFindCategory(updateData);
		} else if (updateData.name) {
			return await this.checkAndFindCategoryByName(updateData.name);
		} else if (updateData.parentId) {
			await this.checkAndFindCategoryId(updateData.parentId);
			return;
		}
	}

	public async remove(id: string, user: User): Promise<Category> {
		try {
			this.logger.log(`Запуск remove, adminId:${user.id}`);
			this.validateId(id);
			const category: Category = await this.checkAndFindCategoryId(id);
			return await this.adsCategoriesRepository.deleteCategory(category, user);
		} catch (error) {
			this.logger.error(`create, adminId:${user.id}, error: ${error.message}`);
			this.errorHandlerService.handleError(error);
		}
	}
}
