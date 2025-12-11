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
 * Delete a section of audio (keep the parts before and after)
 * Uses FFmpeg to extract and concatenate the portions outside the selection
 */
export async function deleteSection(
    inputPath: string,
    outputPath: string,
    startTime: number,
    endTime: number
): Promise<void> {
    const fs = await import('fs/promises');
    const path = await import('path');

    // Get total duration first
    const totalDuration = await getAudioDuration(inputPath);

    // If selection starts at 0, just keep the end portion
    if (startTime <= 0.1) {
        return new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .setStartTime(endTime)
                .output(outputPath)
                .audioCodec('copy')
                .on('end', () => {
                    console.log(`Audio section deleted (kept end): ${outputPath}`);
                    resolve();
                })
                .on('error', (err) => {
                    reject(new Error(`Failed to delete section: ${err.message}`));
                })
                .run();
        });
    }

    // If selection ends at duration, just keep the start portion
    if (endTime >= totalDuration - 0.1) {
        return new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .setDuration(startTime)
                .output(outputPath)
                .audioCodec('copy')
                .on('end', () => {
                    console.log(`Audio section deleted (kept start): ${outputPath}`);
                    resolve();
                })
                .on('error', (err) => {
                    reject(new Error(`Failed to delete section: ${err.message}`));
                })
                .run();
        });
    }

    // Otherwise, we need to extract before and after, then concatenate
    const dir = path.dirname(inputPath);
    const tempBefore = path.join(dir, `temp_before_${Date.now()}.mp3`);
    const tempAfter = path.join(dir, `temp_after_${Date.now()}.mp3`);
    const concatList = path.join(dir, `concat_${Date.now()}.txt`);

    try {
        // Extract the "before" portion
        await new Promise<void>((resolve, reject) => {
            ffmpeg(inputPath)
                .setDuration(startTime)
                .output(tempBefore)
                .audioCodec('copy')
                .on('end', () => resolve())
                .on('error', (err) => reject(new Error(`Failed to extract before: ${err.message}`)))
                .run();
        });

        // Extract the "after" portion
        await new Promise<void>((resolve, reject) => {
            ffmpeg(inputPath)
                .setStartTime(endTime)
                .output(tempAfter)
                .audioCodec('copy')
                .on('end', () => resolve())
                .on('error', (err) => reject(new Error(`Failed to extract after: ${err.message}`)))
                .run();
        });

        // Create concat list file
        await fs.writeFile(concatList, `file '${tempBefore}'\nfile '${tempAfter}'`);

        // Concatenate the two parts
        await new Promise<void>((resolve, reject) => {
            ffmpeg()
                .input(concatList)
                .inputOptions(['-f', 'concat', '-safe', '0'])
                .output(outputPath)
                .audioCodec('copy')
                .on('end', () => {
                    console.log(`Audio section deleted successfully: ${outputPath}`);
                    resolve();
                })
                .on('error', (err) => {
                    reject(new Error(`Failed to concatenate: ${err.message}`));
                })
                .run();
        });
    } finally {
        // Cleanup temp files
        try {
            await fs.unlink(tempBefore);
        } catch (e) { /* ignore */ }
        try {
            await fs.unlink(tempAfter);
        } catch (e) { /* ignore */ }
        try {
            await fs.unlink(concatList);
        } catch (e) { /* ignore */ }
    }
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
