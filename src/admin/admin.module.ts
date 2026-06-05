import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Organizer, Tournament } from '../entities';
import { AdminBootstrapService } from './admin-bootstrap.service';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PlatformAdminGuard } from './platform-admin.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Organizer, Tournament]),
    AuthModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, PlatformAdminGuard, AdminBootstrapService],
})
export class AdminModule {}
