-- Add status column to alerts table for soft delete functionality
-- This allows users to "clear" alerts without permanently deleting them from the database

-- Add status column if it doesn't exist
ALTER TABLE alerts 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- Add sms_sent_count and email_sent_count columns if they don't exist
ALTER TABLE alerts 
ADD COLUMN IF NOT EXISTS sms_sent_count INTEGER DEFAULT 0;

ALTER TABLE alerts 
ADD COLUMN IF NOT EXISTS email_sent_count INTEGER DEFAULT 0;

-- Update existing records to have 'active' status
UPDATE alerts 
SET status = 'active' 
WHERE status IS NULL;

-- Add index for faster filtering
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);

-- Add check constraint to ensure valid status values
ALTER TABLE alerts
ADD CONSTRAINT chk_alert_status 
CHECK (status IN ('active', 'deleted'));

-- Comments for documentation
COMMENT ON COLUMN alerts.status IS 'Alert status: active (visible to user), deleted (soft deleted, hidden from user)';

-- View existing data
SELECT id, passenger_id, emergency_type, status, created_at 
FROM alerts 
ORDER BY created_at DESC 
LIMIT 10;
