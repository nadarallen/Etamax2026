import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Role } from './lib/auth'; // Removed verifyToken
import { jwtVerify } from 'jose'; // Use jose to verify JWT
import { Ratelimit } from '@upstash/ratelimit'; // Prompt 28
import { Redis } from '@upstash/redis';

// Mock Redis/Ratelimit if env not present (Dev Mode fallback)
// Mock Redis/Ratelimit if env not present or is a placeholder
const isRedisConfigured = process.env.UPSTASH_REDIS_REST_URL &&
    !process.env.UPSTASH_REDIS_REST_URL.includes('your-redis-url');

const ratelimit = isRedisConfigured
    ? new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(10, '10 s'),
        analytics: true,
    })
    : { limit: () => Promise.resolve({ success: true }) }; // Dummy

const PUBLIC_ROUTES = ['/login', '/register', '/', '/api/webhooks/razorpay', '/api/cron/cleanup'];

// RBAC Rules
const ROLE_Access = {
    [Role.STUDENT]: ['/student', '/events', '/teams'],
    [Role.CLUB_ADMIN]: ['/club', '/events'], // Club admins can also see events
    [Role.SUPER_ADMIN]: ['/admin', '/club', '/student'], // God mode
};

export async function middleware(req: NextRequest) {
    const path = req.nextUrl.pathname;
    const ip = req.headers.get('x-forwarded-for') ?? '127.0.0.1';

    // 1. Rate Limiting (Security Prompt 28)
    if (path === '/login' || path === '/register') {
        const { success } = await ratelimit.limit(ip);
        if (!success) {
            return new NextResponse('Too Many Requests', { status: 429 });
        }
    }

    // 1. Public Routes
    if (path === '/' ||
        path.startsWith('/login') ||
        path.startsWith('/register') ||
        path.startsWith('/api/webhooks') ||
        path.startsWith('/api/cron') ||
        path.startsWith('/tickets') // Allow public tickets
    ) {
        return NextResponse.next();
    }

    // 2. Auth Check
    const accessToken = req.cookies.get('session')?.value;
    if (!accessToken) {
        return NextResponse.redirect(new URL('/login', req.url));
    }

    let userRole = Role.STUDENT;

    try {
        // Verify JWT properly
        const { payload } = await jwtVerify(accessToken, new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-key-change-me'));
        const metadata = (payload as any) || {}; // our payload is flat now
        userRole = metadata.role || Role.STUDENT;
    } catch (e) {
        // Invalid token
        return NextResponse.redirect(new URL('/login', req.url));
    }

    // 3. Role Based Access Control

    // Admin Routes
    if (path.startsWith('/admin') || path.startsWith('/api/admin')) {
        // Exception: Club Admins can access Create Event, Edit Event, Slots Config AND Desk
        const isSharedAdminRoute = path.startsWith('/admin/create-event')
            || path.startsWith('/admin/edit-event')
            || path.startsWith('/admin/events')
            || path.startsWith('/admin/desk');

        if (isSharedAdminRoute) {
            if (userRole !== Role.SUPER_ADMIN && userRole !== Role.CLUB_ADMIN) {
                return NextResponse.redirect(new URL('/', req.url));
            }
        } else {
            // Strict Admin Routes (Dashboard, Users, etc.)
            if (userRole !== Role.SUPER_ADMIN) {
                return path.startsWith('/api/admin')
                    ? NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
                    : NextResponse.redirect(new URL('/', req.url));
            }
        }
    }

    if ((path.startsWith('/club') || path.startsWith('/api/club')) && userRole !== Role.CLUB_ADMIN && userRole !== Role.SUPER_ADMIN) {
        return path.startsWith('/api/club')
            ? NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
            : NextResponse.redirect(new URL('/', req.url));
    }

    if ((path.startsWith('/student') || path.startsWith('/api/student')) && userRole !== Role.STUDENT && userRole !== Role.SUPER_ADMIN) {
        return path.startsWith('/api/student')
            ? NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
            : NextResponse.redirect(new URL('/', req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
