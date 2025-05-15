import { NextRequest, NextResponse } from 'next/server';
import Lead from '@/models/Lead';
import { verifyToken, getAuthToken } from '@/lib/auth';
import { dbConnect } from '@/lib/dbConnect';
import User from '@/models/User';

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

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');

    const skip = (page - 1) * limit;

    // Build query
    let query: any = {};

    // Get the user's organization
    const user = await User.findById(userId).select('organizationId');

    // If the user has an organization ID and is not a super_admin,
    // filter leads by their organization
    if (userRole !== 'super_admin' && user?.organizationId) {
      query.organizationId = user.organizationId;
    }

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const leads = await Lead.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'name email')
      .lean();

    const total = await Lead.countDocuments(query);

    return NextResponse.json({
      leads,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching leads:', error);
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

    // Get the user's organization to assign it to the lead
    const user = await User.findById(decoded.id).select('organizationId');

    const body = await request.json();

    // Check for duplicate email or phone
    let isDuplicate = false;
    let duplicateReason = '';
    let existingLeadInfo = null;

    // Build duplicate query with organization restriction for non-super_admin
    let duplicateQuery: any = {};

    // Only super_admin can see duplicates across organizations
    if (decoded.role !== 'super_admin' && user?.organizationId) {
      duplicateQuery.organizationId = user.organizationId;
    }

    // Only check if email or phone is provided
    if (body.email) {
      duplicateQuery.email = body.email;

      const duplicateEmail = await Lead.findOne(duplicateQuery)
        .populate('createdBy', 'name email');

      if (duplicateEmail) {
        isDuplicate = true;
        duplicateReason = 'email';
        existingLeadInfo = {
          id: duplicateEmail._id,
          name: `${duplicateEmail.firstName} ${duplicateEmail.lastName}`,
          status: duplicateEmail.status,
          createdBy: duplicateEmail.createdBy ? duplicateEmail.createdBy.name : 'Unknown',
          createdAt: duplicateEmail.createdAt
        };
      }
    }

    // Reset duplicate query except for organization filter
    if (decoded.role !== 'super_admin' && user?.organizationId) {
      duplicateQuery = { organizationId: user.organizationId };
    } else {
      duplicateQuery = {};
    }

    // If not duplicate by email, check phone
    if (!isDuplicate && body.phone) {
      duplicateQuery.phone = body.phone;

      const duplicatePhone = await Lead.findOne(duplicateQuery)
        .populate('createdBy', 'name email');

      if (duplicatePhone) {
        isDuplicate = true;
        duplicateReason = 'phone number';
        existingLeadInfo = {
          id: duplicatePhone._id,
          name: `${duplicatePhone.firstName} ${duplicatePhone.lastName}`,
          status: duplicatePhone.status,
          createdBy: duplicatePhone.createdBy ? duplicatePhone.createdBy.name : 'Unknown',
          createdAt: duplicatePhone.createdAt
        };
      }
    }

    // Set status to DUPLICATE if a duplicate was found
    const status = isDuplicate ? 'DUPLICATE' : (body.status || 'PENDING');

    // Create notes with duplicate information if applicable
    let notes = body.notes || '';
    if (isDuplicate && existingLeadInfo) {
      notes = `${notes}\n\n[SYSTEM] This lead has been marked as a duplicate because the ${duplicateReason} matches an existing lead (${existingLeadInfo.name}).`;
    }

    // Transform dynamic fields from object to array format
    const fieldsArray = [];
    if (body.fields && typeof body.fields === 'object') {
      console.log("Received dynamic fields:", body.fields);
      for (const [key, value] of Object.entries(body.fields)) {
        if (value) { // Only add non-empty values
          fieldsArray.push({ key, value });
        }
      }
    }

    console.log("Transformed fields for database:", fieldsArray);

    // Create the lead with proper fields format and assign organization
    const lead = await Lead.create({
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone,
      dateOfBirth: body.dateOfBirth,
      address: body.address,
      applicationType: body.applicationType,
      lawsuit: body.lawsuit,
      notes: notes,
      status: status,
      fields: fieldsArray,
      createdBy: decoded.id,
      // Assign the user's organization ID to the lead
      organizationId: user?.organizationId || null,
      statusHistory: [
        {
          fromStatus: '',
          toStatus: status,
          notes: isDuplicate
            ? `Lead created and automatically marked as DUPLICATE (matching ${duplicateReason})`
            : 'Lead created',
          changedBy: decoded.id,
          timestamp: new Date()
        }
      ]
    });

    return NextResponse.json({
      message: isDuplicate
        ? `Lead created but marked as DUPLICATE (matching ${duplicateReason})`
        : 'Lead created successfully',
      lead,
      isDuplicate,
      duplicateInfo: isDuplicate ? existingLeadInfo : null
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating lead:', error);
    return NextResponse.json(
      { message: 'Server error', error: (error as Error).message },
      { status: 500 }
    );
  }
}
