export type ImageVariant = 'card' | 'icon' | 'original';

/**
 * Returns the URL for a specific image variant.
 * 
 * @param url The original image URL (e.g., "/uploads/image.jpg")
 * @param variant The desired variant ('card', 'icon', 'original')
 * @returns The URL for the variant, or the original if external/null
 */
export function getImageUrl(url: string | null | undefined, variant: ImageVariant = 'original'): string | null {
    if (!url) return null;

    // If it's an external URL (http/https), return as is
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }

    // If it's not in the uploads directory, return as is (e.g. /default-show.png)
    if (!url.startsWith('/uploads/')) {
        return url;
    }

    // If original is requested, return as is
    if (variant === 'original') {
        return url;
    }

    // Split the extension
    const lastDotIndex = url.lastIndexOf('.');
    if (lastDotIndex === -1) return url;

    const basePath = url.substring(0, lastDotIndex);
    const extension = url.substring(lastDotIndex);

    // Append variant suffix
    return `${basePath}_${variant}${extension}`;
}
