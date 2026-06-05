import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { OrganizerStatus, UserRole } from '../common/enums';
import { Organizer } from '../entities';

@Injectable()
export class AdminBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(AdminBootstrapService.name);

  constructor(
    @InjectRepository(Organizer)
    private readonly organizerRepo: Repository<Organizer>,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    const email = this.config.get<string>('PLATFORM_ADMIN_EMAIL');
    const password = this.config.get<string>('PLATFORM_ADMIN_PASSWORD');
    if (!email || !password) {
      return;
    }

    const existingAdmin = await this.organizerRepo.findOne({
      where: { role: UserRole.PLATFORM_ADMIN },
    });
    if (existingAdmin) {
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const name =
      this.config.get<string>('PLATFORM_ADMIN_NAME') ?? 'Administrador';

    const admin = this.organizerRepo.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: UserRole.PLATFORM_ADMIN,
      status: OrganizerStatus.ACTIVE,
    });
    await this.organizerRepo.save(admin);
    this.logger.log(`Platform admin criado: ${admin.email}`);
  }
}
