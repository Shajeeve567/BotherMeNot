CREATE TABLE "signals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" text NOT NULL,
	"external_id" text NOT NULL,
	"type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"raw_payload" jsonb NOT NULL,
	"status" text DEFAULT 'received' NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "signals_source_external_id_unique" UNIQUE("source","external_id")
);
