export interface UploadResult {
  url: string;
  publicId?: string;
}

export interface StorageProvider {
  upload(
    file: Buffer,
    filename: string,
    folder?: string,
  ): Promise<UploadResult>;
  delete(publicId: string): Promise<void>;
}

export const STORAGE_PROVIDER = 'STORAGE_PROVIDER';
