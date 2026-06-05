import { IsEnum } from 'class-validator';
import { WinnerTeam } from '../../common/enums';

export class WalkoverMatchDto {
  @IsEnum(WinnerTeam)
  winnerTeam: WinnerTeam;
}
