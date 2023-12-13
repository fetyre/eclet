import { ExecutionContext, createParamDecorator } from '@nestjs/common';

export const GetOAuthPayload = createParamDecorator(
	(data: unknown, ctx: ExecutionContext) => {
		const request = ctx.switchToHttp().getRequest();
		const { oauthData } = request.user;
		return oauthData;
	}
);
