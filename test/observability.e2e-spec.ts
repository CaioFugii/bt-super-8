import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { Repository } from 'typeorm';
import { AuditAction, OrganizerStatus, UserRole } from '../src/common/enums';
import { AuditLog, Organizer } from '../src/entities';
import { CORRELATION_ID_HEADER } from '../src/observability/correlation-id.middleware';
import { authHeader, createE2eApp } from './helpers/e2e-app';

describe('Observability (e2e)', () => {
  let app: INestApplication<App>;
  let token: string;
  let organizerId: string;
  let tournamentId: string;

  const email = `obs-${Date.now()}@bts8.test`;
  const password = 'senha123';

  beforeAll(async () => {
    app = await createE2eApp();

    const organizerRepo = app.get<Repository<Organizer>>(
      getRepositoryToken(Organizer),
    );
    const organizer = organizerRepo.create({
      name: 'Organizador Observability',
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role: UserRole.ORGANIZER,
      status: OrganizerStatus.ACTIVE,
    });
    await organizerRepo.save(organizer);
    organizerId = organizer.id;

    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password })
      .expect(201);
    token = login.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('adiciona correlationId nas respostas', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/public/tournaments/token-invalido')
      .expect(404);

    expect(res.headers['x-correlation-id']).toMatch(/^REQ-\d{8}-[A-F0-9]{6}$/);
  });

  it('propaga correlationId informado pelo cliente', async () => {
    const correlationId = 'REQ-20260605-CUSTOM1';
    const res = await request(app.getHttpServer())
      .get('/api/public/tournaments/token-invalido')
      .set(CORRELATION_ID_HEADER, correlationId)
      .expect(404);

    expect(res.headers['x-correlation-id']).toBe(correlationId);
  });

  it('registra auditoria ao criar torneio', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/tournaments')
      .set(authHeader(token))
      .send({
        name: 'Torneio Audit',
        date: '2026-07-01',
        scoreLimit: 6,
        hasTieBreak: false,
        walkoverScoreWinner: 6,
        walkoverScoreLoser: 0,
      })
      .expect(201);

    tournamentId = res.body.id;

    const auditRepo = app.get<Repository<AuditLog>>(
      getRepositoryToken(AuditLog),
    );
    const audit = await auditRepo.findOne({
      where: {
        action: AuditAction.TOURNAMENT_CREATED,
        entityId: tournamentId,
      },
    });

    expect(audit).toBeTruthy();
    expect(audit?.userId).toBe(organizerId);
    expect(audit?.metadata).toMatchObject({
      tournamentId,
      organizerId,
    });
  });

  it('registra auditoria ao atualizar torneio', async () => {
    await request(app.getHttpServer())
      .patch(`/api/tournaments/${tournamentId}`)
      .set(authHeader(token))
      .send({ name: 'Torneio Audit Atualizado' })
      .expect(200);

    const auditRepo = app.get<Repository<AuditLog>>(
      getRepositoryToken(AuditLog),
    );
    const audit = await auditRepo.findOne({
      where: {
        action: AuditAction.TOURNAMENT_UPDATED,
        entityId: tournamentId,
      },
    });
    expect(audit).toBeTruthy();
  });
});
