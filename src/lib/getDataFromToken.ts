// lib/getDataFromToken.ts
import jwt from 'jsonwebtoken';

/**
 * Extracts the 'token' cookie from the request headers, verifies it, and returns the userId.
 * Returns null if cookie/token is missing or invalid.
 */
export function getDataFromToken(request: Request): string | null {
  // Grab the "cookie" header
  const cookieHeader = request.headers.get('cookie') || '';
  // Example: "token=abc123; Path=/; OtherCookie=value"
  const cookiesArr = cookieHeader.split(';');

  let token: string | null = null;
  for (const cookie of cookiesArr) {
    const [key, val] = cookie.trim().split('=');
    if (key === 'token') {
      token = val;
      break;
    }
  }

  // If no 'token' cookie is found, or no secret key, return null
  if (!token || !process.env.JWT_SECRET) {
    return null;
  }
  
  // Verify the token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as { userId?: string };
    if (!decoded.userId) return null;
    return decoded.userId;
  } catch {
    return null;
  }
}
