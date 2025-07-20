-- Create lost_found_reports table
-- This table stores all lost and found item reports submitted by passengers

CREATE TABLE IF NOT EXISTS lost_found_reports (
    -- Primary key
    report_id SERIAL PRIMARY KEY,
    
    -- Foreign key to passengers table
    passenger_id INTEGER NOT NULL,
    
    -- Report details
    report_type VARCHAR(10) NOT NULL CHECK (report_type IN ('lost', 'found')),
    report_reference VARCHAR(255) UNIQUE NOT NULL, -- UUID reference for public identification
    
    -- Item details
    item_category VARCHAR(50) NOT NULL CHECK (item_category IN (
        'phone', 'wallet', 'bag', 'keys', 'clothing', 
        'documents', 'electronics', 'jewelry', 'other'
    )),
    item_description TEXT NOT NULL,
    item_photo_url VARCHAR(255), -- Path to uploaded photo
    
    -- Location details
    route_number VARCHAR(10), -- Optional bus route number
    region_id INTEGER, -- Foreign key to regions table
    approximate_location VARCHAR(255), -- Optional specific location description
    
    -- Incident details
    incident_date DATE NOT NULL,
    incident_time TIME NOT NULL,
    
    -- Contact information
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20) NOT NULL,
    
    -- Additional details
    reward_offered DECIMAL(10,2) DEFAULT 0.00,
    
    -- Status and metadata
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'expired', 'deleted')),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '40 days'), -- Auto-expire after 40 days
    
    -- Foreign key constraints
    CONSTRAINT fk_lost_found_passenger 
        FOREIGN KEY (passenger_id) 
        REFERENCES passengers(passenger_id) 
        ON DELETE CASCADE,
        
    CONSTRAINT fk_lost_found_region 
        FOREIGN KEY (region_id) 
        REFERENCES regions(region_id) 
        ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lost_found_passenger_id ON lost_found_reports(passenger_id);
CREATE INDEX IF NOT EXISTS idx_lost_found_item_category ON lost_found_reports(item_category);
CREATE INDEX IF NOT EXISTS idx_lost_found_report_type ON lost_found_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_lost_found_status ON lost_found_reports(status);
CREATE INDEX IF NOT EXISTS idx_lost_found_created_at ON lost_found_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lost_found_incident_date ON lost_found_reports(incident_date DESC);
CREATE INDEX IF NOT EXISTS idx_lost_found_route_number ON lost_found_reports(route_number);
CREATE INDEX IF NOT EXISTS idx_lost_found_region_id ON lost_found_reports(region_id);
CREATE INDEX IF NOT EXISTS idx_lost_found_reference ON lost_found_reports(report_reference);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_lost_found_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_lost_found_updated_at
    BEFORE UPDATE ON lost_found_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_lost_found_updated_at();

-- Create function to find potential matches (mentioned in controller but may not exist)
CREATE OR REPLACE FUNCTION find_potential_matches(
    p_report_type VARCHAR(10),
    p_item_category VARCHAR(50),
    p_item_description TEXT,
    p_route_number VARCHAR(10) DEFAULT NULL,
    p_region_id INTEGER DEFAULT NULL,
    p_incident_date DATE DEFAULT NULL
)
RETURNS TABLE(
    report_id INTEGER,
    similarity_score DECIMAL(3,2),
    match_reason TEXT
) AS $$
BEGIN
    -- Simple matching logic - can be enhanced with more sophisticated algorithms
    RETURN QUERY
    SELECT 
        r.report_id,
        CASE 
            WHEN r.route_number = p_route_number AND r.region_id = p_region_id THEN 0.95
            WHEN r.route_number = p_route_number THEN 0.85
            WHEN r.region_id = p_region_id THEN 0.75
            ELSE 0.50
        END as similarity_score,
        CASE 
            WHEN r.route_number = p_route_number AND r.region_id = p_region_id THEN 'Same route and region'
            WHEN r.route_number = p_route_number THEN 'Same route'
            WHEN r.region_id = p_region_id THEN 'Same region'
            ELSE 'Same item category'
        END as match_reason
    FROM lost_found_reports r
    WHERE r.report_type = CASE WHEN p_report_type = 'lost' THEN 'found' ELSE 'lost' END
        AND r.item_category = p_item_category
        AND r.status = 'active'
        AND ABS(EXTRACT(DAY FROM (r.incident_date - p_incident_date))) <= 7 -- Within 7 days
    ORDER BY similarity_score DESC, r.created_at DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- Insert sample regions if they don't exist (for testing)
INSERT INTO regions (region_name, region_code, description) VALUES
    ('Colombo', 'COL', 'Colombo District'),
    ('Gampaha', 'GAM', 'Gampaha District'),
    ('Kalutara', 'KAL', 'Kalutara District'),
    ('Kandy', 'KAN', 'Kandy District'),
    ('Matale', 'MAT', 'Matale District'),
    ('Nuwara Eliya', 'NUW', 'Nuwara Eliya District'),
    ('Galle', 'GAL', 'Galle District'),
    ('Matara', 'MAT', 'Matara District'),
    ('Hambantota', 'HAM', 'Hambantota District'),
    ('Jaffna', 'JAF', 'Jaffna District')
ON CONFLICT (region_code) DO NOTHING;

-- Grant necessary permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON lost_found_reports TO your_app_user;
-- GRANT USAGE, SELECT ON SEQUENCE lost_found_reports_report_id_seq TO your_app_user;

COMMENT ON TABLE lost_found_reports IS 'Stores lost and found item reports from bus passengers';
COMMENT ON COLUMN lost_found_reports.report_reference IS 'Public UUID reference for report identification';
COMMENT ON COLUMN lost_found_reports.expires_at IS 'Automatic expiration date for reports (40 days from creation)';
