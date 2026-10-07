-- ==============================================================================
-- 02_rls_policies.sql
-- Row Level Security (RLS) Policies for Bird Sound Identification System
-- ==============================================================================

-- 1. Enable Row Level Security on all core tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.identifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.birds ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- PROFILES POLICIES
-- ==============================================================================

-- Users can view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- Users can insert their own profile
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
    ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- ==============================================================================
-- IDENTIFICATIONS POLICIES
-- ==============================================================================

-- Users can select only their own identifications
DROP POLICY IF EXISTS "Users can select own identifications" ON public.identifications;
CREATE POLICY "Users can select own identifications"
    ON public.identifications
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Users can insert their own identifications
DROP POLICY IF EXISTS "Users can insert own identifications" ON public.identifications;
CREATE POLICY "Users can insert own identifications"
    ON public.identifications
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Users can delete only their own identifications
DROP POLICY IF EXISTS "Users can delete own identifications" ON public.identifications;
CREATE POLICY "Users can delete own identifications"
    ON public.identifications
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- ==============================================================================
-- BIRDS CATALOG POLICIES
-- ==============================================================================

-- Anyone (authenticated and anonymous) can read the bird library
DROP POLICY IF EXISTS "Birds catalog is publicly readable" ON public.birds;
CREATE POLICY "Birds catalog is publicly readable"
    ON public.birds
    FOR SELECT
    TO public
    USING (true);

-- Writable only by the backend service role (bypasses RLS by default in Supabase)
-- Standard anon/authenticated users have NO INSERT/UPDATE/DELETE grants.
