-- Table: public.sms_logs

CREATE TABLE IF NOT EXISTS sms_logs (
    id SERIAL PRIMARY KEY,
    provider VARCHAR(50) NOT NULL,
    channel_id INTEGER,
    sender_id INTEGER,
    message TEXT NOT NULL,
    requested_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    status VARCHAR(50) NOT NULL,
    recipients JSONB,
    details JSONB,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_logs_channel_id ON sms_logs(channel_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_sender_id ON sms_logs(sender_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_created_at ON sms_logs(created_at DESC);
