import { NextResponse } from "next/server";

export async function GET() {
  // NextAuth middleware protects routes; here we simply redirect to the default signout page
  return NextResponse.redirect(new URL("/api/auth/signout?callbackUrl=/", process.env.NEXTAUTH_URL));
}


