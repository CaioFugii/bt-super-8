import { IsOptional, IsString } from 'class-validator';

export class WithdrawParticipantDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
