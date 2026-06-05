import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAdminPlatform1730000000002 implements MigrationInterface {
  name = 'AddAdminPlatform1730000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."organizers_role_enum" AS ENUM('ORGANIZER', 'PLATFORM_ADMIN')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."organizers_status_enum" AS ENUM('ACTIVE', 'INACTIVE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."admin_audit_logs_action_enum" AS ENUM('CREATE_ORGANIZER', 'UPDATE_ORGANIZER', 'ACTIVATE_ORGANIZER', 'DEACTIVATE_ORGANIZER', 'RESET_PASSWORD')`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizers" ADD "role" "public"."organizers_role_enum" NOT NULL DEFAULT 'ORGANIZER'`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizers" ADD "status" "public"."organizers_status_enum" NOT NULL DEFAULT 'ACTIVE'`,
    );
    await queryRunner.query(
      `CREATE TABLE "admin_audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "admin_user_id" uuid NOT NULL, "action" "public"."admin_audit_logs_action_enum" NOT NULL, "target_user_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_admin_audit_logs" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_admin_audit_logs_admin_user_id" ON "admin_audit_logs" ("admin_user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_admin_audit_logs_target_user_id" ON "admin_audit_logs" ("target_user_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_admin_audit_logs_target_user_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_admin_audit_logs_admin_user_id"`);
    await queryRunner.query(`DROP TABLE "admin_audit_logs"`);
    await queryRunner.query(`ALTER TABLE "organizers" DROP COLUMN "status"`);
    await queryRunner.query(`ALTER TABLE "organizers" DROP COLUMN "role"`);
    await queryRunner.query(`DROP TYPE "public"."admin_audit_logs_action_enum"`);
    await queryRunner.query(`DROP TYPE "public"."organizers_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."organizers_role_enum"`);
  }
}
