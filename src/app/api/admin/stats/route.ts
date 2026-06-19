export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/models/User";
import { BloodRequest } from "@/lib/models/BloodRequest";
import { ChatHistory } from "@/lib/models/ChatHistory";
import { requireAdmin } from "@/lib/middleware/auth";

export async function GET(req: Request) {
  try {
    const admin = requireAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden. Admin access only." }, { status: 403 });
    }

    await connectDB();

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Get chat stats
    let totalChats = 0;
    let totalChatMessages = 0;
    let recentChats: any[] = [];

    if (process.env.MONGODB_URI) {
      totalChats = await ChatHistory.countDocuments({});
      const messageStats = await ChatHistory.aggregate([
        { $project: { numMessages: { $size: "$messages" } } },
        { $group: { _id: null, total: { $sum: "$numMessages" } } }
      ]);
      totalChatMessages = messageStats[0]?.total || 0;
      recentChats = await ChatHistory.find({})
        .sort({ updatedAt: -1 })
        .limit(5)
        .populate("userId", "name email")
        .lean();
    } else {
      totalChats = await ChatHistory.countDocuments({});
      const allChats = await ChatHistory.find({});
      totalChatMessages = allChats.reduce((sum: number, chat: any) => sum + (chat.messages?.length || 0), 0);
      recentChats = await ChatHistory.find({})
        .sort({ updatedAt: -1 })
        .limit(5)
        .populate("userId", "name email")
        .lean();
    }

    const [
      totalUsers,
      totalDonors,
      totalRecipients,
      totalRequests,
      openRequests,
      acceptedRequests,
      rejectedRequests,
      fulfilledRequests,
      cancelledRequests,
      criticalRequests,
      newUsersLast7Days,
      bloodTypeDistribution,
      cityBreakdown,
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ role: "donor" }),
      User.countDocuments({ role: "recipient" }),
      BloodRequest.countDocuments({}),
      BloodRequest.countDocuments({ status: "open" }),
      BloodRequest.countDocuments({ status: "accepted" }),
      BloodRequest.countDocuments({ status: "rejected" }),
      BloodRequest.countDocuments({ status: "fulfilled" }),
      BloodRequest.countDocuments({ status: "cancelled" }),
      BloodRequest.countDocuments({ urgency: "critical" }),
      User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      User.aggregate([
        { $group: { _id: "$bloodType", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      BloodRequest.aggregate([
        { $group: { _id: "$city", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]),
    ]);

    return NextResponse.json({
      totalUsers,
      totalDonors,
      totalRecipients,
      totalRequests,
      openRequests,
      acceptedRequests,
      rejectedRequests,
      fulfilledRequests,
      cancelledRequests,
      criticalRequests,
      newUsersLast7Days,
      bloodTypeDistribution,
      cityBreakdown,
      totalChats,
      totalChatMessages,
      recentChats,
    });
  } catch (err) {
    console.error("[GET /api/admin/stats]", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
