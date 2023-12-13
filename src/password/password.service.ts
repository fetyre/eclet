import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

@Injectable()
export class PasswordService {
	public async hashPassword(password: string): Promise<string> {
		return await argon2.hash(password);
	}

	public async verifyPassword(
		userPassword: string,
		secondPassword: string
	): Promise<boolean> {
		return await argon2.verify(userPassword, secondPassword);
	}
}
