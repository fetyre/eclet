import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { BlacklistedToken } from '@prisma/client';
import { TokenTypeEnum } from 'src/jwt/models/enums/token-type.enum';
import { PrismaService } from 'src/settings/prisma.database/prisma.service';
import { PrismaTransaction } from 'src/types';
import { ValidateService } from 'src/validate/validate.service';
import { CreateBlacklistedTokenDto } from './models/dto/save-oauth.black-list.dto';
import { MILLISECONDS_IN_SECOND } from 'src/constants/global-constants';
import { CommonService } from 'src/common/common.service';

@Injectable()
export class BlackListService {
	private readonly logger: Logger = new Logger(BlackListService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly validateService: ValidateService,
		private readonly commonService: CommonService
	) {}

	private async saveBlacklistedTokenWithTransaction(
		createDto: CreateBlacklistedTokenDto,
		prisma: PrismaTransaction
	): Promise<BlacklistedToken> {
		this.logger.log(
			`Запуск saveBlacklistedTokenWithTransaction, userId: ${createDto.userId}`
		);
		return await prisma.blacklistedToken.create({
			data: {
				tokenV4Id: createDto.tokenV4Id,
				classToken: createDto.tokenType,
				exp: createDto.exp,
				user: {
					connect: {
						id: createDto.userId
					}
				}
			}
		});
	}

	private async saveBlacklistedTokenWithoutTransaction(
		createDto: CreateBlacklistedTokenDto
	): Promise<BlacklistedToken> {
		this.logger.log(
			`Запуск saveBlacklistedTokenWithoutTransaction, userId: ${createDto.userId}`
		);
		return await this.prisma.blacklistedToken.create({
			data: {
				tokenV4Id: createDto.tokenV4Id,
				classToken: createDto.tokenType,
				exp: createDto.exp,
				user: {
					connect: {
						id: createDto.userId
					}
				}
			}
		});
	}

	private async validateBlacklistedTokenData(
		createDto: CreateBlacklistedTokenDto
	): Promise<void> {
		this.logger.log(
			`Запуск validateBlacklistedTokenData, userId: ${createDto.userId}`
		);
		return await this.validateService.validateByDto(createDto);
	}

	public async createAndSaveBlacklistedToken(
		createDto: CreateBlacklistedTokenDto,
		prisma?: PrismaTransaction
	): Promise<BlacklistedToken> {
		this.logger.log(
			`Запуск createAndSaveBlacklistedToken, userId: ${createDto.userId}`
		);
		await this.validateBlacklistedTokenData(createDto);
		return this.saveBlacklistedToken(createDto, prisma);
	}

	private async saveBlacklistedToken(
		createDto: CreateBlacklistedTokenDto,
		prisma?: PrismaTransaction
	): Promise<BlacklistedToken> {
		this.logger.log(`Запуск saveBlacklistedToken, userId: ${createDto.userId}`);
		return prisma
			? this.saveBlacklistedTokenWithTransaction(createDto, prisma)
			: this.saveBlacklistedTokenWithoutTransaction(createDto);
	}

	@Cron('0 2 * * *', {
		name: 'clearBlackList',
		timeZone: 'Europe/Minsk'
	})
	private async clearBlackList() {
		this.logger.log('Старт переодической задачи clearBlackList');
		const lte: number = this.getCurrentTimeInSeconds();
		await this.deleteExpiredTokens(lte);
		this.logger.log(
			'Успешное выполеннение переодической задачи clearBlackList'
		);
	}

	private async deleteExpiredTokens(lte: number) {
		this.logger.log(
			'Запуск deleteExpiredTokens для переодической задачи clearBlackList'
		);
		return await this.prisma.blacklistedToken.deleteMany({
			where: {
				exp: {
					lte
				}
			}
		});
	}

	private getCurrentTimeInSeconds(): number {
		this.logger.log(
			'Запуск getCurrentTimeInSeconds для переодической задачи clearBlackList'
		);
		const now: number = this.commonService.getCurrentTimeMillis();
		return Math.round(now / MILLISECONDS_IN_SECOND);
	}

	public async checkBlackListResfreshToken(
		userId: string,
		tokenV4Id: string,
		exp: number,
		tokenType: TokenTypeEnum
	) {
		const blacklistedToken: BlacklistedToken =
			await this.prisma.blacklistedToken.findFirst({
				where: { userId, tokenV4Id, classToken: tokenType, exp }
			});
		if (blacklistedToken)
			throw new HttpException(
				'Токен найден в черном списке',
				HttpStatus.UNAUTHORIZED
			);
	}
}
