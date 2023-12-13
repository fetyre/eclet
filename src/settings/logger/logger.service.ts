import { Injectable } from '@nestjs/common';
import pino from 'pino';
import pinoElastic from 'pino-elasticsearch';
import { ConfigLoaderService } from '../config/config-loader.service';
import moment from 'moment';

@Injectable()
export class MyLogger {
	private errorStream;
	private generalStream;
	private errorLogger;
	private generalLogger;

	constructor(private readonly configLoaderService: ConfigLoaderService) {
		const dateSuffix: string = moment().format('YYYY-MM-DD');

		this.errorStream = pinoElastic({
			index: `${this.configLoaderService.elasticsearchLoggerErrorIndex}-${dateSuffix}`,
			node: 'http://localhost:9200',
			esVersion: 7,
			flushBytes: 1000
		});

		this.generalStream = pinoElastic({
			index: `${this.configLoaderService.elasticsearchLoggerOtherIndex}-${dateSuffix}`,
			node: 'http://localhost:9200',
			esVersion: 7,
			flushBytes: 1000
		});

		this.errorLogger = pino(
			{
				level: 'trace',
				timestamp: () => `,"time":"${new Date().toISOString()}"`,
				formatters: {
					level(label, number) {
						return { level: label };
					},
					bindings(bindings) {
						return { pid: bindings.pid, hostname: bindings.hostname };
					},
					log(object) {
						return { message: object.message, ...object };
					}
				}
			},
			this.errorStream
		);

		this.generalLogger = pino(
			{
				level: 'trace',
				timestamp: () => `,"time":"${new Date().toISOString()}"`,
				formatters: {
					level(label, number) {
						return { level: label };
					},
					bindings(bindings) {
						return { pid: bindings.pid, hostname: bindings.hostname };
					},
					log(object) {
						return { message: object.message, ...object };
					}
				}
			},
			this.generalStream
		);
	}

	public error(message: string, trace?: string): void {
		this.errorLogger.error({ trace }, message);
	}

	public debug(message: string): void {
		this.generalLogger.debug(message);
	}

	public info(message: string): void {
		this.generalLogger.info(message);
	}

	public warn(message: string, trace?: string): void {
		this.errorLogger.warn({ trace }, message);
	}

	public fatal(message: string, trace?: string): void {
		this.errorLogger.fatal({ trace }, message);
	}

	public verbose(message: string): void {
		this.generalLogger.trace(message);
	}
}

// @Injectable()
// export class MyLoggerAdapter implements PinoLogger {
// 	protected context: string;
// 	protected contextName: string;
// 	protected errorKey: string;
// 	get logger(): pino.Logger<pino.LoggerOptions> {
// 		throw new Error('Method not implemented.');
// 	}
// 	trace(msg: string, ...args: any[]): void;
// 	trace(obj: unknown, msg?: string, ...args: any[]): void;
// 	trace(obj: unknown, msg?: unknown, ...args: unknown[]): void {
// 		throw new Error('Method not implemented.');
// 	}
// 	debug(msg: string, ...args: any[]): void;
// 	debug(obj: unknown, msg?: string, ...args: any[]): void;
// 	debug(obj: unknown, msg?: unknown, ...args: unknown[]): void {
// 		throw new Error('Method not implemented.');
// 	}
// 	info(msg: string, ...args: any[]): void;
// 	info(obj: unknown, msg?: string, ...args: any[]): void;
// 	info(obj: unknown, msg?: unknown, ...args: unknown[]): void {
// 		throw new Error('Method not implemented.');
// 	}
// 	warn(msg: string, ...args: any[]): void;
// 	warn(obj: unknown, msg?: string, ...args: any[]): void;
// 	warn(obj: unknown, msg?: unknown, ...args: unknown[]): void {
// 		throw new Error('Method not implemented.');
// 	}
// 	error(msg: string, ...args: any[]): void;
// 	error(obj: unknown, msg?: string, ...args: any[]): void;
// 	error(obj: unknown, msg?: unknown, ...args: unknown[]): void {
// 		throw new Error('Method not implemented.');
// 	}
// 	fatal(msg: string, ...args: any[]): void;
// 	fatal(obj: unknown, msg?: string, ...args: any[]): void;
// 	fatal(obj: unknown, msg?: unknown, ...args: unknown[]): void {
// 		throw new Error('Method not implemented.');
// 	}
// 	setContext(value: string): void {
// 		throw new Error('Method not implemented.');
// 	}
// 	assign(fields: pino.Bindings): void {
// 		throw new Error('Method not implemented.');
// 	}
// 	protected call(
// 		method: pino.Level,
// 		...args:
// 			| [msg: string, ...args: any[]]
// 			| [obj: object, msg?: string, ...args: any[]]
// 	): void {
// 		throw new Error('Method not implemented.');
// 	}

// 	// Добавьте остальные методы, которые требуются для интерфейса PinoLogger
// }
