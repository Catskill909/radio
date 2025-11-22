import fs from 'fs';
import path from 'path';
import { toZonedTime, fromZonedTime, format as formatTz } from 'date-fns-tz';

/**
 * Get the station's configured timezone from settings file.
 * Falls back to UTC if not configured or if there's an error.
 */
export function getStationTimezone(): string {
  try {
    const settingsPath = path.join(process.cwd(), 'station-settings.json');
    if (fs.existsSync(settingsPath)) {
      const raw = fs.readFileSync(settingsPath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed?.timezone && typeof parsed.timezone === 'string') {
        return parsed.timezone;
      }
    }
  } catch (e) {
    console.error('Failed to read station timezone:', e);
  }
  return 'UTC'; // Safe fallback
}

/**
 * Convert a local date/time string in station timezone to a UTC Date object.
 * Used when creating schedule slots from user input.
 * 
 * @param dateString - Date in YYYY-MM-DD format
 * @param timeString - Time in HH:mm format (24-hour)
 * @returns Date object representing the UTC instant
 * 
 * @example
 * // If station timezone is America/New_York
 * stationTimeToUTC("2025-11-22", "15:00")
 * // Returns Date representing Nov 22, 2025 3pm Eastern (8pm UTC)
 */
export function stationTimeToUTC(
  dateString: string,
  timeString: string
): Date {
  const stationTz = getStationTimezone();
  
  // Parse "YYYY-MM-DD" and "HH:mm" as station-local time
  const localDateTime = `${dateString}T${timeString}:00`;
  
  // fromZonedTime interprets the string as being in the given timezone
  // and returns a Date object representing that instant in UTC
  return fromZonedTime(localDateTime, stationTz);
}

/**
 * Convert a UTC Date object to station-local time Date object.
 * The returned Date will have the same wall-clock time as station-local,
 * but still be a JS Date (which is always UTC internally).
 * 
 * Used for display purposes in client components.
 * 
 * @param date - UTC Date object (from DB or Date.now())
 * @returns Date object with station-local wall-clock time
 * 
 * @example
 * // If station timezone is America/New_York and DB has "2025-11-22T20:00:00Z"
 * utcToStationTime(new Date("2025-11-22T20:00:00Z"))
 * // Returns Date representing Nov 22, 2025 3pm (as a Date object)
 */
export function utcToStationTime(date: Date): Date {
  const stationTz = getStationTimezone();
  return toZonedTime(date, stationTz);
}

/**
 * Format a Date object as a string in station timezone.
 * 
 * @param date - Date object to format
 * @param formatStr - date-fns format string (default: 'yyyy-MM-dd HH:mm:ss')
 * @returns Formatted string in station timezone
 * 
 * @example
 * formatInStationTime(new Date(), 'PPpp')
 * // Returns "Nov 22, 2025, 3:00:00 PM" (in station timezone)
 */
export function formatInStationTime(
  date: Date,
  formatStr: string = 'yyyy-MM-dd HH:mm:ss'
): string {
  const stationTz = getStationTimezone();
  try {
    return formatTz(date, formatStr, { timeZone: stationTz });
  } catch (e) {
    // Fallback to UTC if timezone is invalid
    return formatTz(date, formatStr, { timeZone: 'UTC' });
  }
}

/**
 * Get the current time as a Date object in station timezone.
 * Useful for "now" comparisons in station-local context.
 * 
 * @returns Date object representing current time in station timezone
 */
export function nowInStationTime(): Date {
  const stationTz = getStationTimezone();
  return toZonedTime(new Date(), stationTz);
}

/**
 * Check if a given UTC instant is currently "active" based on station time.
 * Used by recorder service to determine if a show should be recording.
 * 
 * @param startTime - UTC start time from DB
 * @param endTime - UTC end time from DB
 * @returns true if current station time is between start and end
 */
export function isActiveInStationTime(startTime: Date, endTime: Date): boolean {
  const now = new Date(); // Current UTC time
  return now >= startTime && now < endTime;
}

/**
 * Parse a Date object from user input, treating it as station-local time.
 * Useful for date picker values.
 * 
 * @param localDate - Date object from date picker (browser-local)
 * @param treatAsStationTime - If true, reinterpret as station time
 * @returns UTC Date for storage
 */
export function parseDateAsStationTime(localDate: Date): Date {
  const stationTz = getStationTimezone();
  
  // Extract the wall-clock time components
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, '0');
  const day = String(localDate.getDate()).padStart(2, '0');
  const hours = String(localDate.getHours()).padStart(2, '0');
  const minutes = String(localDate.getMinutes()).padStart(2, '0');
  const seconds = String(localDate.getSeconds()).padStart(2, '0');
  
  const localDateTimeStr = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  
  // Treat this wall-clock time as being in station timezone
  return fromZonedTime(localDateTimeStr, stationTz);
}
