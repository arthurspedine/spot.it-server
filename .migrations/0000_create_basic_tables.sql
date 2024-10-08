CREATE TABLE IF NOT EXISTS "encounters" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"wally_id" text NOT NULL,
	"occured_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"profile_picture" text NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "wallies" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"profile_picture" text NOT NULL,
	"created_at" timestamp,
	"role_id" text NOT NULL,
	CONSTRAINT "wallies_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "wally_roles" (
	"id" text PRIMARY KEY NOT NULL,
	"role" text NOT NULL,
	"score_multiplier" numeric DEFAULT '1' NOT NULL,
	CONSTRAINT "wally_roles_role_unique" UNIQUE("role")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "encounters" ADD CONSTRAINT "encounters_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "encounters" ADD CONSTRAINT "encounters_wally_id_wallies_id_fk" FOREIGN KEY ("wally_id") REFERENCES "public"."wallies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wallies" ADD CONSTRAINT "wallies_role_id_wally_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."wally_roles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
