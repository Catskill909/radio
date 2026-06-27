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
    errorMessage?: string | null
    responseTime?: number
}

/**
 * Detect bitrate by analyzing actual stream data
 * Works even when server doesn't provide icy-br header
 */
async function detectBitrateFromStream(url: string): Promise<number | undefined> {
    try {
        console.log('🔍 Analyzing stream to detect bitrate...');

        // Capture 5 seconds of audio to measure bitrate
        const captureDurationMs = 5000;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(url, {
            headers: { 'User-Agent': 'RadioSuite/1.0' },
            signal: controller.signal,
        });

        if (!response.ok) {
            clearTimeout(timeoutId);
            return undefined;
        }

        const reader = response.body?.getReader();
        if (!reader) {
            clearTimeout(timeoutId);
            return undefined;
        }

        let totalBytes = 0;
        const captureStart = Date.now();

        // Capture data for specified duration
        while (Date.now() - captureStart < captureDurationMs) {
            const { done, value } = await reader.read();
            if (done) break;
            totalBytes += value.length;
        }

        reader.cancel();
        clearTimeout(timeoutId);

        const actualDuration = (Date.now() - captureStart) / 1000; // seconds

        // Calculate bitrate: (bytes * 8 bits) / seconds / 1000 = kbps
        const bitrate = Math.round((totalBytes * 8) / actualDuration / 1000);

        console.log(`📊 Detected bitrate: ${bitrate}kbps (captured ${totalBytes} bytes in ${actualDuration.toFixed(1)}s)`);

        // Sanity check: bitrate should be between 32 and 512 kbps for most streams
        if (bitrate >= 32 && bitrate <= 512) {
            return bitrate;
        }

        console.log(`⚠️ Detected bitrate ${bitrate}kbps outside expected range, ignoring`);
        return undefined;
    } catch (error) {
        console.log('⚠️ Could not detect bitrate from stream:', error);
        return undefined;
    }
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

        let response = await fetch(url, {
            method: 'HEAD',
            headers: {
                'Icy-MetaData': '1', // Request Icecast metadata
                'User-Agent': 'RadioSuite/1.0',
            },
            signal: controller.signal,
        })

        // Some Icecast/AzuraCast mounts return 404/405/501 for HEAD requests even
        // though the stream is live. Fall back to GET before declaring it offline.
        if (!response.ok) {
            console.log(`⚠️ HEAD returned HTTP ${response.status} for ${url}, retrying with GET...`);
            const getController = new AbortController()
            const getTimeoutId = setTimeout(() => getController.abort(), 10000)
            try {
                response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Icy-MetaData': '1',
                        'User-Agent': 'RadioSuite/1.0',
                    },
                    signal: getController.signal,
                })
                // Only the headers are needed here; cancel the body so we don't
                // download the live stream indefinitely.
                response.body?.cancel().catch(() => { })
            } finally {
                clearTimeout(getTimeoutId)
            }
        }

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

        // If bitrate wasn't in headers, detect it by analyzing the stream
        if (!metadata.bitrate) {
            console.log('⚠️ Bitrate not in headers, analyzing stream data...');
            metadata.bitrate = await detectBitrateFromStream(url);
        }

        return {
            isValid: true,
            status: 'online',
            ...metadata,
            errorMessage: null,
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
