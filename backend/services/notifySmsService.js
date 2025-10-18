const axios = require('axios');
const db = require('../config/db');
const smsLogService = require('./smsLogService');

const CEO_ANNOUNCEMENT_CHANNEL_ID = Number(process.env.CEO_ANNOUNCEMENT_CHANNEL_ID || 18);
const NOTIFY_API_ENDPOINT = process.env.NOTIFY_API_ENDPOINT || 'https://app.notify.lk/api/v1/send';
const NOTIFY_BATCH_SIZE = Math.max(1, Number(process.env.NOTIFY_SMS_BATCH_SIZE) || 50);
const DEFAULT_COUNTRY_CODE = (() => {
  const raw = process.env.NOTIFY_DEFAULT_COUNTRY_CODE;
  if (!raw) {
    return '94';
  }
  const cleaned = raw.replace(/[^0-9]/g, '');
  return cleaned || '94';
})();

const hasNotifyCredentials = Boolean(
  process.env.NOTIFY_USER_ID && process.env.NOTIFY_API_KEY && process.env.NOTIFY_SENDER_ID
);

const normalizeToDialString = (phoneNumber) => {
  if (!phoneNumber) {
    return null;
  }

  if (typeof phoneNumber !== 'string') {
    phoneNumber = String(phoneNumber);
  }

  let cleaned = phoneNumber.replace(/[^0-9+]/g, '');
  if (!cleaned) {
    return null;
  }

  if (cleaned.toLowerCase().startsWith('tel:')) {
    cleaned = cleaned.substring(4);
  }

  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }

  if (cleaned.startsWith('00')) {
    cleaned = cleaned.substring(2);
  }

  let candidate = cleaned;
  if (candidate.startsWith('0')) {
    candidate = `${DEFAULT_COUNTRY_CODE}${candidate.substring(1)}`;
  } else if (candidate.length === 9) {
    candidate = `${DEFAULT_COUNTRY_CODE}${candidate}`;
  }

  const INTERNATIONAL_NUMBER_PATTERN = /^[1-9]\d{6,14}$/;
  if (!INTERNATIONAL_NUMBER_PATTERN.test(candidate)) {
    return null;
  }

  // Notify.lk requires 11 digit local numbers (e.g. 94771234567). Skip anything outside spec.
  if (candidate.length !== 11) {
    return null;
  }

  if (!candidate.startsWith(DEFAULT_COUNTRY_CODE)) {
    return null;
  }

  return candidate;
};

const chunkArray = (items, size) => {
  const batches = [];
  for (let index = 0; index < items.length; index += size) {
    batches.push(items.slice(index, index + size));
  }
  return batches;
};

const postNotifyBatch = async (batch, message) => {
  const payload = {
    user_id: process.env.NOTIFY_USER_ID,
    api_key: process.env.NOTIFY_API_KEY,
    sender_id: process.env.NOTIFY_SENDER_ID,
    to: batch.join(',')
  };

  const body = new URLSearchParams(payload);
  body.append('message', message);

  const response = await axios.post(NOTIFY_API_ENDPOINT, body.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  return response.data;
};

const sendSms = async ({ message, phoneNumbers }) => {
  if (!hasNotifyCredentials) {
    throw new Error('Notify.lk SMS credentials are not configured');
  }

  if (!message || !message.trim()) {
    return {
      requested: 0,
      delivered: 0,
      batches: []
    };
  }

  const destinationNumbers = Array.isArray(phoneNumbers)
    ? phoneNumbers
        .map(normalizeToDialString)
        .filter(Boolean)
    : [];

  if (destinationNumbers.length === 0) {
    console.warn('Notify.lk SMS: no destination numbers after normalization.');
    return {
      requested: 0,
      delivered: 0,
      batches: []
    };
  }

  const batches = chunkArray(destinationNumbers, NOTIFY_BATCH_SIZE);
  const results = [];
  let delivered = 0;

  for (const batch of batches) {
    try {
      const data = await postNotifyBatch(batch, message);
      delivered += batch.length;
      results.push({ success: true, batchSize: batch.length, response: data });
    } catch (error) {
      const responseData = error?.response?.data || error.message;
      console.error('Notify.lk SMS batch failed:', responseData);
      results.push({ success: false, batchSize: batch.length, error: responseData });
    }
  }

  const anySuccess = results.some((entry) => entry.success);
  if (!anySuccess) {
    const errorPayload = results.map((entry) => entry.error).filter(Boolean);
    const messageText = errorPayload.length > 0
      ? `Notify.lk SMS failed for all batches: ${JSON.stringify(errorPayload)}`
      : 'Notify.lk SMS failed for all batches with unknown errors';
    throw new Error(messageText);
  }

  return {
    requested: destinationNumbers.length,
    delivered,
    batches: results
  };
};

const fetchActiveRecipientPhones = async (client) => {
  const query = `
    SELECT DISTINCT u.user_id, u.phone
    FROM users u
    JOIN roles r ON u.role_id = r.role_id
    WHERE u.is_active = TRUE
      AND u.phone IS NOT NULL
      AND TRIM(u.phone) <> ''
      AND (
        (r.role_name = 'passenger' AND EXISTS (
          SELECT 1 FROM passengers p WHERE p.passenger_id = u.user_id
        ))
        OR
        (r.role_name = 'driver' AND EXISTS (
          SELECT 1 FROM drivers d WHERE d.driver_id = u.user_id
        ))
      )
  `;

  const result = await client.query(query);
  return result.rows;
};

const sendSmsToActivePassengers = async ({ message, channelId = null, senderId = null }) => {
  if (!hasNotifyCredentials) {
    throw new Error('Notify.lk SMS credentials are not configured');
  }

  const client = await db.connect();

  const logPayload = {
    provider: 'notify.lk',
    channelId,
    senderId,
    message,
    requestedCount: 0,
    deliveredCount: 0,
    status: 'pending',
    recipients: [],
    details: null
  };

  try {
  const recipientPhones = await fetchActiveRecipientPhones(client);
  const phoneNumbers = recipientPhones.map((row) => row.phone);

    logPayload.requestedCount = phoneNumbers.length;
    logPayload.recipients = phoneNumbers;

    if (phoneNumbers.length === 0) {
      console.warn('Notify.lk SMS: no active passengers with phone numbers found.');
      logPayload.status = 'empty';
      return {
        requested: 0,
        delivered: 0,
        batches: []
      };
    }

    try {
      const result = await sendSms({ message, phoneNumbers });
      logPayload.requestedCount = result.requested;
      logPayload.deliveredCount = result.delivered;

      const failedBatches = result.batches.filter((batch) => !batch.success);
      if (failedBatches.length === 0) {
        logPayload.status = 'sent';
      } else if (failedBatches.length === result.batches.length) {
        logPayload.status = 'failed';
        logPayload.details = { failedBatches };
      } else {
        logPayload.status = 'partial';
        logPayload.details = { failedBatches };
      }

      console.info(
        `Notify.lk SMS broadcast result: requested=${result.requested}, delivered=${result.delivered}, batches=${result.batches.length}`
      );

      return result;
    } catch (error) {
      logPayload.status = 'failed';
      logPayload.details = {
        error: error?.message || 'Notify.lk SMS send failed'
      };
      throw error;
    }
  } finally {
    await smsLogService.logSms(logPayload);
    client.release();
  }
};

const shouldTriggerCeoAnnouncementBroadcast = ({ channelId, senderId, channelCreatorId, creatorRole }) => {
  if (!channelId || !senderId || !channelCreatorId) {
    return false;
  }

  if (senderId !== channelCreatorId) {
    return false;
  }

  const role = creatorRole ? creatorRole.toLowerCase() : '';
  const matchesRole = role === 'ceo';
  const matchesChannel = Number(channelId) === CEO_ANNOUNCEMENT_CHANNEL_ID;

  return matchesRole || matchesChannel;
};

module.exports = {
  hasNotifyCredentials,
  sendSms,
  sendSmsToActivePassengers,
  shouldTriggerCeoAnnouncementBroadcast
};
