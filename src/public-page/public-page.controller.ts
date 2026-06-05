import {
  Controller,
  Get,
  GoneException,
  NotFoundException,
  Param,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { PublicTournamentsService } from '../tournaments/public-tournaments.service';
import {
  renderSpectatorErrorPage,
  renderSpectatorPage,
} from './public-page.template';

@Controller('t')
export class PublicPageController {
  constructor(private readonly publicService: PublicTournamentsService) {}

  @Get(':publicToken')
  async getPage(
    @Param('publicToken') publicToken: string,
    @Res() res: Response,
  ) {
    try {
      await this.publicService.validatePublicToken(publicToken);
      res.type('html').send(renderSpectatorPage());
    } catch (error) {
      const status =
        error instanceof NotFoundException
          ? 404
          : error instanceof GoneException
            ? 410
            : 400;

      const body = error instanceof NotFoundException || error instanceof GoneException
        ? (error.getResponse() as { message?: string | { message?: string } })
        : null;

      const message =
        typeof body?.message === 'object'
          ? body.message.message
          : typeof body?.message === 'string'
            ? body.message
            : 'Torneio não encontrado.';

      res.status(status).type('html').send(renderSpectatorErrorPage(message ?? 'Erro.'));
    }
  }
}
