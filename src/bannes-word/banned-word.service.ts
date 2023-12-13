import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ErrorHandlerService } from 'src/errro-catch/error-catch.service';
import { BannedWord, User } from '@prisma/client';
import { IBannedWord, IBannedWordArgs, IUpdateBannedWord } from './interfaces';
import { BannedWordOrNull } from './types/banned-word.types';
import { ValidateService } from 'src/validate/validate.service';
import { PageParametersService } from 'src/base-page/page-base.service';
import { BannedWordRepository } from './banned-word.repository';

@Injectable()
export class BannedWordService extends PageParametersService {
	readonly logger: Logger = new Logger(BannedWordService.name);

	constructor(
		private readonly errorHandlerService: ErrorHandlerService,
		private readonly validateService: ValidateService,
		private readonly bannedWordRepository: BannedWordRepository
	) {
		super();
	}

	public async create(word: IBannedWord, user: User): Promise<IBannedWord> {
		try {
			this.logger.log(`Запуск create, adminId: ${user.id}`);
			await this.validateBannedWord(word);
			return await this.bannedWordRepository.createBannedWord(word);
		} catch (error) {
			this.logger.error(
				`Ошибка в create, adminId: ${user.id}, error: ${error.message}`
			);
			this.errorHandlerService.handleError(error);
		}
	}

	private async validateBannedWord(word: IBannedWord): Promise<void> {
		this.logger.log(`Запуск validateBannedWord`);
		const bannedModel: BannedWordOrNull =
			await this.bannedWordRepository.findBannedWordInDatabase(word);
		this.verifyBannedWordExistence(bannedModel);
	}

	private verifyBannedWordExistence(bannedModel: BannedWordOrNull): void {
		this.logger.log(`Запуск verifyBannedWordExistence`);
		if (bannedModel) {
			throw new HttpException(
				'Запрещенное слово уже зарегистрировано.',
				HttpStatus.CONFLICT
			);
		}
	}

	public async findAll(args: IBannedWordArgs, user: User) {
		try {
			this.logger.log(`Запуск findAll, adminId: ${user.id}`);
			await this.getWords(args);
			return await this.bannedWordRepository.findMany(args);
		} catch (error) {
			this.logger.error(
				`Ошибка в findAll, adminId: ${user.id}, error: ${error.message}`
			);
			this.errorHandlerService.handleError(error);
		}
	}

	private async getWords(args: IBannedWordArgs): Promise<void> {
		this.logger.log(`Запуск getWords.`);
		const totalUsers: number =
			await this.bannedWordRepository.getTotalBannedWordsCount();
		this.validatePageNumber(totalUsers, args);
		this.validatePageSize(totalUsers, args);
	}

	public async findOne(id: string, user: User): Promise<BannedWord> {
		try {
			this.logger.log(`Запуск create, adminId: ${user.id}`);
			this.validateId(id);
			return await this.findBannedWordById(id);
		} catch (error) {
			this.logger.error(
				`Ошибка в findOne, adminId: ${user.id}, error: ${error.message}`
			);
			this.errorHandlerService.handleError(error);
		}
	}

	private async findBannedWordById(id: string): Promise<BannedWord> {
		this.logger.log(`Запуск findBannedWordById, bannedWordId: ${id}`);
		const bannedModel: BannedWordOrNull =
			await this.bannedWordRepository.fetchBannedWordFromDatabase(id);
		this.checkBannedWordExistence(bannedModel);
		return bannedModel;
	}

	private checkBannedWordExistence(bannedModel: BannedWordOrNull): void {
		this.logger.log(`Запуск fetchBannedWordFromDatabase`);
		if (!bannedModel) {
			throw new HttpException(
				'Запрещенное слово не найдено.',
				HttpStatus.NOT_FOUND
			);
		}
	}

	private validateId(id: string): void {
		this.logger.log(`Запуск validateId, bannedWordId: ${id}`);
		return this.validateService.checkId(id);
	}

	public async update(
		updateData: IUpdateBannedWord,
		user: User
	): Promise<BannedWord> {
		try {
			this.logger.log(`Запуск update, adminId: ${user.id}`);
			const bannedModel: BannedWord = await this.findBannedWordById(
				updateData.id
			);
			this.checkForDuplicateBannedWord(bannedModel, updateData);
			return await this.bannedWordRepository.updateBannedWord(updateData);
		} catch (error) {
			this.logger.error(
				`Ошибка в update, adminId: ${user.id}, error: ${error.message}`
			);
			this.errorHandlerService.handleError(error);
		}
	}

	private checkForDuplicateBannedWord(
		banedModel: BannedWord,
		updateData: IUpdateBannedWord
	): void {
		this.logger.log(
			`Запуск checkForDuplicateBannedWord, bannedWordId: ${banedModel.id}`
		);
		if (banedModel.word === updateData.word) {
			throw new HttpException(
				'Запрещенное слово уже зарегистрировано',
				HttpStatus.CONFLICT
			);
		}
	}

	public async remove(id: string, user: User): Promise<BannedWord> {
		try {
			this.logger.log(`Запуск remove, userId: ${user.id}`);
			this.validateId(id);
			await this.findBannedWordById(id);
			return await this.bannedWordRepository.deleteBannedWord(id);
		} catch (error) {
			this.logger.error(
				`Ошибка в remove, adminId: ${user.id}, error: ${error.message}`
			);
			this.errorHandlerService.handleError(error);
		}
	}
}
