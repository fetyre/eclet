import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class SecurityService {
	private readonly logger: Logger = new Logger(SecurityService.name);

	public encrypt(data: string, publicKey: string): string {
		this.logger.log(`Запуск encrypt `);
		const encryptedData: Buffer = crypto.publicEncrypt(
			publicKey,
			Buffer.from(data)
		);
		return encryptedData.toString('base64');
	}

	public decrypt(encryptedData: string, privateKey: string): string {
		this.logger.log(`Запуск decrypt `);
		const buffer: Buffer = Buffer.from(encryptedData, 'base64');
		const decryptedData: Buffer = crypto.privateDecrypt(privateKey, buffer);
		return decryptedData.toString();
	}

	public generateToken(): string {
		this.logger.log(`Запуск generateToken`);
		return crypto
			.randomBytes(this.configLoaderService.cryptoRandomBytes)
			.toString('hex');
	}

	public hashedToken(token: string): string {
		this.logger.log(`Запуск hashedToken`);
		return crypto.createHash('sha256').update(token).digest('hex');
	}
}
