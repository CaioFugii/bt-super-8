import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Match,
  Participant,
  RevokedPublicToken,
  Tournament,
  TournamentChallenge,
  TournamentStatusAudit,
} from '../entities';
import { TournamentsController } from './tournaments.controller';
import { PublicTournamentsController } from './public-tournaments.controller';
import { TournamentsService } from './tournaments.service';
import { PublicTournamentsService } from './public-tournaments.service';
import { RankingService } from './ranking.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Tournament,
      Participant,
      Match,
      TournamentChallenge,
      RevokedPublicToken,
      TournamentStatusAudit,
    ]),
  ],
  controllers: [TournamentsController, PublicTournamentsController],
  providers: [TournamentsService, PublicTournamentsService, RankingService],
  exports: [PublicTournamentsService],
})
export class TournamentsModule {}
