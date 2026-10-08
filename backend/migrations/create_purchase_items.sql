-- =====================================================================
-- STREAKO - Purchase Items Table Schema & Security Policies
-- Run this migration in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/tdnkoixpqmmakliiqfqe/sql
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.purchase_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    item_name TEXT NOT NULL,
    location_type TEXT NOT NULL DEFAULT 'specific', -- 'specific' or 'type'
    place_name TEXT,
    place_type TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    address TEXT,
    date_type TEXT NOT NULL DEFAULT 'specific', -- 'specific' or 'day_of_week'
    specific_date DATE,
    day_of_week TEXT, -- 'monday', 'tuesday', etc.
    time_type TEXT NOT NULL DEFAULT 'anytime', -- 'specific' or 'anytime'
    specific_time TIME,
    repeat_type TEXT NOT NULL DEFAULT 'once', -- 'once' or 'weekly'
    status TEXT NOT NULL DEFAULT 'Pending', -- 'Pending', 'Reminder active', 'Done'
    reminder_count INTEGER NOT NULL DEFAULT 0,
    last_reminded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;

-- Allow service_role key full access and authenticated users access to their rows
DROP POLICY IF EXISTS "Service role full access on purchase_items" ON public.purchase_items;
CREATE POLICY "Service role full access on purchase_items"
    ON public.purchase_items
    FOR ALL
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can manage own purchase items" ON public.purchase_items;
CREATE POLICY "Users can manage own purchase items"
    ON public.purchase_items
    FOR ALL
    USING (auth.uid() = user_id OR user_id IS NULL)
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_purchase_items_user_id ON public.purchase_items(user_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_status ON public.purchase_items(status);
CREATE INDEX IF NOT EXISTS idx_purchase_items_created_at ON public.purchase_items(created_at DESC);
