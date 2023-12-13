import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { User, UserStatus } from '@prisma/client';
import { ValidateService } from 'src/validate/validate.service';

@Injectable()
export abstract class BaseService {
	constructor(public readonly validateService: ValidateService) {}

	protected validateId(id: string): void {
		return this.validateService.checkId(id);
	}

	private verifyUserAccountNotBlocked(user: User): void {
		if (user.accountStatus === UserStatus.blocked) {
			throw new HttpException(
				'Аккаунт пользователя заблокирован',
				HttpStatus.FORBIDDEN
			);
		}
	}

	private verifyUserEmail(user: User): void {
		if (user.isEmailVerified === false) {
			throw new HttpException(
				'Доступ запрещен: электронная почта пользователя не подтверждена',
				HttpStatus.FORBIDDEN
			);
		}
	}

	protected verifyUserStatusAndEmail(user: User): void {
		this.verifyUserAccountNotBlocked(user);
		this.verifyUserEmail(user);
	}
}
