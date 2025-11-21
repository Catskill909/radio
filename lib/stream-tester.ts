/**
 * Stream Testing Service
 * Tests Icecast/Shoutcast streams and extracts metadata
 */

export interface StreamTestResult {
    isValid: boolean
    status: 'online' | 'offline' | 'error' | 'testing'
    bitrate?: number
    format?: string
    listeners?: number
    maxListeners?: number
    genre?: string
    description?: string
    errorMessage?: string
    responseTime?: number
}

export async function testStream(url: string): Promise<StreamTestResult> {
    const startTime = Date.now()

    try {
        // Validate URL format
        const urlObj = new URL(url)
        if (!['http:', 'https:'].includes(urlObj.protocol)) {
            return {
                isValid: false,
                status: 'error',
                errorMessage: 'Invalid protocol. Only HTTP and HTTPS are supported.',
            }
        }

        // Test stream connectivity with timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

        const response = await fetch(url, {
            method: 'HEAD',
            headers: {
                'Icy-MetaData': '1', // Request Icecast metadata
                'User-Agent': 'RadioSuite/1.0',
            },
            signal: controller.signal,
        })

        clearTimeout(timeoutId)
        const responseTime = Date.now() - startTime

        // Check if response is successful
        if (!response.ok) {
            return {
                isValid: false,
                status: 'offline',
                errorMessage: `HTTP ${response.status}: ${response.statusText}`,
                responseTime,
            }
        }

        // Extract Icecast/Shoutcast metadata from headers
        const metadata = extractMetadata(response.headers)

        return {
            isValid: true,
            status: 'online',
            ...metadata,
            responseTime,
        }
    } catch (error: any) {
        const responseTime = Date.now() - startTime

        // Handle specific error types
        if (error.name === 'AbortError') {
            return {
                isValid: false,
                status: 'error',
                errorMessage: 'Connection timeout (10s)',
                responseTime,
            }
        }

        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            return {
                isValid: false,
                status: 'offline',
                errorMessage: 'Unable to connect to stream server',
                responseTime,
            }
        }

        return {
            isValid: false,
            status: 'error',
            errorMessage: error.message || 'Unknown error occurred',
            responseTime,
        }
    }
}

/**
 * Extract metadata from Icecast/Shoutcast response headers
 */
function extractMetadata(headers: Headers): Partial<StreamTestResult> {
    const metadata: Partial<StreamTestResult> = {}

    // Icecast headers
    const icyName = headers.get('icy-name')
    const icyBr = headers.get('icy-br')
    const icyGenre = headers.get('icy-genre')
    const icyDescription = headers.get('icy-description')
    const contentType = headers.get('content-type')

    // Extract bitrate
    if (icyBr) {
        metadata.bitrate = parseInt(icyBr, 10)
    }

    // Extract genre
    if (icyGenre) {
        metadata.genre = icyGenre
    }

    // Extract description (prefer icy-description, fallback to icy-name)
    if (icyDescription) {
        metadata.description = icyDescription
    } else if (icyName) {
        metadata.description = icyName
    }

    // Determine format from content-type
    if (contentType) {
        if (contentType.includes('mpeg') || contentType.includes('mp3')) {
            metadata.format = 'MP3'
        } else if (contentType.includes('aac')) {
            metadata.format = 'AAC'
        } else if (contentType.includes('ogg')) {
            metadata.format = 'OGG'
        } else if (contentType.includes('flac')) {
            metadata.format = 'FLAC'
        } else {
            metadata.format = contentType.split('/')[1]?.toUpperCase() || 'Unknown'
        }
    }

    return metadata
}

/**
 * Quick connectivity test (faster, less detailed)
 */
export async function quickTest(url: string): Promise<boolean> {
    try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

        const response = await fetch(url, {
            method: 'HEAD',
            signal: controller.signal,
        })

        clearTimeout(timeoutId)
        return response.ok
    } catch {
        return false
    }
}
