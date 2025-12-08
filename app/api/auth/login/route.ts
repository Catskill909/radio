import { NextResponse } from 'next/server';

// Same hash function as middleware (must match!)
function simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
}

export async function POST(request: Request) {
    try {
        const { password } = await request.json();

        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminPassword) {
            console.error('ADMIN_PASSWORD environment variable is not set');
            return NextResponse.json(
                { error: 'Server configuration error' },
                { status: 500 }
            );
        }

        if (password !== adminPassword) {
            return NextResponse.json(
                { error: 'Invalid password' },
                { status: 401 }
            );
        }

        // Create a signed token (timestamp + signature)
        const timestamp = Date.now().toString();
        const signature = simpleHash(`${timestamp}-${adminPassword}`);
        const token = `${timestamp}.${signature}`;

        // Create response with auth cookie
        const response = NextResponse.json({ success: true });

        // Set HTTP-only cookie with 7-day expiry
        response.cookies.set('stationdock-auth', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
            path: '/',
        });

        return response;
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'An error occurred' },
            { status: 500 }
        );
    }
}
