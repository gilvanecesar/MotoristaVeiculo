-- Criação da tabela de assinaturas
CREATE TABLE IF NOT EXISTS "subscriptions" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id"),
  "client_id" INTEGER REFERENCES "clients"("id"),
  "stripe_subscription_id" TEXT UNIQUE,
  "stripe_price_id" TEXT,
  "stripe_customer_id" TEXT,
  "status" TEXT NOT NULL,
  "plan_type" TEXT NOT NULL,
  "current_period_start" TIMESTAMP NOT NULL,
  "current_period_end" TIMESTAMP NOT NULL,
  "cancel_at_period_end" BOOLEAN DEFAULT FALSE,
  "canceled_at" TIMESTAMP,
  "ended_at" TIMESTAMP,
  "metadata" JSONB,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criação da tabela de faturas
CREATE TABLE IF NOT EXISTS "invoices" (
  "id" SERIAL PRIMARY KEY,
  "subscription_id" INTEGER REFERENCES "subscriptions"("id"),
  "user_id" INTEGER NOT NULL REFERENCES "users"("id"),
  "client_id" INTEGER REFERENCES "clients"("id"),
  "stripe_invoice_id" TEXT UNIQUE,
  "status" TEXT NOT NULL,
  "invoice_number" TEXT,
  "description" TEXT,
  "amount" DECIMAL NOT NULL,
  "amount_paid" DECIMAL,
  "amount_due" DECIMAL,
  "currency" TEXT DEFAULT 'brl',
  "invoice_date" TIMESTAMP,
  "due_date" TIMESTAMP,
  "paid_at" TIMESTAMP,
  "receipt_url" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criação da tabela de pagamentos
CREATE TABLE IF NOT EXISTS "payments" (
  "id" SERIAL PRIMARY KEY,
  "invoice_id" INTEGER REFERENCES "invoices"("id"),
  "user_id" INTEGER NOT NULL REFERENCES "users"("id"),
  "client_id" INTEGER REFERENCES "clients"("id"),
  "stripe_payment_intent_id" TEXT UNIQUE,
  "stripe_payment_method_id" TEXT,
  "amount" DECIMAL NOT NULL,
  "currency" TEXT DEFAULT 'brl',
  "status" TEXT NOT NULL,
  "payment_type" TEXT,
  "payment_method" TEXT,
  "last4" TEXT,
  "expiry_month" INTEGER,
  "expiry_year" INTEGER,
  "card_brand" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);