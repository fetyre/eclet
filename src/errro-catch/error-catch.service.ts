// ErrorHandlerService.ts
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigLoaderService } from 'src/settings/config/config-loader.service';

@Injectable()
export class ErrorHandlerService {
	private readonly logger: Logger = new Logger(ErrorHandlerService.name);

	constructor(private readonly configLoaderService: ConfigLoaderService) {}

	public handleError(error: any): void {
		this.logger.error(`Запуск handleError, error: ${error}`);
		if (error instanceof HttpException) {
			throw error;
		}
		this.logger.warn(`Критическкая ошибка, error: ${error}`);
		throw new HttpException(
			`${this.configLoaderService.errorConfig.errorDefaultMessage}`,
			HttpStatus.INTERNAL_SERVER_ERROR
		);
	}
}
