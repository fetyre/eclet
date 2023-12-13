import { Injectable, Logger } from '@nestjs/common';
import { ProviderModel } from '@prisma/client';
import { PrismaService } from 'src/settings/prisma.database/prisma.service';
import { PrismaTransaction } from 'src/types';
import { OAuthProviderCreationDto } from './models/dto';

@Injectable()
export class OAuthRepository {
	readonly logger: Logger = new Logger(OAuthRepository.name);
	constructor(private readonly prisma: PrismaService) {}

	public async createProviderModel(
		createDto: OAuthProviderCreationDto,
		prisma: PrismaTransaction
	): Promise<ProviderModel> {
		this.logger.log(`Запуск createProviderModel, userID: ${createDto.userId}`);
		return await prisma.providerModel.create({
			data: {
				providerId: createDto.providerId,
				providerName: createDto.providerName,
				user: {
					connect: { id: createDto.userId }
				}
			}
		});
	}
}
