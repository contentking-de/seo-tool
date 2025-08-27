import { NextResponse } from "next/server";
import { rateLimit } from "@/middleware/rateLimit";

export function middleware(request: Request) {
  const ip = (request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1").trim();
  if (!rateLimit(ip)) {
    return new NextResponse("Too Many Requests", { status: 429 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/api/seo/audit",
};


