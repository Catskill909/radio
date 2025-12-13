import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { applyFade, normalizeAudio, backupAudioFile, getAudioDuration, trimAudio } from "@/lib/ffmpeg";
import { unlink, writeFile } from "fs/promises";

export async function POST(request: NextRequest) {
    console.log("Received request to /api/process-audio");
    try {
        const body = await request.json();
        console.log("Request body:", body);
        const { filename, operation, parameters, startTime, endTime } = body;

        // Validation
        if (!filename || !operation) {
            console.error("Missing filename or operation");
            return NextResponse.json(
                { success: false, error: "filename and operation are required" },
                { status: 400 }
            );
        }

        // Security check: prevent directory traversal
        if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
            return NextResponse.json(
                { success: false, error: "Invalid filename" },
                { status: 400 }
            );
        }

        const recordingsDir = path.join(process.cwd(), "recordings");
        const filepath = path.join(recordingsDir, filename);

        // Create backup before modifying the original
        console.log(`Creating backup of ${filename}...`);
        const backupPath = await backupAudioFile(filepath);

        // Create a temporary file for the processed audio
        const tempPath = path.join(recordingsDir, `temp_${Date.now()}_${filename}`);

        try {
            // Process based on operation type
            switch (operation) {
                case 'fade':
                    const fadeIn = parameters?.fadeIn || 0;
                    const fadeOut = parameters?.fadeOut || 0;
                    const fadeStartTime = parameters?.startTime;
                    const fadeEndTime = parameters?.endTime;

                    // If start/end time provided, apply fade to that specific section of the file
                    if (typeof fadeStartTime === 'number' && typeof fadeEndTime === 'number' && fadeEndTime > fadeStartTime) {
                        console.log(`Applying fade at position ${fadeStartTime}-${fadeEndTime}: in=${fadeIn}s, out=${fadeOut}s`);

                        // Get total duration
                        const totalDuration = await getAudioDuration(filepath);
                        const fs = await import('fs/promises');

                        // Extract section, apply fade, splice back (same pattern as normalize)
                        const tempBefore = path.join(recordingsDir, `temp_fade_before_${Date.now()}.mp3`);
                        const tempSection = path.join(recordingsDir, `temp_fade_section_${Date.now()}.mp3`);
                        const tempFaded = path.join(recordingsDir, `temp_faded_${Date.now()}.mp3`);
                        const tempAfter = path.join(recordingsDir, `temp_fade_after_${Date.now()}.mp3`);
                        const concatList = path.join(recordingsDir, `concat_fade_${Date.now()}.txt`);

                        try {
                            const hasBefore = fadeStartTime > 0.1;
                            const hasAfter = fadeEndTime < totalDuration - 0.1;

                            // Extract section
                            await trimAudio(filepath, tempSection, fadeStartTime, fadeEndTime);

                            // Apply fade to the section
                            await applyFade(tempSection, tempFaded, fadeIn, fadeOut);

                            // Build concat list
                            let concatContent = '';

                            if (hasBefore) {
                                await trimAudio(filepath, tempBefore, 0, fadeStartTime);
                                concatContent += `file '${tempBefore}'\n`;
                            }

                            concatContent += `file '${tempFaded}'\n`;

                            if (hasAfter) {
                                await trimAudio(filepath, tempAfter, fadeEndTime, totalDuration);
                                concatContent += `file '${tempAfter}'\n`;
                            }

                            await writeFile(concatList, concatContent);

                            // Concatenate
                            const ffmpegModule = await import('fluent-ffmpeg');
                            await new Promise<void>((resolve, reject) => {
                                ffmpegModule.default()
                                    .input(concatList)
                                    .inputOptions(['-f', 'concat', '-safe', '0'])
                                    .outputOptions(['-c', 'copy'])
                                    .output(tempPath)
                                    .on('end', () => resolve())
                                    .on('error', (err: Error) => reject(err))
                                    .run();
                            });
                        } finally {
                            // Cleanup temp files
                            for (const f of [tempBefore, tempSection, tempFaded, tempAfter, concatList]) {
                                try { await fs.unlink(f); } catch (e) { /* ignore */ }
                            }
                        }
                    } else {
                        // Apply fade to entire file (original behavior)
                        console.log(`Applying fade to entire ${filename}: in=${fadeIn}s, out=${fadeOut}s`);
                        await applyFade(filepath, tempPath, fadeIn, fadeOut);
                    }
                    break;

                case 'normalize':
                    const targetLUFS = parameters?.targetLUFS || -16;
                    const truePeak = parameters?.truePeak || -1.5;
                    const lra = parameters?.lra || 11;

                    // Check if normalizing a selection
                    if (typeof startTime === 'number' && typeof endTime === 'number' && endTime > startTime) {
                        console.log(`Normalizing selection of ${filename} from ${startTime}s to ${endTime}s to ${targetLUFS} LUFS`);

                        // Get total duration
                        const totalDuration = await getAudioDuration(filepath);
                        const fs = await import('fs/promises');

                        // Extract the three parts: before, selection, after
                        const tempBefore = path.join(recordingsDir, `temp_before_${Date.now()}.mp3`);
                        const tempSelection = path.join(recordingsDir, `temp_selection_${Date.now()}.mp3`);
                        const tempNormalized = path.join(recordingsDir, `temp_normalized_${Date.now()}.mp3`);
                        const tempAfter = path.join(recordingsDir, `temp_after_${Date.now()}.mp3`);
                        const concatList = path.join(recordingsDir, `concat_${Date.now()}.txt`);

                        try {
                            const hasBefore = startTime > 0.1;
                            const hasAfter = endTime < totalDuration - 0.1;

                            // Extract selection
                            await trimAudio(filepath, tempSelection, startTime, endTime);

                            // Normalize the selection
                            await normalizeAudio(tempSelection, tempNormalized, targetLUFS, truePeak, lra);

                            // Build concat list
                            let concatContent = '';

                            if (hasBefore) {
                                await trimAudio(filepath, tempBefore, 0, startTime);
                                concatContent += `file '${tempBefore}'\n`;
                            }

                            concatContent += `file '${tempNormalized}'\n`;

                            if (hasAfter) {
                                await trimAudio(filepath, tempAfter, endTime, totalDuration);
                                concatContent += `file '${tempAfter}'\n`;
                            }

                            await writeFile(concatList, concatContent);

                            // Concatenate using ffmpeg
                            const ffmpeg = await import('fluent-ffmpeg');
                            await new Promise<void>((resolve, reject) => {
                                ffmpeg.default()
                                    .input(concatList)
                                    .inputOptions(['-f', 'concat', '-safe', '0'])
                                    .output(tempPath)
                                    .audioCodec('libmp3lame')
                                    .audioBitrate('192k')
                                    .on('end', () => resolve())
                                    .on('error', (err: Error) => reject(err))
                                    .run();
                            });
                        } finally {
                            // Cleanup temp files
                            for (const f of [tempBefore, tempSelection, tempNormalized, tempAfter, concatList]) {
                                try { await unlink(f); } catch (e) { /* ignore */ }
                            }
                        }
                    } else {
                        console.log(`Normalizing ${filename} to ${targetLUFS} LUFS`);
                        await normalizeAudio(filepath, tempPath, targetLUFS, truePeak, lra);
                    }
                    break;

                default:
                    throw new Error(`Unknown operation: ${operation}`);
            }

            // Delete the original file
            await unlink(filepath);

            // Rename temp file to original filename
            const fs = await import('fs/promises');
            await fs.rename(tempPath, filepath);

            // Get the new duration
            const newDuration = await getAudioDuration(filepath);

            console.log(`Successfully processed ${filename}. New duration: ${newDuration}s`);

            return NextResponse.json({
                success: true,
                filename: filename,
                duration: newDuration,
                backupPath: path.basename(backupPath),
                operation: operation
            });
        } catch (error) {
            // If processing failed, restore from backup
            console.error("Processing failed, restoring from backup...");
            try {
                const fs = await import('fs/promises');
                await fs.copyFile(backupPath, filepath);
                // Clean up temp file if it exists
                try { await unlink(tempPath); } catch (e) { /* ignore */ }
            } catch (restoreError) {
                console.error("Failed to restore backup:", restoreError);
            }
            throw error;
        }
    } catch (error) {
        console.error("Error processing audio file:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Internal server error"
            },
            { status: 500 }
        );
    }
}

