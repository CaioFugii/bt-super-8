import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { STORAGE_PROVIDER } from './storage.interface';
import { CloudinaryStorageProvider } from './providers/cloudinary.provider';
import { StorageService } from './storage.service';

@Module({
  imports: [ConfigModule],
  providers: [
    CloudinaryStorageProvider,
    {
      provide: STORAGE_PROVIDER,
      useFactory: (config: ConfigService, cloudinary: CloudinaryStorageProvider) => {
        const provider = config.get<string>('STORAGE_PROVIDER', 'cloudinary');
        if (provider === 'cloudinary') {
          return cloudinary;
        }
        throw new Error(`Storage provider "${provider}" não suportado`);
      },
      inject: [ConfigService, CloudinaryStorageProvider],
    },
    StorageService,
  ],
  exports: [StorageService, CloudinaryStorageProvider],
})
export class StorageModule {}
