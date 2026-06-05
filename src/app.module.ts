import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { createTypeOrmOptions } from './database/database.config';
import { TournamentsModule } from './tournaments/tournaments.module';
import { StorageModule } from './storage/storage.module';
import { UploadModule } from './upload/upload.module';
import { PublicPageModule } from './public-page/public-page.module';
import { AdminModule } from './admin/admin.module';

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
      useFactory: (config: ConfigService) => createTypeOrmOptions(config),
    }),
    AuthModule,
    AdminModule,
    TournamentsModule,
    StorageModule,
    UploadModule,
    PublicPageModule,
  ],
})
export class AppModule {}
