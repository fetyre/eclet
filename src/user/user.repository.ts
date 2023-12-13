import { Injectable, Logger } from '@nestjs/common';
import { EmailChange, Provider, StatusEnum, User } from '@prisma/client';
import { PrismaService } from 'src/settings/prisma.database/prisma.service';
import { NullableUser, PrismaTransaction } from 'src/types';
import { BooleanOrUndefined } from './models/types/users.type';
import { ISignUp, IUserUpdate, UserQueryParams } from './models/interface';
import { OptionalUserWithEmailToken } from 'src/strategy/types/strategies.types';
import { IPasswordUpdate } from 'src/reset-user-password/interface';
import { NullableUserWithPasswordReset } from 'src/reset-password-login/type/reset-password.type';
import { UserWithProviderOrNull } from 'src/oauth-auth/type/type-oauht';
import { OAuthCreateUser } from 'src/oauth-auth/models/interface';
import { OptionalUserWithCredentials } from 'src/auth/login/type/login-auth.type';
import { BASE_PAGE } from 'src/constants/global-constants';

@Injectable()
export class UsersRepository {
	readonly logger: Logger = new Logger(UsersRepository.name);
	constructor(private readonly prisma: PrismaService) {}

	/**
	 * Поиск пользователя по email
	 * @param {string} email - email пользователя
	 * @returns {Promise<NullableUser>} Найденный пользователь (User) или null
	 * @throws {InternalServerErrorException} Если возникла внутренняя ошибка сервера
	 * @since 2023-11-11
	 */
	public async findUserByEmail(email: string): Promise<NullableUser> {
		this.logger.log(`Запуск findUserByEmail. email: ${email}`);
		return await this.prisma.user.findUnique({
			where: { email }
		});
	}

	public async findManyUsers(
		queryParams: UserQueryParams,
		emailVerificationStatus: BooleanOrUndefined
	): Promise<User[]> {
		this.logger.log(`Запуск findManyUsers.`);
		return await this.prisma.user.findMany({
			where: {
				isEmailVerified: emailVerificationStatus,
				gender: queryParams.gender,
				status: queryParams.status,
				accountStatus: queryParams.accountStatus,
				role: queryParams.role
			},
			orderBy: queryParams.sortField
				? {
						[queryParams.sortField]: queryParams.sortOrder
				  }
				: undefined,
			skip: queryParams.pageSize * (queryParams.page - BASE_PAGE),
			take: queryParams.pageSize
		});
	}

	/**
	 * Сохранения в бд
	 * @param {ISignUp} createData - пользователя для сохранения в бд
	 * @param {string} tokenV4Id - v4 токен подтверждения для сохранения в бд
	 * @param {PrismaTransaction} prisma - транзакция
	 * @returns {Promise<User>} Сохраненный пользователь в бд
	 * @throws {InternalServerErrorException} Если возникла внутренняя ошибка сервера
	 * @since 2023-11-11
	 */
	public async saveRegularUser(
		createData: ISignUp,
		tokenV4Id: string,
		prisma: PrismaTransaction
	): Promise<User> {
		this.logger.log(`Запуск saveRegularUser, email: ${createData.email}`);
		return await prisma.user.create({
			data: {
				...createData,
				credentials: {
					create: {
						passwordLast: createData.password
					}
				},
				emailToken: {
					create: {
						token: tokenV4Id,
						emailResendAttempts: [new Date()]
					}
				}
			}
		});
	}

	public async updateSaveUser(
		updateData: IUserUpdate,
		user: User
	): Promise<User> {
		this.logger.log(`Запуск updateSaveUser, id: ${user.id}`);
		return await this.prisma.user.update({
			where: { id: user.id },
			data: {
				...updateData
			}
		});
	}

	public async deleteUser(deleteUser: User): Promise<User> {
		this.logger.log(`Запуск deleteUser, deleteUserId: ${deleteUser.id}`);
		return await this.prisma.user.delete({ where: { id: deleteUser.id } });
	}

	public async findUserById(id: string): Promise<NullableUser> {
		this.logger.log(`Запуск findUserById, userId:${id}`);
		return await this.prisma.user.findUnique({ where: { id } });
	}

	public async getTotalUserCount(): Promise<number> {
		this.logger.log(`Запуск getTotalUserCount.`);
		return await this.prisma.user.count();
	}

	public async updateUserRatingInDatabase(
		recipientUser: User,
		updatedRating: number,
		prisma: PrismaTransaction
	): Promise<User> {
		this.logger.log(
			`Запуск updateUserRatingInDatabase, recipientUserId: ${recipientUser.id}.`
		);
		return await prisma.user.update({
			where: { id: recipientUser.id },
			data: { rating: updatedRating }
		});
	}

	public async findUserWithEmailModelById(
		id: string
	): Promise<OptionalUserWithEmailToken> {
		return await this.prisma.user.findUnique({
			where: { id },
			include: { emailToken: true }
		});
	}

	public async updateUserPassword(
		updateData: IPasswordUpdate,
		user: User,
		prisma: PrismaTransaction
	): Promise<User> {
		this.logger.log(`Запуск updateUserPassword, userId: ${user.id}`);
		return await prisma.user.update({
			where: { id: user.id },
			data: { password: updateData.password }
		});
	}

	public async updateUserByResetPassword(
		id: string,
		passwordHash: string,
		prisma: PrismaTransaction
	) {
		this.logger.log(`Запуск updateUserByResetPassword, userId: ${id}`);
		return await prisma.user.update({
			where: { id },
			data: {
				password: passwordHash,
				credentials: {
					update: {
						passwordLast: passwordHash,
						passwordVersion: { increment: 1 }
					}
				},
				forgotPassword: {
					update: {
						resetPasswordToken: null,
						youResert: false,
						lastResetPasword: new Date()
					}
				}
			}
		});
	}

	public async findUserByEmailWithForgotPassword(
		email: string
	): Promise<NullableUserWithPasswordReset> {
		this.logger.log(`Запуск findUserByEmail. email: ${email}`);
		return await this.prisma.user.findUnique({
			where: { email },
			include: { forgotPassword: true }
		});
	}

	public async updateUserActiveAccount(
		id: string,
		prisma: PrismaTransaction
	): Promise<User> {
		this.logger.log(`Запуск updateUserActiveAccount, id: ${id}`);
		return await prisma.user.update({
			where: { id },
			data: {
				isEmailVerified: true
			}
		});
	}

	public async findUserWithEmailProviderAndToken(
		email: string
	): Promise<UserWithProviderOrNull> {
		this.logger.log(`Запуск findUserWithEmailProviderAndToken. email:${email}`);
		return await this.prisma.user.findUnique({
			where: { email },
			include: { providerModel: true, emailToken: true }
		});
	}

	public async createUserWithOAuthProvider(
		createUserDto: OAuthCreateUser,
		providerValue: Provider,
		prisma: PrismaTransaction
	): Promise<User> {
		this.logger.log(
			`Запуск createUserWithOAuthProvider. email: ${createUserDto.email}`
		);
		return await prisma.user.create({
			data: {
				username: createUserDto.username,
				email: createUserDto.email,
				provider: providerValue,
				isEmailVerified: true,
				providerModel: {
					create: {
						providerId: createUserDto.oauthId,
						providerName: providerValue
					}
				}
			}
		});
	}

	/**
	 * Обновления статуса пользователя
	 * @param {string} id - id пользователя
	 * @returns {Promise<string[]>} Обновленный объект пользоавтеля(User)
	 * @throws {InternalServerErrorException} Если возникла внутренняя ошибка сервера
	 * @since 2023-11-11
	 */
	public async updateUserStatus(
		id: string,
		status: StatusEnum,
		prisma: PrismaTransaction
	): Promise<User> {
		this.logger.log(`Запуск updateUserStatus, userId:${id}`);
		return await prisma.user.update({
			where: { id },
			data: { status }
		});
	}

	/**
	 * Поиск пользователя по email
	 * @param {string} email - email для поиска
	 * @returns {Promise<OptionalUserWithCredentials>} объект пользователя с моделью Credentials
	 * @throws {InternalServerErrorException} Если возникла внутренняя ошибка сервера
	 * @since 2023-11-11
	 */
	public async findUserWithEmailAndCredentials(
		email: string
	): Promise<OptionalUserWithCredentials> {
		this.logger.log(`Запуск findUserByEmail. email: ${email}`);
		return await this.prisma.user.findUnique({
			where: { email },
			include: { credentials: true }
		});
	}

	public async updateUserEmail(
		resetEmailModel: EmailChange,
		prisma: PrismaTransaction
	): Promise<User> {
		this.logger.log(
			`Запуск updateUserEmail, userId: ${resetEmailModel.userId}`
		);
		return prisma.user.update({
			where: { id: resetEmailModel.id },
			data: { email: resetEmailModel.email }
		});
	}
}
