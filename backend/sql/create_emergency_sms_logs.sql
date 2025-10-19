-- Emergency SMS Logs Table
-- This table specifically tracks SMS sent during emergency alerts to emergency contacts

CREATE TABLE IF NOT EXISTS emergency_sms_logs (
    id SERIAL PRIMARY KEY,
    
    -- Emergency Alert Information
    emergency_alert_id INTEGER,                      -- Reference to emergency_alerts table (if exists)
    passenger_id INTEGER NOT NULL,                   -- Who triggered the emergency
    emergency_type VARCHAR(100),                     -- Type of emergency (Medical, Accident, etc.)
    
    -- Location Information
    passenger_latitude DECIMAL(10, 8),               -- Passenger location at time of alert
    passenger_longitude DECIMAL(11, 8),
    nearest_depot_name VARCHAR(255),                 -- Nearest depot for reference
    
    -- SMS Details
    message TEXT NOT NULL,                           -- Full SMS content sent
    recipient_phone VARCHAR(20) NOT NULL,            -- Single recipient phone number
    recipient_name VARCHAR(255),                     -- Emergency contact name
    recipient_relationship VARCHAR(100),             -- Relationship to passenger
    
    -- Delivery Information
    provider VARCHAR(50) NOT NULL DEFAULT 'notify.lk',
    delivery_status VARCHAR(50) NOT NULL,            -- 'pending', 'sent', 'failed'
    delivery_error TEXT,                             -- Error message if failed
    
    -- API Response
    notify_response JSONB,                           -- Raw response from Notify.lk API
    
    -- Timestamps
    sent_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    delivered_at TIMESTAMP WITHOUT TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_emergency_sms_passenger_id ON emergency_sms_logs(passenger_id);
CREATE INDEX IF NOT EXISTS idx_emergency_sms_alert_id ON emergency_sms_logs(emergency_alert_id);
CREATE INDEX IF NOT EXISTS idx_emergency_sms_status ON emergency_sms_logs(delivery_status);
CREATE INDEX IF NOT EXISTS idx_emergency_sms_created_at ON emergency_sms_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_emergency_sms_recipient_phone ON emergency_sms_logs(recipient_phone);

-- Comments for documentation
COMMENT ON TABLE emergency_sms_logs IS 'Tracks all SMS sent to emergency contacts during emergency alerts';
COMMENT ON COLUMN emergency_sms_logs.passenger_id IS 'ID of passenger who triggered the emergency alert';
COMMENT ON COLUMN emergency_sms_logs.emergency_type IS 'Type of emergency: Medical Emergency, Accident, Panic Alert, etc.';
COMMENT ON COLUMN emergency_sms_logs.recipient_phone IS 'Phone number of emergency contact (normalized to 94XXXXXXXXX format)';
COMMENT ON COLUMN emergency_sms_logs.delivery_status IS 'SMS delivery status: pending, sent, failed';
COMMENT ON COLUMN emergency_sms_logs.notify_response IS 'Full API response from Notify.lk for debugging';
