import { format as formatTz } from 'date-fns-tz';

/**
 * Client-safe version of formatInStationTime.
 * Takes timezone as a parameter instead of reading from file system.
 * 
 * @param date - Date object to format
 * @param formatStr - date-fns format string
 * @param timezone - IANA timezone string (e.g., "America/New_York")
 * @returns Formatted string in specified timezone
 */
export function formatInTimezone(
    date: Date,
    formatStr: string,
    timezone: string
): string {
    try {
        return formatTz(date, formatStr, { timeZone: timezone });
    } catch (e) {
        // Fallback to UTC if timezone is invalid
        return formatTz(date, formatStr, { timeZone: 'UTC' });
    }
}
