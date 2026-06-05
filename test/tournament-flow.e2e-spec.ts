import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { Repository } from 'typeorm';
import { Gender, TournamentFormat } from '../src/common/enums';
import { RevokedPublicToken, Tournament } from '../src/entities';
import { authHeader, createE2eApp } from './helpers/e2e-app';

describe('Tournament flow (e2e)', () => {
  let app: INestApplication<App>;
  let token: string;
  let tournamentId: string;
  let mixedTournamentId: string;
  let publicToken: string;

  const email = `e2e-${Date.now()}@bts8.test`;
  const password = 'senha123';

  beforeAll(async () => {
    app = await createE2eApp();

    const register = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        name: 'Organizador E2E',
        email,
        password,
        instagramHandle: '@e2eorg',
      })
      .expect(201);

    token = register.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('health: API responde em rota pública', async () => {
    await request(app.getHttpServer())
      .get('/api/public/tournaments/token-invalido')
      .expect(404);
  });

  it('cria torneio SUPER_8 sem publicToken', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/tournaments')
      .set(authHeader(token))
      .send({
        name: 'Super 8 E2E',
        date: '2026-06-15',
        location: 'Quadra Central',
        scoreLimit: 6,
        hasTieBreak: false,
        walkoverScoreWinner: 6,
        walkoverScoreLoser: 0,
        format: 'SUPER_8',
      })
      .expect(201);

    tournamentId = res.body.id;
    expect(res.body.publicToken).toBeNull();
    expect(res.body.publicTokenExpiresAt).toBeNull();
  });

  it('cria torneio SUPER_8_MIXED sem publicToken', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/tournaments')
      .set(authHeader(token))
      .send({
        name: 'Super 8 Misto E2E',
        date: '2026-06-16',
        scoreLimit: 6,
        hasTieBreak: false,
        walkoverScoreWinner: 6,
        walkoverScoreLoser: 0,
        format: 'SUPER_8_MIXED',
      })
      .expect(201);

    mixedTournamentId = res.body.id;
    expect(res.body.publicToken).toBeNull();
  });

  it('bloqueia geração mista com quantidade inválida', async () => {
    const males = ['H1', 'H2', 'H3', 'H4', 'H5'];
    const females = ['M1', 'M2', 'M3'];

    for (const [i, name] of males.entries()) {
      await request(app.getHttpServer())
        .post(`/api/tournaments/${mixedTournamentId}/participants`)
        .set(authHeader(token))
        .send({ name, gender: Gender.MALE })
        .expect(i < 4 ? 201 : 400);
    }

    for (const name of females) {
      await request(app.getHttpServer())
        .post(`/api/tournaments/${mixedTournamentId}/participants`)
        .set(authHeader(token))
        .send({ name, gender: Gender.FEMALE })
        .expect(201);
    }

    await request(app.getHttpServer())
      .post(`/api/tournaments/${mixedTournamentId}/matches/generate`)
      .set(authHeader(token))
      .expect(400);
  });

  it('fluxo SUPER_8: participantes, partidas, ranking e link público', async () => {
    const names = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8'];
    for (const name of names) {
      await request(app.getHttpServer())
        .post(`/api/tournaments/${tournamentId}/participants`)
        .set(authHeader(token))
        .send({ name, phone: '11999999999', notes: 'interno' })
        .expect(201);
    }

    const matchesRes = await request(app.getHttpServer())
      .post(`/api/tournaments/${tournamentId}/matches/generate`)
      .set(authHeader(token))
      .expect(201);

    expect(matchesRes.body).toHaveLength(14);

    const matches = await request(app.getHttpServer())
      .get(`/api/tournaments/${tournamentId}/matches`)
      .set(authHeader(token))
      .expect(200);

    for (const match of matches.body) {
      await request(app.getHttpServer())
        .patch(`/api/tournaments/${tournamentId}/matches/${match.id}/result`)
        .set(authHeader(token))
        .send({ teamAScore: 6, teamBScore: 4 })
        .expect(200);
    }

    await request(app.getHttpServer())
      .post(`/api/tournaments/${tournamentId}/finish`)
      .set(authHeader(token))
      .expect(201);

    const ranking = await request(app.getHttpServer())
      .get(`/api/tournaments/${tournamentId}/ranking`)
      .set(authHeader(token))
      .expect(200);

    expect(ranking.body.ranking).toHaveLength(8);

    const share = await request(app.getHttpServer())
      .post(`/api/tournaments/${tournamentId}/share-link`)
      .set(authHeader(token))
      .expect(201);

    expect(share.body.publicUrl).toMatch(/\/t\/.+/);
    expect(new Date(share.body.publicTokenExpiresAt).getTime()).toBeGreaterThan(
      Date.now(),
    );

    publicToken = share.body.publicUrl.split('/t/')[1];

    const pub = await request(app.getHttpServer())
      .get(`/api/public/tournaments/${publicToken}`)
      .expect(200);

    expect(pub.body.tournament.name).toBe('Super 8 E2E');
    expect(pub.body.participants).toHaveLength(8);
    expect(pub.body.matches).toHaveLength(14);
    expect(pub.body.ranking).toHaveLength(8);
    expect(pub.body.participants[0]).not.toHaveProperty('phone');
    expect(pub.body.participants[0]).not.toHaveProperty('id');
    expect(JSON.stringify(pub.body)).not.toContain('interno');

    const page = await request(app.getHttpServer())
      .get(`/t/${publicToken}`)
      .expect(200);

    expect(page.headers['content-type']).toMatch(/html/);
    expect(page.text).toContain('id="app"');
    expect(page.text).toContain('/spectator/app.js');
  });

  it('GET /t/:publicToken retorna HTML para token válido', async () => {
    const share = await request(app.getHttpServer())
      .post(`/api/tournaments/${tournamentId}/share-link`)
      .set(authHeader(token))
      .expect(201);

    const tokenValue = share.body.publicUrl.split('/t/')[1];
    const res = await request(app.getHttpServer()).get(`/t/${tokenValue}`).expect(200);

    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain('Super 8 Beach Tennis');
    expect(res.text).toContain('/spectator/style.css');
  });

  it('GET /t/:publicToken bloqueia token inválido com HTML', async () => {
    const res = await request(app.getHttpServer())
      .get('/t/token-invalido-xyz')
      .expect(404);

    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain('Torneio não encontrado');
  });

  it('novo compartilhamento invalida token anterior', async () => {
    const oldToken = publicToken;

    const share = await request(app.getHttpServer())
      .post(`/api/tournaments/${tournamentId}/share-link`)
      .set(authHeader(token))
      .expect(201);

    publicToken = share.body.publicUrl.split('/t/')[1];
    expect(publicToken).not.toBe(oldToken);

    await request(app.getHttpServer())
      .get(`/api/public/tournaments/${oldToken}`)
      .expect(410);

    await request(app.getHttpServer())
      .get(`/api/public/tournaments/${publicToken}`)
      .expect(200);
  });

  it('revoga link público', async () => {
    await request(app.getHttpServer())
      .delete(`/api/tournaments/${tournamentId}/share-link`)
      .set(authHeader(token))
      .expect(200);

    await request(app.getHttpServer())
      .get(`/api/public/tournaments/${publicToken}`)
      .expect(410);
  });

  it('bloqueia token expirado', async () => {
    const share = await request(app.getHttpServer())
      .post(`/api/tournaments/${tournamentId}/share-link`)
      .set(authHeader(token))
      .expect(201);

    const expiredToken = share.body.publicUrl.split('/t/')[1];
    const tournamentRepo = app.get<Repository<Tournament>>(
      getRepositoryToken(Tournament),
    );

    await tournamentRepo.update(
      { publicToken: expiredToken },
      { publicTokenExpiresAt: new Date(Date.now() - 60_000) },
    );

    const res = await request(app.getHttpServer())
      .get(`/api/public/tournaments/${expiredToken}`)
      .expect(410);

    expect(res.body.code).toBe('PUBLIC_LINK_EXPIRED');

    const page = await request(app.getHttpServer())
      .get(`/t/${expiredToken}`)
      .expect(410);

    expect(page.headers['content-type']).toMatch(/html/);
    expect(page.text).toContain('Link expirado');
  });

  it('fluxo SUPER_8_MIXED: 4H+4M, partidas, destaques e link público', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/tournaments')
      .set(authHeader(token))
      .send({
        name: 'Misto E2E Limpo',
        date: '2026-06-20',
        scoreLimit: 6,
        hasTieBreak: false,
        walkoverScoreWinner: 6,
        walkoverScoreLoser: 0,
        format: TournamentFormat.SUPER_8_MIXED,
        enableForfeitChallenge: true,
        forfeitChallengeMode: 'RANDOM',
      })
      .expect(201);

    mixedTournamentId = created.body.id;

    const males = ['João', 'Pedro', 'Carlos', 'Rafael'];
    const females = ['Ana', 'Maria', 'Fernanda', 'Juliana'];

    for (const name of males) {
      await request(app.getHttpServer())
        .post(`/api/tournaments/${mixedTournamentId}/participants`)
        .set(authHeader(token))
        .send({ name, gender: Gender.MALE })
        .expect(201);
    }

    for (const name of females) {
      await request(app.getHttpServer())
        .post(`/api/tournaments/${mixedTournamentId}/participants`)
        .set(authHeader(token))
        .send({ name, gender: Gender.FEMALE })
        .expect(201);
    }

    const gen = await request(app.getHttpServer())
      .post(`/api/tournaments/${mixedTournamentId}/matches/generate`)
      .set(authHeader(token))
      .expect(201);

    expect(gen.body).toHaveLength(14);

    const matches = await request(app.getHttpServer())
      .get(`/api/tournaments/${mixedTournamentId}/matches`)
      .set(authHeader(token))
      .expect(200);

    for (const match of matches.body) {
      await request(app.getHttpServer())
        .patch(`/api/tournaments/${mixedTournamentId}/matches/${match.id}/result`)
        .set(authHeader(token))
        .send({ teamAScore: 6, teamBScore: 3 })
        .expect(200);
    }

    await request(app.getHttpServer())
      .post(`/api/tournaments/${mixedTournamentId}/finish`)
      .set(authHeader(token))
      .expect(201);

    const highlights = await request(app.getHttpServer())
      .get(`/api/tournaments/${mixedTournamentId}/highlights`)
      .set(authHeader(token))
      .expect(200);

    expect(highlights.body.maleHighlights).toBeDefined();
    expect(highlights.body.femaleHighlights).toBeDefined();

    const share = await request(app.getHttpServer())
      .post(`/api/tournaments/${mixedTournamentId}/share-link`)
      .set(authHeader(token))
      .expect(201);

    const mixedPublicToken = share.body.publicUrl.split('/t/')[1];

    const pub = await request(app.getHttpServer())
      .get(`/api/public/tournaments/${mixedPublicToken}`)
      .expect(200);

    expect(pub.body.tournament.format).toBe('SUPER_8_MIXED');
    expect(pub.body.highlights?.maleHighlights).toBeDefined();
    expect(pub.body.highlights?.femaleHighlights).toBeDefined();
    expect(pub.body.challenge).toBeDefined();
    expect(pub.body.participants.some((p: { gender: string }) => p.gender)).toBe(
      true,
    );
  });

  it('bloqueia token inexistente', async () => {
    await request(app.getHttpServer())
      .get('/api/public/tournaments/token-inexistente')
      .expect(404);
  });

  it('endpoint público não exige autenticação', async () => {
    await request(app.getHttpServer())
      .get('/api/public/tournaments/qualquer-token')
      .expect((res) => {
        expect([404, 410]).toContain(res.status);
      });
  });
});
