# Photo Gallery Component - Handoff Documentation

A modern, Material Design-inspired photo gallery modal with lightbox functionality. Built with vanilla HTML/CSS/JS for easy portability.

## Features

- **Thumbnail Grid** - Responsive masonry-style grid with hover effects
- **Full-size Lightbox** - Click to view full images with smooth transitions
- **Keyboard Navigation** - Arrow keys, Escape to close
- **Mobile Responsive** - Adapts to all screen sizes
- **Lazy Loading** - Thumbnails load on demand
- **Dark Theme** - Modern dark UI with cyan accents

---

## Quick Start

### 1. Add Required Dependencies

```html
<!-- Google Fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Raleway:wght@600;700&display=swap" rel="stylesheet">

<!-- Font Awesome Icons -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
```

### 2. Add the HTML Structure

```html
<!-- Gallery Button -->
<div class="gallery-button-container">
    <button class="gallery-button" onclick="openGallery()">
        <i class="fas fa-images"></i>
        <span>View App Screenshots</span>
    </button>
</div>

<!-- Gallery Modal -->
<div id="galleryModal" class="gallery-modal" role="dialog" aria-modal="true" aria-labelledby="galleryTitle">
    <div class="gallery-backdrop" onclick="closeGallery()"></div>
    <div class="gallery-container">
        <div class="gallery-header">
            <h2 id="galleryTitle"><i class="fas fa-images"></i> App Screenshots</h2>
            <button class="gallery-close" onclick="closeGallery()" aria-label="Close gallery">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="gallery-content">
            <div class="gallery-grid" id="galleryGrid"></div>
        </div>
    </div>
</div>

<!-- Lightbox -->
<div id="lightbox" class="lightbox" role="dialog" aria-modal="true">
    <button class="lightbox-close" onclick="closeLightbox()" aria-label="Close image">
        <i class="fas fa-times"></i>
    </button>
    <button class="lightbox-nav lightbox-prev" onclick="navigateLightbox(-1)" aria-label="Previous image">
        <i class="fas fa-chevron-left"></i>
    </button>
    <button class="lightbox-nav lightbox-next" onclick="navigateLightbox(1)" aria-label="Next image">
        <i class="fas fa-chevron-right"></i>
    </button>
    <div class="lightbox-content">
        <img id="lightboxImage" src="" alt="">
        <div class="lightbox-caption" id="lightboxCaption"></div>
    </div>
    <div class="lightbox-counter" id="lightboxCounter"></div>
</div>
```

---

## CSS Styles

### Color Palette

```css
/* Primary Colors */
--bg-dark: #0a0a0a;
--bg-card: #151515;
--bg-modal: rgba(21, 21, 21, 0.95);
--border-subtle: #252525;
--border-hover: #3a3a3a;

/* Accent Colors */
--accent-cyan: #22d3ee;
--accent-blue: #60a5fa;
--accent-blue-light: #93c5fd;

/* Text Colors */
--text-primary: #e5e5e5;
--text-secondary: #999;
--text-muted: #888;
```

### Gallery Button

```css
.gallery-button-container {
    display: flex;
    justify-content: center;
    margin-bottom: 2.5rem;
}

.gallery-button {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.875rem 1.75rem;
    font-family: 'Inter', sans-serif;
    font-size: 1rem;
    font-weight: 500;
    color: #60a5fa;
    background: transparent;
    border: 1px solid #3b82f6;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.gallery-button:hover {
    background: rgba(59, 130, 246, 0.1);
    border-color: #60a5fa;
    color: #93c5fd;
}

.gallery-button:active {
    transform: scale(0.98);
}

.gallery-arrow {
    transition: transform 0.2s ease;
}

.gallery-button:hover .gallery-arrow {
    transform: translateX(3px);
}
```

### Gallery Modal

```css
.gallery-modal {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.3s ease, visibility 0.3s ease;
}

.gallery-modal.active {
    opacity: 1;
    visibility: visible;
}

.gallery-backdrop {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(8px);
}

.gallery-container {
    position: relative;
    width: 90vw;
    max-width: 1200px;
    max-height: 90vh;
    background: rgba(21, 21, 21, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    transform: scale(0.95) translateY(20px);
    transition: transform 0.3s ease;
    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.6);
}

.gallery-modal.active .gallery-container {
    transform: scale(1) translateY(0);
}

.gallery-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(0, 0, 0, 0.3);
}

.gallery-header h2 {
    font-family: 'Raleway', sans-serif;
    font-size: 1.25rem;
    font-weight: 700;
    color: #fff;
    display: flex;
    align-items: center;
    gap: 0.6rem;
}

.gallery-header h2 i {
    color: #22d3ee;
}

.gallery-close {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    color: #999;
    cursor: pointer;
    transition: all 0.2s ease;
}

.gallery-close:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
    border-color: rgba(255, 255, 255, 0.2);
}

.gallery-content {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
}

/* Custom Scrollbar */
.gallery-content::-webkit-scrollbar {
    width: 8px;
}

.gallery-content::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.02);
}

.gallery-content::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
}

.gallery-content::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.2);
}
```

### Gallery Grid Items

```css
.gallery-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 1rem;
}

.gallery-item {
    position: relative;
    aspect-ratio: 16/10;
    border-radius: 12px;
    overflow: hidden;
    cursor: pointer;
    background: #0a0a0a;
    border: 1px solid rgba(255, 255, 255, 0.06);
    transition: all 0.3s ease;
}

.gallery-item:hover {
    transform: translateY(-4px);
    border-color: rgba(34, 211, 238, 0.4);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
}

.gallery-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s ease;
}

.gallery-item:hover img {
    transform: scale(1.05);
}

.gallery-item-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 1rem;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0) 100%);
    transform: translateY(100%);
    transition: transform 0.3s ease;
}

.gallery-item:hover .gallery-item-overlay {
    transform: translateY(0);
}

.gallery-item-title {
    font-family: 'Inter', sans-serif;
    font-size: 0.85rem;
    font-weight: 600;
    color: #fff;
    display: flex;
    align-items: center;
    gap: 0.4rem;
}

.gallery-item-title i {
    color: #22d3ee;
    font-size: 0.75rem;
}
```

### Lightbox

```css
.lightbox {
    position: fixed;
    inset: 0;
    z-index: 1100;
    background: rgba(0, 0, 0, 0.95);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.3s ease, visibility 0.3s ease;
}

.lightbox.active {
    opacity: 1;
    visibility: visible;
}

.lightbox-content {
    max-width: 90vw;
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.lightbox-content img {
    max-width: 100%;
    max-height: 80vh;
    object-fit: contain;
    border-radius: 8px;
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
    transition: opacity 0.4s ease-in-out, transform 0.4s ease-in-out;
}

.lightbox-content img.fade-out {
    opacity: 0;
    transform: scale(0.98);
}

.lightbox-caption {
    margin-top: 1rem;
    font-family: 'Inter', sans-serif;
    font-size: 1rem;
    font-weight: 600;
    color: #fff;
    text-align: center;
    transition: opacity 0.4s ease-in-out;
}

.lightbox-close {
    position: absolute;
    top: 1.5rem;
    right: 1.5rem;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 12px;
    color: #fff;
    font-size: 1.25rem;
    cursor: pointer;
    transition: all 0.2s ease;
}

.lightbox-close:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: rotate(90deg);
}

.lightbox-nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 56px;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 50%;
    color: #fff;
    font-size: 1.25rem;
    cursor: pointer;
    transition: all 0.2s ease;
}

.lightbox-nav:hover {
    background: rgba(34, 211, 238, 0.3);
    border-color: rgba(34, 211, 238, 0.5);
}

.lightbox-prev {
    left: 1.5rem;
}

.lightbox-next {
    right: 1.5rem;
}

.lightbox-counter {
    position: absolute;
    bottom: 1.5rem;
    left: 50%;
    transform: translateX(-50%);
    font-family: 'Inter', sans-serif;
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.6);
    background: rgba(0, 0, 0, 0.5);
    padding: 0.5rem 1rem;
    border-radius: 20px;
}
```

### Mobile Responsive

```css
@media (max-width: 768px) {
    .gallery-container {
        width: 95vw;
        max-height: 95vh;
        border-radius: 16px;
    }

    .gallery-grid {
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
        gap: 0.75rem;
    }

    .gallery-item-overlay {
        transform: translateY(0); /* Always visible on mobile */
        padding: 0.75rem;
    }

    .lightbox-nav {
        width: 44px;
        height: 44px;
    }

    .lightbox-prev {
        left: 0.75rem;
    }

    .lightbox-next {
        right: 0.75rem;
    }
}
```

---

## JavaScript

```javascript
// Image data array - customize with your images
const screenshots = [
    { file: '1-front-1.png', title: 'Public Listen Page', icon: 'fa-headphones' },
    { file: '2-front-2.png', title: 'Listen Page - Now Playing', icon: 'fa-headphones' },
    // ... add more images
];

let currentLightboxIndex = 0;

// Initialize gallery grid
function initGallery() {
    const grid = document.getElementById('galleryGrid');
    if (!grid) return;

    // Helper to get thumbnail path from original filename
    const getThumbPath = (file) => {
        const baseName = file.substring(0, file.lastIndexOf('.'));
        return `/images/gallery/thumbs/${baseName}_thumb.jpg`;
    };

    grid.innerHTML = screenshots.map((item, index) => `
        <div class="gallery-item" onclick="openLightbox(${index})" tabindex="0" 
             onkeydown="if(event.key==='Enter')openLightbox(${index})">
            <img src="${getThumbPath(item.file)}" alt="${item.title}" loading="lazy">
            <div class="gallery-item-overlay">
                <div class="gallery-item-title">
                    <i class="fas ${item.icon}"></i>
                    ${item.title}
                </div>
            </div>
        </div>
    `).join('');
}

// Gallery modal functions
function openGallery() {
    const modal = document.getElementById('galleryModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    initGallery();
}

function closeGallery() {
    const modal = document.getElementById('galleryModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// Lightbox functions
function openLightbox(index) {
    currentLightboxIndex = index;
    const lightbox = document.getElementById('lightbox');
    const image = document.getElementById('lightboxImage');
    const caption = document.getElementById('lightboxCaption');
    const counter = document.getElementById('lightboxCounter');

    const item = screenshots[index];
    image.src = `/images/gallery/${item.file}`;
    image.alt = item.title;
    caption.innerHTML = `<i class="fas ${item.icon}" style="color: #22d3ee; margin-right: 0.5rem;"></i>${item.title}`;
    counter.textContent = `${index + 1} / ${screenshots.length}`;

    lightbox.classList.add('active');
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    lightbox.classList.remove('active');
}

function navigateLightbox(direction) {
    const image = document.getElementById('lightboxImage');
    const caption = document.getElementById('lightboxCaption');

    // Add fade-out class
    image.classList.add('fade-out');
    caption.style.opacity = '0';

    // Wait for fade-out, then swap image
    setTimeout(() => {
        currentLightboxIndex = (currentLightboxIndex + direction + screenshots.length) % screenshots.length;
        const item = screenshots[currentLightboxIndex];

        image.src = `/images/gallery/${item.file}`;
        image.alt = item.title;
        caption.innerHTML = `<i class="fas ${item.icon}" style="color: #22d3ee; margin-right: 0.5rem;"></i>${item.title}`;
        document.getElementById('lightboxCounter').textContent = `${currentLightboxIndex + 1} / ${screenshots.length}`;

        // Fade back in after image loads
        image.onload = () => {
            image.classList.remove('fade-out');
            caption.style.opacity = '1';
        };
    }, 350);
}

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    const lightbox = document.getElementById('lightbox');
    const gallery = document.getElementById('galleryModal');

    if (lightbox.classList.contains('active')) {
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') navigateLightbox(-1);
        if (e.key === 'ArrowRight') navigateLightbox(1);
    } else if (gallery.classList.contains('active')) {
        if (e.key === 'Escape') closeGallery();
    }
});

// Click outside lightbox image to close
document.getElementById('lightbox')?.addEventListener('click', (e) => {
    if (e.target.id === 'lightbox') closeLightbox();
});
```

---

## Thumbnail Generation

Use Sharp (Node.js) to generate optimized thumbnails:

```typescript
// scripts/generate-gallery-thumbnails.ts
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const GALLERY_DIR = path.join(process.cwd(), 'images', 'gallery');
const THUMBS_DIR = path.join(GALLERY_DIR, 'thumbs');
const THUMB_WIDTH = 400;

async function generateThumbnails() {
    if (!fs.existsSync(THUMBS_DIR)) {
        fs.mkdirSync(THUMBS_DIR, { recursive: true });
    }

    const files = fs.readdirSync(GALLERY_DIR).filter(file => 
        fs.statSync(path.join(GALLERY_DIR, file)).isFile() && 
        file.match(/\.(png|jpg|jpeg|webp)$/i)
    );

    for (const file of files) {
        const inputPath = path.join(GALLERY_DIR, file);
        const baseName = file.substring(0, file.lastIndexOf('.'));
        const outputPath = path.join(THUMBS_DIR, `${baseName}_thumb.jpg`);

        if (fs.existsSync(outputPath)) continue;

        await sharp(fs.readFileSync(inputPath))
            .resize(THUMB_WIDTH, null, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 85 })
            .toFile(outputPath);
    }
}

generateThumbnails();
```

Run with: `npx tsx scripts/generate-gallery-thumbnails.ts`

---

## File Structure

```
public/
├── images/
│   └── gallery/
│       ├── 1-front-1.png
│       ├── 2-front-2.png
│       ├── ...
│       └── thumbs/
│           ├── 1-front-1_thumb.jpg
│           ├── 2-front-2_thumb.jpg
│           └── ...
```

---

## Customization Tips

### Change Accent Color
Replace `#22d3ee` (cyan) with your brand color throughout the CSS.

### Adjust Grid Size
Modify `minmax(260px, 1fr)` in `.gallery-grid` for different card sizes.

### Change Aspect Ratio
Modify `aspect-ratio: 16/10` in `.gallery-item` for different proportions.

### Add Categories/Filters
Extend the data structure with a `category` field and add filter buttons.

---

## Accessibility

- `role="dialog"` and `aria-modal="true"` on modals
- `aria-label` on all buttons
- `tabindex="0"` on gallery items for keyboard focus
- Keyboard navigation (Escape, Arrow keys)
- Focus trap in modals (add if needed)

---

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- CSS features used: `inset`, `backdrop-filter`, `aspect-ratio`
- For older browsers, add fallbacks or polyfills as needed
