/**
 * ACRCloud Song Recognition Utilities
 * 
 * Ported from song-api/server/index.js
 * Provides functions for audio fingerprinting and song identification.
 */

import crypto from 'crypto';

// Types
export interface ACRCloudCredentials {
    host: string;
    accessKey: string;
    accessSecret: string;
}

export interface ACRCloudSong {
    title: string;
    artist: string;
    album?: string;
    coverArt?: string;
    releaseDate?: string;
    identifiedAt: string;
}

export interface ACRCloudResult {
    success: boolean;
    song?: ACRCloudSong;
    error?: string;
    code?: number;
}

/**
 * Generate HMAC-SHA1 signature for ACRCloud API authentication
 * @see https://docs.acrcloud.com/reference/identification-api
 */
export function generateSignature(
    accessKey: string,
    accessSecret: string,
    timestamp: string
): string {
    const httpMethod = 'POST';
    const httpUri = '/v1/identify';
    const dataType = 'audio';
    const signatureVersion = '1';

    const stringToSign = [
        httpMethod,
        httpUri,
        accessKey,
        dataType,
        signatureVersion,
        timestamp
    ].join('\n');

    const signature = crypto
        .createHmac('sha1', accessSecret)
        .update(stringToSign)
        .digest('base64');

    return signature;
}

/**
 * Fetch album cover art from Deezer API
 */
async function fetchDeezerCover(albumId: string): Promise<string | null> {
    try {
        const response = await fetch(`https://api.deezer.com/album/${albumId}`);
        const data = await response.json();
        return data.cover_xl || data.cover_big || data.cover_medium || null;
    } catch (error) {
        console.log('Deezer cover fetch failed:', error);
        return null;
    }
}

/**
 * Fetch album cover art from iTunes Search API (fallback)
 */
async function fetchItunesCover(artist: string, title: string): Promise<string | null> {
    try {
        const query = encodeURIComponent(`${artist} ${title}`);
        const response = await fetch(`https://itunes.apple.com/search?term=${query}&media=music&limit=1`);
        const data = await response.json();

        if (data.results?.[0]?.artworkUrl100) {
            // Get higher resolution artwork (600x600 instead of 100x100)
            return data.results[0].artworkUrl100.replace('100x100', '600x600');
        }
        return null;
    } catch (error) {
        console.log('iTunes cover fetch failed:', error);
        return null;
    }
}

/**
 * Fetch cover art from available sources
 */
export async function fetchCoverArt(
    artist: string,
    title: string,
    externalMetadata?: { deezer?: { album?: { id: string } } }
): Promise<string | null> {
    // Try Deezer first if we have album ID
    if (externalMetadata?.deezer?.album?.id) {
        const deezerCover = await fetchDeezerCover(externalMetadata.deezer.album.id);
        if (deezerCover) return deezerCover;
    }

    // Fall back to iTunes search
    return fetchItunesCover(artist, title);
}

/**
 * Capture audio from stream and identify song via ACRCloud
 * @param streamUrl - URL of the audio stream to identify
 * @param credentials - ACRCloud API credentials
 * @param streamBitrate - Optional bitrate of the stream in kbps (e.g., 128, 320)
 */
export async function identifySong(
    streamUrl: string,
    credentials: ACRCloudCredentials,
    streamBitrate?: number
): Promise<ACRCloudResult> {
    const { host, accessKey, accessSecret } = credentials;

    // Validate credentials
    if (!accessKey || !accessSecret || !host) {
        return {
            success: false,
            error: 'ACRCloud credentials not configured',
            code: -1
        };
    }

    try {
        // Use provided bitrate or default to 128kbps
        const bitrateKbps = streamBitrate || 128;
        console.log(`🎧 Capturing live audio from stream (${bitrateKbps}kbps)...`);

        // ACRCloud optimal settings: 10 seconds is the recommended duration
        // This provides the best balance of accuracy, speed, and bandwidth
        const captureDurationSeconds = 10; // ACRCloud optimal recommendation
        const maxCaptureSizeKB = 500; // ACRCloud recommends under 1MB
        const bytesPerSecond = (bitrateKbps * 1000) / 8;
        const targetBytes = captureDurationSeconds * bytesPerSecond;
        const captureBytes = Math.min(targetBytes, maxCaptureSizeKB * 1024);
        const chunks: Uint8Array[] = [];
        let totalBytes = 0;

        console.log(`📊 Target capture: ${captureBytes} bytes (${captureDurationSeconds} seconds)`);

        // Fetch audio from stream
        const streamResponse = await fetch(streamUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; StationDock/1.0)' }
        });

        if (!streamResponse.ok) {
            throw new Error(`Stream fetch failed: ${streamResponse.status}`);
        }

        const reader = streamResponse.body?.getReader();
        if (!reader) {
            throw new Error('Could not read stream');
        }

        // Capture audio
        const startTime = Date.now();
        while (totalBytes < captureBytes) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
            totalBytes += value.length;
        }
        const captureTime = (Date.now() - startTime) / 1000;
        reader.cancel();

        // Combine chunks into a single buffer
        const audioBuffer = Buffer.concat(chunks.map(chunk => Buffer.from(chunk)));

        // Calculate actual duration captured
        const actualDuration = audioBuffer.length / bytesPerSecond;

        // Enhanced diagnostic logging
        console.log(`📤 Captured ${audioBuffer.length} bytes in ${captureTime.toFixed(1)}s`);
        console.log(`📊 Stream bitrate: ${bitrateKbps}kbps | Duration: 10s (optimized) | Actual: ~${actualDuration.toFixed(1)}s`);
        console.log(`🎯 Recognition mode: recorded audio (live stream optimization)`);

        // Generate signature
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const signature = generateSignature(accessKey, accessSecret, timestamp);

        // Build form data
        const formData = new FormData();
        formData.append('sample', new Blob([audioBuffer], { type: 'audio/mpeg' }), 'sample.mp3');
        formData.append('access_key', accessKey);
        formData.append('sample_bytes', audioBuffer.length.toString());
        formData.append('timestamp', timestamp);
        formData.append('signature', signature);
        formData.append('data_type', 'audio');
        formData.append('audio_data_type', 'recorded'); // CRITICAL: Use 'recorded' mode for live streams with noise
        formData.append('audio_format', 'mp3'); // Explicit format hint for decoder
        formData.append('signature_version', '1');

        // Send to ACRCloud
        const acrUrl = `https://${host}/v1/identify`;
        console.log(`🌐 Sending to ACRCloud: ${acrUrl}`);

        const acrResponse = await fetch(acrUrl, {
            method: 'POST',
            body: formData
        });

        const result = await acrResponse.json();
        console.log('📋 ACRCloud status:', result.status?.code, result.status?.msg);

        // Check for success
        if (result.status?.code === 0 && result.metadata?.music?.[0]) {
            const music = result.metadata.music[0];
            const artist = music.artists?.[0]?.name || 'Unknown Artist';
            const title = music.title || 'Unknown Title';

            // Fetch cover art
            const coverArt = await fetchCoverArt(
                artist,
                title,
                music.external_metadata
            );

            return {
                success: true,
                song: {
                    title,
                    artist,
                    album: music.album?.name,
                    coverArt: coverArt || undefined,
                    releaseDate: music.release_date,
                    identifiedAt: new Date().toISOString()
                }
            };
        }

        // Song not found or error
        const statusMessages: Record<number, string> = {
            1001: 'Song not found in database',
            2000: 'Recording error',
            2001: 'Fingerprint generation failed',
            2004: 'Unable to generate fingerprint',
            2005: 'Timeout',
            3001: 'Access key error',
            3003: 'API limit exceeded',
            3014: 'Invalid signature',
            3015: 'Rate limit exceeded'
        };

        return {
            success: false,
            error: statusMessages[result.status?.code] || result.status?.msg || 'Unknown error',
            code: result.status?.code
        };

    } catch (error) {
        console.error('ACRCloud identification error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to identify song',
            code: -1
        };
    }
}
