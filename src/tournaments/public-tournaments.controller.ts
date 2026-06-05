import { Controller, Get, Param } from '@nestjs/common';
import { PublicTournamentsService } from './public-tournaments.service';

@Controller('public/tournaments')
export class PublicTournamentsController {
  constructor(private readonly publicService: PublicTournamentsService) {}

  @Get(':publicToken')
  getByToken(@Param('publicToken') publicToken: string) {
    return this.publicService.getByPublicToken(publicToken);
  }
}
