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

-- Create Anomaly Alerts table (Time-series)
CREATE TABLE IF NOT EXISTS anomaly_alerts (
    timestamp TIMESTAMPTZ NOT NULL,
    alert_id VARCHAR(50) NOT NULL,
    device_id VARCHAR(100) NOT NULL,
    device_name VARCHAR(100) NOT NULL,
    zone VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,         -- sustained_load, over_current, offline_timeout, voltage_anomaly
    severity VARCHAR(20) NOT NULL,     -- Critical, High, Medium
    title TEXT NOT NULL,
    value DOUBLE PRECISION NOT NULL,
    threshold DOUBLE PRECISION NOT NULL
);

SELECT create_hypertable('anomaly_alerts', 'timestamp', if_not_exists => TRUE);

-- Create Zone Mappings table (Relational)
CREATE TABLE IF NOT EXISTS zone_mappings (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    floor VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,         -- Residential, Common Area, Utility
    devices TEXT[] NOT NULL DEFAULT '{}',
    tenant VARCHAR(255) NOT NULL DEFAULT 'Unassigned',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create Indexes for performance query optimization
CREATE INDEX IF NOT EXISTS idx_telemetry_device_time ON energy_telemetry (device_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_anomaly_device_time ON anomaly_alerts (device_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_anomaly_severity ON anomaly_alerts (severity, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- Insert Mock Users for initial SSO authentication mapping
INSERT INTO users (email, display_name, role)
VALUES 
    ('resident@example.com', 'John Resident', 'Resident'),
    ('admin@example.com', 'Sarah Admin', 'Admin'),
    ('superadmin@example.com', 'David SuperAdmin', 'Super Admin'),
    ('support@example.com', 'Alex Support', 'Support')
ON CONFLICT (email) DO NOTHING;

-- Insert default zone mappings
INSERT INTO zone_mappings (id, name, floor, type, devices, tenant)
VALUES
    ('zone-a1', 'Unit A-201', 'Level 2', 'Residential', ARRAY['device-aircon-01', 'device-fridge-01'], 'John Resident'),
    ('zone-b1', 'Corridor B', 'Level 3', 'Common Area', ARRAY['device-pump-01'], 'Building Management'),
    ('zone-lobby', 'Ground Lobby', 'Ground', 'Common Area', ARRAY['device-light-01', 'device-anomaly-timer'], 'Building Management')
ON CONFLICT (id) DO NOTHING;
