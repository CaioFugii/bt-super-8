import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { Repository } from 'typeorm';
import {
  AdminAuditAction,
  OrganizerStatus,
  UserRole,
} from '../src/common/enums';
import { AdminAuditLog, Organizer } from '../src/entities';
import { authHeader, createE2eApp } from './helpers/e2e-app';

describe('Admin (e2e)', () => {
  let app: INestApplication<App>;
  let adminToken: string;
  let organizerToken: string;
  let organizerId: string;
  let adminId: string;

  const adminEmail = `admin-e2e-${Date.now()}@bts8.test`;
  const organizerEmail = `org-e2e-${Date.now()}@bts8.test`;
  const password = 'senha123';

  beforeAll(async () => {
    app = await createE2eApp();
    const organizerRepo = app.get<Repository<Organizer>>(
      getRepositoryToken(Organizer),
    );

    const admin = organizerRepo.create({
      name: 'Admin E2E',
      email: adminEmail,
      passwordHash: await bcrypt.hash(password, 10),
      role: UserRole.PLATFORM_ADMIN,
      status: OrganizerStatus.ACTIVE,
    });
    await organizerRepo.save(admin);
    adminId = admin.id;

    const organizer = organizerRepo.create({
      name: 'Organizador E2E',
      email: organizerEmail,
      passwordHash: await bcrypt.hash(password, 10),
      role: UserRole.ORGANIZER,
      status: OrganizerStatus.ACTIVE,
    });
    await organizerRepo.save(organizer);
    organizerId = organizer.id;

    const adminLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: adminEmail, password })
      .expect(201);
    adminToken = adminLogin.body.accessToken;

    const organizerLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: organizerEmail, password })
      .expect(201);
    organizerToken = organizerLogin.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('organizador não acessa rotas admin', async () => {
    await request(app.getHttpServer())
      .get('/api/admin/organizers')
      .set(authHeader(organizerToken))
      .expect(403)
      .expect((res) => {
        expect(res.body.code).toBe('FORBIDDEN');
      });
  });

  it('admin lista dashboard', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/admin/dashboard')
      .set(authHeader(adminToken))
      .expect(200);

    expect(res.body).toMatchObject({
      activeCount: expect.any(Number),
      inactiveCount: expect.any(Number),
      totalCount: expect.any(Number),
    });
  });

  it('admin cria organizador com senha gerada', async () => {
    const email = `novo-${Date.now()}@bts8.test`;
    const res = await request(app.getHttpServer())
      .post('/api/admin/organizers')
      .set(authHeader(adminToken))
      .send({ name: 'Novo Organizador', email })
      .expect(201);

    expect(res.body.organizer.email).toBe(email);
    expect(res.body.organizer.status).toBe('ACTIVE');
    expect(res.body.temporaryPassword).toHaveLength(12);

    const auditRepo = app.get<Repository<AdminAuditLog>>(
      getRepositoryToken(AdminAuditLog),
    );
    const audit = await auditRepo.findOne({
      where: {
        adminUserId: adminId,
        action: AdminAuditAction.CREATE_ORGANIZER,
        targetUserId: res.body.organizer.id,
      },
    });
    expect(audit).toBeTruthy();
  });

  it('admin edita organizador', async () => {
    const res = await request(app.getHttpServer())
      .put(`/api/admin/organizers/${organizerId}`)
      .set(authHeader(adminToken))
      .send({
        name: 'Organizador Atualizado',
        email: organizerEmail,
      })
      .expect(200);

    expect(res.body.name).toBe('Organizador Atualizado');
  });

  it('admin desativa organizador e bloqueia login', async () => {
    await request(app.getHttpServer())
      .post(`/api/admin/organizers/${organizerId}/deactivate`)
      .set(authHeader(adminToken))
      .expect(201)
      .expect((res) => {
        expect(res.body.status).toBe('INACTIVE');
      });

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: organizerEmail, password })
      .expect(403)
      .expect((res) => {
        expect(res.body.code).toBe('USER_INACTIVE');
      });
  });

  it('admin reativa organizador', async () => {
    await request(app.getHttpServer())
      .post(`/api/admin/organizers/${organizerId}/activate`)
      .set(authHeader(adminToken))
      .expect(201)
      .expect((res) => {
        expect(res.body.status).toBe('ACTIVE');
      });
  });

  it('admin redefine senha', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/admin/organizers/${organizerId}/reset-password`)
      .set(authHeader(adminToken))
      .expect(201);

    expect(res.body.temporaryPassword).toHaveLength(12);
  });
});
