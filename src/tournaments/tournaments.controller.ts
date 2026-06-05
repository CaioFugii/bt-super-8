import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentOrganizer } from '../auth/current-organizer.decorator';
import { Organizer } from '../entities';
import { TournamentStatus } from '../common/enums';
import { TournamentsService } from './tournaments.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { CreateParticipantDto } from './dto/create-participant.dto';
import { UpdateParticipantDto } from './dto/update-participant.dto';
import { UpdateMatchResultDto } from './dto/update-match-result.dto';
import { WalkoverMatchDto } from './dto/walkover-match.dto';
import { WithdrawParticipantDto } from './dto/withdraw-participant.dto';

@Controller('tournaments')
@UseGuards(JwtAuthGuard)
export class TournamentsController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  @Post()
  create(
    @CurrentOrganizer() organizer: Organizer,
    @Body() dto: CreateTournamentDto,
  ) {
    return this.tournamentsService.create(organizer, dto);
  }

  @Get()
  findAll(
    @CurrentOrganizer() organizer: Organizer,
    @Query('status') status?: TournamentStatus,
  ) {
    return this.tournamentsService.findAll(organizer, status);
  }

  @Get(':id')
  findOne(@CurrentOrganizer() organizer: Organizer, @Param('id') id: string) {
    return this.tournamentsService.findOne(organizer, id);
  }

  @Patch(':id')
  update(
    @CurrentOrganizer() organizer: Organizer,
    @Param('id') id: string,
    @Body() dto: UpdateTournamentDto,
  ) {
    return this.tournamentsService.update(organizer, id, dto);
  }

  @Post(':id/cancel')
  cancel(@CurrentOrganizer() organizer: Organizer, @Param('id') id: string) {
    return this.tournamentsService.cancel(organizer, id);
  }

  @Delete(':id')
  remove(@CurrentOrganizer() organizer: Organizer, @Param('id') id: string) {
    return this.tournamentsService.remove(organizer, id);
  }

  @Post(':id/finish')
  finish(@CurrentOrganizer() organizer: Organizer, @Param('id') id: string) {
    return this.tournamentsService.finish(organizer, id);
  }

  @Get(':id/ranking')
  ranking(@CurrentOrganizer() organizer: Organizer, @Param('id') id: string) {
    return this.tournamentsService.getRanking(organizer, id);
  }

  @Get(':id/highlights')
  highlights(
    @CurrentOrganizer() organizer: Organizer,
    @Param('id') id: string,
  ) {
    return this.tournamentsService.getHighlights(organizer, id);
  }

  @Get(':id/social-card-data')
  socialCardData(
    @CurrentOrganizer() organizer: Organizer,
    @Param('id') id: string,
  ) {
    return this.tournamentsService.getSocialCardData(organizer, id);
  }

  @Get(':id/challenge')
  challenge(@CurrentOrganizer() organizer: Organizer, @Param('id') id: string) {
    return this.tournamentsService.getChallenge(organizer, id);
  }

  @Get(':id/share-link')
  shareLinkStatus(
    @CurrentOrganizer() organizer: Organizer,
    @Param('id') id: string,
  ) {
    return this.tournamentsService.getShareLinkStatus(organizer, id);
  }

  @Post(':id/share-link')
  generateShareLink(
    @CurrentOrganizer() organizer: Organizer,
    @Param('id') id: string,
  ) {
    return this.tournamentsService.generateShareLink(organizer, id);
  }

  @Delete(':id/share-link')
  revokeShareLink(
    @CurrentOrganizer() organizer: Organizer,
    @Param('id') id: string,
  ) {
    return this.tournamentsService.revokeShareLink(organizer, id);
  }

  @Post(':id/participants')
  addParticipant(
    @CurrentOrganizer() organizer: Organizer,
    @Param('id') id: string,
    @Body() dto: CreateParticipantDto,
  ) {
    return this.tournamentsService.addParticipant(organizer, id, dto);
  }

  @Get(':id/participants')
  listParticipants(
    @CurrentOrganizer() organizer: Organizer,
    @Param('id') id: string,
  ) {
    return this.tournamentsService.listParticipants(organizer, id);
  }

  @Patch(':tournamentId/participants/:participantId')
  updateParticipant(
    @CurrentOrganizer() organizer: Organizer,
    @Param('tournamentId') tournamentId: string,
    @Param('participantId') participantId: string,
    @Body() dto: UpdateParticipantDto,
  ) {
    return this.tournamentsService.updateParticipant(
      organizer,
      tournamentId,
      participantId,
      dto,
    );
  }

  @Delete(':tournamentId/participants/:participantId')
  removeParticipant(
    @CurrentOrganizer() organizer: Organizer,
    @Param('tournamentId') tournamentId: string,
    @Param('participantId') participantId: string,
  ) {
    return this.tournamentsService.removeParticipant(
      organizer,
      tournamentId,
      participantId,
    );
  }

  @Post(':tournamentId/participants/:participantId/withdraw')
  withdrawParticipant(
    @CurrentOrganizer() organizer: Organizer,
    @Param('tournamentId') tournamentId: string,
    @Param('participantId') participantId: string,
    @Body() dto: WithdrawParticipantDto,
  ) {
    return this.tournamentsService.withdrawParticipant(
      organizer,
      tournamentId,
      participantId,
      dto,
    );
  }

  @Post(':id/matches/generate')
  generateMatches(
    @CurrentOrganizer() organizer: Organizer,
    @Param('id') id: string,
  ) {
    return this.tournamentsService.generateMatches(organizer, id);
  }

  @Get(':id/matches')
  listMatches(
    @CurrentOrganizer() organizer: Organizer,
    @Param('id') id: string,
  ) {
    return this.tournamentsService.listMatches(organizer, id);
  }

  @Patch(':tournamentId/matches/:matchId/result')
  updateResult(
    @CurrentOrganizer() organizer: Organizer,
    @Param('tournamentId') tournamentId: string,
    @Param('matchId') matchId: string,
    @Body() dto: UpdateMatchResultDto,
  ) {
    return this.tournamentsService.updateMatchResult(
      organizer,
      tournamentId,
      matchId,
      dto,
    );
  }

  @Patch(':tournamentId/matches/:matchId/result/edit')
  editResult(
    @CurrentOrganizer() organizer: Organizer,
    @Param('tournamentId') tournamentId: string,
    @Param('matchId') matchId: string,
    @Body() dto: UpdateMatchResultDto,
  ) {
    return this.tournamentsService.editMatchResult(
      organizer,
      tournamentId,
      matchId,
      dto,
    );
  }

  @Post(':tournamentId/matches/:matchId/walkover')
  walkover(
    @CurrentOrganizer() organizer: Organizer,
    @Param('tournamentId') tournamentId: string,
    @Param('matchId') matchId: string,
    @Body() dto: WalkoverMatchDto,
  ) {
    return this.tournamentsService.markWalkover(
      organizer,
      tournamentId,
      matchId,
      dto,
    );
  }
}
