const db = require('../config/db');

const DEFAULT_PROVIDER = 'ideamart';

const normalizeJsonValue = (value) => {
  if (value === undefined || value === null) {
    return null;
  }

  try {
    return JSON.stringify(value);
  } catch (error) {
    return JSON.stringify({ serializationError: error.message });
  }
};

const logSms = async ({
  provider = DEFAULT_PROVIDER,
  channelId = null,
  senderId = null,
  message,
  requestedCount = 0,
  deliveredCount = 0,
  status = 'pending',
  recipients = null,
  details = null
}) => {
  if (!message || !message.trim()) {
    return;
  }

  const query = `
    INSERT INTO sms_logs (
      provider,
      channel_id,
      sender_id,
      message,
      requested_count,
      delivered_count,
      status,
      recipients,
      details
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb)
  `;

  const values = [
    provider,
    channelId,
    senderId,
    message,
    requestedCount,
    deliveredCount,
    status,
    normalizeJsonValue(recipients),
    normalizeJsonValue(details)
  ];

  try {
    await db.query(query, values);
  } catch (error) {
    console.error('Failed to log SMS event:', error.message);
  }
};

module.exports = {
  logSms
};
