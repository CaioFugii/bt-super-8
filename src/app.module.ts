import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import {
  Match,
  Organizer,
  Participant,
  RevokedPublicToken,
  Tournament,
  TournamentChallenge,
} from './entities';
import { AuthModule } from './auth/auth.module';
import { TournamentsModule } from './tournaments/tournaments.module';
import { StorageModule } from './storage/storage.module';
import { UploadModule } from './upload/upload.module';
import { PublicPageModule } from './public-page/public-page.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public', 'spectator'),
      serveRoot: '/spectator',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('POSTGRES_HOST', 'localhost'),
        port: parseInt(config.get('POSTGRES_PORT', '5432'), 10),
        username: config.get('POSTGRES_USER', 'bts8'),
        password: config.get('POSTGRES_PASSWORD', 'bts8'),
        database: config.get('POSTGRES_DB', 'bts8'),
        entities: [
          Organizer,
          Tournament,
          Participant,
          Match,
          TournamentChallenge,
          RevokedPublicToken,
        ],
        synchronize: config.get('NODE_ENV') !== 'production',
      }),
    }),
    AuthModule,
    TournamentsModule,
    StorageModule,
    UploadModule,
    PublicPageModule,
  ],
})
export class AppModule {}
