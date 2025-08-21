-- ALTAMEDICA Database Initialization
-- Medical records, appointments, and telemedicine data

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS medical_records;
CREATE SCHEMA IF NOT EXISTS appointments;
CREATE SCHEMA IF NOT EXISTS telemedicine;
CREATE SCHEMA IF NOT EXISTS audit_log;

-- Medical records table
CREATE TABLE medical_records.patient_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL,
    doctor_id UUID NOT NULL,
    record_type VARCHAR(50) NOT NULL,
    diagnosis TEXT,
    prescription JSONB,
    lab_results JSONB,
    imaging_results JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    encrypted_data BYTEA,
    access_log JSONB DEFAULT '[]'::jsonb
);

-- Appointments table
CREATE TABLE appointments.patient_appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL,
    doctor_id UUID NOT NULL,
    appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    status VARCHAR(20) DEFAULT 'scheduled',
    telemedicine_session_id UUID,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Telemedicine sessions table
CREATE TABLE telemedicine.sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID REFERENCES appointments.patient_appointments(id),
    room_id VARCHAR(100) NOT NULL,
    session_start TIMESTAMP WITH TIME ZONE,
    session_end TIMESTAMP WITH TIME ZONE,
    participants JSONB NOT NULL DEFAULT '[]'::jsonb,
    webrtc_config JSONB,
    recording_url TEXT,
    session_notes TEXT,
    quality_metrics JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit log table
CREATE TABLE audit_log.medical_activities (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    hipaa_compliant BOOLEAN DEFAULT TRUE
);

-- Create indexes for performance
CREATE INDEX idx_patient_records_patient_id ON medical_records.patient_records(patient_id);
CREATE INDEX idx_patient_records_doctor_id ON medical_records.patient_records(doctor_id);
CREATE INDEX idx_patient_records_created_at ON medical_records.patient_records(created_at);

CREATE INDEX idx_appointments_patient_id ON appointments.patient_appointments(patient_id);
CREATE INDEX idx_appointments_doctor_id ON appointments.patient_appointments(doctor_id);
CREATE INDEX idx_appointments_date ON appointments.patient_appointments(appointment_date);

CREATE INDEX idx_telemedicine_appointment_id ON telemedicine.sessions(appointment_id);
CREATE INDEX idx_telemedicine_room_id ON telemedicine.sessions(room_id);

CREATE INDEX idx_audit_user_id ON audit_log.medical_activities(user_id);
CREATE INDEX idx_audit_timestamp ON audit_log.medical_activities(timestamp);

-- Insert sample data for testing
INSERT INTO medical_records.patient_records (patient_id, doctor_id, record_type, diagnosis) VALUES
(uuid_generate_v4(), uuid_generate_v4(), 'consultation', 'Regular checkup - patient in good health'),
(uuid_generate_v4(), uuid_generate_v4(), 'telemedicine', 'Remote consultation via video call'),
(uuid_generate_v4(), uuid_generate_v4(), 'emergency', 'Emergency consultation - resolved successfully');

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA medical_records TO altamedica;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA appointments TO altamedica;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA telemedicine TO altamedica;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA audit_log TO altamedica;
