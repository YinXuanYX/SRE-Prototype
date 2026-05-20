-- Create TimescaleDB extension if not already present
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Create Roles Enum
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('Resident', 'Admin', 'Super Admin', 'Support');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create Consent Status Enum
DO $$ BEGIN
    CREATE TYPE consent_status AS ENUM ('Granted', 'Revoked');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create Users table (Relational)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'Resident',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create Consent Logs table (Relational, PDPA opt-in history)
CREATE TABLE IF NOT EXISTS consent_logs (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    consent_type VARCHAR(100) NOT NULL, -- e.g., 'appliance_breakdown'
    status consent_status NOT NULL DEFAULT 'Revoked',
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create Energy Telemetry table (Time-series)
CREATE TABLE IF NOT EXISTS energy_telemetry (
    timestamp TIMESTAMPTZ NOT NULL,
    device_id VARCHAR(100) NOT NULL,
    device_name VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL, -- Active, Offline, Error
    load_kw DOUBLE PRECISION NOT NULL,
    voltage DOUBLE PRECISION NOT NULL
);

-- Convert energy_telemetry to hypertable (1-day chunk interval is typical, but we can stick to defaults for prototype)
SELECT create_hypertable('energy_telemetry', 'timestamp', if_not_exists => TRUE);

-- Create Indexes for performance query optimization
CREATE INDEX IF NOT EXISTS idx_telemetry_device_time ON energy_telemetry (device_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- Insert Mock Users for initial SSO authentication mapping
INSERT INTO users (email, display_name, role)
VALUES 
    ('resident@example.com', 'John Resident', 'Resident'),
    ('admin@example.com', 'Sarah Admin', 'Admin'),
    ('superadmin@example.com', 'David SuperAdmin', 'Super Admin'),
    ('support@example.com', 'Alex Support', 'Support')
ON CONFLICT (email) DO NOTHING;
