/**
 * Supabase / PostgreSQL Schema Definition with Row Level Security (RLS)
 * Synchronized with LeadLens Cart Abandonment Tracker
 */

export const SUPABASE_SQL_SCHEMA = `-- ============================================================================
-- LEADLENS SUPABASE CART ABANDONMENT SCHEMA & RLS
-- PostgreSQL 14+
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE: Registered Clothing Brands
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id TEXT NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    brand_name TEXT NOT NULL,
    api_key TEXT NOT NULL UNIQUE,
    phone_number TEXT NOT NULL,
    store_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_profiles_api_key ON public.profiles(api_key);
CREATE INDEX IF NOT EXISTS idx_profiles_brand_id ON public.profiles(brand_id);

-- 2. LEADS TABLE: Cart Abandonment Drop-Offs
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id TEXT NOT NULL REFERENCES public.profiles(brand_id) ON DELETE CASCADE,
    brand_api_key TEXT NOT NULL REFERENCES public.profiles(api_key) ON DELETE CASCADE,
    visitor_identifier TEXT NOT NULL,     -- Visitor Name / ID
    visitor_phone TEXT,                   -- Phone Number (If captured)
    visitor_email TEXT,                   -- Email ID (If captured)
    clicked_item_name TEXT NOT NULL,      -- Clicked Item Name
    status TEXT NOT NULL DEFAULT 'Abandoned', -- 'Abandoned' | 'Viewed but Not Bought'
    price NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_leads_brand_api_key ON public.leads(brand_api_key);
CREATE INDEX IF NOT EXISTS idx_leads_created_at_desc ON public.leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);

-- 3. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- 4. RLS POLICIES FOR TENANT ISOLATION
-- Logged in brand owner can ONLY view leads tagged with their brand_api_key
CREATE POLICY "leads_tenant_isolation_select" ON public.leads
    FOR SELECT
    USING (
        brand_api_key = (
            SELECT api_key 
            FROM public.profiles 
            WHERE user_id = auth.uid()
            LIMIT 1
        )
    );

-- External Storefront Tracker Anonymous Ingestion
CREATE POLICY "leads_anonymous_tracker_insert" ON public.leads
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 
            FROM public.profiles 
            WHERE profiles.api_key = leads.brand_api_key
        )
    );

ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
`;

export const SUPABASE_JS_CLIENT_SNIPPET = `// Supabase Client Ingestion Example
import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://your-project.supabase.co', 'your-anon-key');

export async function logCartAbandonment(lead: {
  brand_id: string;
  brand_api_key: string;
  visitor_identifier: string;
  visitor_phone?: string | null;
  visitor_email?: string | null;
  clicked_item_name: string;
  status: 'Abandoned' | 'Viewed but Not Bought';
}) {
  return await supabase.from('leads').insert([lead]);
}
`;
