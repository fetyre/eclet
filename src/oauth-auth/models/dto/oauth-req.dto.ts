import { OAuthProvider } from 'src/auth/models/enums/oauth.provide.emun';
import { OAuthReqInterface } from '../interface/oauth-req.interface';
import { OAuthCreateDto } from './oauth.dto';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class OAuthReqDto extends OAuthCreateDto implements OAuthReqInterface {
	@ApiProperty({ description: 'провайдер OAuth', required: false })
	@IsEnum(OAuthProvider)
	@IsNotEmpty()
	public readonly provider: OAuthProvider;
}
