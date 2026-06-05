import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { ForfeitChallengeMode, TournamentFormat } from '../../common/enums';

export class CreateTournamentDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TournamentFormat)
  format?: TournamentFormat;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsIn([4, 6])
  scoreLimit: 4 | 6;

  @IsBoolean()
  hasTieBreak: boolean;

  @IsInt()
  @Min(0)
  walkoverScoreWinner: number;

  @IsInt()
  @Min(0)
  walkoverScoreLoser: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(4)
  courtCount?: number;

  @IsOptional()
  @IsBoolean()
  enableForfeitChallenge?: boolean;

  @IsOptional()
  @IsEnum(ForfeitChallengeMode)
  forfeitChallengeMode?: ForfeitChallengeMode;

  @ValidateIf((o: CreateTournamentDto) => o.forfeitChallengeMode === ForfeitChallengeMode.CUSTOM)
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  customChallenges?: string[];
}
