/**
 * Utilities for parsing and handling schedule-related errors
 */

export interface ConflictingShow {
    title: string;
    startTime?: Date;
    endTime?: Date;
}

export interface ParsedScheduleError {
    type: 'overlap' | 'validation' | 'general';
    message: string;
    conflictingShow?: ConflictingShow;
    weekNumber?: number;
}

/**
 * Parse a schedule error message to extract structured information
 */
export function parseScheduleError(errorMessage: string): ParsedScheduleError {
    // Extract show title from patterns like: "...overlaps with \"Show Title\""
    const titleMatch = errorMessage.match(/overlaps with [""]([^""]+)[""]/) ||
        errorMessage.match(/conflicts with [""]([^""]+)[""]/) ||
        errorMessage.match(/overlap with [""]([^""]+)[""]/)

    // Extract week number from: "Week 3 first half overlaps..."
    const weekMatch = errorMessage.match(/Week (\d+)/)

    // Extract dates from: "scheduled 11/23/2025, 5:00:00 PM - 11/23/2025, 6:00:00 PM"
    const dateMatch = errorMessage.match(/scheduled (.+?) - (.+?)\)/)

    // Determine error type
    let type: 'overlap' | 'validation' | 'general' = 'general'
    if (errorMessage.toLowerCase().includes('overlap') ||
        errorMessage.toLowerCase().includes('conflict')) {
        type = 'overlap'
    } else if (errorMessage.toLowerCase().includes('duration') ||
        errorMessage.toLowerCase().includes('time')) {
        type = 'validation'
    }

    return {
        type,
        message: errorMessage,
        conflictingShow: titleMatch ? {
            title: titleMatch[1],
            startTime: dateMatch ? new Date(dateMatch[1]) : undefined,
            endTime: dateMatch ? new Date(dateMatch[2]) : undefined,
        } : undefined,
        weekNumber: weekMatch ? parseInt(weekMatch[1]) : undefined,
    }
}

/**
 * Get user-friendly suggestions based on error type
 */
export function getErrorSuggestions(parsedError: ParsedScheduleError): string[] {
    const suggestions: string[] = []

    if (parsedError.type === 'overlap') {
        suggestions.push('Choose a different time slot')
        suggestions.push('Adjust the duration to avoid the conflict')
        if (parsedError.weekNumber) {
            suggestions.push('Uncheck "Repeat Weekly" to schedule only this week')
        }
        suggestions.push('Edit or delete the conflicting show')
    } else if (parsedError.type === 'validation') {
        suggestions.push('Check that start time is before end time')
        suggestions.push('Ensure the duration is at least 15 minutes')
    } else {
        suggestions.push('Review your settings and try again')
    }

    return suggestions
}
