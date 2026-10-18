-- Pre-repo connections cannot be routed (no repo to match), so they are dropped; reconnect via the repo picker.
DELETE FROM "source_connections";--> statement-breakpoint
ALTER TABLE "source_connections" DROP CONSTRAINT "source_connections_type_external_unique";--> statement-breakpoint
ALTER TABLE "source_connections" ADD COLUMN "repo_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "source_connections" ADD COLUMN "repo_full_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "source_connections" ADD CONSTRAINT "source_connections_type_external_repo_unique" UNIQUE("source_type","external_id","repo_id");