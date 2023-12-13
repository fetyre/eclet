import { Provider } from '@prisma/client';
import { OAuthCreateDto } from './oauth.dto';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class ValidateOAuthRegisterUserDto extends OAuthCreateDto {
	@IsEnum(Provider)
	@IsNotEmpty()
	provider: Provider;
}
