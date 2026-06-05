import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { Gender } from '../../common/enums';

export class CreateParticipantDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  instagram?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
