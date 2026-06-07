import { NextResponse } from "next/server";
import { createCouponCode, getExpirationDate } from "@/lib/coupons";
import { createServiceSupabase } from "@/lib/supabase-server";

const promotionText =
  process.env.PROMOTION_TEXT || "10% de descuento en tu próxima visita";

export async function POST(request) {
  try {
    const body = await request.json();
    const ratings = [
      body.rating_general,
      body.rating_food,
      body.rating_service,
      body.rating_cleanliness,
    ].map(Number);

    if (ratings.some((rating) => !Number.isInteger(rating) || rating < 1 || rating > 5)) {
      return NextResponse.json(
        { error: "Todas las calificaciones deben estar entre 1 y 5." },
        { status: 400 }
      );
    }

    const supabase = createServiceSupabase();
    const { data: survey, error: surveyError } = await supabase
      .from("surveys")
      .insert({
        table_number: String(body.table_number || "").slice(0, 30),
        rating_general: ratings[0],
        rating_food: ratings[1],
        rating_service: ratings[2],
        rating_cleanliness: ratings[3],
        comment: String(body.comment || "").slice(0, 600),
        contact: String(body.contact || "").slice(0, 120),
      })
      .select("id")
      .single();

    if (surveyError) throw surveyError;

    const coupon = await insertCouponWithRetry(supabase, survey.id);

    return NextResponse.json({ ok: true, coupon });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "No se pudo registrar la encuesta." },
      { status: 500 }
    );
  }
}

async function insertCouponWithRetry(supabase, surveyId) {
  let lastError;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = createCouponCode();
    const { data, error } = await supabase
      .from("coupons")
      .insert({
        survey_id: surveyId,
        code,
        status: "unused",
        promotion_text: promotionText,
        expires_at: getExpirationDate(),
      })
      .select("id, code, status, promotion_text, expires_at")
      .single();

    if (!error) return data;
    lastError = error;
    if (error.code !== "23505") break;
  }

  throw lastError;
}
