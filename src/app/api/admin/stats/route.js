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
          "id, table_number, rating_general, rating_food, rating_service, rating_cleanliness, comment, created_at"
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
