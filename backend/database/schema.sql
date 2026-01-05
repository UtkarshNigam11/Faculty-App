-- Create database (run this separately)
-- CREATE DATABASE faculty_substitute;

-- Users/Faculty table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Substitute requests table
CREATE TABLE IF NOT EXISTS substitute_requests (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    time VARCHAR(20) NOT NULL,
    duration INTEGER NOT NULL, -- in minutes
    classroom VARCHAR(50) NOT NULL,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, completed, cancelled
    accepted_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_requests_status ON substitute_requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_teacher ON substitute_requests(teacher_id);
CREATE INDEX IF NOT EXISTS idx_requests_date ON substitute_requests(date);

-- Sample data for testing
INSERT INTO users (name, email, password, department, phone) VALUES
('Dr. Smith', 'smith@college.edu', 'password123', 'Mathematics', '1234567890'),
('Prof. Johnson', 'johnson@college.edu', 'password123', 'Physics', '0987654321'),
('Dr. Williams', 'williams@college.edu', 'password123', 'Chemistry', '5551234567')
ON CONFLICT (email) DO NOTHING;
