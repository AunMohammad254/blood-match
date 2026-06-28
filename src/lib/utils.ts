/**
 * Formats a phone number for WhatsApp API
 * Standardizes Pakistan numbers (starting with 0) to include country code 92
 */
export function formatWhatsAppUrl(phone: string | undefined, message?: string): string {
  if (!phone) return "#";
  let cleaned = phone.replace(/\D/g, "");
  
  if (cleaned.startsWith("0")) {
    cleaned = "92" + cleaned.slice(1);
  }
  
  let url = `https://wa.me/${cleaned}`;
  if (message) {
    url += `?text=${encodeURIComponent(message)}`;
  }
  
  return url;
}

/**
 * Formats a relative time string (e.g., "5m ago")
 */
export function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "just now";
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  } catch {
    return "recently";
  }
}
