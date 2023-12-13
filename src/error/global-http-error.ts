import {
	ExceptionFilter,
	Catch,
	ArgumentsHost,
	HttpException
} from '@nestjs/common';
import { Response } from 'express';
import { IErrorResponse } from './interface/error-response.interface';
import { STATUS_CODES } from 'http';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';
import { ConfigLoaderService } from 'src/settings/config/config-loader.service';
import { GqlArgumentsHost, GqlContextType } from '@nestjs/graphql';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
	constructor(private readonly configLoaderService: ConfigLoaderService) {}

	catch(exception: HttpException, host: ArgumentsHost) {
		// const ctx: HttpArgumentsHost = host.switchToHttp();
		// const response = ctx.getResponse<Response>();
		const responseType = host.getType<GqlContextType>();
		console.log(responseType);
		if (responseType === 'graphql') {
			console.log('1');
			return this.handleGraphqlResponse(exception, host);
		}
		console.log('3');
		const ctx: HttpArgumentsHost = host.switchToHttp();
		const response = ctx.getResponse<Response>();
		return this.handleHttpResponse(response, exception, host);
	}

	private handleGraphqlResponse(exception: any, host: ArgumentsHost): void {
		const response: any = this.detectGraphqlRequest(host);
		const status: number = this.extractStatus(exception);
		const message: string | object = this.extractErrorMessage(exception);
		const responseBody = this.createGraphResponseBody(status, message);
		console.log('2');
		console.log(responseBody);
		response.json(responseBody);
		console.log('77');
		return

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

	private handleHttpResponse(
		response: any,
		exception: HttpException,
		host: ArgumentsHost
	): void {
		const status: number = this.extractStatus(exception);
		const message: string | object = this.extractErrorMessage(exception);
		const requestUrl = host?.switchToHttp()?.getRequest()?.url;
		const errorTitle: string = STATUS_CODES[status] || 'Error';
		const responseBody: IErrorResponse = this.createResponseBody(
			status,
			message,
			errorTitle,
			requestUrl
		);
		response.status(status).json(responseBody);
	}

	private createResponseBody(
		status: number,
		message: string | object,
		title: string,
		requestUrl?: string
	): IErrorResponse {
		return {
			status,
			source: { pointer: requestUrl },
			title,
			detail: message
		};
	}

	private extractErrorMessage(exception: HttpException): string | object {
		return exception instanceof HttpException
			? exception.getResponse()
			: this.configLoaderService.errorConfig.errorDefaultMessage;
	}

	private extractStatus(exception: HttpException): number {
		return exception instanceof HttpException
			? exception.getStatus()
			: this.configLoaderService.errorConfig.errorDefaultStatus;
	}
}
