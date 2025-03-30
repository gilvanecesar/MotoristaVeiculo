CREATE TABLE "clients" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"cnpj" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"whatsapp" text,
	"client_type" text NOT NULL,
	"street" text NOT NULL,
	"number" text NOT NULL,
	"complement" text,
	"neighborhood" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"zipcode" text NOT NULL,
	"contact_name" text,
	"contact_phone" text,
	"notes" text,
	"logo_url" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "clients_cnpj_unique" UNIQUE("cnpj")
);
--> statement-breakpoint
CREATE TABLE "drivers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"cpf" text NOT NULL,
	"phone" text NOT NULL,
	"whatsapp" text,
	"birthdate" date NOT NULL,
	"cnh" text NOT NULL,
	"cnh_category" text NOT NULL,
	"cnh_expiration" date NOT NULL,
	"cnh_issue_date" date NOT NULL,
	"street" text NOT NULL,
	"number" text NOT NULL,
	"complement" text,
	"neighborhood" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"zipcode" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "drivers_cpf_unique" UNIQUE("cpf"),
	CONSTRAINT "drivers_cnh_unique" UNIQUE("cnh")
);
--> statement-breakpoint
CREATE TABLE "freight_destinations" (
	"id" serial PRIMARY KEY NOT NULL,
	"freight_id" integer NOT NULL,
	"destination" text NOT NULL,
	"destination_state" text NOT NULL,
	"order" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "freights" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer,
	"origin" text NOT NULL,
	"origin_state" text NOT NULL,
	"destination" text NOT NULL,
	"destination_state" text NOT NULL,
	"cargo_type" text NOT NULL,
	"needs_tarp" text NOT NULL,
	"product_type" text NOT NULL,
	"cargo_weight" numeric NOT NULL,
	"vehicle_type" text NOT NULL,
	"body_type" text NOT NULL,
	"freight_value" numeric NOT NULL,
	"toll_option" text NOT NULL,
	"payment_method" text NOT NULL,
	"observations" text,
	"status" text DEFAULT 'aberto' NOT NULL,
	"contact_name" text NOT NULL,
	"contact_phone" text NOT NULL,
	"has_multiple_destinations" boolean DEFAULT false,
	"expiration_date" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password" text,
	"name" text NOT NULL,
	"profile_type" text NOT NULL,
	"auth_provider" text DEFAULT 'local' NOT NULL,
	"provider_id" text,
	"avatar_url" text,
	"is_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_login" timestamp,
	"subscription_active" boolean DEFAULT false NOT NULL,
	"subscription_type" text,
	"subscription_expires_at" timestamp,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"driver_id" integer,
	"client_id" integer,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" serial PRIMARY KEY NOT NULL,
	"driver_id" integer NOT NULL,
	"plate" text NOT NULL,
	"brand" text NOT NULL,
	"model" text NOT NULL,
	"year" integer NOT NULL,
	"color" text NOT NULL,
	"renavam" text,
	"vehicle_type" text NOT NULL,
	"body_type" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "vehicles_plate_unique" UNIQUE("plate")
);
--> statement-breakpoint
ALTER TABLE "freight_destinations" ADD CONSTRAINT "freight_destinations_freight_id_freights_id_fk" FOREIGN KEY ("freight_id") REFERENCES "public"."freights"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "freights" ADD CONSTRAINT "freights_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE no action ON UPDATE no action;