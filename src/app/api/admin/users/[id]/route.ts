import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getAuthToken } from '@/lib/auth';
import User from '@/models/User';
import { dbConnect } from '@/lib/dbConnect';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    // Already returns decoded token payload
    const decoded = getAuthToken(request);

    if (!decoded || typeof decoded !== 'object') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = params.id;
    const body = await request.json();

    // Check if the user exists
    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent users from updating their own role
    if (userId === decoded.id && body.role && body.role !== user.role) {
      return NextResponse.json(
        { message: 'You cannot change your own role' },
        { status: 403 }
      );
    }

    // Prevent regular admins from updating super_admin roles
    if (user.role === 'super_admin' && decoded.role !== 'super_admin') {
      return NextResponse.json(
        { message: 'Only super administrators can modify super admin roles' },
        { status: 403 }
      );
    }

    // Prevent regular admins from assigning super_admin role
    if (body.role === 'super_admin' && decoded.role !== 'super_admin') {
      return NextResponse.json(
        { message: 'Only super administrators can assign super admin role' },
        { status: 403 }
      );
    }

    // Handle password update if it's provided
    if (body.password) {
      if (body.password.length < 6) {
        return NextResponse.json(
          { message: 'Password must be at least 6 characters' },
          { status: 400 }
        );
      }
      const bcrypt = require('bcryptjs');
      user.password = await bcrypt.hash(body.password, 10);
    }

    // Update user fields
    if (body.name) user.name = body.name;
    if (body.email) user.email = body.email;
    if (body.role) user.role = body.role;

    // Handle active status updates
    if (body.active !== undefined) {
      // Prevent deactivating your own account
      if (userId === decoded.id && body.active === false) {
        return NextResponse.json(
          { message: 'You cannot deactivate your own account' },
          { status: 403 }
        );
      }

      // Prevent deactivating the last super_admin
      if (body.active === false && user.role === 'super_admin') {
        const superAdminCount = await User.countDocuments({
          role: 'super_admin',
          active: true,
          _id: { $ne: userId }
        });

        if (superAdminCount === 0) {
          return NextResponse.json(
            { message: 'Cannot deactivate the last super admin account' },
            { status: 403 }
          );
        }
      }

      user.active = body.active;
    }

    await user.save();

    return NextResponse.json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.active,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { message: 'Server error', error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    // Already returns decoded token payload
    const decoded = getAuthToken(request);

    if (!decoded || typeof decoded !== 'object') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = params.id;

    // Check if the user exists
    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent users from deleting themselves
    if (userId === decoded.id) {
      return NextResponse.json(
        { message: 'You cannot delete your own account' },
        { status: 403 }
      );
    }

    // Prevent deleting the last super_admin
    if (user.role === 'super_admin') {
      const superAdminCount = await User.countDocuments({
        role: 'super_admin',
        _id: { $ne: userId }
      });

      if (superAdminCount === 0) {
        return NextResponse.json(
          { message: 'Cannot delete the last super admin account' },
          { status: 403 }
        );
      }
    }

    // Delete the user
    await User.findByIdAndDelete(userId);

    return NextResponse.json({
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { message: 'Server error', error: (error as Error).message },
      { status: 500 }
    );
  }
}
