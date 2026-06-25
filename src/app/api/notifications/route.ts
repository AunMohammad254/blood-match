export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/middleware/auth";
import { getNotifications, markAllAsRead } from "@/lib/db/notifications";

export async function GET(req: Request) {
  try {
    const user = verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const notifications = getNotifications(user.userId);
    return NextResponse.json({ notifications }, { status: 200 });
  } catch (err) {
    console.error("[GET /api/notifications]", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    markAllAsRead(user.userId);
    return NextResponse.json({ message: "All notifications marked as read." }, { status: 200 });
  } catch (err) {
    console.error("[PATCH /api/notifications]", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
