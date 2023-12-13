import { Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { GqlArgumentsHost, GqlExceptionFilter } from '@nestjs/graphql';
import { ApolloError } from 'apollo-server-express';
import { SourceLocation } from 'graphql';
import { ConfigLoaderService } from 'src/settings/config/config-loader.service';

@Catch(ApolloError)
export class GraphQLErrorFilter implements GqlExceptionFilter {
	constructor(private readonly configLoaderService: ConfigLoaderService) {}

	catch(exception: ApolloError, host: ArgumentsHost) {
		// 	const gqlHost: GqlArgumentsHost = GqlArgumentsHost.create(host);
		// 	const status: number = this.extractStatus(exception);
		// 	const message: string | object = this.extractErrorMessage(exception);
		// 	const locations: readonly SourceLocation[] = exception.locations;
		// 	const path: readonly (string | number)[] = exception.path;

		// 	return {
		// 		errors: [
		// 			{
		// 				message,
		// 				locations,
		// 				path,
		// 				extensions: {
		// 					code: status
		// 				}
		// 			}
		// 		]
		// 	};
		console.log('111');
		const response: any = this.detectGraphqlRequest(host);
		const status: number = this.extractStatus(exception);
		const message: string | object = this.extractErrorMessage(exception);
		const responseBody = this.createGraphResponseBody(status, message);
		console.log('2');
		console.log(responseBody);
		response.json(responseBody);
		console.log('77');
		return;
	}

	private createGraphResponseBody(status: number, message: string | object) {
		return {
			statusCode: status,
			message: 'qweqweqwe'
		};
	}

	private detectGraphqlRequest(host: ArgumentsHost): any {
		const gqlHost: GqlArgumentsHost = GqlArgumentsHost.create(host);
		return gqlHost.getContext()?.req.res;
	}

	private extractErrorMessage(exception: ApolloError): string | object {
		return exception instanceof HttpException
			? exception.getResponse()
			: this.configLoaderService.errorConfig.errorDefaultMessage;
	}

	private extractStatus(exception: ApolloError): number {
		return exception instanceof HttpException
			? exception.getStatus()
			: this.configLoaderService.errorConfig.errorDefaultStatus;
	}

	// private extractErrorMessage(exception: ApolloError): string | object {
	// 	return exception instanceof ApolloError
	// 		? exception.message
	// 		: this.configLoaderService.errorConfig.errorDefaultMessage;
	// }

	// private extractStatus(exception: ApolloError): number {
	// 	return exception instanceof ApolloError
	// 		? exception.extensions.code
	// 		: this.configLoaderService.errorConfig.errorDefaultStatus;
	// }
}
