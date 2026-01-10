import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const GALLERY_DIR = path.join(process.cwd(), 'images', 'gallery');
const THUMBS_DIR = path.join(GALLERY_DIR, 'thumbs');

// Thumbnail width for gallery grid
const THUMB_WIDTH = 400;

async function generateThumbnails() {
    // Check if gallery directory exists
    if (!fs.existsSync(GALLERY_DIR)) {
        console.log('Gallery directory not found at:', GALLERY_DIR);
        return;
    }

    // Create thumbs directory if it doesn't exist
    if (!fs.existsSync(THUMBS_DIR)) {
        fs.mkdirSync(THUMBS_DIR, { recursive: true });
        console.log('Created thumbs directory:', THUMBS_DIR);
    }

    // Get all image files (excluding the thumbs directory)
    const files = fs.readdirSync(GALLERY_DIR).filter(file => {
        const filePath = path.join(GALLERY_DIR, file);
        return fs.statSync(filePath).isFile() && file.match(/\.(png|jpg|jpeg|webp)$/i);
    });

    // Sort files numerically by the leading number
    files.sort((a, b) => {
        const numA = parseInt(a.split('-')[0], 10);
        const numB = parseInt(b.split('-')[0], 10);
        return numA - numB;
    });

    console.log(`Found ${files.length} gallery images to process.`);

    let generated = 0;
    let skipped = 0;

    for (const file of files) {
        const inputPath = path.join(GALLERY_DIR, file);

        // Output as JPEG for better compression
        const baseName = file.substring(0, file.lastIndexOf('.'));
        const thumbName = `${baseName}_thumb.jpg`;
        const outputPath = path.join(THUMBS_DIR, thumbName);

        // Skip if thumbnail already exists
        if (fs.existsSync(outputPath)) {
            console.log(`Skipping ${file} (thumbnail exists)`);
            skipped++;
            continue;
        }

        try {
            const buffer = fs.readFileSync(inputPath);

            await sharp(buffer)
                .resize(THUMB_WIDTH, null, {
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .jpeg({ quality: 85 })
                .toFile(outputPath);

            const originalSize = fs.statSync(inputPath).size;
            const thumbSize = fs.statSync(outputPath).size;
            const reduction = Math.round((1 - thumbSize / originalSize) * 100);

            console.log(`  ✓ ${file} => ${thumbName} (${reduction}% smaller)`);
            generated++;
        } catch (error) {
            console.error(`  ✗ Failed to process ${file}:`, error);
        }
    }

    console.log('');
    console.log(`Done! Generated: ${generated}, Skipped: ${skipped}`);
    console.log(`Thumbnails saved to: ${THUMBS_DIR}`);
}

generateThumbnails();
