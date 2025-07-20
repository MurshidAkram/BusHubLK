-- Lost and Found System Tables for Bus Transport Service

-- Table to store lost and found item reports
CREATE TABLE lost_found_reports (
    report_id SERIAL PRIMARY KEY,
    passenger_id INTEGER NOT NULL REFERENCES passengers(passenger_id) ON DELETE CASCADE,
    report_type VARCHAR(10) NOT NULL CHECK (report_type IN ('lost', 'found')),
    item_category VARCHAR(50) NOT NULL,
    item_description TEXT NOT NULL,
    
    -- Bus and Route Information
    route_number VARCHAR(10) REFERENCES routes(route_number),
    bus_registration VARCHAR(20), -- We'll store this as text since multiple buses can serve same route
    depot_id INTEGER REFERENCES depots(depot_id),
    
    -- Date and Time Information
    incident_date DATE NOT NULL,
    incident_time TIME NOT NULL,
    approximate_location TEXT, -- Bus stop or area description
    
    -- Contact Information
    contact_email VARCHAR(100),
    contact_phone VARCHAR(20) NOT NULL,
    
    -- Item Status and Tracking
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'matched', 'resolved', 'expired', 'cancelled')),
    priority_level INTEGER DEFAULT 1 CHECK (priority_level BETWEEN 1 AND 5), -- 1=low, 5=urgent
    
    -- Additional Information
    item_photo_url TEXT, -- URL to uploaded photo
    additional_notes TEXT,
    reward_offered DECIMAL(10,2) DEFAULT 0.00,
    
    -- System fields
    report_reference VARCHAR(20) UNIQUE NOT NULL, -- Format: LF2024001, FD2024001
    is_verified BOOLEAN DEFAULT FALSE,
    verification_method VARCHAR(50), -- 'phone', 'email', 'in_person'
    verified_at TIMESTAMP,
    verified_by INTEGER REFERENCES users(user_id),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days')
);

-- Table to track potential matches between lost and found items
CREATE TABLE lost_found_matches (
    match_id SERIAL PRIMARY KEY,
    lost_report_id INTEGER NOT NULL REFERENCES lost_found_reports(report_id) ON DELETE CASCADE,
    found_report_id INTEGER NOT NULL REFERENCES lost_found_reports(report_id) ON DELETE CASCADE,
    match_score INTEGER DEFAULT 0 CHECK (match_score BETWEEN 0 AND 100), -- Algorithm-based similarity score
    match_status VARCHAR(20) DEFAULT 'pending' CHECK (match_status IN ('pending', 'confirmed', 'rejected', 'resolved')),
    
    -- Contact attempts tracking
    contact_attempted BOOLEAN DEFAULT FALSE,
    contact_method VARCHAR(50), -- 'phone', 'email', 'sms'
    contact_notes TEXT,
    last_contact_attempt TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    resolved_by INTEGER REFERENCES users(user_id)
);

-- Table to store communication history
CREATE TABLE lost_found_communications (
    communication_id SERIAL PRIMARY KEY,
    report_id INTEGER NOT NULL REFERENCES lost_found_reports(report_id) ON DELETE CASCADE,
    match_id INTEGER REFERENCES lost_found_matches(match_id) ON DELETE CASCADE,
    
    communication_type VARCHAR(20) NOT NULL CHECK (communication_type IN ('email', 'sms', 'phone', 'in_person', 'system')),
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('system', 'passenger', 'staff', 'admin')),
    sender_id INTEGER REFERENCES users(user_id),
    
    subject VARCHAR(200),
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table to track item handover process
CREATE TABLE lost_found_handovers (
    handover_id SERIAL PRIMARY KEY,
    match_id INTEGER NOT NULL REFERENCES lost_found_matches(match_id) ON DELETE CASCADE,
    
    -- Handover details
    handover_location VARCHAR(200) NOT NULL, -- Depot name or meeting point
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    
    -- Verification process
    identity_verification_required BOOLEAN DEFAULT TRUE,
    identity_document_type VARCHAR(50), -- 'nic', 'passport', 'driving_license'
    identity_document_number VARCHAR(50),
    
    -- Staff handling
    handling_staff_id INTEGER REFERENCES users(user_id),
    depot_id INTEGER REFERENCES depots(depot_id),
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show')),
    completion_notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Table for system configuration and settings
CREATE TABLE lost_found_settings (
    setting_id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_by INTEGER REFERENCES users(user_id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT INTO lost_found_settings (setting_key, setting_value, description) VALUES 
('report_expiry_days', '30', 'Number of days after which reports expire'),
('auto_match_threshold', '75', 'Minimum match score for automatic matching'),
('max_photos_per_report', '3', 'Maximum number of photos per report'),
('reward_max_amount', '10000.00', 'Maximum reward amount allowed'),
('verification_required', 'true', 'Whether identity verification is required for handovers'),
('notification_email_enabled', 'true', 'Enable email notifications'),
('notification_sms_enabled', 'false', 'Enable SMS notifications');

-- Create indexes for better performance
CREATE INDEX idx_lost_found_reports_passenger ON lost_found_reports(passenger_id);
CREATE INDEX idx_lost_found_reports_type ON lost_found_reports(report_type);
CREATE INDEX idx_lost_found_reports_status ON lost_found_reports(status);
CREATE INDEX idx_lost_found_reports_route ON lost_found_reports(route_number);
CREATE INDEX idx_lost_found_reports_date ON lost_found_reports(incident_date);
CREATE INDEX idx_lost_found_reports_category ON lost_found_reports(item_category);
CREATE INDEX idx_lost_found_reports_reference ON lost_found_reports(report_reference);
CREATE INDEX idx_lost_found_reports_expires ON lost_found_reports(expires_at);

CREATE INDEX idx_lost_found_matches_lost ON lost_found_matches(lost_report_id);
CREATE INDEX idx_lost_found_matches_found ON lost_found_matches(found_report_id);
CREATE INDEX idx_lost_found_matches_status ON lost_found_matches(match_status);
CREATE INDEX idx_lost_found_matches_score ON lost_found_matches(match_score);

CREATE INDEX idx_lost_found_communications_report ON lost_found_communications(report_id);
CREATE INDEX idx_lost_found_communications_match ON lost_found_communications(match_id);
CREATE INDEX idx_lost_found_communications_type ON lost_found_communications(communication_type);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_lost_found_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_lost_found_reports_updated_at
    BEFORE UPDATE ON lost_found_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_lost_found_updated_at();

-- Function to generate unique report reference
CREATE OR REPLACE FUNCTION generate_report_reference(report_type_param VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
    prefix VARCHAR(2);
    year_part VARCHAR(4);
    sequence_num INTEGER;
    reference VARCHAR(20);
BEGIN
    -- Set prefix based on report type
    IF report_type_param = 'lost' THEN
        prefix := 'LF';
    ELSE
        prefix := 'FD';
    END IF;
    
    -- Get current year
    year_part := EXTRACT(YEAR FROM CURRENT_DATE)::VARCHAR;
    
    -- Get next sequence number for this year and type
    SELECT COALESCE(MAX(CAST(SUBSTRING(report_reference FROM 7) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM lost_found_reports 
    WHERE report_reference LIKE prefix || year_part || '%';
    
    -- Format reference with zero padding
    reference := prefix || year_part || LPAD(sequence_num::VARCHAR, 3, '0');
    
    RETURN reference;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate report reference
CREATE OR REPLACE FUNCTION set_report_reference()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.report_reference IS NULL OR NEW.report_reference = '' THEN
        NEW.report_reference := generate_report_reference(NEW.report_type);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_report_reference
    BEFORE INSERT ON lost_found_reports
    FOR EACH ROW
    EXECUTE FUNCTION set_report_reference();

-- Function to find potential matches (simplified version)
CREATE OR REPLACE FUNCTION find_potential_matches(report_id_param INTEGER)
RETURNS TABLE(
    potential_match_id INTEGER,
    match_score INTEGER,
    item_category VARCHAR,
    incident_date DATE,
    route_number VARCHAR
) AS $$
DECLARE
    current_report RECORD;
BEGIN
    -- Get the current report details
    SELECT * INTO current_report 
    FROM lost_found_reports 
    WHERE report_id = report_id_param;
    
    -- Find potential matches based on various criteria
    RETURN QUERY
    SELECT 
        r.report_id,
        (
            CASE WHEN r.item_category = current_report.item_category THEN 40 ELSE 0 END +
            CASE WHEN r.route_number = current_report.route_number THEN 30 ELSE 0 END +
            CASE WHEN ABS(EXTRACT(DAY FROM (r.incident_date - current_report.incident_date))) <= 1 THEN 20 ELSE 0 END +
            CASE WHEN r.depot_id = current_report.depot_id THEN 10 ELSE 0 END
        ) as score,
        r.item_category,
        r.incident_date,
        r.route_number
    FROM lost_found_reports r
    WHERE r.report_id != report_id_param
    AND r.report_type != current_report.report_type  -- Opposite type (lost vs found)
    AND r.status = 'active'
    AND (
        r.item_category = current_report.item_category OR
        r.route_number = current_report.route_number OR
        ABS(EXTRACT(DAY FROM (r.incident_date - current_report.incident_date))) <= 3
    )
    ORDER BY score DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql;
