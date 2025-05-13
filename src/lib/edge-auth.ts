import { jwtVerify } from 'jose';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secure-jwt-secret-key';
const COOKIE_NAME = 'auth_token';

export function getAuthTokenEdge(req: NextRequest): string | undefined {
  return req.cookies.get(COOKIE_NAME)?.value;
}

export async function verifyTokenEdge(token: string) {
  try {
    // Convert JWT_SECRET to Uint8Array as required by jose
    const secretKey = new TextEncoder().encode(JWT_SECRET);

    // Verify token
    const { payload } = await jwtVerify(token, secretKey);

    return payload;
  } catch (error) {
    console.error('Token verification failed in edge:', error);
    return null;
  }
}
