import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import { mkdir } from "fs/promises";
import sharp from "sharp";

export async function POST(request: NextRequest) {
    const data = await request.formData();
    const file: File | null = data.get("file") as unknown as File;

    if (!file) {
        return NextResponse.json({ success: false }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure uploads directory exists
    const uploadDir = path.join(process.cwd(), "uploads");
    try {
        await mkdir(uploadDir, { recursive: true });
    } catch (e) {
        // Ignore error if directory exists
    }

    // Create unique filename
    const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
    const filepath = path.join(uploadDir, filename);

    // Save original
    await writeFile(filepath, buffer);
    console.log(`Uploaded file to ${filepath}`);

    // Generate variants
    try {
        const fileBase = filename.substring(0, filename.lastIndexOf('.'));
        const extension = filename.substring(filename.lastIndexOf('.')); // includes dot

        // Card variant (600x600)
        await sharp(buffer)
            .resize(600, 600, { fit: 'cover' })
            .jpeg({ quality: 80 })
            .toFile(path.join(uploadDir, `${fileBase}_card${extension}`));

        // Icon variant (150x150)
        await sharp(buffer)
            .resize(150, 150, { fit: 'cover' })
            .jpeg({ quality: 80 })
            .toFile(path.join(uploadDir, `${fileBase}_icon${extension}`));

        console.log(`Generated variants for ${filename}`);
    } catch (error) {
        console.error("Error generating image variants:", error);
        // We don't fail the upload if variants fail, just log it
    }

    // Return the public URL
    return NextResponse.json({
        success: true,
        url: `/uploads/${filename}`
    });
}
