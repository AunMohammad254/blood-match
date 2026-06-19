export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { BloodRequest } from "@/lib/models/BloodRequest";
import { requireAdmin } from "@/lib/middleware/auth";
import { z } from "zod";
import { BLOOD_TYPES } from "@/lib/constants";

const UpdateRequestSchema = z.object({
  patientName: z.string().min(2, "Patient name must be at least 2 characters.").optional(),
  bloodType: z.enum(BLOOD_TYPES as unknown as [string, ...string[]]).optional(),
  units: z.number().min(1).max(20).optional(),
  hospital: z.string().min(2, "Hospital name must be at least 2 characters.").optional(),
  city: z.string().min(2, "City must be at least 2 characters.").optional(),
  urgency: z.enum(["normal", "urgent", "critical"]).optional(),
  contactPhone: z.string().min(10, "Contact phone must be at least 10 characters.").optional(),
  status: z.enum(["open", "accepted", "rejected", "fulfilled", "cancelled"]).optional(),
  action: z.enum(["accept", "reject"]).optional(),
});

// PATCH — Update request details (urgency, status, patient information)
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const admin = requireAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden. Admin access only." }, { status: 403 });
    }

    await connectDB();
    const { id } = params;
    const body = await req.json();

    const result = UpdateRequestSchema.safeParse(body);
    if (!result.success) {
      const errorMsg = result.error.issues.map((e) => e.message).join(" ");
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const data = result.data;
    const updateData: Record<string, any> = {};

    if (data.patientName) updateData.patientName = data.patientName.trim();
    if (data.bloodType) updateData.bloodType = data.bloodType;
    if (typeof data.units === "number") updateData.units = data.units;
    if (data.hospital) updateData.hospital = data.hospital.trim();
    if (data.city) updateData.city = data.city.trim();
    if (data.urgency) updateData.urgency = data.urgency;
    if (data.contactPhone) updateData.contactPhone = data.contactPhone.trim();
    if (data.status) updateData.status = data.status;

    // Support action field ("accept" / "reject") for backwards compatibility
    if (data.action) {
      updateData.status = data.action === "accept" ? "accepted" : "rejected";
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
    }

    const updated = await BloodRequest.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Request not found." }, { status: 404 });
    }

    return NextResponse.json({
      message: "Request updated successfully.",
      request: updated,
    });
  } catch (err) {
    console.error("[PATCH /api/admin/requests/[id]]", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

// DELETE — Hard delete a request
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const admin = requireAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden. Admin access only." }, { status: 403 });
    }

    await connectDB();
    const { id } = params;

    const deleted = await BloodRequest.deleteOne({ _id: id });

    if (!deleted || deleted.deletedCount === 0) {
      return NextResponse.json({ error: "Request not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "Request deleted successfully." });
  } catch (err) {
    console.error("[DELETE /api/admin/requests/[id]]", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
