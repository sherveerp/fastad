// src/app/auth/callback/route.ts
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  await supabase.auth.exchangeCodeForSession();
  return NextResponse.redirect(new URL("/dashboard", request.url));
}
