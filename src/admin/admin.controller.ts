import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CurrentOrganizer } from '../auth/current-organizer.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Organizer } from '../entities';
import { AdminService } from './admin.service';
import { CreateOrganizerDto } from './dto/create-organizer.dto';
import { UpdateOrganizerDto } from './dto/update-organizer.dto';
import { PlatformAdminGuard } from './platform-admin.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard, PlatformAdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  getDashboard() {
    return this.adminService.getDashboard();
  }

  @Get('organizers')
  listOrganizers() {
    return this.adminService.listOrganizers();
  }

  @Post('organizers')
  createOrganizer(
    @CurrentOrganizer() admin: Organizer,
    @Body() dto: CreateOrganizerDto,
  ) {
    return this.adminService.createOrganizer(admin, dto);
  }

  @Put('organizers/:id')
  updateOrganizer(
    @CurrentOrganizer() admin: Organizer,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrganizerDto,
  ) {
    return this.adminService.updateOrganizer(admin, id, dto);
  }

  @Post('organizers/:id/activate')
  activateOrganizer(
    @CurrentOrganizer() admin: Organizer,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.adminService.activateOrganizer(admin, id);
  }

  @Post('organizers/:id/deactivate')
  deactivateOrganizer(
    @CurrentOrganizer() admin: Organizer,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.adminService.deactivateOrganizer(admin, id);
  }

  @Post('organizers/:id/reset-password')
  resetPassword(
    @CurrentOrganizer() admin: Organizer,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.adminService.resetPassword(admin, id);
  }
}
