import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { OrganizerStatus, UserRole } from '../common/enums';
import { AppException } from '../common/errors/app.exception';
import { ErrorCodes } from '../common/errors/error-codes';
import { Organizer } from '../entities';
import { AppLoggerService } from '../observability/app-logger.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { USER_INACTIVE_MESSAGE } from './user-inactive.constants';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Organizer)
    private readonly organizerRepo: Repository<Organizer>,
    private readonly jwtService: JwtService,
    private readonly appLogger: AppLoggerService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.organizerRepo.findOne({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('E-mail já cadastrado');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const organizer = this.organizerRepo.create({
      name: dto.name,
      email: dto.email.toLowerCase(),
      passwordHash,
      instagramHandle: dto.instagramHandle,
      role: UserRole.ORGANIZER,
      status: OrganizerStatus.ACTIVE,
    });
    await this.organizerRepo.save(organizer);

    return this.buildAuthResponse(organizer);
  }

  async login(dto: LoginDto) {
    const organizer = await this.organizerRepo.findOne({
      where: { email: dto.email.toLowerCase() },
    });
    if (!organizer) {
      this.appLogger.logEvent('warn', 'LOGIN_FAILED', {
        email: dto.email.toLowerCase(),
      });
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const valid = await bcrypt.compare(dto.password, organizer.passwordHash);
    if (!valid) {
      this.appLogger.logEvent('warn', 'LOGIN_FAILED', {
        userId: organizer.id,
        email: organizer.email,
      });
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (organizer.status === OrganizerStatus.INACTIVE) {
      this.appLogger.logEvent('warn', 'LOGIN_FAILED', {
        userId: organizer.id,
        email: organizer.email,
        reason: 'USER_INACTIVE',
      });
      throw new AppException(
        ErrorCodes.USER_INACTIVE,
        USER_INACTIVE_MESSAGE,
        403,
      );
    }

    this.appLogger.logEvent('info', 'LOGIN_SUCCESS', {
      userId: organizer.id,
      organizerId: organizer.id,
      role: organizer.role,
    });

    return this.buildAuthResponse(organizer);
  }

  async me(organizer: Organizer) {
    return this.sanitizeOrganizer(organizer);
  }

  private buildAuthResponse(organizer: Organizer) {
    const token = this.jwtService.sign({
      sub: organizer.id,
      email: organizer.email,
      role: organizer.role,
    });
    return {
      accessToken: token,
      organizer: this.sanitizeOrganizer(organizer),
    };
  }

  private sanitizeOrganizer(organizer: Organizer) {
    return {
      id: organizer.id,
      name: organizer.name,
      email: organizer.email,
      instagramHandle: organizer.instagramHandle,
      role: organizer.role,
      status: organizer.status,
      createdAt: organizer.createdAt,
      updatedAt: organizer.updatedAt,
    };
  }
}
