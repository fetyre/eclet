import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { User } from '@prisma/client';
import { ConfigLoaderService } from 'src/settings/config/config-loader.service';
import { JwtPayloadType, JwtTokenType } from './models/type/jwt.type';
import { TokenTypeEnum } from './models/enums/token-type.enum';
import {
	IAccessToken,
	IEmailToken,
	IRefreshToken,
	IResetPasswordToken
} from './models/interfaces';
import { CommonService } from 'src/common/common.service';

@Injectable()
export class JwtService {
	private readonly logger: Logger = new Logger(JwtService.name);

	constructor(
		private readonly configLoaderService: ConfigLoaderService,
		private readonly commonService: CommonService
	) {}

	private static async generateTokenAsync(
		payload: JwtPayloadType,
		secret: string | Buffer,
		options: jwt.SignOptions
	): Promise<string> {
		return jwt.sign(payload, secret, options);
	}

	private static async verifyTokenAsync<T>(
		token: string,
		secret: string | Buffer,
		options: jwt.VerifyOptions
	): Promise<T> {
		return new Promise((resolve, rejects) => {
			jwt.verify(token, secret, options, (error, payload: T) => {
				if (error) {
					rejects(error);
					return;
				}
				resolve(payload);
			});
		});
	}

	public async generateToken(
		user: User,
		tokenType: TokenTypeEnum,
		tokenV4Id?: string
	): Promise<string> {
		switch (tokenType) {
			case TokenTypeEnum.ACCESS:
				return await this.generateAccessToken(user);
			case TokenTypeEnum.REFRESH:
				return await this.generateRefreshToken(user);
			case TokenTypeEnum.CONFIRMATION:
				return await this.generateConfirmationToken(user, tokenV4Id);
			case TokenTypeEnum.RESET_PASSWORD:
				return await this.generateResetPasswordToken(user);
			default:
				throw new HttpException(
					`Неподдерживаемый тип токена: ${tokenType}`,
					HttpStatus.BAD_REQUEST
				);
		}
	}

	private async generateAccessToken(user: User): Promise<string> {
		this.logger.log(`Запуск generateAccessToken, userID: ${user.id}`);
		const { privateKey: accessSecret, time: accessTime } =
			this.configLoaderService.jwtConfig.access;
		const jwtid: string = this.generateId();
		return await JwtService.generateTokenAsync(
			{ id: user.id, role: user.role },
			accessSecret,
			{
				issuer: this.configLoaderService.issuer,
				audience: this.configLoaderService.domain,
				algorithm: 'RS256',
				expiresIn: accessTime,
				jwtid
			}
		);
	}

	private generateId(): string {
		return this.commonService.generateUuid();
	}

	private async generateRefreshToken(
		user: User
		// token?: string
	): Promise<string> {
		const { privateKey: refreshSecret, time: refreshTime } =
			this.configLoaderService.jwtConfig.refresh;
		const jwtid: string = this.generateId();
		return await JwtService.generateTokenAsync(
			{
				id: user.id,
				role: user.role,
				active: user.isEmailVerified
			},
			refreshSecret,
			{
				issuer: this.configLoaderService.issuer,
				audience: this.configLoaderService.domain,
				algorithm: 'RS256',
				expiresIn: refreshTime,
				jwtid
			}
		);
	}

	private async generateConfirmationToken(
		user: User,
		tokenV4Id: string
	): Promise<string> {
		const { privateKey: confirmationSecret, time: confirmationTime } =
			this.configLoaderService.jwtConfig.confirmation;
		return await JwtService.generateTokenAsync(
			{ id: user.id, role: user.role, active: user.isEmailVerified },
			confirmationSecret,
			{
				issuer: this.configLoaderService.issuer,
				audience: this.configLoaderService.domain,
				algorithm: 'RS256',
				expiresIn: confirmationTime,
				jwtid: tokenV4Id,
				notBefore: 5,
				noTimestamp: true
			}
		);
	}

	private async generateResetPasswordToken(user: User): Promise<string> {
		const { privateKey: refreshSecret, time: refreshTime } =
			this.configLoaderService.jwtConfig.resetPassword;
		return await JwtService.generateTokenAsync(
			{ id: user.id, active: user.isEmailVerified },
			refreshSecret,
			{
				issuer: this.configLoaderService.issuer,
				audience: this.configLoaderService.domain,
				algorithm: 'RS256',
				expiresIn: refreshTime
			}
		);
	}

	private static async throwBadRequest<T extends JwtPayloadType>(
		promise: Promise<T>
	): Promise<T> {
		try {
			return await promise;
		} catch (error) {
			if (error instanceof jwt.TokenExpiredError) {
				throw new HttpException(
					'Срок действия токена истек',
					HttpStatus.BAD_REQUEST
				);
			}
			if (error instanceof jwt.JsonWebTokenError) {
				throw new HttpException(
					'Недействительный токен',
					HttpStatus.BAD_REQUEST
				);
			}
			throw new HttpException(
				'Internet servev Error',
				HttpStatus.INTERNAL_SERVER_ERROR
			);
		}
	}

	public async verifyToken<
		T extends IAccessToken | IEmailToken | IRefreshToken | IResetPasswordToken
	>(token: string, tokenType: TokenTypeEnum): Promise<T> {
		const jwtOptions: jwt.VerifyOptions = this.createJwtOptions();
		return await this.verifyTokenByType(token, tokenType, jwtOptions);
	}

	private async verifyTokenByType<T extends JwtTokenType>(
		token: string,
		tokenType: TokenTypeEnum,
		jwtOptions: jwt.VerifyOptions
	): Promise<T> {
		switch (tokenType) {
			case TokenTypeEnum.ACCESS:
				return await this.verifyAccessToken(token, jwtOptions);
			case TokenTypeEnum.REFRESH:
				return await this.verifyRefreshToken(token, jwtOptions);
			case TokenTypeEnum.CONFIRMATION:
				return await this.verifyConfirmationToken(token, jwtOptions);
			case TokenTypeEnum.RESET_PASSWORD:
				return await this.verifyResetPasswordToken(token, jwtOptions);
			default:
				throw new HttpException(
					`Неподдерживаемый тип токена: ${tokenType}`,
					HttpStatus.BAD_REQUEST
				);
		}
	}

	private createJwtOptions(): jwt.VerifyOptions {
		return {
			issuer: this.configLoaderService.issuer,
			audience: new RegExp(this.configLoaderService.domain)
		};
	}

	private async verifyAccessToken<T extends JwtTokenType>(
		token: string,
		jwtOptions: jwt.VerifyOptions
	): Promise<T> {
		const { publicKey, time: accessTime } =
			this.configLoaderService.jwtConfig.access;
		return await this.startCheckVerifyingToken(
			token,
			publicKey,
			jwtOptions,
			accessTime
		);
	}

	private async verifyResetPasswordToken<T extends JwtTokenType>(
		token: string,
		jwtOptions: jwt.VerifyOptions
	): Promise<T> {
		const { publicKey, time: accessTime } =
			this.configLoaderService.jwtConfig.resetPassword;
		return await this.startCheckVerifyingToken(
			token,
			publicKey,
			jwtOptions,
			accessTime
		);
	}

	private async verifyRefreshToken<T extends JwtTokenType>(
		token: string,
		jwtOptions: jwt.VerifyOptions
	): Promise<T> {
		const { publicKey, time: accessTime } =
			this.configLoaderService.jwtConfig.refresh;
		return await this.startCheckVerifyingToken(
			token,
			publicKey,
			jwtOptions,
			accessTime
		);
	}

	private async verifyConfirmationToken<T extends JwtTokenType>(
		token: string,
		jwtOptions: jwt.VerifyOptions
	): Promise<T> {
		const { publicKey, time: accessTime } =
			this.configLoaderService.jwtConfig.confirmation;
		return await this.startCheckVerifyingToken(
			token,
			publicKey,
			jwtOptions,
			accessTime
		);
	}

	private async startCheckVerifyingToken<T extends JwtTokenType>(
		token: string,
		publicKey: string | Buffer,
		jwtOptions: jwt.VerifyOptions,
		time: number
	): Promise<T> {
		return await JwtService.throwBadRequest(
			JwtService.verifyTokenAsync(token, publicKey, {
				...jwtOptions,
				maxAge: time,
				algorithms: ['RS256']
			})
		);
	}
}
