import { User } from "@/types";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("bm_token");
}

export function getUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("bm_user");
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveAuth(token: string, user: User): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("bm_token", token);
  localStorage.setItem("bm_user", JSON.stringify(user));
}

export function logout(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("bm_token");
  localStorage.removeItem("bm_user");
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

export function updateUser(partial: Partial<User>): void {
  if (typeof window === "undefined") return;
  const current = getUser();
  if (current) {
    const updated: User = { ...current, ...partial };
    localStorage.setItem("bm_user", JSON.stringify(updated));
  }
}
