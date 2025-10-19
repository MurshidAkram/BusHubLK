-- Create emergency_contacts table for storing passenger emergency contacts
-- This table is separate from the passengers table to allow multiple contacts per passenger

CREATE TABLE IF NOT EXISTS emergency_contacts (
    id SERIAL PRIMARY KEY,
    passenger_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    relationship VARCHAR(50),
    email VARCHAR(100),
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Foreign key constraint
    CONSTRAINT fk_passenger
        FOREIGN KEY (passenger_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    -- Ensure only one primary contact per passenger
    CONSTRAINT unique_primary_per_passenger
        UNIQUE (passenger_id, is_primary)
        WHERE is_primary = TRUE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_passenger_id
    ON emergency_contacts(passenger_id);

-- Create index for primary contacts
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_is_primary
    ON emergency_contacts(is_primary)
    WHERE is_primary = TRUE;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_emergency_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_emergency_contacts_timestamp
    BEFORE UPDATE ON emergency_contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_emergency_contacts_updated_at();

-- Comments for documentation
COMMENT ON TABLE emergency_contacts IS 'Stores emergency contact information for passengers';
COMMENT ON COLUMN emergency_contacts.passenger_id IS 'References the user_id in users table (passenger)';
COMMENT ON COLUMN emergency_contacts.is_primary IS 'Indicates if this is the primary emergency contact (only one per passenger)';
