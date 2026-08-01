import jwt from "jsonwebtoken";
import { config } from "@/lib/config";

export interface DecodedToken {
  userId: string;
  role: "donor" | "recipient" | "admin" | "coordinator";
  bloodType: string;
}

export function verifyAuth(req: Request): DecodedToken | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.replace("Bearer ", "");
  try {
    return jwt.verify(token, config.jwtSecret) as DecodedToken;
  } catch {
    return null;
  }
}

export function requireAdmin(req: Request): DecodedToken | null {
  const decoded = verifyAuth(req);
  if (!decoded || (decoded.role !== "admin" && decoded.role !== "coordinator")) return null;
  return decoded;
}
