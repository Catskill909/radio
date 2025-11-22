import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
    try {
        const data = await request.formData();
        const file: File | null = data.get("file") as unknown as File;
        const filename: string | null = data.get("filename") as string;

        if (!file || !filename) {
            return NextResponse.json({ success: false, error: "File and filename are required" }, { status: 400 });
        }

        // Security check: prevent directory traversal
        if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
            return NextResponse.json({ success: false, error: "Invalid filename" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Save to recordings directory, overwriting existing file
        const recordingsDir = path.join(process.cwd(), "recordings");
        const filepath = path.join(recordingsDir, filename);

        await writeFile(filepath, buffer);
        console.log(`Overwritten audio file at ${filepath}`);

        return NextResponse.json({
            success: true,
            filename: filename,
            size: file.size
        });
    } catch (error) {
        console.error("Error saving audio file:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
