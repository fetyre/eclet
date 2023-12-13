import { PartialType } from '@nestjs/swagger';
import { CreateAnonymousUserDto } from './create-anonymous-user.dto';

export class UpdateAnonymousUserDto extends PartialType(CreateAnonymousUserDto) {}
