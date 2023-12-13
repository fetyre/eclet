import { PartialType } from '@nestjs/swagger';
import { CreateElasticDto } from './create-elastic.dto';

export class UpdateElasticDto extends PartialType(CreateElasticDto) {}
