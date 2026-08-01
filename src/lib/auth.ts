import { User } from "@/types";

/** 
 * NOTE: JWT is now stored as an httpOnly cookie (set by /api/auth/login).
 * The client never has direct access to the token.
 * Only the user profile object is persisted client-side.
 */

let cachedUser: User | null = null;

export function getUser(): User | null {
  if (typeof window === "undefined") return null;
  if (cachedUser) return cachedUser;

  const raw = localStorage.getItem("bm_user");
  try {
    cachedUser = raw ? JSON.parse(raw) : null;
    return cachedUser;
  } catch {
    return null;
  }
}

export function saveAuth(user: User): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("bm_user", JSON.stringify(user));
  cachedUser = user;
}

export async function logout(): Promise<void> {
  if (typeof window === "undefined") return;
  // Clear cookie server-side
  try {
    await fetch("/api/auth/logout", { method: "DELETE" });
  } catch {
    // Proceed even if the server call fails — clear client state regardless
  }
  localStorage.removeItem("bm_user");
  cachedUser = null;
}

export function isLoggedIn(): boolean {
  return !!getUser();
}

export function updateUser(partial: Partial<User>): void {
  if (typeof window === "undefined") return;
  const current = getUser();
  if (current) {
    const updated: User = { ...current, ...partial };
    localStorage.setItem("bm_user", JSON.stringify(updated));
    cachedUser = updated;
  }
}
