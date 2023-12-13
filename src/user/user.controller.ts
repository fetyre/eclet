import {
	Controller,
	Body,
	Patch,
	UseGuards,
	Res,
	HttpStatus,
	Delete,
	UseInterceptors,
	Get,
	Param,
	HttpCode,
	Query,
	Post
} from '@nestjs/common';
import { UsersService } from './user.service';
import { UpdateUserDto } from './models/dto/update-user.dto';
import {
	JwtAccessAuthGuard,
	JwtAdminAccessGuard,
	JwtSuperAdminAccessGuard
} from 'src/guards';
import { Response } from 'express';
import {
	StatusEnum,
	User,
	UserGender,
	UserRole,
	UserStatus
} from '@prisma/client';
import { EmptyUpdateInterceptor } from '../interceptors/empty-dto.update.interceptor';
import { GetUser } from 'src/decor/current-http-user.decorator';
import { UserQueryParams } from './models/interface';
import { SignUpDto } from './models/dto';
import {
	ApiBadRequestResponse,
	ApiBody,
	ApiInternalServerErrorResponse,
	ApiOperation,
	ApiResponse
} from '@nestjs/swagger';
import { Recaptcha } from '@nestlab/google-recaptcha';

@Controller('users')
export class UserController {
	constructor(private readonly userService: UsersService) {}

	/**
	 * Создание нового пользователя
	 * @param {SignUpDto} signUpDto - DTO для создания нового пользователя
	 * @returns {Promise<void>}
	 * @throws {BadRequestException} Если email адрес уже занят или предоставлены некорректные данные для создания пользователя
	 * @throws {InternalServerErrorException} Если возникла внутренняя ошибка сервера
	 * @see {@link LocalAuthService.signUp}
	 * @since 2023-10-26
	 */
	@Post()
	// @Recaptcha()
	@ApiOperation({ summary: 'Регистрация нового пользователя' })
	@ApiBody({
		type: SignUpDto,
		description: 'Данные для регистрации нового пользователя',
		required: true
	})
	@ApiResponse({
		status: 201,
		description: 'Пользователь успешно создан',
		schema: {
			type: 'object',
			properties: {
				id: {
					type: 'string',
					example: 'ckpfn8skk0000j29z3l9l4d1z'
				},
				email: {
					type: 'string',
					example: 'user@example.com'
				}
			}
		}
	})
	@ApiBadRequestResponse({
		description:
			'Этот email адрес занят или предоставлены некорректные данные для создания пользователя'
	})
	@ApiInternalServerErrorResponse({
		description: 'Внутренняя ошибка сервера'
	})
	async signUp(
		@Body() signUpDto: SignUpDto,
		@Res() res: Response
	): Promise<void> {
		const user: User = await this.userService.signUp(signUpDto);
		res
			.status(HttpStatus.CREATED)
			.location(`/users/${user.id}`)
			.json({ id: user.id, email: user.email });
	}

	@Get()
	@UseGuards(JwtAdminAccessGuard)
	@HttpCode(200)
	async findAll(
		@GetUser() user: User,
		@Query('email_verified') isEmailVerified: string,
		@Query('gender') gender: UserGender,
		@Query('online_status') status: StatusEnum,
		@Query('account_status') accountStatus: UserStatus,
		@Query('role') role: UserRole,
		@Query('page') page: number,
		@Query('pageSize') pageSize: number,
		@Query('sortField') sortField: string,
		@Query('sortOrder') sortOrder: string,
		@Res() res: Response
	): Promise<void> {
		const queryParams: UserQueryParams = {
			isEmailVerified,
			gender,
			status,
			accountStatus,
			role,
			page,
			pageSize,
			sortField,
			sortOrder
		};
		const users: User[] = await this.userService.findAll(user, queryParams);
		res.status(HttpStatus.OK).json(users);
	}

	@Get(':id')
	@HttpCode(200)
	async findOne(@Param('id') id: string, @Res() res: Response): Promise<void> {
		const user: User = await this.userService.findOne(id);
		res.status(HttpStatus.OK).json(user);
	}

	@Patch(':id')
	@UseGuards(JwtAccessAuthGuard)
	@UseInterceptors(EmptyUpdateInterceptor)
	async updateUser(
		@GetUser() user: User,
		@Res() response: Response,
		@Param('id') id: string,
		@Body() updateUserDto: UpdateUserDto
	): Promise<void> {
		const updateUser: User = await this.userService.updateUser(
			updateUserDto,
			user,
			id
		);
		response.status(HttpStatus.OK).json(updateUser);
	}

	@Delete(':id')
	@UseGuards(JwtSuperAdminAccessGuard)
	async deleteUserById(
		@GetUser() user: User,
		@Res() res: Response,
		@Param('id') id: string
	): Promise<void> {
		await this.userService.delete(user, id);
		res.status(HttpStatus.NO_CONTENT).send();
	}
}
