import { Injectable } from '@nestjs/common';
import { v4 } from 'uuid';
import { IMessage } from './interfaces/message.interface';
import * as generator from 'generate-password';
import * as cuid2 from '@paralleldrive/cuid2';

@Injectable()
export class CommonService {
	constructor() {}

	public generateUuid(): string {
		return v4();
	}

	public generateMessage(message: string): IMessage {
		return { id: v4(), message };
	}

	public generate5DigitCode(): string {
		return generator.generate({
			length: 5,
			numbers: true,
			uppercase: false,
			lowercase: false,
			symbols: false
		});
	}

	public generateCuid(): string {
		return cuid2.createId();
	}

	public getCurrentTimeMillis(): number {
		return Date.now();
}
}
