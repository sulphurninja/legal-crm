import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/auth';
import Organization from '@/models/Organization';
import User from '@/models/User';
import { dbConnect } from '@/lib/dbConnect';
import Lead from '@/models/Lead';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    // Verify authentication
    const decoded = getAuthToken(request);

    if (!decoded || typeof decoded !== 'object') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const orgId = params.id;

    // For non-super-admins, verify they're requesting their own org
    if (decoded.role !== 'super_admin') {
      const user = await User.findById(decoded.id).select('organizationId');

      if (!user || !user.organizationId || user.organizationId.toString() !== orgId) {
        return NextResponse.json(
          { message: 'You do not have permission to view this organization' },
          { status: 403 }
        );
      }
    }

    // Get organization details
    const organization = await Organization.findById(orgId);

    if (!organization) {
      return NextResponse.json(
        { message: 'Organization not found' },
        { status: 404 }
      );
    }

    // Get counts of users and leads in this organization
    const userCount = await User.countDocuments({ organizationId: orgId });
    const leadCount = await Lead.countDocuments({ organizationId: orgId });

    return NextResponse.json({
      organization,
      stats: {
        userCount,
        leadCount
      }
    });
  } catch (error) {
    console.error('Error fetching organization:', error);
    return NextResponse.json(
      { message: 'Server error', error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    // Verify authentication
    const decoded = getAuthToken(request);

    if (!decoded || typeof decoded !== 'object') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Only super_admin can update organizations
    if (decoded.role !== 'super_admin') {
      return NextResponse.json(
        { message: 'Only super administrators can update organizations' },
        { status: 403 }
      );
    }

    const orgId = params.id;
    const body = await request.json();

    // Get the organization
    const organization = await Organization.findById(orgId);

    if (!organization) {
      return NextResponse.json(
        { message: 'Organization not found' },
        { status: 404 }
      );
    }

    // Update fields
    if (body.name) organization.name = body.name;
    if (body.description !== undefined) organization.description = body.description;
    if (body.active !== undefined) organization.active = body.active;

    await organization.save();

    return NextResponse.json({
      message: 'Organization updated successfully',
      organization
    });
  } catch (error) {
    console.error('Error updating organization:', error);
    return NextResponse.json(
      { message: 'Server error', error: (error as Error).message },
      { status: 500 }
    );
  }
}
