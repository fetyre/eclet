import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
// import { AuthService } from '../auth.service';
import { SignUpDto } from '../../user/models/dto/sign-up.dto';
import { UsersService } from 'src/user/user.service';
import { User } from '@prisma/client';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'localStrategy') {
	private readonly logger: Logger = new Logger(LocalStrategy.name);
	constructor(private readonly usersService: UsersService) {
		super({
			usernameField: 'email'
		});
	}

	async validate(signUpDto: SignUpDto) {
		try {
			this.logger.log(`Запуск LocalStrategy, email: ${signUpDto.email}`);
			const response: User = await this.usersService.signUp(signUpDto);
			this.logger.log(`Завершение LocalStrategy, email: ${signUpDto.email}`);
			return response;
		} catch (error) {
			this.logger.error(
				`Ошибка в LocalStrategy, email: ${signUpDto.email}, error:${error.message}`
			);
			throw new HttpException('BAD_REQUEST', HttpStatus.BAD_REQUEST);
		}
	}
}
