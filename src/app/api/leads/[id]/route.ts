import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/auth';
import Lead from '@/models/Lead';
import { dbConnect } from '@/lib/dbConnect';

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

    const leadId = params.id;

    // Check if the lead exists
    const lead = await Lead.findById(leadId)
      .populate('createdBy', 'name email')
      .populate('statusHistory.changedBy', 'name email');

    if (!lead) {
      return NextResponse.json(
        { message: 'Lead not found' },
        { status: 404 }
      );
    }

    // Only allow admins or the creator to access the lead
    if (decoded.role !== 'admin' && decoded.role !== 'super_admin' &&
        lead.createdBy && lead.createdBy._id.toString() !== decoded.id) {
      return NextResponse.json(
        { message: 'You do not have permission to view this lead' },
        { status: 403 }
      );
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

    // Check if the lead exists
    const lead = await Lead.findById(leadId);

    if (!lead) {
      return NextResponse.json(
        { message: 'Lead not found' },
        { status: 404 }
      );
    }

    // Only allow admins or the creator to update the lead
    if (decoded.role !== 'admin' && decoded.role !== 'super_admin' &&
        lead.createdBy && lead.createdBy.toString() !== decoded.id) {
      return NextResponse.json(
        { message: 'You do not have permission to update this lead' },
        { status: 403 }
      );
    }

    // Handle status updates (adding to status history)
    if (body.status && body.status !== lead.status) {
      const statusHistory = {
        fromStatus: lead.status,
        toStatus: body.status,
        notes: body.statusNote || "",
        changedBy: decoded.id,
        timestamp: new Date()
      };

      lead.statusHistory.push(statusHistory);
      lead.status = body.status;
    }

    // Handle dynamic fields updates if present
    if (body.fields && typeof body.fields === 'object') {
      // Convert object to array format for mongoose
      const fieldsArray = [];
      for (const [key, value] of Object.entries(body.fields)) {
        if (value) { // Only add non-empty values
          fieldsArray.push({ key, value });
        }
      }
      lead.fields = fieldsArray;
    }

    // Update other fields
    if (body.firstName) lead.firstName = body.firstName;
    if (body.lastName) lead.lastName = body.lastName;
    if (body.email) lead.email = body.email;
    if (body.phone) lead.phone = body.phone;
    if (body.dateOfBirth) lead.dateOfBirth = body.dateOfBirth;
    if (body.address) lead.address = body.address;
    if (body.applicationType) lead.applicationType = body.applicationType;
    if (body.lawsuit) lead.lawsuit = body.lawsuit;
    if (body.notes) lead.notes = body.notes;

    await lead.save();

    return NextResponse.json({
      message: 'Lead updated successfully',
      lead
    });
  } catch (error) {
    console.error('Error updating lead:', error);
    return NextResponse.json(
      { message: 'Server error', error: (error as Error).message },
      { status: 500 }
    );
  }
}
