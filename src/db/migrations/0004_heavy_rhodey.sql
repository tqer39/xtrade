CREATE TABLE "card" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"rarity" text,
	"image_url" text,
	"created_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trade" (
	"id" text PRIMARY KEY NOT NULL,
	"room_slug" text NOT NULL,
	"initiator_user_id" text NOT NULL,
	"responder_user_id" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"proposed_expired_at" timestamp,
	"agreed_expired_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "trade_room_slug_unique" UNIQUE("room_slug")
);
--> statement-breakpoint
CREATE TABLE "trade_history" (
	"id" text PRIMARY KEY NOT NULL,
	"trade_id" text NOT NULL,
	"from_status" text,
	"to_status" text NOT NULL,
	"changed_by_user_id" text,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trade_item" (
	"id" text PRIMARY KEY NOT NULL,
	"trade_id" text NOT NULL,
	"offered_by_user_id" text NOT NULL,
	"card_id" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_have_card" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"card_id" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_have_card_user_card_unique" UNIQUE("user_id","card_id")
);
--> statement-breakpoint
CREATE TABLE "user_trust_job" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"started_at" timestamp,
	"finished_at" timestamp,
	"error_message" text
);
--> statement-breakpoint
CREATE TABLE "user_want_card" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"card_id" text NOT NULL,
	"priority" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_want_card_user_card_unique" UNIQUE("user_id","card_id")
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "trust_score" integer;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "trust_grade" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "trust_score_updated_at" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "trust_score_refresh_requested_at" timestamp;--> statement-breakpoint
ALTER TABLE "card" ADD CONSTRAINT "card_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade" ADD CONSTRAINT "trade_initiator_user_id_user_id_fk" FOREIGN KEY ("initiator_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade" ADD CONSTRAINT "trade_responder_user_id_user_id_fk" FOREIGN KEY ("responder_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade_history" ADD CONSTRAINT "trade_history_trade_id_trade_id_fk" FOREIGN KEY ("trade_id") REFERENCES "public"."trade"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade_history" ADD CONSTRAINT "trade_history_changed_by_user_id_user_id_fk" FOREIGN KEY ("changed_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade_item" ADD CONSTRAINT "trade_item_trade_id_trade_id_fk" FOREIGN KEY ("trade_id") REFERENCES "public"."trade"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade_item" ADD CONSTRAINT "trade_item_offered_by_user_id_user_id_fk" FOREIGN KEY ("offered_by_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade_item" ADD CONSTRAINT "trade_item_card_id_card_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."card"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_have_card" ADD CONSTRAINT "user_have_card_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_have_card" ADD CONSTRAINT "user_have_card_card_id_card_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."card"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_trust_job" ADD CONSTRAINT "user_trust_job_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_want_card" ADD CONSTRAINT "user_want_card_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_want_card" ADD CONSTRAINT "user_want_card_card_id_card_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."card"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "card_name_idx" ON "card" USING btree ("name");--> statement-breakpoint
CREATE INDEX "card_category_idx" ON "card" USING btree ("category");--> statement-breakpoint
CREATE INDEX "trade_room_slug_idx" ON "trade" USING btree ("room_slug");--> statement-breakpoint
CREATE INDEX "trade_initiator_idx" ON "trade" USING btree ("initiator_user_id");--> statement-breakpoint
CREATE INDEX "trade_responder_idx" ON "trade" USING btree ("responder_user_id");--> statement-breakpoint
CREATE INDEX "trade_status_idx" ON "trade" USING btree ("status");--> statement-breakpoint
CREATE INDEX "trade_history_trade_id_idx" ON "trade_history" USING btree ("trade_id");--> statement-breakpoint
CREATE INDEX "trade_item_trade_id_idx" ON "trade_item" USING btree ("trade_id");--> statement-breakpoint
CREATE INDEX "trade_item_offered_by_idx" ON "trade_item" USING btree ("offered_by_user_id");--> statement-breakpoint
CREATE INDEX "user_have_card_user_id_idx" ON "user_have_card" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_have_card_card_id_idx" ON "user_have_card" USING btree ("card_id");--> statement-breakpoint
CREATE INDEX "user_trust_job_user_id_idx" ON "user_trust_job" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_trust_job_status_idx" ON "user_trust_job" USING btree ("status");--> statement-breakpoint
CREATE INDEX "user_trust_job_created_at_idx" ON "user_trust_job" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "user_want_card_user_id_idx" ON "user_want_card" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_want_card_card_id_idx" ON "user_want_card" USING btree ("card_id");
