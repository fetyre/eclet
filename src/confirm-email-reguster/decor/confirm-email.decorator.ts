import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetUserAndPayload = createParamDecorator(
	(data: unknown, ctx: ExecutionContext) => {
		const request = ctx.switchToHttp().getRequest();
		const { user, payload } = request.user;
		return { user, payload };
	}
);
