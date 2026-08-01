/**
 * @route DELETE /api/auth/logout
 * @description Clears the httpOnly JWT cookie, ending the session.
 * @access Public (no auth required — clearing a cookie is always safe)
 */
import { NextResponse } from "next/server";

export async function DELETE(): Promise<Response> {
  const response = NextResponse.json(
    { message: "Logged out successfully." },
    { status: 200 }
  );

  response.cookies.delete("bm_token");
  return response;
}
