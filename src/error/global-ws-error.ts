import { Catch, ArgumentsHost } from '@nestjs/common';
import { BaseWsExceptionFilter } from '@nestjs/websockets';

@Catch()
export class AllExceptionsFilter extends BaseWsExceptionFilter {
	catch(exception: unknown, host: ArgumentsHost) {
		const context = host.switchToWs();
		const client = context.getClient();
		super.catch(exception, host);
	}
}
