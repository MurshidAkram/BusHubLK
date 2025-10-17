const axios = require('axios');
const db = require('../config/db');
const smsLogService = require('./smsLogService');

const CEO_ANNOUNCEMENT_CHANNEL_ID = Number(process.env.CEO_ANNOUNCEMENT_CHANNEL_ID || 18);
const IDEAMART_ENDPOINT = process.env.IDEAMART_SMS_ENDPOINT || 'https://api.ideamart.io/sms/send';
const IDEAMART_BATCH_SIZE = Math.max(1, Number(process.env.IDEAMART_SMS_BATCH_SIZE) || 50);
const DEFAULT_COUNTRY_CODE = (() => {
  const raw = process.env.IDEAMART_DEFAULT_COUNTRY_CODE;
  if (!raw) {
    return '94';
  }
  const cleaned = raw.replace(/[^0-9]/g, '');
  return cleaned || '94';
})();
const INTERNATIONAL_NUMBER_PATTERN = /^[1-9]\d{6,14}$/;

const hasIdeamartCredentials = Boolean(process.env.IDEAMART_APP_ID && process.env.IDEAMART_APP_PASSWORD);

const normalizeToIdeamartAddress = (phoneNumber) => {
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

  if (INTERNATIONAL_NUMBER_PATTERN.test(cleaned)) {
    return `tel:${cleaned}`;
  }

  let candidate = cleaned;
  if (candidate.startsWith('0')) {
    candidate = `${DEFAULT_COUNTRY_CODE}${candidate.substring(1)}`;
  } else if (candidate.length === 9) {
    candidate = `${DEFAULT_COUNTRY_CODE}${candidate}`;
  }

  if (!INTERNATIONAL_NUMBER_PATTERN.test(candidate)) {
    return null;
  }

  return `tel:${candidate}`;
};

const chunkAddresses = (addresses) => {
  const batches = [];
  for (let index = 0; index < addresses.length; index += IDEAMART_BATCH_SIZE) {
    batches.push(addresses.slice(index, index + IDEAMART_BATCH_SIZE));
  }
  return batches;
};

const postIdeamartBatch = async ({ batch, message, sourceAddress }) => {
  const payload = {
    applicationId: process.env.IDEAMART_APP_ID,
    password: process.env.IDEAMART_APP_PASSWORD,
    message,
    destinationAddresses: batch
  };

  if (sourceAddress) {
    payload.sourceAddress = sourceAddress;
  }

  const response = await axios.post(
    IDEAMART_ENDPOINT,
    payload,
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );

  return response.data;
};

const sendSms = async ({ message, phoneNumbers, sourceAddress }) => {
  if (!hasIdeamartCredentials) {
    throw new Error('Ideamart SMS credentials are not configured');
  }

  if (!message || !message.trim()) {
    return {
      requested: 0,
      delivered: 0,
      batches: []
    };
  }

  const destinationAddresses = Array.isArray(phoneNumbers)
    ? phoneNumbers
        .map((value) => {
          if (typeof value === 'string' && value.trim().toLowerCase().startsWith('tel:')) {
            const trimmed = value.trim();
            return INTERNATIONAL_NUMBER_PATTERN.test(trimmed.substring(4)) ? trimmed : null;
          }
          return normalizeToIdeamartAddress(value);
        })
        .filter(Boolean)
    : [];

  if (destinationAddresses.length === 0) {
    console.warn('Ideamart SMS: no destination addresses after normalization.');
    return {
      requested: 0,
      delivered: 0,
      batches: []
    };
  }

  const batches = chunkAddresses(destinationAddresses);
  const results = [];
  let delivered = 0;

  for (const batch of batches) {
    try {
      const data = await postIdeamartBatch({ batch, message, sourceAddress });
      delivered += batch.length;
      results.push({ success: true, batchSize: batch.length, response: data });
    } catch (error) {
      const responseData = error?.response?.data || error.message;
      console.error('Ideamart SMS batch failed:', responseData);
      results.push({ success: false, batchSize: batch.length, error: responseData });
    }
  }

  const anySuccess = results.some((batch) => batch.success);

  if (!anySuccess) {
    const errorPayload = results.map((entry) => entry.error).filter(Boolean);
    const message = errorPayload.length > 0
      ? `Ideamart SMS failed for all batches: ${JSON.stringify(errorPayload)}`
      : 'Ideamart SMS failed for all batches with unknown errors';
    throw new Error(message);
  }

  return {
    requested: destinationAddresses.length,
    delivered,
    batches: results
  };
};

const fetchActivePassengerPhones = async (client) => {
  const query = `
    SELECT DISTINCT u.user_id, u.phone
    FROM passengers p
    JOIN users u ON u.user_id = p.passenger_id
    JOIN roles r ON u.role_id = r.role_id
    WHERE r.role_name = 'passenger'
      AND u.is_active = TRUE
      AND u.phone IS NOT NULL
      AND TRIM(u.phone) <> ''
  `;

  const result = await client.query(query);
  return result.rows;
};

const sendSmsToActivePassengers = async ({ message, sourceAddress, channelId = null, senderId = null }) => {
  if (!hasIdeamartCredentials) {
    throw new Error('Ideamart SMS credentials are not configured');
  }

  const client = await db.connect();

  try {
    const passengerPhones = await fetchActivePassengerPhones(client);

    if (passengerPhones.length === 0) {
      console.warn('Ideamart SMS: no active passengers with phone numbers found.');
    }

    const phoneNumbers = passengerPhones.map((row) => row.phone);
    const logPayload = {
      provider: 'ideamart',
      channelId,
      senderId,
      message,
      requestedCount: phoneNumbers.length,
      deliveredCount: 0,
      status: 'pending',
      recipients: phoneNumbers
    };

    try {
      const result = await sendSms({
      message,
      phoneNumbers,
        sourceAddress: sourceAddress || process.env.IDEAMART_SOURCE_ADDRESS
      });

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
        `Ideamart SMS broadcast result: requested=${result.requested}, delivered=${result.delivered}, batches=${result.batches.length}`
      );

      return result;
    } catch (error) {
      logPayload.status = 'failed';
      logPayload.details = {
        error: error?.message || 'Ideamart SMS send failed'
      };
      throw error;
    } finally {
      await smsLogService.logSms(logPayload);
    }

  } finally {
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
  hasIdeamartCredentials,
  IDEAMART_ENDPOINT,
  IDEAMART_BATCH_SIZE,
  normalizeToIdeamartAddress,
  sendSms,
  sendSmsToActivePassengers,
  shouldTriggerCeoAnnouncementBroadcast
};
