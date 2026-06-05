import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTournamentStatusAudit1730000000001 implements MigrationInterface {
  name = 'AddTournamentStatusAudit1730000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "tournament_status_audits" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tournament_id" uuid NOT NULL,
        "from_status" "public"."tournaments_status_enum" NOT NULL,
        "to_status" "public"."tournaments_status_enum" NOT NULL,
        "changed_by_user_id" uuid NOT NULL,
        "changed_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tournament_status_audits" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "tournament_status_audits"
      ADD CONSTRAINT "FK_tournament_status_audits_tournament"
      FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "tournament_status_audits"
      ADD CONSTRAINT "FK_tournament_status_audits_organizer"
      FOREIGN KEY ("changed_by_user_id") REFERENCES "organizers"("id") ON DELETE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tournament_status_audits" DROP CONSTRAINT "FK_tournament_status_audits_organizer"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tournament_status_audits" DROP CONSTRAINT "FK_tournament_status_audits_tournament"`,
    );
    await queryRunner.query(`DROP TABLE "tournament_status_audits"`);
  }
}
