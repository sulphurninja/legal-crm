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
    const userRole = decoded.role;

    if (!userId) {
      return NextResponse.json({ error: 'Token missing user ID' }, { status: 401 });
    }

    await dbConnect();

    let query = {};

    // If not super_admin, only show users from same organization
    if (userRole !== 'super_admin') {
      const user = await User.findById(userId).select('organizationId');
      if (!user || !user.organizationId) {
        return NextResponse.json(
          { message: 'User not assigned to an organization' },
          { status: 403 }
        );
      }
      query = { organizationId: user.organizationId };
    }
    // For super_admin - no query filter, return all users
    // This ensures users without an organization are also visible

    const users = await User.find(query)
      .select('-password')
      .populate('organizationId', 'name') // Populate organization details
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
    const userRole = decoded.role;

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

    // Get organization for non-super-admins
    let organizationId = body.organizationId;

    // If not super_admin creating a user, assign to creator's organization
    if (userRole !== 'super_admin') {
      const adminUser = await User.findById(userId).select('organizationId');
      if (!adminUser || !adminUser.organizationId) {
        return NextResponse.json(
          { message: 'Admin not assigned to an organization' },
          { status: 403 }
        );
      }
      organizationId = adminUser.organizationId;
    }
    // For super_admin: if creating a non-super-admin user, organization is required
    else if (body.role !== 'super_admin' && !organizationId) {
      return NextResponse.json(
        { message: 'Organization ID is required for non-super-admin users' },
        { status: 400 }
      );
    }
    // For super_admin creating super_admin: organization is not required

    // Hash the password
    const hashedPassword = await hashPassword(body.password);

    // Create the user with appropriate organization (or without for super_admin)
    const userData: any = {
      name: body.name,
      email: body.email,
      password: hashedPassword,
      role: body.role,
    };

    // Only add organizationId if it's provided or required
    if (organizationId || body.role !== 'super_admin') {
      userData.organizationId = organizationId;
    }

    const user = await User.create(userData);

    return NextResponse.json({
      message: 'User created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId
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
