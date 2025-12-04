import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

async function generateVariants() {
    if (!fs.existsSync(UPLOADS_DIR)) {
        console.log('Uploads directory not found.');
        return;
    }

    const files = fs.readdirSync(UPLOADS_DIR);
    console.log(`Found ${files.length} files in uploads directory.`);

    for (const file of files) {
        // Skip existing variants
        if (file.includes('_card.') || file.includes('_icon.')) {
            continue;
        }

        // Skip non-image files (basic check)
        if (!file.match(/\.(jpg|jpeg|png|webp)$/i)) {
            continue;
        }

        const filePath = path.join(UPLOADS_DIR, file);
        const fileBase = file.substring(0, file.lastIndexOf('.'));
        const extension = file.substring(file.lastIndexOf('.'));

        const cardPath = path.join(UPLOADS_DIR, `${fileBase}_card${extension}`);
        const iconPath = path.join(UPLOADS_DIR, `${fileBase}_icon${extension}`);

        // Check if variants exist
        if (fs.existsSync(cardPath) && fs.existsSync(iconPath)) {
            console.log(`Skipping ${file} (variants exist)`);
            continue;
        }

        console.log(`Processing ${file}...`);

        try {
            const buffer = fs.readFileSync(filePath);

            // Generate Card
            if (!fs.existsSync(cardPath)) {
                await sharp(buffer)
                    .resize(600, 600, { fit: 'cover' })
                    .jpeg({ quality: 80 })
                    .toFile(cardPath);
            }

            // Generate Icon
            if (!fs.existsSync(iconPath)) {
                await sharp(buffer)
                    .resize(150, 150, { fit: 'cover' })
                    .jpeg({ quality: 80 })
                    .toFile(iconPath);
            }

            console.log(`  -> Generated variants for ${file}`);
        } catch (error) {
            console.error(`  -> Failed to process ${file}:`, error);
        }
    }

    console.log('Done!');
}

generateVariants();
