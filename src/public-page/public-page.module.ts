import { Module } from '@nestjs/common';
import { TournamentsModule } from '../tournaments/tournaments.module';
import { PublicPageController } from './public-page.controller';

@Module({
  imports: [TournamentsModule],
  controllers: [PublicPageController],
})
export class PublicPageModule {}
