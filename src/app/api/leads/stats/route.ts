import { NextRequest, NextResponse } from 'next/server';
import Lead from '@/models/Lead';
import { getAuthToken, verifyToken } from '@/lib/auth';
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


    // Get counts of leads by status
    const statusCounts = await Lead.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Get total leads count
    const totalLeads = await Lead.countDocuments();

    // Get recent activity (status changes)
    const recentActivity = await Lead.aggregate([
      { $unwind: "$statusHistory" },
      { $sort: { "statusHistory.timestamp": -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "users",
          localField: "statusHistory.changedBy",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $project: {
          _id: 1,
          firstName: 1,
          lastName: 1,
          "statusHistory.fromStatus": 1,
          "statusHistory.toStatus": 1,
          "statusHistory.timestamp": 1,
          "statusHistory.notes": 1,
          "user.name": 1
        }
      }
    ]);

    return NextResponse.json({
      statusCounts,
      totalLeads,
      recentActivity
    });
  } catch (error) {
    console.error('Error fetching lead stats:', error);
    return NextResponse.json(
      { message: 'Server error', error: (error as Error).message },
      { status: 500 }
    );
  }
}
