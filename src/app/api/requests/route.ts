export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { BloodRequest } from "@/lib/models/BloodRequest";
import { verifyAuth } from "@/lib/middleware/auth";
import { BLOOD_TYPES, URGENCY_LEVELS } from "@/lib/constants";
import { FilterQuery } from "mongoose";

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const city = searchParams.get("city");
    const bloodType = searchParams.get("bloodType");
    const status = searchParams.get("status");
    const mine = searchParams.get("mine");

    const filter: FilterQuery<any> = {};

    if (mine === "true") {
      const user = verifyAuth(req);
      if (!user) {
        return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
      }
      filter.requestedBy = user.userId;
      if (status && status !== "all") {
        filter.status = status;
      }
    } else {
      if (status && status !== "all") {
        filter.status = status;
      } else if (!status) {
        filter.status = "open";
      }
    }

    if (city && city.trim()) {
      filter.city = { $regex: city.trim(), $options: "i" };
    }

    if (bloodType && bloodType !== "all") {
      filter.bloodType = bloodType;
    }

    const urgencyOrder: Record<string, number> = { critical: 0, urgent: 1, normal: 2 };

    const requests = await BloodRequest.find(filter)
      .populate("requestedBy", "name city")
      .sort({ createdAt: -1 })
      .lean();

    requests.sort((a: any, b: any) => (urgencyOrder[a.urgency] ?? 99) - (urgencyOrder[b.urgency] ?? 99));

    return NextResponse.json({ requests }, { status: 200 });
  } catch (err) {
    console.error("[GET_/api/requests]", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const user = verifyAuth(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await req.json();
    const { patientName, bloodType, units, hospital, city, urgency, contactPhone } = body;

    if (!patientName || !bloodType || !units || !hospital || !city || !urgency || !contactPhone) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    if (patientName.trim().length < 2) {
      return NextResponse.json({ error: "Patient name must be at least 2 characters." }, { status: 400 });
    }

    if (!BLOOD_TYPES.includes(bloodType)) {
      return NextResponse.json({ error: "Invalid blood type." }, { status: 400 });
    }

    const parsedUnits = Number(units);
    if (isNaN(parsedUnits) || parsedUnits < 1 || parsedUnits > 20) {
      return NextResponse.json({ error: "Units must be between 1 and 20." }, { status: 400 });
    }

    if (hospital.trim().length < 3 || hospital.trim().length > 100) {
      return NextResponse.json({ error: "Hospital name must be between 3 and 100 characters." }, { status: 400 });
    }

    if (!URGENCY_LEVELS.includes(urgency)) {
      return NextResponse.json({ error: "Invalid urgency level." }, { status: 400 });
    }

    if (contactPhone.trim().length < 10) {
      return NextResponse.json({ error: "Contact phone must be at least 10 digits." }, { status: 400 });
    }

    const newRequest = await BloodRequest.create({
      patientName: patientName.trim(),
      bloodType,
      units: parsedUnits,
      hospital: hospital.trim(),
      city: city.trim(),
      urgency,
      contactPhone: contactPhone.trim(),
      requestedBy: user.userId,
      status: "open"
    });

    return NextResponse.json(
      {
        message: "Request created.",
        request: newRequest
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST_/api/requests]", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
