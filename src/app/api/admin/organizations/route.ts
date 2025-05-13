import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/auth';
import Organization from '@/models/Organization';
import User from '@/models/User';
import { dbConnect } from '@/lib/dbConnect';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Verify authentication
    const decoded = getAuthToken(request);

    if (!decoded || typeof decoded !== 'object') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Only super_admin can list all organizations
    if (decoded.role !== 'super_admin') {
      // Regular admin/agent can only see their organization
      const user = await User.findById(decoded.id).select('organizationId');

      if (!user || !user.organizationId) {
        return NextResponse.json(
          { message: 'You do not have an associated organization' },
          { status: 403 }
        );
      }

      const organization = await Organization.findById(user.organizationId);
      return NextResponse.json({
        organizations: organization ? [organization] : []
      });
    }

    // Super admin gets all organizations
    const organizations = await Organization.find()
      .sort({ name: 1 })
      .lean();

    return NextResponse.json({ organizations });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json(
      { message: 'Server error', error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // Verify authentication
    const decoded = getAuthToken(request);

    if (!decoded || typeof decoded !== 'object') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Only super_admin can create organizations
    if (decoded.role !== 'super_admin') {
      return NextResponse.json(
        { message: 'Only super administrators can create organizations' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { message: 'Organization name is required' },
        { status: 400 }
      );
    }

    // Check if organization name already exists
    const existingOrg = await Organization.findOne({
      name: { $regex: new RegExp(`^${body.name}$`, 'i') }
    });

    if (existingOrg) {
      return NextResponse.json(
        { message: 'An organization with this name already exists' },
        { status: 409 }
      );
    }

    // Create the organization
    const organization = await Organization.create({
      name: body.name,
      description: body.description || '',
      active: body.active !== undefined ? body.active : true
    });

    return NextResponse.json({
      message: 'Organization created successfully',
      organization
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating organization:', error);
    return NextResponse.json(
      { message: 'Server error', error: (error as Error).message },
      { status: 500 }
    );
  }
}
