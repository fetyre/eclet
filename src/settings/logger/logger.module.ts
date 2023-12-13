import { Global, Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { ConfigLoaderService } from '../config/config-loader.service';
import moment from 'moment';
import pinoElastic from 'pino-elasticsearch';
import { MyLogger } from './logger.service';

@Global()
@Module({
	imports: [
		LoggerModule.forRootAsync({
			inject: [ConfigLoaderService],
			useFactory: async (configLoaderService: ConfigLoaderService) => {
				const dateSuffix: string = moment().format('YYYY-MM-DD');
				const generalStream = pinoElastic({
					index: `${configLoaderService.elasticsearchLoggerOtherIndex}-${dateSuffix}`,
					node: 'http://localhost:9200',
					esVersion: 7,
					flushBytes: 1000
				});
				return {
					pinoHttp: [
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
						generalStream
					]
				};
			}
		})
	],
	providers: [MyLogger]
})
export class MyLoggerModule {}
