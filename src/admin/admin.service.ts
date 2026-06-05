import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import {
  AdminAuditAction,
  OrganizerStatus,
  UserRole,
} from '../common/enums';
import { AppException } from '../common/errors/app.exception';
import { ErrorCodes } from '../common/errors/error-codes';
import { AdminAuditLog, Organizer } from '../entities';
import { CreateOrganizerDto } from './dto/create-organizer.dto';
import { UpdateOrganizerDto } from './dto/update-organizer.dto';
import { generateTemporaryPassword } from './password.util';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Organizer)
    private readonly organizerRepo: Repository<Organizer>,
    @InjectRepository(AdminAuditLog)
    private readonly auditRepo: Repository<AdminAuditLog>,
  ) {}

  async getDashboard() {
    const [activeCount, inactiveCount, totalCount] = await Promise.all([
      this.organizerRepo.count({
        where: { role: UserRole.ORGANIZER, status: OrganizerStatus.ACTIVE },
      }),
      this.organizerRepo.count({
        where: { role: UserRole.ORGANIZER, status: OrganizerStatus.INACTIVE },
      }),
      this.organizerRepo.count({
        where: { role: UserRole.ORGANIZER },
      }),
    ]);

    return { activeCount, inactiveCount, totalCount };
  }

  async listOrganizers() {
    const organizers = await this.organizerRepo.find({
      where: { role: UserRole.ORGANIZER },
      order: { createdAt: 'DESC' },
    });
    return organizers.map((organizer) => this.sanitizeOrganizer(organizer));
  }

  async createOrganizer(admin: Organizer, dto: CreateOrganizerDto) {
    const email = dto.email.toLowerCase();
    const existing = await this.organizerRepo.findOne({ where: { email } });
    if (existing) {
      throw new AppException(
        ErrorCodes.DUPLICATE_ORGANIZER_EMAIL,
        'Já existe um organizador com este e-mail.',
      );
    }

    const generated = !dto.temporaryPassword;
    const plainPassword = dto.temporaryPassword ?? generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    const organizer = this.organizerRepo.create({
      name: dto.name,
      email,
      passwordHash,
      role: UserRole.ORGANIZER,
      status: OrganizerStatus.ACTIVE,
    });
    await this.organizerRepo.save(organizer);
    await this.logAction(admin.id, AdminAuditAction.CREATE_ORGANIZER, organizer.id);

    return {
      organizer: this.sanitizeOrganizer(organizer),
      temporaryPassword: generated ? plainPassword : undefined,
    };
  }

  async updateOrganizer(
    admin: Organizer,
    id: string,
    dto: UpdateOrganizerDto,
  ) {
    const organizer = await this.findOrganizerOrFail(id);
    const email = dto.email.toLowerCase();

    if (email !== organizer.email) {
      const existing = await this.organizerRepo.findOne({ where: { email } });
      if (existing) {
        throw new AppException(
          ErrorCodes.DUPLICATE_ORGANIZER_EMAIL,
          'Já existe um organizador com este e-mail.',
        );
      }
    }

    organizer.name = dto.name;
    organizer.email = email;
    await this.organizerRepo.save(organizer);
    await this.logAction(admin.id, AdminAuditAction.UPDATE_ORGANIZER, organizer.id);

    return this.sanitizeOrganizer(organizer);
  }

  async activateOrganizer(admin: Organizer, id: string) {
    const organizer = await this.findOrganizerOrFail(id);
    organizer.status = OrganizerStatus.ACTIVE;
    await this.organizerRepo.save(organizer);
    await this.logAction(admin.id, AdminAuditAction.ACTIVATE_ORGANIZER, organizer.id);
    return this.sanitizeOrganizer(organizer);
  }

  async deactivateOrganizer(admin: Organizer, id: string) {
    const organizer = await this.findOrganizerOrFail(id);
    organizer.status = OrganizerStatus.INACTIVE;
    await this.organizerRepo.save(organizer);
    await this.logAction(admin.id, AdminAuditAction.DEACTIVATE_ORGANIZER, organizer.id);
    return this.sanitizeOrganizer(organizer);
  }

  async resetPassword(admin: Organizer, id: string) {
    const organizer = await this.findOrganizerOrFail(id);
    const temporaryPassword = generateTemporaryPassword();
    organizer.passwordHash = await bcrypt.hash(temporaryPassword, 10);
    await this.organizerRepo.save(organizer);
    await this.logAction(admin.id, AdminAuditAction.RESET_PASSWORD, organizer.id);

    return {
      organizer: this.sanitizeOrganizer(organizer),
      temporaryPassword,
    };
  }

  private async findOrganizerOrFail(id: string): Promise<Organizer> {
    const organizer = await this.organizerRepo.findOne({
      where: { id, role: UserRole.ORGANIZER },
    });
    if (!organizer) {
      throw new AppException(
        ErrorCodes.ORGANIZER_NOT_FOUND,
        'Organizador não encontrado.',
        404,
      );
    }
    return organizer;
  }

  private async logAction(
    adminUserId: string,
    action: AdminAuditAction,
    targetUserId: string,
  ) {
    const log = this.auditRepo.create({ adminUserId, action, targetUserId });
    await this.auditRepo.save(log);
  }

  private sanitizeOrganizer(organizer: Organizer) {
    return {
      id: organizer.id,
      name: organizer.name,
      email: organizer.email,
      status: organizer.status,
      createdAt: organizer.createdAt,
      updatedAt: organizer.updatedAt,
    };
  }
}
