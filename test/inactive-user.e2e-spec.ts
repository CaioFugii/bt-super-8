import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { Repository } from 'typeorm';
import { OrganizerStatus, UserRole } from '../src/common/enums';
import { Organizer } from '../src/entities';
import { authHeader, createE2eApp } from './helpers/e2e-app';

describe('Inactive user (e2e)', () => {
  let app: INestApplication<App>;
  let adminToken: string;
  let organizerId: string;
  let inactiveOrganizerEmail: string;

  const adminEmail = `inactive-admin-${Date.now()}@bts8.test`;
  const organizerEmail = `inactive-org-${Date.now()}@bts8.test`;
  const password = 'senha123';

  beforeAll(async () => {
    app = await createE2eApp();
    const organizerRepo = app.get<Repository<Organizer>>(
      getRepositoryToken(Organizer),
    );

    const admin = organizerRepo.create({
      name: 'Admin Inactive E2E',
      email: adminEmail,
      passwordHash: await bcrypt.hash(password, 10),
      role: UserRole.PLATFORM_ADMIN,
      status: OrganizerStatus.ACTIVE,
    });
    await organizerRepo.save(admin);

    const organizer = organizerRepo.create({
      name: 'Organizador Inativo E2E',
      email: organizerEmail,
      passwordHash: await bcrypt.hash(password, 10),
      role: UserRole.ORGANIZER,
      status: OrganizerStatus.ACTIVE,
    });
    await organizerRepo.save(organizer);
    organizerId = organizer.id;

    inactiveOrganizerEmail = `inactive-login-${Date.now()}@bts8.test`;
    const inactiveOrganizer = organizerRepo.create({
      name: 'Organizador Já Inativo',
      email: inactiveOrganizerEmail,
      passwordHash: await bcrypt.hash(password, 10),
      role: UserRole.ORGANIZER,
      status: OrganizerStatus.INACTIVE,
    });
    await organizerRepo.save(inactiveOrganizer);

    const adminLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: adminEmail, password })
      .expect(201);
    adminToken = adminLogin.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('bloqueia login de usuário inativo', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: inactiveOrganizerEmail, password })
      .expect(403)
      .expect((res) => {
        expect(res.body.code).toBe('USER_INACTIVE');
        expect(res.body.message).toBe(
          'Usuário inativo. Entre em contato com o administrador.',
        );
      });
  });

  it('bloqueia acesso com JWT emitido antes da inativação', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: organizerEmail, password })
      .expect(201);

    const tokenBeforeDeactivation = login.body.accessToken;

    await request(app.getHttpServer())
      .post(`/api/admin/organizers/${organizerId}/deactivate`)
      .set(authHeader(adminToken))
      .expect(201);

    await request(app.getHttpServer())
      .get('/api/tournaments')
      .set(authHeader(tokenBeforeDeactivation))
      .expect(403)
      .expect((res) => {
        expect(res.body.code).toBe('USER_INACTIVE');
        expect(res.body.message).toBe(
          'Usuário inativo. Entre em contato com o administrador.',
        );
      });
  });

  it('valida status do usuário em rotas autenticadas distintas', async () => {
    await request(app.getHttpServer())
      .post(`/api/admin/organizers/${organizerId}/activate`)
      .set(authHeader(adminToken))
      .expect(201);

    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: organizerEmail, password })
      .expect(201);

    const token = login.body.accessToken;

    await request(app.getHttpServer())
      .post(`/api/admin/organizers/${organizerId}/deactivate`)
      .set(authHeader(adminToken))
      .expect(201);

    const routes = [
      { method: 'get' as const, path: '/api/auth/me' },
      { method: 'get' as const, path: '/api/tournaments' },
    ];

    for (const route of routes) {
      await request(app.getHttpServer())
        [route.method](route.path)
        .set(authHeader(token))
        .expect(403)
        .expect((res) => {
          expect(res.body.code).toBe('USER_INACTIVE');
          expect(res.body.message).toBe(
            'Usuário inativo. Entre em contato com o administrador.',
          );
        });
    }
  });
});
