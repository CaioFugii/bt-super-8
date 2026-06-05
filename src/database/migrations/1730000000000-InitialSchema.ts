import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1730000000000 implements MigrationInterface {
  name = 'InitialSchema1730000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(
      `CREATE TYPE "public"."matches_status_enum" AS ENUM('PENDING', 'FINISHED', 'WALKOVER', 'CANCELLED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."matches_winner_team_enum" AS ENUM('TEAM_A', 'TEAM_B')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."participants_gender_enum" AS ENUM('MALE', 'FEMALE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."participants_status_enum" AS ENUM('ACTIVE', 'WITHDRAWN')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tournaments_forfeit_challenge_mode_enum" AS ENUM('RANDOM', 'CUSTOM')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tournaments_format_enum" AS ENUM('SUPER_8', 'SUPER_8_MIXED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tournaments_status_enum" AS ENUM('DRAFT', 'IN_PROGRESS', 'FINISHED', 'CANCELLED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "organizers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "email" character varying NOT NULL, "password_hash" character varying NOT NULL, "instagram_handle" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_cd09a9a73ad3bf8e3c0a22dfb49" PRIMARY KEY ("id"), CONSTRAINT "UQ_8397cb03df8e578b59c591d9147" UNIQUE ("email"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "tournaments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organizer_id" uuid NOT NULL, "name" character varying NOT NULL, "description" text, "date" date NOT NULL, "location" character varying, "logo_url" character varying, "format" "public"."tournaments_format_enum" NOT NULL DEFAULT 'SUPER_8', "status" "public"."tournaments_status_enum" NOT NULL DEFAULT 'DRAFT', "score_limit" smallint NOT NULL DEFAULT '6', "has_tie_break" boolean NOT NULL DEFAULT false, "walkover_score_winner" integer NOT NULL DEFAULT '6', "walkover_score_loser" integer NOT NULL DEFAULT '0', "court_count" smallint NOT NULL DEFAULT '1', "enable_forfeit_challenge" boolean NOT NULL DEFAULT false, "forfeit_challenge_mode" "public"."tournaments_forfeit_challenge_mode_enum", "custom_challenges" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "finished_at" TIMESTAMP WITH TIME ZONE, "cancelled_at" TIMESTAMP WITH TIME ZONE, "public_token" character varying(32), "public_token_expires_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_6d5d129da7a80cf99e8ad4833a9" PRIMARY KEY ("id"), CONSTRAINT "UQ_83429a7ece3dd81f654e7ac1779" UNIQUE ("public_token"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "participants" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tournament_id" uuid NOT NULL, "name" character varying NOT NULL, "gender" "public"."participants_gender_enum", "phone" character varying, "instagram" character varying, "photo_url" character varying, "notes" text, "status" "public"."participants_status_enum" NOT NULL DEFAULT 'ACTIVE', "withdrawn_at" TIMESTAMP WITH TIME ZONE, "withdraw_reason" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1cda06c31eec1c95b3365a0283f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "matches" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tournament_id" uuid NOT NULL, "round" smallint NOT NULL, "match_number" smallint NOT NULL, "court_number" smallint, "team_a_player1_id" uuid NOT NULL, "team_a_player2_id" uuid NOT NULL, "team_b_player1_id" uuid NOT NULL, "team_b_player2_id" uuid NOT NULL, "team_a_score" smallint, "team_b_score" smallint, "winner_team" "public"."matches_winner_team_enum", "status" "public"."matches_status_enum" NOT NULL DEFAULT 'PENDING', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_8a22c7b2e0828988d51256117f4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "tournament_challenges" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tournament_id" uuid NOT NULL, "participant_id" uuid NOT NULL, "challenge_text" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_062ba2ef0766667fa46eca3a5e4" PRIMARY KEY ("id"), CONSTRAINT "UQ_32cb43199d55d643b1ac405312b" UNIQUE ("tournament_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "revoked_public_tokens" ("token" character varying NOT NULL, "revoked_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5213b084eac8fc890178a53669b" PRIMARY KEY ("token"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "tournaments" ADD CONSTRAINT "FK_98426b7ee64c5263e68f368bc72" FOREIGN KEY ("organizer_id") REFERENCES "organizers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "participants" ADD CONSTRAINT "FK_65dd65a1863bd69b0d4510a7f7f" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "matches" ADD CONSTRAINT "FK_d0fb132a9b17b5801b916662147" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "matches" ADD CONSTRAINT "FK_62ebb7b100d27876ae934606576" FOREIGN KEY ("team_a_player1_id") REFERENCES "participants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "matches" ADD CONSTRAINT "FK_76716b82ec49bd119106d8d5bd8" FOREIGN KEY ("team_a_player2_id") REFERENCES "participants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "matches" ADD CONSTRAINT "FK_15410fb09a6cdca90b9970d6719" FOREIGN KEY ("team_b_player1_id") REFERENCES "participants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "matches" ADD CONSTRAINT "FK_6b3ba39ee6c5b685a3617c8fff7" FOREIGN KEY ("team_b_player2_id") REFERENCES "participants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tournament_challenges" ADD CONSTRAINT "FK_32cb43199d55d643b1ac405312b" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tournament_challenges" ADD CONSTRAINT "FK_e238f3401e12e3d473d9244530a" FOREIGN KEY ("participant_id") REFERENCES "participants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tournament_challenges" DROP CONSTRAINT "FK_e238f3401e12e3d473d9244530a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tournament_challenges" DROP CONSTRAINT "FK_32cb43199d55d643b1ac405312b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "matches" DROP CONSTRAINT "FK_6b3ba39ee6c5b685a3617c8fff7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "matches" DROP CONSTRAINT "FK_15410fb09a6cdca90b9970d6719"`,
    );
    await queryRunner.query(
      `ALTER TABLE "matches" DROP CONSTRAINT "FK_76716b82ec49bd119106d8d5bd8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "matches" DROP CONSTRAINT "FK_62ebb7b100d27876ae934606576"`,
    );
    await queryRunner.query(
      `ALTER TABLE "matches" DROP CONSTRAINT "FK_d0fb132a9b17b5801b916662147"`,
    );
    await queryRunner.query(
      `ALTER TABLE "participants" DROP CONSTRAINT "FK_65dd65a1863bd69b0d4510a7f7f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tournaments" DROP CONSTRAINT "FK_98426b7ee64c5263e68f368bc72"`,
    );
    await queryRunner.query(`DROP TABLE "revoked_public_tokens"`);
    await queryRunner.query(`DROP TABLE "tournament_challenges"`);
    await queryRunner.query(`DROP TABLE "matches"`);
    await queryRunner.query(`DROP TABLE "participants"`);
    await queryRunner.query(`DROP TABLE "tournaments"`);
    await queryRunner.query(`DROP TABLE "organizers"`);
    await queryRunner.query(`DROP TYPE "public"."tournaments_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."tournaments_format_enum"`);
    await queryRunner.query(
      `DROP TYPE "public"."tournaments_forfeit_challenge_mode_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."participants_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."participants_gender_enum"`);
    await queryRunner.query(`DROP TYPE "public"."matches_winner_team_enum"`);
    await queryRunner.query(`DROP TYPE "public"."matches_status_enum"`);
  }
}
