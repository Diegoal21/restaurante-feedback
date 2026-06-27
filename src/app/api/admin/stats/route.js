import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createServiceSupabase } from "@/lib/supabase-server";

export async function GET(request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const supabase = createServiceSupabase();
  const [{ data: surveys, error: surveysError }, { data: coupons, error: couponsError }] =
    await Promise.all([
      supabase
        .from("surveys")
        .select(
          "id, branch, table_number, how_found, service_attention, wait_time, food_quality, cleanliness, payment_experience, overall_satisfaction, recommend_likelihood, rating_general, rating_food, rating_service, rating_cleanliness, comment, created_at"
        )
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("coupons")
        .select("id, code, status, promotion_text, expires_at, redeemed_at, created_at")
        .order("created_at", { ascending: false })
        .limit(200),
    ]);

  if (surveysError || couponsError) {
    return NextResponse.json(
      { error: surveysError?.message || couponsError?.message },
      { status: 500 }
    );
  }

  const averages = averageRatings(surveys);
  const normalizedCoupons = coupons.map((coupon) => ({
    ...coupon,
    status:
      coupon.status === "unused" && new Date(coupon.expires_at) < new Date()
        ? "expired"
        : coupon.status,
  }));

  return NextResponse.json({
    summary: {
      survey_count: surveys.length,
      rating_average: averages.rating_general,
      ...averages,
      coupons_unused: normalizedCoupons.filter((coupon) => coupon.status === "unused")
        .length,
      coupons_redeemed: normalizedCoupons.filter((coupon) => coupon.status === "redeemed")
        .length,
      coupons_expired: normalizedCoupons.filter((coupon) => coupon.status === "expired")
        .length,
    },
    breakdowns: {
      branch: countByAnswer(surveys, "branch"),
      how_found: countByAnswer(surveys, "how_found"),
      service_attention: countByAnswer(surveys, "service_attention"),
      wait_time: countByAnswer(surveys, "wait_time"),
      food_quality: countByAnswer(surveys, "food_quality"),
      cleanliness: countByAnswer(surveys, "cleanliness"),
      payment_experience: countByAnswer(surveys, "payment_experience"),
      overall_satisfaction: countByAnswer(surveys, "overall_satisfaction"),
      recommend_likelihood: countByAnswer(surveys, "recommend_likelihood"),
    },
    coupons: normalizedCoupons,
    comments: surveys.filter((survey) => survey.comment).slice(0, 8),
  });
}

function averageRatings(surveys) {
  const fields = [
    "rating_general",
    "rating_food",
    "rating_service",
    "rating_cleanliness",
  ];

  return fields.reduce((result, field) => {
    const total = surveys.reduce((sum, survey) => sum + Number(survey[field] || 0), 0);
    result[field] = surveys.length ? total / surveys.length : 0;
    return result;
  }, {});
}

function countByAnswer(surveys, field) {
  return surveys.reduce((result, survey) => {
    const answer = survey[field] || (field === "branch" ? survey.table_number : "") || "Sin respuesta";
    result[answer] = (result[answer] || 0) + 1;
    return result;
  }, {});
}
