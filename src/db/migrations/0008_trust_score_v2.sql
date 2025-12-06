CREATE TABLE "trade_review" (
	"id" text PRIMARY KEY NOT NULL,
	"trade_id" text NOT NULL,
	"reviewer_user_id" text NOT NULL,
	"reviewee_user_id" text NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"is_public" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "trade_review_unique" UNIQUE("trade_id","reviewer_user_id")
);
--> statement-breakpoint
CREATE TABLE "user_review_stats" (
	"user_id" text PRIMARY KEY NOT NULL,
	"review_count" integer DEFAULT 0 NOT NULL,
	"avg_rating" integer,
	"positive_count" integer DEFAULT 0 NOT NULL,
	"negative_count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_trade_stats" (
	"user_id" text PRIMARY KEY NOT NULL,
	"completed_count" integer DEFAULT 0 NOT NULL,
	"canceled_count" integer DEFAULT 0 NOT NULL,
	"disputed_count" integer DEFAULT 0 NOT NULL,
	"avg_response_time_hours" integer,
	"first_trade_at" timestamp,
	"last_trade_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "x_profile_score" integer;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "behavior_score" integer;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "review_score" integer;--> statement-breakpoint
ALTER TABLE "trade_review" ADD CONSTRAINT "trade_review_trade_id_trade_id_fk" FOREIGN KEY ("trade_id") REFERENCES "public"."trade"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade_review" ADD CONSTRAINT "trade_review_reviewer_user_id_user_id_fk" FOREIGN KEY ("reviewer_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade_review" ADD CONSTRAINT "trade_review_reviewee_user_id_user_id_fk" FOREIGN KEY ("reviewee_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_review_stats" ADD CONSTRAINT "user_review_stats_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_trade_stats" ADD CONSTRAINT "user_trade_stats_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "trade_review_trade_id_idx" ON "trade_review" USING btree ("trade_id");--> statement-breakpoint
CREATE INDEX "trade_review_reviewer_idx" ON "trade_review" USING btree ("reviewer_user_id");--> statement-breakpoint
CREATE INDEX "trade_review_reviewee_idx" ON "trade_review" USING btree ("reviewee_user_id");--> statement-breakpoint
CREATE INDEX "trade_review_rating_idx" ON "trade_review" USING btree ("rating");
