import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StorageService } from '../storage/storage.service';
import { CloudinaryStorageProvider } from '../storage/providers/cloudinary.provider';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(
    private readonly storage: StorageService,
    private readonly cloudinary: CloudinaryStorageProvider,
  ) {}

  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  async uploadImage(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Arquivo não enviado');
    }
    if (!this.cloudinary.isConfigured()) {
      throw new BadRequestException(
        'Upload indisponível: configure as credenciais do storage no .env',
      );
    }

    const result = await this.storage.upload(
      file.buffer,
      file.originalname,
      'images',
    );
    return { url: result.url, publicId: result.publicId };
  }
}
