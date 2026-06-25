import crypto from "crypto";

export function getETag(body: string | Buffer): string {
  const hash = crypto.createHash("md5").update(body).digest("hex");
  return `W/"${hash}"`;
}

export function handleETag(req: Request, body: any): { response?: Response; headers: Record<string, string> } {
  const bodyStr = typeof body === "string" ? body : JSON.stringify(body);
  const etag = getETag(bodyStr);
  
  const ifNoneMatch = req.headers.get("if-none-match");
  
  const headers: Record<string, string> = {
    "ETag": etag,
    "Cache-Control": "no-cache",
  };
  
  // Handle both weak and strong ETag validation
  if (ifNoneMatch === etag || ifNoneMatch === etag.replace('W/', '')) {
    return {
      response: new Response(null, { status: 304, headers }),
      headers,
    };
  }
  
  return { headers };
}
