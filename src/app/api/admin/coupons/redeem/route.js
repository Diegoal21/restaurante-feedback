import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createServiceSupabase } from "@/lib/supabase-server";

export async function PATCH(request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const { code } = await request.json();
  if (!code) {
    return NextResponse.json({ error: "Falta el folio." }, { status: 400 });
  }

  const supabase = createServiceSupabase();
  const normalizedCode = String(code).trim().toUpperCase();
  const now = new Date().toISOString();

  const { data: coupon, error } = await supabase
    .from("coupons")
    .update({ status: "redeemed", redeemed_at: now })
    .eq("code", normalizedCode)
    .eq("status", "unused")
    .gte("expires_at", now)
    .select("id, code, status, promotion_text, expires_at, redeemed_at, created_at")
    .single();

  if (error) {
    const { data: existing } = await supabase
      .from("coupons")
      .select("status, expires_at")
      .eq("code", normalizedCode)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ error: "Folio no encontrado." }, { status: 404 });
    }

    if (existing.status !== "unused") {
      return NextResponse.json(
        { error: "Este folio ya no está disponible." },
        { status: 409 }
      );
    }

    if (new Date(existing.expires_at) < new Date()) {
      return NextResponse.json({ error: "Este folio ya venció." }, { status: 409 });
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ coupon });
}
