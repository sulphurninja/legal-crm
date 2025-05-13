import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getAuthToken, hashPassword } from '@/lib/auth';
import User from '@/models/User';
import { dbConnect } from '@/lib/dbConnect';

export async function GET(request: NextRequest) {
  try {
     await dbConnect();

    // Already returns decoded token payload
    const decoded = getAuthToken(request);

    if (!decoded || typeof decoded !== 'object') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = decoded.id;

    if (!userId) {
      return NextResponse.json({ error: 'Token missing user ID' }, { status: 401 });
    }
    await dbConnect();

    const users = await User.find({})
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { message: 'Server error', error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
      await dbConnect();

    // Already returns decoded token payload
    const decoded = getAuthToken(request);

    if (!decoded || typeof decoded !== 'object') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = decoded.id;

    if (!userId) {
      return NextResponse.json({ error: 'Token missing user ID' }, { status: 401 });
    }

    // Super admin check for creating super_admin
    const body = await request.json();
    if (body.role === 'super_admin' && decoded.role !== 'super_admin') {
      return NextResponse.json(
        { message: 'Only super administrators can create super admin users' },
        { status: 403 }
      );
    }

    await dbConnect();

    // Check if email already exists
    const existingUser = await User.findOne({ email: body.email });

    if (existingUser) {
      return NextResponse.json(
        { message: 'A user with this email already exists' },
        { status: 409 }
      );
    }

    // Hash the password
    const hashedPassword = await hashPassword(body.password);

    // Create the user
    const user = await User.create({
      name: body.name,
      email: body.email,
      password: hashedPassword,
      role: body.role
    });

    return NextResponse.json({
      message: 'User created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { message: 'Server error', error: (error as Error).message },
      { status: 500 }
    );
  }
}
