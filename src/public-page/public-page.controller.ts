import {
  Controller,
  Get,
  GoneException,
  HttpException,
  NotFoundException,
  Param,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { isAppErrorBody } from '../common/errors/app.exception';
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
        error instanceof HttpException ? error.getStatus() : 400;
      const response =
        error instanceof HttpException ? error.getResponse() : null;
      const message = isAppErrorBody(response)
        ? response.message
        : typeof response === 'object' &&
            response !== null &&
            isAppErrorBody((response as { message?: unknown }).message)
          ? (response as { message: { message: string } }).message.message
          : 'Torneio não encontrado.';

      res.status(status).type('html').send(renderSpectatorErrorPage(message));
    }
  }
}
