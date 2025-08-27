-- AltaMedica Database Initialization Script
-- Created: 2025-08-27
-- Purpose: Initialize database schema and default data

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create main database if not exists (this runs in the altamedica db already)
-- But we'll create schemas for organization

-- Create schemas
CREATE SCHEMA IF NOT EXISTS medical;
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS audit;

-- Create ENUM types
CREATE TYPE user_role AS ENUM ('patient', 'doctor', 'admin', 'company');
CREATE TYPE appointment_status AS ENUM ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show', 'rescheduled');
CREATE TYPE appointment_type AS ENUM ('consultation', 'follow_up', 'emergency', 'surgery', 'lab_test', 'vaccination', 'check_up', 'telemedicine');

-- Create users table (for authentication)
CREATE TABLE IF NOT EXISTS auth.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'patient',
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

-- Create patients table
CREATE TABLE IF NOT EXISTS medical.patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(20),
    phone_number VARCHAR(20),
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    medical_record_number VARCHAR(50) UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create doctors table
CREATE TABLE IF NOT EXISTS medical.doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    license_number VARCHAR(50) UNIQUE NOT NULL,
    specialties TEXT[],
    phone_number VARCHAR(20),
    consultation_fee DECIMAL(10,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create appointments table
CREATE TABLE IF NOT EXISTS medical.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES medical.patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES medical.doctors(id) ON DELETE CASCADE,
    appointment_date TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    type appointment_type NOT NULL DEFAULT 'consultation',
    status appointment_status NOT NULL DEFAULT 'scheduled',
    reason TEXT,
    notes TEXT,
    is_virtual BOOLEAN DEFAULT false,
    meeting_url VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create medical records table
CREATE TABLE IF NOT EXISTS medical.medical_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES medical.patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES medical.doctors(id),
    appointment_id UUID REFERENCES medical.appointments(id),
    visit_date TIMESTAMPTZ NOT NULL,
    chief_complaint TEXT,
    diagnosis TEXT,
    treatment TEXT,
    prescriptions JSONB,
    lab_results JSONB,
    vital_signs JSONB,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create audit log table
CREATE TABLE IF NOT EXISTS audit.activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON auth.users(email);
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON medical.patients(user_id);
CREATE INDEX IF NOT EXISTS idx_doctors_user_id ON medical.doctors(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON medical.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON medical.appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON medical.appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_medical_records_patient_id ON medical.medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON audit.activity_log(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON auth.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON medical.patients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON medical.doctors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON medical.appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_medical_records_updated_at BEFORE UPDATE ON medical.medical_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user
INSERT INTO auth.users (email, password_hash, role, is_active, email_verified) 
VALUES (
    'admin@altamedica.com', 
    crypt('admin123', gen_salt('bf', 12)), 
    'admin', 
    true, 
    true
) ON CONFLICT (email) DO NOTHING;

-- Grant permissions
GRANT USAGE ON SCHEMA auth TO PUBLIC;
GRANT USAGE ON SCHEMA medical TO PUBLIC;
GRANT USAGE ON SCHEMA audit TO PUBLIC;

-- Grant read/write permissions to all tables
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA auth TO PUBLIC;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA medical TO PUBLIC;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA audit TO PUBLIC;

-- Grant sequence permissions
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA auth TO PUBLIC;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA medical TO PUBLIC;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA audit TO PUBLIC;

-- Print success message
\echo 'AltaMedica database initialized successfully!'
\echo 'Default admin user: admin@altamedica.com / admin123'