-- Faculty Substitute App - Supabase Schema
-- Run this in your Supabase SQL Editor

-- =============================================
-- OPTION 1: FRESH INSTALL (New Database)
-- Uncomment and run if starting fresh
-- =============================================

/*
-- Drop existing tables (WARNING: This deletes all data!)
DROP TABLE IF EXISTS substitute_requests CASCADE;
DROP TABLE IF EXISTS users CASCADE;
*/

-- Users/Faculty table (linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    auth_id UUID UNIQUE,  -- Links to Supabase Auth user ID
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255),  -- Optional: only if not using Supabase Auth
    department VARCHAR(100),
    phone VARCHAR(20),
    email_verified BOOLEAN DEFAULT FALSE,
    push_token VARCHAR(255),  -- Expo push notification token
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Substitute requests table
CREATE TABLE IF NOT EXISTS substitute_requests (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    time VARCHAR(20) NOT NULL,
    duration INTEGER NOT NULL,
    classroom VARCHAR(50) NOT NULL,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    accepted_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- =============================================
-- OPTION 2: MIGRATION (Existing Database)
-- Run this if you already have tables created
-- =============================================

-- Add new columns to existing users table (safe to run multiple times)
DO $$ 
BEGIN
    -- Add auth_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'auth_id') THEN
        ALTER TABLE users ADD COLUMN auth_id UUID UNIQUE;
    END IF;
    
    -- Add email_verified column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'email_verified') THEN
        ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add push_token column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'push_token') THEN
        ALTER TABLE users ADD COLUMN push_token VARCHAR(255);
    END IF;
    
    -- Make password column nullable (Supabase Auth handles passwords now)
    ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
EXCEPTION
    WHEN others THEN
        -- Ignore errors (column might already be nullable)
        NULL;
END $$;

-- =============================================
-- INDEXES (Run for both options)
-- =============================================

CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_push_token ON users(push_token);
CREATE INDEX IF NOT EXISTS idx_requests_status ON substitute_requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_teacher ON substitute_requests(teacher_id);
CREATE INDEX IF NOT EXISTS idx_requests_date ON substitute_requests(date);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE substitute_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow all operations on users" ON users;
DROP POLICY IF EXISTS "Allow all operations on substitute_requests" ON substitute_requests;

-- Create policies for access
CREATE POLICY "Allow all operations on users" ON users
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on substitute_requests" ON substitute_requests
    FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- TRIGGER FOR updated_at
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_substitute_requests_updated_at ON substitute_requests;
CREATE TRIGGER update_substitute_requests_updated_at
    BEFORE UPDATE ON substitute_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- SUPABASE AUTH EMAIL CONFIGURATION
-- =============================================
-- To enable email verification:
-- 1. Go to Authentication > Providers > Enable Email
-- 2. Go to Authentication > URL Configuration
-- 3. Set your Site URL (e.g., http://localhost:3000)
-- 4. For production: Configure SMTP in Project Settings
-- =============================================
