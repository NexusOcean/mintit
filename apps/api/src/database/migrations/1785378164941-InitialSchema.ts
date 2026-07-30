import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1785378164941 implements MigrationInterface {
  name = 'InitialSchema1785378164941';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "email" character varying NOT NULL, "password" character varying NOT NULL, "totpSecret" character varying, "backupCodes" text array NOT NULL DEFAULT '{}', "lastUsedTotp" character varying, "scope" text array NOT NULL DEFAULT '{admin}', "isValid" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."invoices_chain_enum" AS ENUM('xmr', 'firo', 'pivx')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."invoices_asset_enum" AS ENUM('xmr', 'firo', 'pivx')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."invoices_status_enum" AS ENUM('pending', 'seen', 'confirmed', 'underpaid', 'expired', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TABLE "invoices" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "publicId" character varying NOT NULL DEFAULT gen_random_uuid(), "chain" "public"."invoices_chain_enum" NOT NULL, "asset" "public"."invoices_asset_enum" NOT NULL, "assetDecimals" integer NOT NULL, "address" character varying NOT NULL, "addressIndex" integer NOT NULL, "amountAtomic" character varying NOT NULL, "amountFiat" double precision NOT NULL, "fiatCurrency" character varying NOT NULL, "rate" double precision NOT NULL, "rateLockedAt" TIMESTAMP NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "status" "public"."invoices_status_enum" NOT NULL DEFAULT 'pending', "confirmationsRequired" integer NOT NULL, "confirmations" integer NOT NULL DEFAULT '0', "receivedAtomic" character varying NOT NULL DEFAULT '0', "firstSeenAt" TIMESTAMP, "paidAt" TIMESTAMP, "webhookUrl" character varying, "memo" character varying, "chainData" jsonb, "metadata" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_ef615089b3d172d2ba85715a682" UNIQUE ("publicId"), CONSTRAINT "PK_668cef7c22a427fd822cc1be3ce" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0a56750a48fd22fcef290088d6" ON "invoices" ("chain") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1020ac3a8b1b1d1be1aa9332ef" ON "invoices" ("asset") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_662baa9a9c12d0fe2dce257722" ON "invoices" ("address") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ac0f09364e3701d9ed35435288" ON "invoices" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6c896fc1e2519e9a9159616dd1" ON "invoices" ("chain", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a4f2448d7d3a927cab10f6beca" ON "invoices" ("chain", "address") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d71c67ec85d779559fee77b892" ON "invoices" ("createdAt") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payments_chain_enum" AS ENUM('xmr', 'firo', 'pivx')`,
    );
    await queryRunner.query(
      `CREATE TABLE "payments" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "chain" "public"."payments_chain_enum" NOT NULL, "invoiceId" uuid NOT NULL, "address" character varying NOT NULL, "addressIndex" integer NOT NULL, "txHash" character varying NOT NULL, "amountAtomic" character varying NOT NULL, "confirmations" integer NOT NULL DEFAULT '0', "unlocked" boolean NOT NULL DEFAULT false, "blockHeight" integer, "firstSeenAt" TIMESTAMP NOT NULL, "confirmedAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_93e6ceb701f2aa07c885e7e1e5" ON "payments" ("chain") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_43d19956aeab008b49e0804c14" ON "payments" ("invoiceId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c028f77064dbe52f905dfbfb49" ON "payments" ("addressIndex") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_7f3429abda0854aaf880a3c498" ON "payments" ("chain", "txHash", "addressIndex") `,
    );
    await queryRunner.query(
      `CREATE TABLE "scanner_locks" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" character varying NOT NULL, "owner" character varying NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_9fb126b78aa0d3eefab39bc14df" UNIQUE ("name"), CONSTRAINT "PK_f6b2302e9186bb29cfd2a3ebf94" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bd19542efe2e7166b97e3455db" ON "scanner_locks" ("expiresAt") `,
    );
    await queryRunner.query(
      `CREATE TABLE "settings" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "key" character varying NOT NULL, "confirmationDepth" integer, "invoiceDefaultExpirySec" integer, "invoiceMaxExpirySec" integer, "scannerLockTtlMs" integer, "syncedThresholdBlocks" integer, "rateCacheTtlMs" integer, "webhookMaxAttempts" integer, "webhookTimeoutMs" integer, "webhookDispatchIntervalMs" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_c8639b7626fa94ba8265628f214" UNIQUE ("key"), CONSTRAINT "PK_0669fe20e252eb692bf4d344975" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."webhook_deliveries_chain_enum" AS ENUM('xmr', 'firo', 'pivx')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."webhook_deliveries_event_enum" AS ENUM('invoice.seen', 'invoice.confirmed', 'invoice.underpaid', 'invoice.expired')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."webhook_deliveries_status_enum" AS ENUM('pending', 'delivered', 'failed', 'dead_lettered')`,
    );
    await queryRunner.query(
      `CREATE TABLE "webhook_deliveries" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "chain" "public"."webhook_deliveries_chain_enum" NOT NULL, "invoiceId" uuid NOT NULL, "url" character varying NOT NULL, "event" "public"."webhook_deliveries_event_enum" NOT NULL, "payload" jsonb NOT NULL, "attempts" integer NOT NULL DEFAULT '0', "nextAttemptAt" TIMESTAMP NOT NULL, "status" "public"."webhook_deliveries_status_enum" NOT NULL DEFAULT 'pending', "lastResponseCode" integer, "lastError" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_535dd409947fb6d8fc6dfc0112a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1fc56bd783a0daae17cf999edd" ON "webhook_deliveries" ("chain") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_81c86d75b3440577c5266399d4" ON "webhook_deliveries" ("invoiceId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c13822a1a0d15996f93f3f9bcd" ON "webhook_deliveries" ("nextAttemptAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_47a340074173ac16958ea6744d" ON "webhook_deliveries" ("status") `,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_43d19956aeab008b49e0804c145" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "FK_81c86d75b3440577c5266399d4b" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "webhook_deliveries" DROP CONSTRAINT "FK_81c86d75b3440577c5266399d4b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "FK_43d19956aeab008b49e0804c145"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_47a340074173ac16958ea6744d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c13822a1a0d15996f93f3f9bcd"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_81c86d75b3440577c5266399d4"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1fc56bd783a0daae17cf999edd"`,
    );
    await queryRunner.query(`DROP TABLE "webhook_deliveries"`);
    await queryRunner.query(
      `DROP TYPE "public"."webhook_deliveries_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."webhook_deliveries_event_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."webhook_deliveries_chain_enum"`,
    );
    await queryRunner.query(`DROP TABLE "settings"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_bd19542efe2e7166b97e3455db"`,
    );
    await queryRunner.query(`DROP TABLE "scanner_locks"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7f3429abda0854aaf880a3c498"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c028f77064dbe52f905dfbfb49"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_43d19956aeab008b49e0804c14"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_93e6ceb701f2aa07c885e7e1e5"`,
    );
    await queryRunner.query(`DROP TABLE "payments"`);
    await queryRunner.query(`DROP TYPE "public"."payments_chain_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d71c67ec85d779559fee77b892"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a4f2448d7d3a927cab10f6beca"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6c896fc1e2519e9a9159616dd1"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ac0f09364e3701d9ed35435288"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_662baa9a9c12d0fe2dce257722"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1020ac3a8b1b1d1be1aa9332ef"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0a56750a48fd22fcef290088d6"`,
    );
    await queryRunner.query(`DROP TABLE "invoices"`);
    await queryRunner.query(`DROP TYPE "public"."invoices_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."invoices_asset_enum"`);
    await queryRunner.query(`DROP TYPE "public"."invoices_chain_enum"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
