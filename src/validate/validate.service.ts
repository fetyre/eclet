import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { User } from '@prisma/client';
import { ValidationError, validate } from 'class-validator';
import { ID_LENGHT, ID_REGEX } from 'src/constants/global-constants';
import { ConfigLoaderService } from 'src/settings/config/config-loader.service';

@Injectable()
export class ValidateService {
	private readonly logger: Logger = new Logger(ValidateService.name);
	constructor(private readonly configLoaderService: ConfigLoaderService) {}

	public async validateByDto<T extends object>(dto: T): Promise<void> {
		const errors: ValidationError[] = await validate(dto);
		return this.checkValidateObject(errors);
	}

	public async validateDto<T extends object, V extends object>(
		dtoClass: new () => T,
		dto: V
	): Promise<void> {
		this.logger.log('Запуск validateDto');
		const errors: ValidationError[] = await validate(
			Object.assign(new dtoClass(), dto)
		);
		return this.checkValidateObject(errors);
	}

	private checkValidateObject(errors: ValidationError[]): void {
		this.logger.log('Запуск checkValidateObject');
		if (errors.length > 0) {
			this.logger.error(`Ошибка в checkValidateObject, error: ${errors}`);
			throw new HttpException(
				'Произошла ошибка на сервере',
				HttpStatus.INTERNAL_SERVER_ERROR
			);
		}
	}

	public checkId(id: string): void {
		this.logger.log('Запуск checkId');
		this.checkIdRegex(id);
		this.checkIdLength(id);
	}

	private checkIdRegex(id: string): void {
		this.logger.log(`Запуск checkIdRegex`);
		const regex: RegExp = new RegExp(ID_REGEX);
		if (!regex.test(id)) {
			throw new HttpException(
				'Некорректный идентификатор',
				HttpStatus.BAD_REQUEST
			);
		}
	}

	private checkIdLength(id: string): void {
		this.logger.log(`Запуск checkIdLength`);
		if (id.length !== ID_LENGHT) {
			throw new HttpException(
				'Некорректный идентификатор',
				HttpStatus.BAD_REQUEST
			);
		}
	}

	public validateUserId(user: User, resetUserId: string): void {
		this.logger.log(`Запуск validateUserId, userId: ${user.id}`);
		this.checkId(resetUserId);
		return this.checkUserPermission(user, resetUserId);
	}

	private checkUserPermission(user: User, resetUserId: string): void {
		this.logger.log(`Запуск checkUserPermission, userId: ${user.id}`);
		if (user.id !== resetUserId) {
			throw new HttpException(
				'Запрещено. У вас нет прав на выполнение этого действия.',
				HttpStatus.FORBIDDEN
			);
		}
	}
}
