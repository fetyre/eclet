import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './settings/prisma.database/prisma.service';
import * as express from 'express';
import * as session from 'express-session';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { v4 as uuidv4 } from 'uuid';
import helmet from 'helmet';
import { HttpExceptionFilter } from './error/global-http-error';
// import { GraphQLErrorFilter } from './error/global-graph-error';
import { ConfigLoaderService } from './settings/config/config-loader.service';
import { AllExceptionsFilter } from './error/global-ws-error';
import * as csurf from 'csurf';
import { GraphQLErrorFilter } from './error/global-graph-error';

async function bootstrap() {
	// console.log('Before creating the app');
	const app = await NestFactory.create(AppModule, {
		snapshot: true,
		bufferLogs: true
	});
	const configLoaderService: ConfigLoaderService = app.get(ConfigLoaderService);

	// app.useLogger(app.get(MyLogger));

	// app.useGlobalInterceptors(new LoggerErrorInterceptor());
	app.flushLogs();
	const prismaService: PrismaService = app.get(PrismaService);
	app.enableShutdownHooks();
	app
		.getHttpAdapter()
		.getInstance()
		.on('beforeShutdown', async () => {
			await prismaService.$disconnect(); // Отключаемся от базы данных перед завершением приложения
		}); // убеждается что все обработчики запросов,сервисы и провайдеры завешили свою работу, во избежании утечек памяти, и он убеждается в том что  экземпляр PrismaClient также завершает свою работу
	app.useGlobalPipes(
		new ValidationPipe({
			transform: true
		})
	);
	app.setGlobalPrefix('api');
	app.use(
		session({
			secret:
				'qweqweqweqweqweqweqweeqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweewqewqewqewqewqewqqweeqwqweewqqweeqasdasdasdasdasd',
			resave: false,
			saveUninitialized: false,
			genid: () => {
				const timestamp: number = Date.now();
				const uuid: string = uuidv4();
				return `${timestamp}-${uuid}`;
			}
		})
	);
	app.use(helmet());
	app.enableCors();
	// app.use(csurf());

	app.use(express.json({ limit: '50mb' }));
	app.use(express.urlencoded({ limit: '50mb', extended: true }));
	const config = new DocumentBuilder()
		.setTitle('NestJS Example App')
		.setDescription('The API description')
		.setVersion('1.0')
		.addTag('shop')
		.build();
	app.useGlobalFilters(
		new GraphQLErrorFilter(configLoaderService),
		new HttpExceptionFilter(configLoaderService),
		new AllExceptionsFilter()
	);
	const document: OpenAPIObject = SwaggerModule.createDocument(app, config);
	SwaggerModule.setup('api', app, document);
	await app.listen(3000);
}
bootstrap();
