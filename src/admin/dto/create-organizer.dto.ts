import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateOrganizerDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  temporaryPassword?: string;
}
