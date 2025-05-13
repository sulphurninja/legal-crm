import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { UserType } from '@/types';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secure-jwt-secret-key';
const JWT_EXPIRES_IN = '7d';
const COOKIE_NAME = 'auth_token';

export const verifyToken = (token: string) => {
  try {
    // More explicit decoding with proper typing
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;

    console.log("Token successfully verified:", decoded);

    if (!decoded.id) {
      console.error("Token verified but missing ID:", decoded);
    }

    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
};

export const generateToken = (user: Partial<UserType> & { id?: string }) => {
  try {
    // Ensure we're using consistent ID field
    const payload = {
      id: user.id || user._id?.toString(),  // Make sure ID is a string
      email: user.email,
      role: user.role,
    };

    console.log('Generating token with payload:', payload);

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    return token;
  } catch (error) {
    console.error('Error generating token:', error);
    throw error;
  }
};

export function getAuthToken(req: NextRequest): jwt.JwtPayload | null {
  const token = req.cookies.get('auth_token')?.value;
  if (!token || !JWT_SECRET) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    return decoded;
  } catch (err) {
    console.error('[getAuthToken] Invalid token:', err);
    return null;
  }
}


// export const getUserFromRequest = (req?: NextRequest) => {
//   if (!req) return null;
//   const token = getAuthToken(req);
//   if (!token) return null;

//   const decoded = verifyToken(token);
//   return decoded;
// };

export const setAuthCookie = async (token: string, res?: NextResponse) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    path: '/',
    sameSite: 'lax' as const
  };

  if (res) {
    // For API routes using NextResponse
    res.cookies.set(COOKIE_NAME, token, cookieOptions);
    return res;
  } else {
    // For server components
    const cookiesStore = await cookies();
    cookiesStore.set(COOKIE_NAME, token, cookieOptions);
  }
};

export const clearAuthCookie = async (res?: NextResponse) => {
  if (res) {
    // For API routes
    res.cookies.delete(COOKIE_NAME);
    return res;
  } else {
    // For server components
    const cookiesStore = await cookies();
    cookiesStore.delete(COOKIE_NAME);
  }
};

export const hashPassword = async (password: string) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (password: string, hashedPassword: string) => {
  return bcrypt.compare(password, hashedPassword);
};
