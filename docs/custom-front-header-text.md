# Custom Front Header Branding - Implementation Plan

## Overview
Add customizable site branding to the public `/listen` page (http://localhost:3000/settings), featuring a site logo, title, and tagline that can be positioned on the left side of the top header, separate from the metadata and audio controls on the right.

## Current State Analysis

### Desktop Layout (`TopPlayerBar.tsx`)
- Fixed header at top, 100px height
- Right-aligned unified player card containing:
  - Show artwork/station logo (56x56px)
  - Show title + LIVE badge
  - Host/tagline subtitle  
  - Time remaining widget
  - Play/pause button

### Mobile Layout (`CollapsingHeader.tsx`)
- Collapsing header behavior
- Similar metadata display pattern

### Current Font Usage
- **Headers**: `Oswald` (already loaded in `layout.tsx`)
- **Body/UI**: `Inter` and `Barlow Semi Condensed`
- Google Fonts already imported: `Oswald`, `Inter`, `Barlow Semi Condensed`

### Database Schema (`StationSettings` model)
Already has:
- `name` - String? (default: "My Radio Station")
- `description` - String?
- `logoUrl` - String?

**Missing fields needed**:
- `siteTitle` - String? (custom title for front-end)
- `siteTagline` - String? (custom tagline for front-end)
- `siteLogo` - String? (URL to custom logo image)
- `showSiteTitle` - Boolean (toggle visibility)
- `showSiteTagline` - Boolean (toggle visibility)
- `showSiteLogo` - Boolean (toggle visibility)

---

## Design Specifications

### Typography
- **Site Title**: Oswald font (already loaded), bold, ~2xl-3xl size
- **Site Tagline**: Inter font (already loaded), regular weight, ~sm-base size, text-gray-400

### Layout Structure (Desktop)

```
┌─────────────────────────────────────────────────────────────────┐
│  Fixed Header (100px height)                                    │
│                                                                  │
│  [Logo]  Site Title               [Metadata Widget] [Player]    │
│          Site Tagline                                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Left Side (New):**
- Site logo (optional, ~48x48 to 64x64px)
- Site title (Oswald, bold)
- Site tagline (Inter, smaller, gray)

**Right Side (Existing):**
- Player card with show artwork, metadata, time remaining, play button

### Mobile Layout
Similar structure but potentially stacked or simplified based on screen width.

---

## Implementation Tasks

### 1. Database Schema Updates

#### Add to `StationSettings` model in `schema.prisma`:
```prisma
model StationSettings {
  // ... existing fields ...
  
  // Site Branding
  siteTitle       String?  // Custom front-end title
  siteTagline     String?  // Custom front-end tagline  
  siteLogo        String?  // URL to logo image
  showSiteTitle   Boolean  @default(true)
  showSiteTagline Boolean  @default(true)
  showSiteLogo    Boolean  @default(true)
}
```

#### Migration Steps:
1. Update `schema.prisma`
2. Run `npx prisma migrate dev --name add_site_branding`
3. Run `npx prisma generate`

---

### 2. Settings Page UI (`app/settings/page.tsx`)

Add a new **"Site Branding"** section above or near "Station Identity" with:

#### Controls Needed:
- **Site Logo Upload/URL Input**
  - Toggle switch: "Show Site Logo"
  - Image upload or URL input field
  - Preview of current logo
  
- **Site Title**
  - Toggle switch: "Show Site Title"
  - Text input for title
  - Character limit recommendation (~40 chars)
  
- **Site Tagline**
  - Toggle switch: "Show Site Tagline"
  - Text input for tagline
  - Character limit recommendation (~80 chars)

#### Create New Component: `SiteBrandingForm.tsx`
- Client component with form state
- Toggle switches for visibility
- Input fields for text/URLs
- Image upload/preview functionality
- Save action using server action

---

### 3. Update Server Actions (`app/actions.ts`)

Add fields to the `updateStationSettings` action:
```typescript
export async function updateStationSettings(data: {
  // ... existing fields ...
  siteTitle?: string;
  siteTagline?: string;
  siteLogo?: string;
  showSiteTitle?: boolean;
  showSiteTagline?: boolean;
  showSiteLogo?: boolean;
}) {
  // Update station settings with new branding fields
}
```

---

### 4. Update Public API (`/api/public/now-playing`)

Ensure the response includes site branding data:
```typescript
{
  currentShow: { ... },
  stationInfo: {
    name: "...",
    tagline: "...",
    defaultArtwork: "...",
    // ADD:
    siteTitle: "...",
    siteTagline: "...",
    siteLogo: "...",
    showSiteTitle: true,
    showSiteTagline: true,
    showSiteLogo: true
  }
}
```

---

### 5. Update `TopPlayerBar.tsx` (Desktop Layout)

#### New Structure:
```tsx
<div className="fixed top-0 left-0 right-0 h-[100px] bg-black z-40 flex items-center justify-between px-6">
  
  {/* LEFT SIDE - Site Branding */}
  {(showSiteLogo || showSiteTitle || showSiteTagline) && (
    <div className="flex items-center gap-4">
      {/* Site Logo */}
      {showSiteLogo && siteLogo && (
        <img 
          src={siteLogo} 
          alt="Site Logo" 
          className="w-12 h-12 md:w-16 md:h-16 rounded-lg object-cover"
        />
      )}
      
      {/* Site Title & Tagline */}
      <div className="flex flex-col">
        {showSiteTitle && siteTitle && (
          <h1 
            className="text-2xl md:text-3xl font-bold text-white leading-tight"
            style={{ fontFamily: 'Oswald, sans-serif' }}
          >
            {siteTitle}
          </h1>
        )}
        {showSiteTagline && siteTagline && (
          <p className="text-sm text-gray-400 mt-0.5">
            {siteTagline}
          </p>
        )}
      </div>
    </div>
  )}
  
  {/* RIGHT SIDE - Existing Player Card */}
  <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-4 shadow-lg">
    {/* ... existing player card content ... */}
  </div>
  
</div>
```

Key changes:
- Change outer div from `justify-end` to `justify-between`
- Add conditional left section for branding
- Keep right section for player controls

---

### 6. Update `CollapsingHeader.tsx` (Mobile Layout)

Similar approach but adapted for mobile:
- May need to adjust layout to accommodate both branding and player
- Consider stacking or smaller sizes
- Ensure collapsing behavior still works smoothly

---

### 7. Typography & Styling

#### Font Pairings (Already Available):
- **Primary (Headers)**: Oswald - Bold, condensed, attention-grabbing
- **Secondary (Tagline)**: Inter - Clean, readable, modern sans-serif

#### Color Scheme:
- Site Title: `text-white`
- Site Tagline: `text-gray-400` (softer, less prominent)
- Logo: Rounded corners, subtle shadow for depth

---

## Testing Checklist

- [ ] Database migration runs successfully
- [ ] Settings page displays new branding section
- [ ] Toggle switches work correctly
- [ ] Logo upload/URL works and displays preview
- [ ] Text inputs save properly
- [ ] Changes appear immediately on `/listen` page after save
- [ ] Desktop layout shows branding on left, player on right
- [ ] Mobile layout adapts appropriately
- [ ] All toggles hide/show elements as expected
- [ ] Fonts render correctly (Oswald for title, Inter for tagline)
- [ ] Logo scales properly at different viewport sizes
- [ ] No layout breaking when fields are empty or toggles are off

---

## Edge Cases to Handle

1. **Empty/Null Values**: If no logo, title, or tagline set, gracefully hide entire left section
2. **Long Titles**: Implement text truncation or responsive sizing
3. **Logo Aspect Ratios**: Handle non-square logos gracefully
4. **Mobile Viewport**: Ensure text doesn't overflow or clash with player
5. **Accessibility**: Ensure proper alt text for logos, semantic HTML for titles

---

## Future Enhancements

- Custom font selection for site title
- Color picker for site title/tagline
- Animation options (fade-in, slide-in)
- Multiple logo variants (light/dark mode)
- A/B testing different branding configurations

---

## File Changes Summary

### New Files:
- `components/SiteBrandingForm.tsx` - Settings UI for branding controls

### Modified Files:
1. `prisma/schema.prisma` - Add branding fields to `StationSettings`
2. `app/settings/page.tsx` - Add Site Branding section
3. `app/actions.ts` - Update settings save action
4. `app/api/public/now-playing/route.ts` - Include branding in response
5. `app/listen/components/TopPlayerBar.tsx` - Add left-side branding section
6. `app/listen/components/CollapsingHeader.tsx` - Add mobile branding
7. `app/listen/components/types.ts` - Update `NowPlayingData` type

---

## Notes

- Oswald font is already loaded globally - no additional imports needed
- Inter is already available for tagline
- Existing player functionality remains completely unchanged
- All branding elements are optional and toggleable
- Design maintains current aesthetic (dark theme, glassmorphism)
