import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { BASE_PAGE, MIN_ITEMS_PER_PAGE } from 'src/constants/global-constants';

@Injectable()
export abstract class PageParametersService {
	protected readonly logger: Logger = new Logger(PageParametersService.name);

	protected validatePageNumber(
		totalUsers: number,
		queryParams: {
			page: number;
			pageSize: number;
		}
	): void {
		this.logger.log(`Запуск validatePageNumber.`);
		const firstUserOnPage: number =
			(queryParams.page - BASE_PAGE) * queryParams.pageSize +
			MIN_ITEMS_PER_PAGE;
		if (totalUsers < firstUserOnPage) {
			throw new HttpException(
				'Запрашиваемая страница не существует. Пожалуйста, укажите другую страницу.',
				HttpStatus.NOT_FOUND
			);
		}
	}

	protected validatePageSize(
		totalUsers: number,
		queryParams: {
			page: number;
			pageSize: number;
		}
	): void {
		this.logger.log(`Запуск validatePageSize.`);
		if (queryParams.pageSize > totalUsers) {
			throw new HttpException(
				'Размер страницы не может быть больше общего количества пользователей.',
				HttpStatus.BAD_REQUEST
			);
		}
	}
}
