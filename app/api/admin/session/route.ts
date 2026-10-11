
import { NextRequest, NextResponse } from "next/server";
import { requireKfmAdmin } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const auth = await requireKfmAdmin(request);

  if (!auth.ok) {
    return auth.response;
  }

  return NextResponse.json({
    success: true,
    email: auth.user.email,
  });
}
