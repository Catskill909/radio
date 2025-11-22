import { NextRequest, NextResponse } from "next/server";
import { writeFile, unlink } from "fs/promises";
import path from "path";
import { mkdir } from "fs/promises";
import ffmpeg from "fluent-ffmpeg";

export async function POST(request: NextRequest) {
    const data = await request.formData();
    const file: File | null = data.get("file") as unknown as File;

    if (!file) {
        return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/x-m4a", "audio/m4a", "audio/ogg"];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|m4a|ogg)$/i)) {
        return NextResponse.json({
            success: false,
            error: "Invalid file type. Please upload an audio file (mp3, wav, m4a, or ogg)"
        }, { status: 400 });
    }

    // Validate file size (500MB max)
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
        return NextResponse.json({
            success: false,
            error: "File too large. Maximum size is 500MB"
        }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure recordings directory exists
    const recordingsDir = path.join(process.cwd(), "recordings");
    try {
        await mkdir(recordingsDir, { recursive: true });
    } catch (e) {
        // Ignore error if directory exists
    }

    // Create unique filename
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, "_");
    const filename = `${timestamp}-${sanitizedName}`;
    const filepath = path.join(recordingsDir, filename);

    await writeFile(filepath, buffer);
    console.log(`Uploaded audio file to ${filepath}`);

    // Extract duration using ffprobe
    let duration = 0;
    try {
        duration = await new Promise<number>((resolve, reject) => {
            ffmpeg.ffprobe(filepath, (err, metadata) => {
                if (err) {
                    console.error("Error extracting audio duration:", err);
                    reject(err);
                } else {
                    const durationInSeconds = Math.floor(metadata.format.duration || 0);
                    resolve(durationInSeconds);
                }
            });
        });
    } catch (error) {
        console.error("Failed to extract duration:", error);
        // Continue without duration - it can be null
    }

    // Return the file info
    return NextResponse.json({
        success: true,
        filename: filename,
        duration: duration,
        size: file.size
    });
}
