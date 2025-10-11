/**
 * Time utilities for converting UTC timestamps to Sri Lanka time
 * Sri Lanka Time Zone: UTC+5:30 (Asia/Colombo)
 */

// Sri Lanka timezone offset: +5 hours 30 minutes = 330 minutes
const SRI_LANKA_OFFSET_MINUTES = 330;

/**
 * Convert UTC timestamp to Sri Lanka time
 * @param utcTimestamp - UTC timestamp string or Date object
 * @returns Date object in Sri Lanka time
 */
export const convertToSriLankaTime = (utcTimestamp: string | Date): Date => {
  const utcDate = typeof utcTimestamp === 'string' ? new Date(utcTimestamp) : utcTimestamp;
  
  // Add Sri Lanka offset to UTC time
  const sriLankaTime = new Date(utcDate.getTime() + (SRI_LANKA_OFFSET_MINUTES * 60 * 1000));
  return sriLankaTime;
};

/**
 * Get current Sri Lanka time
 * @returns Date object representing current time in Sri Lanka
 */
export const getCurrentSriLankaTime = (): Date => {
  const now = new Date();
  return convertToSriLankaTime(now);
};

/**
 * Calculate time difference in minutes between current Sri Lanka time and given timestamp
 * @param timestamp - UTC timestamp string or Date object
 * @returns number of minutes since the timestamp (positive = in the past, negative = in the future)
 */
export const getMinutesSince = (timestamp: string | Date): number => {
  const timestampInSriLanka = convertToSriLankaTime(timestamp);
  const currentSriLankaTime = getCurrentSriLankaTime();
  
  const diffInMs = currentSriLankaTime.getTime() - timestampInSriLanka.getTime();
  return Math.floor(diffInMs / (1000 * 60));
};

/**
 * Format time difference for display (e.g., "2m ago", "5 minutes ago", "now")
 * @param timestamp - UTC timestamp string or Date object
 * @returns formatted string representing time difference
 */
export const formatTimeSince = (timestamp: string | Date): string => {
  const minutes = getMinutesSince(timestamp);
  
  if (minutes <= 0) {
    return 'now';
  } else if (minutes === 1) {
    return '1m ago';
  } else if (minutes < 60) {
    return `${minutes}m ago`;
  } else {
    const hours = Math.floor(minutes / 60);
    if (hours === 1) {
      return '1h ago';
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      const days = Math.floor(hours / 24);
      return days === 1 ? '1d ago' : `${days}d ago`;
    }
  }
};

/**
 * Format timestamp to Sri Lanka time string
 * @param timestamp - UTC timestamp string or Date object
 * @param format - 'short' for time only, 'long' for date and time
 * @returns formatted time string in Sri Lanka time
 */
export const formatSriLankaTime = (timestamp: string | Date, format: 'short' | 'long' = 'short'): string => {
  const sriLankaTime = convertToSriLankaTime(timestamp);
  
  if (format === 'short') {
    return sriLankaTime.toLocaleTimeString('en-LK', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } else {
    return sriLankaTime.toLocaleString('en-LK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }
};

/**
 * Check if a timestamp is considered stale (older than specified minutes)
 * @param timestamp - UTC timestamp string or Date object
 * @param thresholdMinutes - number of minutes to consider as stale threshold
 * @returns true if timestamp is older than threshold
 */
export const isTimestampStale = (timestamp: string | Date, thresholdMinutes: number = 5): boolean => {
  const minutes = getMinutesSince(timestamp);
  return minutes > thresholdMinutes;
};

/**
 * Get Sri Lanka time zone info
 * @returns object with timezone information
 */
export const getSriLankaTimeZoneInfo = () => {
  return {
    name: 'Asia/Colombo',
    offset: '+05:30',
    offsetMinutes: SRI_LANKA_OFFSET_MINUTES,
    displayName: 'Sri Lanka Standard Time'
  };
};

/**
 * Convert minutes to human readable format
 * @param minutes - number of minutes
 * @returns formatted string (e.g., "2h 30m", "45m")
 */
export const formatMinutesToHuman = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}m`;
};