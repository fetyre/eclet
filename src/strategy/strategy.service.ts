import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ValidateService } from 'src/validate/validate.service';
import { ConfirmPayload } from './interface/confirm-stategy.interface';
import { NullableUser } from 'src/types';
import { User, UserRole } from '@prisma/client';
import { TokenTypeEnum } from 'src/jwt/models/enums/token-type.enum';
import { BlackListService } from 'src/black-list/black-list.service';
import { ValidateConfirmPayload } from './dto';
import {
	OptionalUserWithEmailToken,
	UserWithEmailToken
} from './types/strategies.types';
import { UsersRepository } from 'src/user/user.repository';

@Injectable()
export class StrategyService {
	private readonly logger: Logger = new Logger(StrategyService.name);

	constructor(
		private readonly validateService: ValidateService,
		private readonly blackListService: BlackListService,
		private readonly usersRepository: UsersRepository
	) {}

	public async validatePayload(payload: any): Promise<ConfirmPayload> {
		this.logger.log(`Запуск validatePayload.`);
		const value: ValidateConfirmPayload = { ...payload };
		await this.validateService.validateDto(ValidateConfirmPayload, value);
		return value;
	}

	public async checkAndFindUserById(id: string): Promise<User> {
		const user: NullableUser = await this.usersRepository.findUserById(id);
		this.checkUser(user);
		return user;
	}

	private checkUser(user: NullableUser | OptionalUserWithEmailToken): void {
		if (!user) {
			throw new HttpException('Пользователь не найден', HttpStatus.NOT_FOUND);
		}
	}

	public checkRoleUser(userRole: string, requiredRole: UserRole): void {
		if (userRole !== requiredRole) {
			throw new HttpException(
				'У вас нет необходимых прав для доступа к этому ресурсу',
				HttpStatus.FORBIDDEN
			);
		}
	}

	public async findTokenInBlackList(
		userId: string,
		jti: string,
		exp: number,
		tokenType: TokenTypeEnum
	): Promise<void> {
		return await this.blackListService.checkBlackListResfreshToken(
			userId,
			jti,
			exp,
			tokenType
		);
	}

	public async checkAndFindUserWithEmailModelById(
		id: string
	): Promise<UserWithEmailToken> {
		const user: OptionalUserWithEmailToken =
			await this.usersRepository.findUserWithEmailModelById(id);
		this.checkUser(user);
		return user;
	}
}
