CREATE TABLE "card_set" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_public" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "card_set_item" (
	"id" text PRIMARY KEY NOT NULL,
	"set_id" text NOT NULL,
	"card_id" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "card_set_item_set_card_unique" UNIQUE("set_id","card_id")
);
--> statement-breakpoint
ALTER TABLE "card_set" ADD CONSTRAINT "card_set_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_set_item" ADD CONSTRAINT "card_set_item_set_id_card_set_id_fk" FOREIGN KEY ("set_id") REFERENCES "public"."card_set"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_set_item" ADD CONSTRAINT "card_set_item_card_id_card_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."card"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "card_set_user_id_idx" ON "card_set" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "card_set_item_set_id_idx" ON "card_set_item" USING btree ("set_id");
