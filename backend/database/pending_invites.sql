-- Pending Invites Table Migration
-- Run this in Supabase SQL Editor to create the pending_invites table

-- Create pending_invites table
CREATE TABLE IF NOT EXISTS pending_invites (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    phone VARCHAR(20),
    invite_token VARCHAR(255) UNIQUE NOT NULL,
    invited_by INTEGER REFERENCES admins(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (TIMEZONE('utc', NOW()) + INTERVAL '7 days')
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pending_invites_email ON pending_invites(email);
CREATE INDEX IF NOT EXISTS idx_pending_invites_token ON pending_invites(invite_token);
CREATE INDEX IF NOT EXISTS idx_pending_invites_status ON pending_invites(status);

-- Enable Row Level Security
ALTER TABLE pending_invites ENABLE ROW LEVEL SECURITY;

-- Drop policy if exists (for re-runs)
DROP POLICY IF EXISTS "Allow all operations on pending_invites" ON pending_invites;

-- Create policy for service role access
CREATE POLICY "Allow all operations on pending_invites" ON pending_invites
    FOR ALL USING (true) WITH CHECK (true);

-- Add comments
COMMENT ON TABLE pending_invites IS 'Stores invited users before they complete registration';
COMMENT ON COLUMN pending_invites.invite_token IS 'Unique token sent in invite email for verification';
COMMENT ON COLUMN pending_invites.status IS 'pending = waiting for user, accepted = user registered, expired = link expired';
