import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getAuthToken } from '@/lib/auth';
import User from '@/models/User';
import Organization from '@/models/Organization';
import { dbConnect } from '@/lib/dbConnect';
import mongoose from 'mongoose';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    // Already returns decoded token payload
    const decoded = getAuthToken(req);

    if (!decoded || typeof decoded !== 'object') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = decoded.id;

    if (!userId) {
      return NextResponse.json({ error: 'Token missing user ID' }, { status: 401 });
    }

    // Get user without population
    const user = await User.findById(userId).select('-password');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Manually handle organization if needed
    let organization = null;
    if (user.organizationId) {
      try {
        organization = await Organization.findById(user.organizationId);
      } catch (orgError) {
        console.error('Error fetching organization:', orgError);
      }
    }

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        organization: organization ? {
          id: organization._id.toString(),
          name: organization.name
        } : null
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Failed to get user information', details: (error as Error).message },
      { status: 500 }
    );
  }
}
