import { Inject, Injectable } from '@nestjs/common';
import { STORAGE_PROVIDER, type StorageProvider } from './storage.interface';

@Injectable()
export class StorageService {
  constructor(
    @Inject(STORAGE_PROVIDER) private readonly provider: StorageProvider,
  ) {}

  upload(file: Buffer, filename: string, folder?: string) {
    return this.provider.upload(file, filename, folder);
  }

  delete(publicId: string) {
    return this.provider.delete(publicId);
  }
}
