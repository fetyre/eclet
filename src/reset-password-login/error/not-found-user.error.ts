import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * @class NotFoundUserByResetPassword
 * @classdesc оишбка когда пользователя нету
 * @since 2023-10-30
 * @see {HttpException} extends
 */
export class NotFoundUserByResetPassword extends HttpException {
	constructor() {
		super('Пользователя не существует', HttpStatus.BAD_REQUEST);
	}
}
