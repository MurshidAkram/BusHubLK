const db = require('../config/db');

/**
 * Log a single emergency SMS to the database
 * This service specifically handles emergency contact SMS logging
 */
const logEmergencySms = async ({
  emergencyAlertId = null,
  passengerId,
  emergencyType,
  passengerLatitude = null,
  passengerLongitude = null,
  nearestDepotName = null,
  message,
  recipientPhone,
  recipientName = null,
  recipientRelationship = null,
  deliveryStatus = 'pending',
  deliveryError = null,
  notifyResponse = null
}) => {
  if (!passengerId || !message || !recipientPhone) {
    console.error('logEmergencySms: Missing required fields (passengerId, message, or recipientPhone)');
    return null;
  }

  const query = `
    INSERT INTO emergency_sms_logs (
      emergency_alert_id,
      passenger_id,
      emergency_type,
      passenger_latitude,
      passenger_longitude,
      nearest_depot_name,
      message,
      recipient_phone,
      recipient_name,
      recipient_relationship,
      provider,
      delivery_status,
      delivery_error,
      notify_response,
      sent_at,
      delivered_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), $15)
    RETURNING id
  `;

  const values = [
    emergencyAlertId,
    passengerId,
    emergencyType,
    passengerLatitude,
    passengerLongitude,
    nearestDepotName,
    message,
    recipientPhone,
    recipientName,
    recipientRelationship,
    'notify.lk',
    deliveryStatus,
    deliveryError,
    notifyResponse ? JSON.stringify(notifyResponse) : null,
    deliveryStatus === 'sent' ? new Date() : null
  ];

  try {
    const result = await db.query(query, values);
    console.log(`✅ Emergency SMS logged: ID ${result.rows[0].id} | Recipient: ${recipientPhone} | Status: ${deliveryStatus}`);
    return result.rows[0];
  } catch (error) {
    console.error('❌ Failed to log emergency SMS:', error.message);
    console.error('   Recipient:', recipientPhone, '| Status:', deliveryStatus);
    return null;
  }
};

/**
 * Log multiple emergency SMS sends (batch)
 */
const logMultipleEmergencySms = async (smsArray) => {
  const results = [];
  
  for (const sms of smsArray) {
    const result = await logEmergencySms(sms);
    results.push(result);
  }
  
  return results;
};

/**
 * Get emergency SMS logs for a specific passenger
 */
const getEmergencySmsLogsByPassenger = async (passengerId, limit = 50) => {
  const query = `
    SELECT 
      id,
      emergency_alert_id,
      passenger_id,
      emergency_type,
      recipient_phone,
      recipient_name,
      recipient_relationship,
      delivery_status,
      delivery_error,
      sent_at,
      delivered_at
    FROM emergency_sms_logs
    WHERE passenger_id = $1
    ORDER BY sent_at DESC
    LIMIT $2
  `;

  try {
    const result = await db.query(query, [passengerId, limit]);
    return result.rows;
  } catch (error) {
    console.error('Failed to fetch emergency SMS logs:', error.message);
    return [];
  }
};

/**
 * Get emergency SMS logs for a specific alert
 */
const getEmergencySmsLogsByAlert = async (emergencyAlertId) => {
  const query = `
    SELECT 
      id,
      passenger_id,
      emergency_type,
      recipient_phone,
      recipient_name,
      recipient_relationship,
      delivery_status,
      delivery_error,
      sent_at,
      delivered_at
    FROM emergency_sms_logs
    WHERE emergency_alert_id = $1
    ORDER BY sent_at ASC
  `;

  try {
    const result = await db.query(query, [emergencyAlertId]);
    return result.rows;
  } catch (error) {
    console.error('Failed to fetch emergency SMS logs by alert:', error.message);
    return [];
  }
};

/**
 * Get SMS delivery statistics
 */
const getEmergencySmsStats = async (passengerId = null, days = 30) => {
  const whereClause = passengerId ? 'WHERE passenger_id = $1 AND' : 'WHERE';
  const params = passengerId ? [passengerId, days] : [days];
  const paramIndex = passengerId ? 2 : 1;

  const query = `
    SELECT 
      COUNT(*) as total_sent,
      COUNT(CASE WHEN delivery_status = 'sent' THEN 1 END) as successful,
      COUNT(CASE WHEN delivery_status = 'failed' THEN 1 END) as failed,
      COUNT(CASE WHEN delivery_status = 'pending' THEN 1 END) as pending,
      COUNT(DISTINCT passenger_id) as unique_passengers,
      COUNT(DISTINCT recipient_phone) as unique_recipients
    FROM emergency_sms_logs
    ${whereClause} sent_at >= NOW() - INTERVAL '${days} days'
  `;

  try {
    const result = await db.query(query, params);
    return result.rows[0];
  } catch (error) {
    console.error('Failed to fetch emergency SMS stats:', error.message);
    return null;
  }
};

module.exports = {
  logEmergencySms,
  logMultipleEmergencySms,
  getEmergencySmsLogsByPassenger,
  getEmergencySmsLogsByAlert,
  getEmergencySmsStats
};
