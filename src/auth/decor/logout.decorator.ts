import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetUserDetails = createParamDecorator(
	(data: unknown, ctx: ExecutionContext) => {
		const request = ctx.switchToHttp().getRequest();
		const { jti, user, exp } = request.user;
		return { jti, user, exp };
	}
);
