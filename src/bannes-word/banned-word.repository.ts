import { Injectable, Logger } from '@nestjs/common';
import { BannedWord } from '@prisma/client';
import { SortField, SortOrderEnum } from 'src/enum/global.enum';
import { PrismaService } from 'src/settings/prisma.database/prisma.service';
import { IBannedWord, IBannedWordArgs, IUpdateBannedWord } from './interfaces';
import { BannedWordOrNull } from './types/banned-word.types';
import { BASE_PAGE } from 'src/constants/global-constants';

@Injectable()
export class BannedWordRepository {
	readonly logger: Logger = new Logger(BannedWordRepository.name);
	constructor(private readonly prisma: PrismaService) {}

	public async createBannedWord(wordData: IBannedWord): Promise<IBannedWord> {
		this.logger.log(`Запуск createBannedWord}`);
		return await this.prisma.bannedWord.create({
			data: { word: wordData.word }
		});
	}

	public async findBannedWordInDatabase(
		wordData: IBannedWord
	): Promise<BannedWordOrNull> {
		this.logger.log(`Запуск findBannedWordInDatabase`);
		return await this.prisma.bannedWord.findUnique({
			where: { word: wordData.word }
		});
	}

	public async getTotalBannedWordsCount(): Promise<number> {
		this.logger.log(`Запуск getTotalBannedWordsCount.`);
		return await this.prisma.bannedWord.count();
	}

	public async findMany(args: IBannedWordArgs): Promise<BannedWord[]> {
		this.logger.log(`Запуск findMany.`);
		return await this.prisma.bannedWord.findMany({
			orderBy: {
				[args.sortField || SortField.create]:
					args.sortOrder || SortOrderEnum.desc
			},
			skip: args.pageSize * (args.page - BASE_PAGE),
			take: args.pageSize
		});
	}

	public async fetchBannedWordFromDatabase(
		id: string
	): Promise<BannedWordOrNull> {
		this.logger.log(`Запуск fetchBannedWordFromDatabase, bannedWordId: ${id}`);
		return await this.prisma.bannedWord.findUnique({ where: { id } });
	}

	public async updateBannedWord(
		updateData: IUpdateBannedWord
	): Promise<BannedWord> {
		this.logger.log(`Запуск updateBannedWord, bannedWordId: ${updateData.id}`);
		return await this.prisma.bannedWord.update({
			where: { id: updateData.id },
			data: { word: updateData.word }
		});
	}

	public async deleteBannedWord(id: string): Promise<BannedWord> {
		this.logger.log(`Запуск deleteBannedWord, bannedWordId: ${id}`);
		return await this.prisma.bannedWord.delete({ where: { id } });
	}

	public async getBannedWordsFromDB(): Promise<{ word: string }[]> {
		this.logger.log(`Запуск getBannedWordsFromDB `);
		return await this.prisma.bannedWord.findMany({
			select: {
				word: true
			}
		});
	}
}
