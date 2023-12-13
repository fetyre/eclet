import {
	Injectable,
	NestInterceptor,
	ExecutionContext,
	CallHandler,
	BadRequestException
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Observable } from 'rxjs';

/**
 * Интерцептор, который проверяет, что в теле запроса GraphQL заполнено хотя бы одно поле.
 * Если тело запроса не определено или содержит только одно поле, выбрасывается исключение BadRequestException.
 * Используется для проверки входящих запросов GraphQL и обеспечения наличия обязательных полей.
 */
@Injectable()
export class EmptyUpdateInterceptorCategory implements NestInterceptor {
	intercept(contextt: ExecutionContext, next: CallHandler): Observable<any> {
		const ctx: GqlExecutionContext = GqlExecutionContext.create(contextt);
		const req = ctx.getContext().req?.body;
		if (!req || Object.keys(req).length <= 1) {
			throw new BadRequestException('Хотя бы одно поле должно быть заполнено');
		}
		return next.handle();
	}
}
