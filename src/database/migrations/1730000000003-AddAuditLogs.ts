import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuditLogs1730000000003 implements MigrationInterface {
  name = 'AddAuditLogs1730000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "action" character varying(64) NOT NULL,
        "user_id" uuid,
        "entity_type" character varying(32) NOT NULL,
        "entity_id" character varying(64) NOT NULL,
        "metadata" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_logs" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_action" ON "audit_logs" ("action")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_entity" ON "audit_logs" ("entity_type", "entity_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_user_id" ON "audit_logs" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_created_at" ON "audit_logs" ("created_at")`,
    );

    await queryRunner.query(`
      INSERT INTO "audit_logs" ("action", "user_id", "entity_type", "entity_id", "created_at")
      SELECT
        "action"::text,
        "admin_user_id",
        'ORGANIZER',
        "target_user_id"::text,
        "created_at"
      FROM "admin_audit_logs"
    `);

    await queryRunner.query(`DROP INDEX "public"."IDX_admin_audit_logs_target_user_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_admin_audit_logs_admin_user_id"`);
    await queryRunner.query(`DROP TABLE "admin_audit_logs"`);
    await queryRunner.query(`DROP TYPE "public"."admin_audit_logs_action_enum"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."admin_audit_logs_action_enum" AS ENUM('CREATE_ORGANIZER', 'UPDATE_ORGANIZER', 'ACTIVATE_ORGANIZER', 'DEACTIVATE_ORGANIZER', 'RESET_PASSWORD')`,
    );
    await queryRunner.query(`
      CREATE TABLE "admin_audit_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "admin_user_id" uuid NOT NULL,
        "action" "public"."admin_audit_logs_action_enum" NOT NULL,
        "target_user_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_admin_audit_logs" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      INSERT INTO "admin_audit_logs" ("admin_user_id", "action", "target_user_id", "created_at")
      SELECT
        "user_id",
        "action"::"public"."admin_audit_logs_action_enum",
        "entity_id"::uuid,
        "created_at"
      FROM "audit_logs"
      WHERE "entity_type" = 'ORGANIZER'
        AND "action" IN (
          'CREATE_ORGANIZER',
          'UPDATE_ORGANIZER',
          'ACTIVATE_ORGANIZER',
          'DEACTIVATE_ORGANIZER',
          'RESET_PASSWORD'
        )
    `);
    await queryRunner.query(`DROP INDEX "public"."IDX_audit_logs_created_at"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_audit_logs_user_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_audit_logs_entity"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_audit_logs_action"`);
    await queryRunner.query(`DROP TABLE "audit_logs"`);
  }
}
