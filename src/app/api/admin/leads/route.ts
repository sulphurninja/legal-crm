import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/auth';
import Lead from '@/models/Lead';
import { dbConnect } from '@/lib/dbConnect';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Verify authentication
    const decoded = getAuthToken(request);

    if (!decoded || typeof decoded !== 'object') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    const userId = decoded.id;
    const userRole = decoded.role;

    // Get user's organization
    const user = await User.findById(userId).select('organizationId');

    // Get query parameters for potential filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Build query
    const query: any = {};
    if (status) {
      query.status = status;
    }
    if (userRole !== 'super_admin' && user?.organizationId) {
      query.organizationId = user.organizationId;
    }

    const leads = await Lead.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    return NextResponse.json({ leads });
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json(
      { message: 'Server error', error: (error as Error).message },
      { status: 500 }
    );
  }
}
