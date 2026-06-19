export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { BloodRequest } from "@/lib/models/BloodRequest";
import { requireAdmin } from "@/lib/middleware/auth";
import { z } from "zod";
import { BLOOD_TYPES, URGENCY_LEVELS } from "@/lib/constants";

const CreateRequestSchema = z.object({
  patientName: z.string().min(2, "Patient name must be at least 2 characters."),
  bloodType: z.enum(BLOOD_TYPES as unknown as [string, ...string[]]),
  units: z.number().min(1, "Units must be at least 1.").max(20, "Units cannot exceed 20."),
  hospital: z.string().min(2, "Hospital name must be at least 2 characters."),
  city: z.string().min(2, "City must be at least 2 characters."),
  urgency: z.enum(["normal", "urgent", "critical"]),
  contactPhone: z.string().min(10, "Contact phone must be at least 10 characters."),
  requestedBy: z.string().min(1, "RequestedBy user ID is required."),
  status: z.enum(["open", "accepted", "rejected", "fulfilled", "cancelled"]).optional(),
});

// GET — List blood requests
export async function GET(req: Request) {
  try {
    const admin = requireAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden. Admin access only." }, { status: 403 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const city = searchParams.get("city");
    const bloodType = searchParams.get("bloodType");
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, parseInt(searchParams.get("limit") || "20"));

    const filter: Record<string, any> = {};
    if (status && status !== "all") filter.status = status;
    if (city && city.trim()) filter.city = city.trim();
    if (bloodType && bloodType !== "all") filter.bloodType = bloodType;

    if (search && search.trim()) {
      filter.$or = [
        { patientName: { $regex: search, $options: "i" } },
        { hospital: { $regex: search, $options: "i" } },
        { city: { $regex: search, $options: "i" } },
        { contactPhone: { $regex: search, $options: "i" } },
      ];
    }

    const [requests, total] = await Promise.all([
      BloodRequest.find(filter)
        .populate("requestedBy", "name city email phone")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      BloodRequest.countDocuments(filter),
    ]);

    return NextResponse.json({ requests, total, page, limit });
  } catch (err) {
    console.error("[GET /api/admin/requests]", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

// POST — Create blood request
export async function POST(req: Request) {
  try {
    const admin = requireAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden. Admin access only." }, { status: 403 });
    }

    await connectDB();
    const body = await req.json();

    const result = CreateRequestSchema.safeParse(body);
    if (!result.success) {
      const errorMsg = result.error.issues.map((e) => e.message).join(" ");
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const newRequest = await BloodRequest.create({
      ...result.data,
      status: result.data.status || "open",
    });

    return NextResponse.json({ message: "Blood request created successfully.", request: newRequest }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/requests]", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
