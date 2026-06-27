import { NextResponse } from "next/server";
import { createCouponCode, getExpirationDate } from "@/lib/coupons";
import { createServiceSupabase } from "@/lib/supabase-server";

const promotionText =
  process.env.PROMOTION_TEXT || "15% de descuento en pizzas, ensaladas o especialidades";

const branches = ["Gómez Farías", "Navarrete", "Hotel Colonial"];

const surveyOptions = {
  how_found: [
    "Recomendacion de familiares o amigos",
    "Redes sociales",
    "Google / Internet",
    "Pase por el lugar",
    "Plataforma de entrega (Uber Eats, Didi Food, etc.)",
    "Ya nos conocia",
    "Otro",
  ],
  service_attention: ["Excelente", "Buena", "Regular", "Mala"],
  wait_time: ["Muy rapido", "Adecuado", "Un poco lento", "Demasiado lento"],
  food_quality: ["Excelente", "Buena", "Regular", "Mala"],
  cleanliness: ["Excelente", "Buena", "Regular", "Mala"],
  payment_experience: ["Excelente", "Buena", "Regular", "Mala"],
  overall_satisfaction: [
    "Muy satisfecho(a)",
    "Satisfecho(a)",
    "Poco satisfecho(a)",
    "Insatisfecho(a)",
  ],
  recommend_likelihood: [
    "Definitivamente si",
    "Probablemente si",
    "Probablemente no",
    "Definitivamente no",
  ],
};

const scoreMap = {
  Excelente: 5,
  Buena: 4,
  Regular: 3,
  Mala: 1,
  "Muy satisfecho(a)": 5,
  "Satisfecho(a)": 4,
  "Poco satisfecho(a)": 2,
  "Insatisfecho(a)": 1,
};

export async function POST(request) {
  try {
    const body = await request.json();
    const answers = normalizeAnswers(body);

    const supabase = createServiceSupabase();
    const branch = String(body.branch || body.table_number || "").trim();
    const contact = String(body.contact || "").trim().slice(0, 30);
    const phoneDigits = contact.replace(/\D/g, "");

    if (!branches.includes(branch)) {
      return NextResponse.json(
        { error: "Selecciona una sucursal valida." },
        { status: 400 }
      );
    }

    if (phoneDigits.length < 8) {
      return NextResponse.json(
        { error: "Ingresa un telefono valido." },
        { status: 400 }
      );
    }

    const { data: survey, error: surveyError } = await supabase
      .from("surveys")
      .insert({
        branch,
        contact,
        how_found: answers.how_found,
        service_attention: answers.service_attention,
        wait_time: answers.wait_time,
        food_quality: answers.food_quality,
        cleanliness: answers.cleanliness,
        payment_experience: answers.payment_experience,
        overall_satisfaction: answers.overall_satisfaction,
        recommend_likelihood: answers.recommend_likelihood,
        rating_general: scoreMap[answers.overall_satisfaction],
        rating_food: scoreMap[answers.food_quality],
        rating_service: scoreMap[answers.service_attention],
        rating_cleanliness: scoreMap[answers.cleanliness],
        comment: String(body.comment || "").slice(0, 600),
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

function normalizeAnswers(body) {
  return Object.entries(surveyOptions).reduce((result, [field, options]) => {
    const answer = String(body[field] || "").trim();
    if (!options.includes(answer)) {
      throw new Error("Contesta todas las preguntas de la encuesta.");
    }
    result[field] = answer;
    return result;
  }, {});
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
