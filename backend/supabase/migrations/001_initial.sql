-- ============================================================
-- BizKPI — Initial Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Enums ────────────────────────────────────────────────────────────────────
CREATE TYPE period_type_enum AS ENUM ('day', 'week', 'month', 'quarter', 'year');

-- ── user_profiles ─────────────────────────────────────────────────────────────
-- Extends Supabase auth.users without duplicating auth logic
CREATE TABLE public.user_profiles (
    id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    business_name   TEXT NOT NULL,
    business_sector TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup (optional trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, business_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'business_name', 'Mi negocio'));
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── periods ───────────────────────────────────────────────────────────────────
CREATE TABLE public.periods (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    period_type period_type_enum NOT NULL,
    start_date  DATE NOT NULL,
    end_date    DATE NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_dates CHECK (end_date >= start_date)
);

CREATE INDEX idx_periods_user_id ON public.periods(user_id);

-- ── business_data ─────────────────────────────────────────────────────────────
CREATE TABLE public.business_data (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    period_id   UUID NOT NULL REFERENCES public.periods(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Required
    total_revenue   NUMERIC(15,2) NOT NULL CHECK (total_revenue >= 0),
    total_expenses  NUMERIC(15,2) NOT NULL CHECK (total_expenses >= 0),
    num_sales       INTEGER       NOT NULL CHECK (num_sales > 0),
    num_customers   INTEGER       NOT NULL CHECK (num_customers > 0),

    -- Optional — enrich AI analysis
    cost_of_goods_sold  NUMERIC(15,2),
    marketing_expenses  NUMERIC(15,2),
    refunds             NUMERIC(15,2),
    new_customers       INTEGER,
    returning_customers INTEGER,
    top_product_name    TEXT,
    top_product_revenue NUMERIC(15,2),
    notes               TEXT,

    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (period_id)   -- one record per period
);

CREATE INDEX idx_business_data_user_id ON public.business_data(user_id);

-- ── kpis ──────────────────────────────────────────────────────────────────────
CREATE TABLE public.kpis (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    period_id   UUID NOT NULL REFERENCES public.periods(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    revenue                 NUMERIC(15,2)  NOT NULL,
    expenses                NUMERIC(15,2)  NOT NULL,
    net_profit              NUMERIC(15,2)  NOT NULL,
    profit_margin           NUMERIC(8,4)   NOT NULL,   -- percentage
    num_sales               INTEGER        NOT NULL,
    num_customers           INTEGER        NOT NULL,
    avg_ticket              NUMERIC(15,2)  NOT NULL,
    gross_margin            NUMERIC(8,4),              -- null if no COGS
    customer_acquisition_rate NUMERIC(8,4),
    returning_customer_rate   NUMERIC(8,4),

    calculated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (period_id)
);

-- ── ai_recommendations ────────────────────────────────────────────────────────
CREATE TABLE public.ai_recommendations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    period_id       UUID NOT NULL REFERENCES public.periods(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recommendations JSONB       NOT NULL,
    model_used      TEXT        NOT NULL DEFAULT 'openai/gpt-4o-mini',
    generated_at    TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (period_id)
);

-- ── Row Level Security ────────────────────────────────────────────────────────
ALTER TABLE public.user_profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.periods            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_data      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpis               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;

-- Policies: each user sees only their own rows
CREATE POLICY "own_profile"      ON public.user_profiles      FOR ALL USING (auth.uid() = id);
CREATE POLICY "own_periods"      ON public.periods            FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_data"         ON public.business_data      FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_kpis"         ON public.kpis               FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_reco"         ON public.ai_recommendations FOR ALL USING (auth.uid() = user_id);
