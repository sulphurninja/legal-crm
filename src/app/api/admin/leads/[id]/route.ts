import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/auth';
import Lead from '@/models/Lead';
import { dbConnect } from '@/lib/dbConnect';
import User from '@/models/User';

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

    const userId = decoded.id;
    const userRole = decoded.role;
    const leadId = params.id;

    // Check if the lead exists
    const lead = await Lead.findById(leadId)
      .populate('createdBy', 'name email organizationId')
      .populate('statusHistory.changedBy', 'name email')
      .populate('organizationId', 'name');

    if (!lead) {
      return NextResponse.json(
        { message: 'Lead not found' },
        { status: 404 }
      );
    }

    // Check organization access (unless super_admin)
    if (userRole !== 'super_admin') {
      const user = await User.findById(userId).select('organizationId');

      // Must be in same organization or be the creator
      if (!user ||
          (!user.organizationId || lead.organizationId.toString() !== user.organizationId.toString()) &&
          lead.createdBy && lead.createdBy._id.toString() !== userId) {
        return NextResponse.json(
          { message: 'You do not have permission to view this lead' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({ lead });
  } catch (error) {
    console.error('Error fetching lead:', error);
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

    const leadId = params.id;
    const body = await request.json();
    const { status, notes } = body;

    // Check if the lead exists
    const lead = await Lead.findById(leadId);

    if (!lead) {
      return NextResponse.json(
        { message: 'Lead not found' },
        { status: 404 }
      );
    }

    // Add to status history
    const statusHistory = {
      fromStatus: lead.status,
      toStatus: status,
      notes: notes || "",
      changedBy: decoded.id
    };

    // Update the lead
    lead.status = status;
    lead.statusHistory.push(statusHistory);

    await lead.save();

    return NextResponse.json({
      message: 'Lead updated successfully',
      lead: {
        id: lead._id,
        firstName: lead.firstName,
        lastName: lead.lastName,
        status: lead.status
      }
    });
  } catch (error) {
    console.error('Error updating lead:', error);
    return NextResponse.json(
      { message: 'Server error', error: (error as Error).message },
      { status: 500 }
    );
  }
}
