/**
 * Filename utilities for generating safe, human-readable recording filenames
 */

/**
 * Sanitizes a string for safe use in filenames
 * - Removes/replaces special characters that are problematic in file systems
 * - Handles Windows, macOS, and Linux filename restrictions
 */
export function sanitizeFilename(name: string): string {
    return name
        .replace(/[<>:"\/\\|?*\x00-\x1F]/g, '') // Remove invalid characters
        .replace(/\s+/g, ' ')                    // Normalize whitespace
        .trim()                                   // Remove leading/trailing spaces
        .substring(0, 200)                        // Limit length to prevent issues
}

/**
 * Generates a unique filename for a recording
 * Format: [Show Title] - [YYYY-MM-DD] - [HHmm].[extension]
 * 
 * @param showTitle - The title of the show being recorded
 * @param recordingDate - The date/time the recording started
 * @param codec - The audio codec being used (e.g., 'libmp3lame', 'aac')
 * @returns A sanitized, unique filename with appropriate extension
 */
export function generateRecordingFilename(
    showTitle: string,
    recordingDate: Date,
    codec: string
): string {
    const sanitizedTitle = sanitizeFilename(showTitle)
    const dateStr = recordingDate.toISOString().split('T')[0] // YYYY-MM-DD

    // Get file extension based on codec
    const ext = getExtensionForCodec(codec)

    // Format: [Show Title] - [YYYY-MM-DD].[extension]
    return `${sanitizedTitle} - ${dateStr}.${ext}`
}

/**
 * Maps audio codec names to file extensions
 */
function getExtensionForCodec(codec: string): string {
    const codecMap: Record<string, string> = {
        'libmp3lame': 'mp3',
        'aac': 'aac',
        'libopus': 'opus',
        'flac': 'flac',
    }
    return codecMap[codec] || 'mp3'
}
