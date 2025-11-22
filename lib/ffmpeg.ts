import ffmpeg from 'fluent-ffmpeg';
import { promisify } from 'util';

/**
 * Get audio duration in seconds using ffprobe
 */
export async function getAudioDuration(filePath: string): Promise<number> {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
            if (err) {
                reject(new Error(`Failed to get audio duration: ${err.message}`));
                return;
            }
            const duration = metadata.format.duration;
            if (typeof duration === 'number') {
                resolve(duration);
            } else {
                reject(new Error('Duration not found in metadata'));
            }
        });
    });
}

/**
 * Get complete audio metadata using ffprobe
 */
export async function getAudioMetadata(filePath: string): Promise<ffmpeg.FfprobeData> {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
            if (err) {
                reject(new Error(`Failed to get audio metadata: ${err.message}`));
                return;
            }
            resolve(metadata);
        });
    });
}

/**
 * Trim audio file from startTime to endTime (in seconds)
 * Overwrites the original file with the trimmed version
 */
export async function trimAudio(
    inputPath: string,
    outputPath: string,
    startTime: number,
    endTime: number
): Promise<void> {
    return new Promise((resolve, reject) => {
        const duration = endTime - startTime;

        ffmpeg(inputPath)
            .setStartTime(startTime)
            .setDuration(duration)
            .output(outputPath)
            .audioCodec('copy') // Copy audio codec to avoid re-encoding (faster, no quality loss)
            .on('end', () => {
                console.log(`Audio trimmed successfully: ${outputPath}`);
                resolve();
            })
            .on('error', (err) => {
                console.error('Error trimming audio:', err);
                reject(new Error(`Failed to trim audio: ${err.message}`));
            })
            .run();
    });
}

/**
 * Create a backup of an audio file
 */
export async function backupAudioFile(filePath: string): Promise<string> {
    const fs = await import('fs/promises');
    const path = await import('path');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const dir = path.dirname(filePath);
    const ext = path.extname(filePath);
    const basename = path.basename(filePath, ext);
    const backupPath = path.join(dir, `${basename}.backup_${timestamp}${ext}`);

    await fs.copyFile(filePath, backupPath);
    console.log(`Backup created: ${backupPath}`);

    return backupPath;
}
