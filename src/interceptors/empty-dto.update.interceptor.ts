import {
	Injectable,
	NestInterceptor,
	ExecutionContext,
	CallHandler,
	BadRequestException
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class EmptyUpdateInterceptor implements NestInterceptor {
	intercept(contextt: ExecutionContext, next: CallHandler): Observable<any> {
		const req = contextt.switchToHttp().getRequest().body;
		if (Object.keys(req).length === 0) {
			throw new BadRequestException('Хотя бы одно поле должно быть заполнено');
		}
		return next.handle();
	}
}
