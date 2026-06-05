import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('revoked_public_tokens')
export class RevokedPublicToken {
  @PrimaryColumn()
  token: string;

  @CreateDateColumn({ name: 'revoked_at' })
  revokedAt: Date;
}
