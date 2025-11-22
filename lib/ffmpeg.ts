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

/**
 * Apply fade in/out effects to audio
 */
export async function applyFade(
    inputPath: string,
    outputPath: string,
    fadeIn: number = 0,
    fadeOut: number = 0
): Promise<void> {
    return new Promise((resolve, reject) => {
        const metadata = new Promise<ffmpeg.FfprobeData>((res, rej) => {
            ffmpeg.ffprobe(inputPath, (err, data) => {
                if (err) rej(err);
                else res(data);
            });
        });

        metadata.then((data) => {
            const duration = data.format.duration || 0;
            const filters: string[] = [];

            if (fadeIn > 0) {
                filters.push(`afade=t=in:st=0:d=${fadeIn}`);
            }

            if (fadeOut > 0) {
                const fadeOutStart = duration - fadeOut;
                filters.push(`afade=t=out:st=${fadeOutStart}:d=${fadeOut}`);
            }

            const command = ffmpeg(inputPath).output(outputPath);

            if (filters.length > 0) {
                command.audioFilters(filters.join(','));
            }

            command
                .on('end', () => {
                    console.log(`Fade applied successfully: ${outputPath}`);
                    resolve();
                })
                .on('error', (err) => {
                    console.error('Error applying fade:', err);
                    reject(new Error(`Failed to apply fade: ${err.message}`));
                })
                .run();
        }).catch(reject);
    });
}

/**
 * Normalize audio to standard podcast levels (-16 LUFS)
 */
export async function normalizeAudio(
    inputPath: string,
    outputPath: string,
    targetLUFS: number = -16
): Promise<void> {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .output(outputPath)
            .audioFilters(`loudnorm=I=${targetLUFS}:TP=-1.5:LRA=11`)
            .on('end', () => {
                console.log(`Audio normalized successfully: ${outputPath}`);
                resolve();
            })
            .on('error', (err) => {
                console.error('Error normalizing audio:', err);
                reject(new Error(`Failed to normalize audio: ${err.message}`));
            })
            .run();
    });
}
