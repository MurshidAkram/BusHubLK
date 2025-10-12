-- Passenger notifications table for in-app alerts
CREATE TABLE IF NOT EXISTS passenger_notifications (
    notification_id      BIGSERIAL PRIMARY KEY,
    passenger_id         INTEGER NOT NULL REFERENCES passengers(passenger_id) ON DELETE CASCADE,
    title                VARCHAR(150) NOT NULL,
    body                 TEXT NOT NULL,
    category             VARCHAR(50) NOT NULL DEFAULT 'general' CHECK (category IN (
                                'general', 'lost_found', 'complaint', 'emergency', 'system'
                             )),
    related_entity_type  VARCHAR(60),
    related_entity_id    INTEGER,
    metadata             JSONB NOT NULL DEFAULT '{}'::jsonb,
    priority             VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
    is_read              BOOLEAN NOT NULL DEFAULT FALSE,
    read_at              TIMESTAMP,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Accelerate lookups for unread notifications and recent history
CREATE INDEX IF NOT EXISTS idx_passenger_notifications_passenger
    ON passenger_notifications (passenger_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_passenger_notifications_unread
    ON passenger_notifications (passenger_id)
    WHERE is_read = FALSE;

-- Optional helper to prune very old notifications (90 days by default)
CREATE OR REPLACE FUNCTION delete_expired_passenger_notifications(max_age interval DEFAULT interval '90 days')
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM passenger_notifications
    WHERE created_at < NOW() - max_age;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    RETURN COALESCE(deleted_count, 0);
END;
$$;
