-- Add resolved_date column to lost_found_reports table
-- This column will store when a report was marked as resolved

ALTER TABLE lost_found_reports 
ADD COLUMN resolved_date TIMESTAMP DEFAULT NULL;

-- Add index for better query performance
CREATE INDEX idx_lost_found_reports_resolved_date ON lost_found_reports(resolved_date);

-- Add comment for documentation
COMMENT ON COLUMN lost_found_reports.resolved_date IS 'Timestamp when the report was marked as resolved by the user';

-- Show the updated table structure
\d lost_found_reports;
