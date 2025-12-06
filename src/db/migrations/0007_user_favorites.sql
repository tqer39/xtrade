CREATE TABLE IF NOT EXISTS "user_favorite_card" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"card_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_favorite_user" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"favorite_user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_favorite_card_user_id_idx" ON "user_favorite_card" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_favorite_card_card_id_idx" ON "user_favorite_card" USING btree ("card_id");
--> statement-breakpoint
ALTER TABLE "user_favorite_card" ADD CONSTRAINT "user_favorite_card_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "user_favorite_card" ADD CONSTRAINT "user_favorite_card_card_id_card_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."card"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_favorite_user_user_id_idx" ON "user_favorite_user" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_favorite_user_favorite_user_id_idx" ON "user_favorite_user" USING btree ("favorite_user_id");
--> statement-breakpoint
ALTER TABLE "user_favorite_user" ADD CONSTRAINT "user_favorite_user_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "user_favorite_user" ADD CONSTRAINT "user_favorite_user_favorite_user_id_user_id_fk" FOREIGN KEY ("favorite_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_favorite_card_user_card_unique" ON "user_favorite_card" USING btree ("user_id","card_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_favorite_user_unique" ON "user_favorite_user" USING btree ("user_id","favorite_user_id");
