import { ApiProperty } from '@nestjs/swagger';
import { Provider } from '@prisma/client';
import { IsString, IsNotEmpty, IsEnum, Matches, Length } from 'class-validator';
import { ID_REGEX } from 'src/common/constss/regex.const';

export class OAuthProviderCreationDto {
	@ApiProperty({ description: 'OAuth ID провайдера', required: false })
	@IsString({ message: 'ID провайдера OAuth должен быть строкой' })
	@IsNotEmpty({ message: 'ID провайдера OAuth обязателен' })
	providerId: string;

	@ApiProperty({ description: 'Название OAuth провайдера', required: false })
	@IsNotEmpty({ message: 'Название провайдера OAuth обязательно' })
	@IsEnum(Provider)
	providerName: Provider;

	@IsNotEmpty({ message: 'ID пользователя не может быть пустым' })
	@IsString({ message: 'ID пользователя должен быть строкой' })
	@Length(25, 25, {
		message: 'ID пользователя может быть длиною только 25 символов'
	})
	@Matches(ID_REGEX, {
		message:
			'ID пользователя должен содержать только буквы (в обоих регистрах), цифры и дефисы'
	})
	@ApiProperty({
		description: 'ID пользователя',
		example: 'ckpfn8skk0000j29z3l9l4d1z'
	})
	userId: string;
}
