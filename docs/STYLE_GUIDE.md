# StationDock Style Guide

This document provides comprehensive styling information for StationDock to help replicate its visual design in other projects. It covers typography, color palette, component patterns, and CSS best practices.

---

## Design Philosophy

StationDock follows a **modern, dark-first design** with these core principles:

1. **Dark Theme Excellence** - Proper contrast ratios, visual depth, and clear hierarchy
2. **Material Design Inspiration** - Elevated surfaces, smooth transitions, subtle shadows
3. **Premium Feel** - Glassmorphism effects, gradient accents, polished micro-interactions
4. **Accessibility First** - High contrast text, focus indicators, keyboard navigation

---

## Technology Stack

- **Framework**: Next.js 14 (App Router) with React and TypeScript
- **Styling**: TailwindCSS 4.x with `@tailwindcss/typography` plugin
- **Icons**: Lucide React + Font Awesome 6
- **UI Primitives**: Radix UI (for accessible dialogs, tooltips, etc.)
- **Fonts**: Google Fonts (see Typography section)

---

## Typography

### Font Families

```html
<!-- Add to <head> -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&family=Barlow+Semi+Condensed:wght@500;600;700&display=swap" rel="stylesheet" />
```

### Font Usage

| Font                   | Usage                                  | Weights         |
|------------------------|----------------------------------------|-----------------|
| **Inter**              | Body text, paragraphs, UI elements     | 300-700         |
| **Oswald**             | Headings, titles, action labels        | 400, 500, 600, 700 |
| **Barlow Semi Condensed** | Condensed labels, badges            | 500, 600, 700   |

### CSS Application

```css
body {
    font-family: 'Inter', sans-serif;
}

/* Headings and titles */
.heading, h1, h2, h3 {
    font-family: 'Oswald', sans-serif;
}

/* Calendar and toolbar headers */
.toolbar-label {
    font-family: 'Oswald', sans-serif;
    font-weight: 600;
    letter-spacing: 0.5px;
    text-transform: uppercase;
}
```

---

## Color Palette

### CSS Custom Properties

```css
:root {
    /* Background Colors */
    --foreground-rgb: 255, 255, 255;
    --background-start-rgb: 15, 23, 42;    /* Slate 900 */
    --background-end-rgb: 15, 23, 42;

    /* Primary Accent */
    --primary: #3b82f6;         /* Blue 500 */
    --primary-hover: #2563eb;   /* Blue 600 */

    /* Surface Colors */
    --surface: #1e293b;         /* Slate 800 */
    --surface-hover: #334155;   /* Slate 700 */
    --border: #334155;          /* Slate 700 */
}
```

### Tailwind Color Mapping

| Purpose           | Tailwind Class      | Hex Code   | Description               |
|-------------------|---------------------|------------|---------------------------|
| **Background**    | `bg-gray-950`       | `#030712`  | Main app background       |
| **Surface 1**     | `bg-gray-900`       | `#111827`  | Cards, panels             |
| **Surface 2**     | `bg-gray-800`       | `#1f2937`  | Elevated elements, headers|
| **Surface Hover** | `bg-gray-700`       | `#374151`  | Interactive hover states  |
| **Border**        | `border-gray-700`   | `#374151`  | Subtle borders            |
| **Border Light**  | `border-gray-600`   | `#4b5563`  | Hover border states       |
| **Text Primary**  | `text-white`        | `#ffffff`  | Primary text              |
| **Text Secondary**| `text-gray-400`     | `#9ca3af`  | Muted text, descriptions  |
| **Text Tertiary** | `text-gray-500`     | `#6b7280`  | Very muted, disabled      |
| **Primary**       | `bg-blue-500`       | `#3b82f6`  | Primary actions           |
| **Primary Hover** | `bg-blue-600`       | `#2563eb`  | Primary hover             |
| **Danger**        | `bg-red-600`        | `#dc2626`  | Delete, destructive       |
| **Warning**       | `text-amber-400`    | `#fbbf24`  | Caution indicators        |
| **Success**       | `text-green-400`    | `#4ade80`  | Success states            |

### Gradients

```css
/* Primary button gradient */
background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);

/* Card/surface gradient */
background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);

/* Progress bar gradient */
background: linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%);
```

---

## Shadows & Elevation

### Box Shadows

```css
/* Standard card elevation */
box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 
            0 2px 4px -1px rgba(0, 0, 0, 0.2);

/* Modal/dialog elevation */
box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);

/* Primary button shadow */
box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);

/* Primary button hover shadow */
box-shadow: 0 4px 12px rgba(59, 130, 246, 0.5);

/* Glowing border effect (pulse animation) */
box-shadow: 0 0 15px rgba(59, 130, 246, 0.2);
```

### Tailwind Shadow Utilities

| Class              | Usage                           |
|--------------------|---------------------------------|
| `shadow-lg`        | Standard elevation              |
| `shadow-2xl`       | Modal/dialog elevation          |
| `shadow-inner`     | Inset shadows for depth         |

---

## Border Radius

| Element Type    | Tailwind Class | Pixels  |
|-----------------|----------------|---------|
| **Buttons**     | `rounded-lg`   | 8px     |
| **Cards**       | `rounded-xl`   | 12px    |
| **Modals**      | `rounded-2xl`  | 16px    |
| **Small elements** | `rounded`   | 4px     |
| **Circular**    | `rounded-full` | 50%     |

---

## Component Patterns

### Modal/Dialog

```tsx
// Structure
<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    {/* Backdrop */}
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" />
    
    {/* Modal Container */}
    <div className="relative bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-start gap-4 p-6 border-b border-gray-700">
            {/* Icon container */}
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <IconComponent className="w-6 h-6 text-blue-500" />
            </div>
            <div className="flex-1">
                <h2 className="text-xl font-bold text-white">Title</h2>
                <p className="text-gray-400 mt-1 text-sm">Description</p>
            </div>
            {/* Close button */}
            <button className="flex-shrink-0 p-1 hover:bg-gray-700 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-400" />
            </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
            {/* Content here */}
        </div>
        
        {/* Actions */}
        <div className="flex gap-3 p-6">
            <button className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 rounded-lg transition-colors">
                Cancel
            </button>
            <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors">
                Confirm
            </button>
        </div>
    </div>
</div>
```

### Card

```tsx
<div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
    <div className="flex items-center gap-3 mb-4">
        <Icon className="w-6 h-6 text-indigo-400" />
        <h2 className="text-xl font-semibold text-white">Card Title</h2>
    </div>
    <div className="text-gray-400">
        Card content goes here
    </div>
</div>
```

### Button Variants

```tsx
// Primary Button (Blue glow)
<button className="px-4 py-2.5 rounded-lg border border-blue-500/50 hover:border-blue-400 
    bg-blue-500/5 hover:bg-blue-500/10 text-blue-100 font-medium transition-all 
    shadow-[0_0_15px_rgba(59,130,246,0.2)] hover:shadow-[0_0_25px_rgba(59,130,246,0.4)]">
    Primary Action
</button>

// Secondary Button (Gray)
<button className="px-4 py-2.5 rounded-lg border border-gray-700 hover:border-gray-600 
    bg-gray-800/50 hover:bg-gray-800 text-gray-400 hover:text-gray-300 font-medium transition-all">
    Secondary
</button>

// Destructive Button (Red)
<button className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-lg 
    transition-colors shadow-lg hover:shadow-red-500/20">
    Delete
</button>

// Solid Primary
<button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg 
    transition-colors">
    Submit
</button>

// Ghost/Subtle Button
<button className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white">
    <Icon className="w-5 h-5" />
</button>
```

### Form Inputs

```tsx
<input
    type="text"
    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg 
        text-white placeholder-gray-500 
        focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500
        transition-colors"
    placeholder="Enter value..."
/>

// Select
<select className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg 
    text-white focus:outline-none focus:border-blue-500 transition-colors">
    <option>Option 1</option>
</select>

// Textarea
<textarea className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg 
    text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 
    transition-colors resize-none"
    rows={4}
/>
```

### Badge/Pill

```tsx
// Status Badge
<span className="px-2 py-1 text-xs font-medium rounded-full bg-green-500/20 text-green-400">
    Active
</span>

// Type Badge
<span className="px-2 py-1 text-xs font-medium rounded bg-gray-700 text-gray-300">
    Category
</span>

// Time Remaining Pill
<span className="px-3 py-1 bg-gray-800/80 backdrop-blur rounded-full text-sm text-gray-300">
    45m remaining
</span>
```

---

## Custom Scrollbars

```css
/* Standard Scrollbar */
::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}

::-webkit-scrollbar-track {
    background: #0f172a;
}

::-webkit-scrollbar-thumb {
    background: #334155;
    border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
    background: #475569;
}

/* Thin Scrollbar (for modals) */
.thin-scrollbar::-webkit-scrollbar {
    width: 4px;
}

.thin-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}

.thin-scrollbar::-webkit-scrollbar-thumb {
    background: #4b5563;
    border-radius: 4px;
}

.thin-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: #4b5563 transparent;
}

/* Hide Scrollbar */
.no-scrollbar::-webkit-scrollbar {
    display: none;
}

.no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
```

---

## Animations & Transitions

### Standard Transitions

```tsx
// All interactive elements should use:
className="transition-colors"        // For color changes
className="transition-all"           // For multiple property changes
className="transition-all duration-200"  // With timing
```

### Animations (Tailwind Animate Plugin)

```tsx
// Modal entrance
className="animate-in fade-in duration-200"
className="animate-in zoom-in-95 duration-200"

// Loading spinner
className="animate-spin"

// Pulse effect
className="animate-pulse"
```

### Custom Animations

```css
/* Pulse Border Animation */
@keyframes pulse-border {
    0%, 100% {
        border-color: rgba(59, 130, 246, 0.5);
        box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
    }
    50% {
        border-color: rgba(59, 130, 246, 1);
        box-shadow: 0 0 12px 2px rgba(59, 130, 246, 0.4);
    }
}

/* Glowing Current Time Indicator */
@keyframes currentTimePulse {
    0%, 100% {
        box-shadow: 0 0 10px rgba(239, 68, 68, 1),
                    0 0 20px rgba(239, 68, 68, 0.7),
                    0 0 35px rgba(239, 68, 68, 0.5);
        opacity: 1;
    }
    50% {
        box-shadow: 0 0 15px rgba(239, 68, 68, 1),
                    0 0 35px rgba(239, 68, 68, 0.9),
                    0 0 55px rgba(239, 68, 68, 0.7);
        opacity: 0.7;
    }
}
```

---

## Glassmorphism Effects

```css
/* Backdrop blur with transparency */
.glass-panel {
    background: rgba(31, 41, 55, 0.8);  /* gray-800 with opacity */
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(75, 85, 99, 0.3);  /* gray-600 with opacity */
}

/* Modal backdrop */
.modal-backdrop {
    background: rgba(0, 0, 0, 0.60);
    backdrop-filter: blur(4px);
}
```

---

## Icon Sizing Guidelines

| Context          | Size (Tailwind)      | Pixels |
|------------------|----------------------|--------|
| Inline with text | `w-4 h-4`           | 16px   |
| Button icons     | `w-5 h-5`           | 20px   |
| Card header icons| `w-6 h-6`           | 24px   |
| Feature icons    | `w-8 h-8`           | 32px   |
| Hero icons       | `w-12 h-12`         | 48px   |

---

## Z-Index Scale

| Layer            | Z-Index | Usage                    |
|------------------|---------|--------------------------|
| Base content     | 0       | Default                  |
| Dropdown         | 10      | Dropdown menus           |
| Sticky elements  | 40-41   | Sticky headers           |
| Modal backdrop   | 50      | Modal backgrounds        |
| Modal content    | 50      | Modal dialogs            |
| Tooltip          | 60      | Tooltips, popovers       |
| Poppers          | 9999    | Date pickers, select     |
| Unsaved modal    | 2000    | Prevent-leave modals     |

---

## Responsive Breakpoints

Using Tailwind's default breakpoints:

| Breakpoint | Min Width | Usage                    |
|------------|-----------|--------------------------|
| `sm:`      | 640px     | Mobile landscape         |
| `md:`      | 768px     | Tablets                  |
| `lg:`      | 1024px    | Small laptops            |
| `xl:`      | 1280px    | Desktops                 |
| `2xl:`     | 1536px    | Large screens            |

---

## File Organization

```
app/
├── globals.css              # Global styles, dark theme, scrollbars
├── layout.tsx               # Font imports
├── schedule/
│   └── calendar-custom.css  # Calendar-specific overrides
└── shows/
    └── datepicker-dark.css  # Date picker dark theme

components/
├── AudioPlayer.css          # Audio player styling
└── *.tsx                    # Component files with Tailwind classes
```

---

## Tailwind Configuration

```javascript
// tailwind.config.ts (if customizing)
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Uses default Tailwind colors (gray, blue, red, etc.)
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
```

---

## Quick Reference: Common Class Combinations

```tsx
// Page container
<div className="min-h-screen bg-gray-950 text-white">

// Card container
<div className="bg-gray-900 border border-gray-700 rounded-xl p-6 shadow-lg">

// Section header
<h2 className="text-xl font-semibold text-white" style={{ fontFamily: 'Oswald, sans-serif' }}>

// Body text
<p className="text-gray-400 text-sm leading-relaxed">

// Muted description
<span className="text-gray-500 text-xs">

// Interactive list item
<div className="p-4 bg-gray-800/50 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 rounded-lg transition-colors cursor-pointer">

// Icon button
<button className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white">

// Badge on dark surface
<span className="text-xs px-2 py-0.5 bg-gray-700 text-gray-300 rounded">
```

---

## Usage Notes for AI Assistants

When implementing this design system in another project:

1. **Start with globals.css** - Set up the base dark theme and CSS variables
2. **Import Google Fonts** - Inter, Oswald, and Barlow Semi Condensed
3. **Use Tailwind's gray scale** - gray-700 through gray-950 for surfaces
4. **Apply consistent border radius** - `rounded-lg` for buttons, `rounded-xl` for cards, `rounded-2xl` for modals
5. **Add transitions everywhere** - `transition-colors` or `transition-all` for smooth interactions
6. **Use backdrop-blur for overlays** - Creates premium glassmorphism effect
7. **Keep text hierarchy** - White for primary, gray-400 for secondary, gray-500 for tertiary
8. **Shadow for elevation** - Darker shadows work better on dark backgrounds

---

*Last updated: December 2024*
