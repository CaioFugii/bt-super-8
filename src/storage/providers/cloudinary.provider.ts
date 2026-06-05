import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { StorageProvider, UploadResult } from '../storage.interface';

@Injectable()
export class CloudinaryStorageProvider implements StorageProvider {
  private readonly logger = new Logger(CloudinaryStorageProvider.name);
  private configured = false;

  constructor(private readonly config: ConfigService) {
    const cloudName = config.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = config.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = config.get<string>('CLOUDINARY_API_SECRET');

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
      this.configured = true;
    } else {
      this.logger.warn(
        'Cloudinary não configurado — upload de imagens indisponível até definir credenciais no .env',
      );
    }
  }

  isConfigured(): boolean {
    return this.configured;
  }

  async upload(
    file: Buffer,
    filename: string,
    folder?: string,
  ): Promise<UploadResult> {
    if (!this.configured) {
      throw new Error(
        'Cloudinary não configurado. Defina CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY e CLOUDINARY_API_SECRET.',
      );
    }

    const baseFolder =
      folder ?? this.config.get<string>('CLOUDINARY_FOLDER') ?? 'bts8';

    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: baseFolder, public_id: filename.replace(/\.[^.]+$/, '') },
        (err, result) => {
          if (err || !result) {
            reject(err ?? new Error('Falha no upload Cloudinary'));
            return;
          }
          resolve({ url: result.secure_url, publicId: result.public_id });
        },
      );
      stream.end(file);
    });
  }

  async delete(publicId: string): Promise<void> {
    if (!this.configured) return;
    await cloudinary.uploader.destroy(publicId);
  }
}
