import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

const SECRET_KEY = process.env.JWT_SECRET || 'super-secret-key-change-me';
const key = new TextEncoder().encode(SECRET_KEY);

export enum Role {
    STUDENT = 'STUDENT',
    CLUB_ADMIN = 'CLUB_ADMIN',
    SUPER_ADMIN = 'SUPER_ADMIN',
}

export interface SessionPayload {
    userId: string;
    role: Role;
    email: string;
    name: string;
}

export async function signToken(payload: SessionPayload) {
    return await new SignJWT({ ...payload })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('2h') // Extended session for ease
        .sign(key);
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
    try {
        const { payload } = await jwtVerify(token, key);
        return payload as unknown as SessionPayload;
    } catch (error) {
        return null;
    }
}

export async function setSessionCookie(accessToken: string) {
    const cookieStore = await cookies();

    cookieStore.set('session', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 2 * 60 * 60, // 2 hours
    });
}

export async function clearSession() {
    const cookieStore = await cookies();
    cookieStore.delete('session');
    // cookieStore.delete('refresh');
}

export async function getSession() {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;

    if (!token) return null;

    const payload = await verifyToken(token);
    if (!payload) return null;

    return {
        user: {
            id: payload.userId,
            email: payload.email,
            user_metadata: {
                role: payload.role,
                name: payload.name
            }
        },
        role: payload.role // backward compatibility for now
    };
}
