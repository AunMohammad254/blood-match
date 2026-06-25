import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { DonationRecord } from "@/lib/models/DonationRecord";
import { User } from "@/lib/models/User";
import { verifyAuth } from "@/lib/middleware/auth";

export async function GET(req: Request) {
  try {
    await connectDB();
    const user = verifyAuth(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const records = await DonationRecord.find({ donorId: user.userId }).sort({ donatedAt: -1 }).lean();
    
    return NextResponse.json({ records }, { status: 200 });
  } catch (err) {
    console.error("[GET_/api/donors/history]", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const user = verifyAuth(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { hospital, city, units, notes, donatedAt } = body;

    // Create the donation record
    const record = await DonationRecord.create({
      donorId: user.userId,
      hospital: hospital || "",
      city: city || "Unknown",
      units: Number(units) || 1,
      notes: notes || "",
      donatedAt: donatedAt ? new Date(donatedAt) : new Date(),
    });

    // Update the user's lastDonatedAt
    await User.findByIdAndUpdate(user.userId, {
      $set: { lastDonatedAt: record.donatedAt }
    });

    return NextResponse.json({ message: "Donation logged successfully", record }, { status: 201 });
  } catch (err) {
    console.error("[POST_/api/donors/history]", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
