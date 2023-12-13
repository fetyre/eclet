import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GqlAuthGuard extends AuthGuard('jwtAccessStrategy') {
	getRequest(contextt: ExecutionContext) {
		const ctx = GqlExecutionContext.create(contextt);
		const gqlReq = ctx.getContext().req;
		if (gqlReq) {
			const { variables } = ctx.getArgs();
			gqlReq.body = variables;
			return gqlReq;
		}
		return contextt.switchToHttp().getRequest();
	}
}
