import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';
import { join } from 'path';
import {
  Match,
  Organizer,
  Participant,
  RevokedPublicToken,
  Tournament,
  TournamentChallenge,
} from '../entities';

type EnvSource = ConfigService | NodeJS.ProcessEnv;

const ENTITIES = [
  Organizer,
  Tournament,
  Participant,
  Match,
  TournamentChallenge,
  RevokedPublicToken,
];

function readEnv(source: EnvSource, key: string, fallback?: string): string | undefined {
  if (source instanceof ConfigService) {
    const value = source.get<string>(key);
    return value ?? fallback;
  }
  return source[key] ?? fallback;
}

function isProduction(source: EnvSource): boolean {
  return readEnv(source, 'NODE_ENV') === 'production';
}

function usesManagedDatabase(source: EnvSource): boolean {
  return Boolean(readEnv(source, 'DATABASE_URL'));
}

function shouldUseSsl(source: EnvSource, databaseUrl?: string): boolean {
  const flag = readEnv(source, 'DATABASE_SSL');
  if (flag === 'true') return true;
  if (flag === 'false') return false;
  return Boolean(databaseUrl?.includes('amazonaws.com'));
}

export function createTypeOrmOptions(
  source: EnvSource,
): TypeOrmModuleOptions & DataSourceOptions {
  const databaseUrl = readEnv(source, 'DATABASE_URL');
  const migrationsPath = join(__dirname, 'migrations', '*.{ts,js}');

  if (databaseUrl) {
    return {
      type: 'postgres',
      url: databaseUrl,
      entities: ENTITIES,
      migrations: [migrationsPath],
      synchronize: false,
      migrationsRun: readEnv(source, 'DB_MIGRATIONS_RUN', 'true') !== 'false',
      ssl: shouldUseSsl(source, databaseUrl) ? { rejectUnauthorized: false } : false,
    };
  }

  return {
    type: 'postgres',
    host: readEnv(source, 'POSTGRES_HOST', 'localhost'),
    port: parseInt(readEnv(source, 'POSTGRES_PORT', '5432')!, 10),
    username: readEnv(source, 'POSTGRES_USER', 'bts8'),
    password: readEnv(source, 'POSTGRES_PASSWORD', 'bts8'),
    database: readEnv(source, 'POSTGRES_DB', 'bts8'),
    entities: ENTITIES,
    migrations: [migrationsPath],
    synchronize: !isProduction(source) && !usesManagedDatabase(source),
    migrationsRun: false,
  };
}
