import jwt from "jsonwebtoken";

export interface DecodedToken {
  userId: string;
  role: "donor" | "recipient";
  bloodType: string;
}

export function verifyAuth(req: Request): DecodedToken | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.replace("Bearer ", "");
  try {
    const secret = process.env.JWT_SECRET || "a_long_random_secret_string_minimum_32_chars";
    return jwt.verify(token, secret) as DecodedToken;
  } catch {
    return null;
  }
}
