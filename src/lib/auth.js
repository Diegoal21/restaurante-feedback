import { NextResponse } from "next/server";
import { createAnonSupabase } from "@/lib/supabase-server";

export async function requireAdmin(request) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) {
    return {
      error: NextResponse.json({ error: "No autorizado." }, { status: 401 }),
    };
  }

  const supabase = createAnonSupabase();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return {
      error: NextResponse.json({ error: "Sesión inválida." }, { status: 401 }),
    };
  }

  const allowedEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  if (allowedEmails.length && !allowedEmails.includes(data.user.email.toLowerCase())) {
    return {
      error: NextResponse.json({ error: "Usuario sin permisos." }, { status: 403 }),
    };
  }

  return { user: data.user };
}
