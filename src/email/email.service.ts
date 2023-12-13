// import { Injectable, Logger } from '@nestjs/common';
// import { EmailToken } from '@prisma/client';
// import { PrismaService } from 'src/settings/prisma.database/prisma.service';

// @Injectable()
// export class EmailService {
// 	private readonly logger: Logger = new Logger(EmailService.name);

// 	constructor(private prisma: PrismaService) {}

// 	public async updateResendAttemptsAndCreateNewToken(
// 		emailModelId: string,
// 		arrayDate: Date[],
// 		tokenV4Id?: string
// 	): Promise<EmailToken> {
// 		this.logger.log(
// 			`Запуск updateResendAttemptsAndCreateNewToken, emailModelId: ${emailModelId}`
// 		);
// 		return await this.prisma.emailToken.update({
// 			where: { id: emailModelId },
// 			data: {
// 				emailResendAttempts: arrayDate,
// 				token: tokenV4Id
// 			}
// 		});
// 	}
// }
