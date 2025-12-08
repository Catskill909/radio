import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that don't require authentication
const publicRoutes = [
    '/listen',
    '/login',
    '/api/feed',
    '/api/public',
    '/api/audio',
    '/api/auth/login',
    '/api/auth/logout',
];

// Static asset paths that should always be accessible
const staticPaths = [
    '/_next',
    '/images',
    '/uploads',
    '/favicon.ico',
    '/features.html',
    '/file.svg',
    '/globe.svg',
    '/next.svg',
    '/vercel.svg',
    '/window.svg',
];

// Simple hash function for Edge runtime (no Buffer needed)
function simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow static assets
    for (const path of staticPaths) {
        if (pathname.startsWith(path)) {
            return NextResponse.next();
        }
    }

    // Allow public routes
    for (const route of publicRoutes) {
        if (pathname === route || pathname.startsWith(route + '/')) {
            return NextResponse.next();
        }
    }

    // Check for auth cookie
    const authCookie = request.cookies.get('stationdock-auth');

    if (!authCookie?.value) {
        // Redirect to login with return URL
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Verify the auth token (simple timestamp + signature check)
    try {
        const [timestamp, signature] = authCookie.value.split('.');
        const adminPassword = process.env.ADMIN_PASSWORD || 'stationdock-secret';
        const expectedSignature = simpleHash(`${timestamp}-${adminPassword}`);

        if (signature !== expectedSignature) {
            throw new Error('Invalid signature');
        }

        // Check if token is expired (7 days)
        const tokenTime = parseInt(timestamp, 10);
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        if (Date.now() - tokenTime > sevenDays) {
            throw new Error('Token expired');
        }

        return NextResponse.next();
    } catch {
        // Invalid or expired token - redirect to login
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        const response = NextResponse.redirect(loginUrl);
        // Clear the invalid cookie
        response.cookies.delete('stationdock-auth');
        return response;
    }
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image).*)',
    ],
};
