"use client";

import Image from "next/image";
import { useState } from "react";
import { CheckCircle2, Clipboard, Loader2 } from "lucide-react";

const questions = [
  {
    name: "how_found",
    label: "1. ¿Cómo nos encontraste?",
    options: [
      "Recomendación de familiares o amigos",
      "Redes sociales",
      "Google / Internet",
      "Pasé por el lugar",
      "Plataforma de entrega (Uber Eats, Didi Food, etc.)",
      "Ya nos conocía",
      "Otro",
    ],
  },
  {
    name: "service_attention",
    label: "2. ¿Cómo calificarías la atención recibida por nuestro personal?",
    options: ["Excelente", "Buena", "Regular", "Mala"],
  },
  {
    name: "wait_time",
    label: "3. ¿Qué te pareció el tiempo de espera para recibir tus alimentos o bebidas?",
    options: ["Muy rápido", "Adecuado", "Un poco lento", "Demasiado lento"],
  },
  {
    name: "food_quality",
    label: "4. ¿Cómo calificas la calidad de los alimentos y bebidas consumidos?",
    options: ["Excelente", "Buena", "Regular", "Mala"],
  },
  {
    name: "cleanliness",
    label: "5. ¿Cómo encontraste la limpieza y presentación del establecimiento?",
    options: ["Excelente", "Buena", "Regular", "Mala"],
  },
  {
    name: "payment_experience",
    label: "6. ¿Cómo fue tu experiencia con el proceso de cobro y pago?",
    options: ["Excelente", "Buena", "Regular", "Mala"],
  },
  {
    name: "overall_satisfaction",
    label: "7. Considerando tu visita en general, ¿qué tan satisfecho(a) quedaste?",
    options: ["Muy satisfecho(a)", "Satisfecho(a)", "Poco satisfecho(a)", "Insatisfecho(a)"],
  },
  {
    name: "recommend_likelihood",
    label: "8. ¿Qué tan probable es que nos recomiendes a familiares o amigos?",
    options: ["Definitivamente sí", "Probablemente sí", "Probablemente no", "Definitivamente no"],
  },
];

const branches = ["Gómez Farías", "Navarrete", "Hotel Colonial"];

const initialAnswers = questions.reduce((result, question) => {
  result[question.name] = "";
  return result;
}, {});

export default function SurveyForm({ initialBranch, qrToken }) {
  const [answers, setAnswers] = useState(initialAnswers);
  const branch = branches.includes(initialBranch) ? initialBranch : "";
  const [contact, setContact] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const answeredCount = Object.values(answers).filter(Boolean).length;

  async function submitSurvey(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branch: branch.trim(),
          qr_token: qrToken,
          contact: contact.trim(),
          comment: comment.trim(),
          ...answers,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "No se pudo guardar la encuesta.");
      }

      setResult(payload);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function copyCode() {
    if (!result?.coupon?.code) return;
    await navigator.clipboard.writeText(result.coupon.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  if (result) {
    return (
      <main className="survey-card success-card">
        <Image
          alt="Stromboli Trattoria"
          className="card-logo"
          height={960}
          src="/stromboli-logo.png"
          width={960}
        />
        <CheckCircle2 className="success-icon" size={42} />
        <p className="eyebrow">Gracias por tu opinión</p>
        <h2>Tu promoción está lista</h2>
        <p className="muted">
          Presenta este folio en tu próxima visita. El restaurante lo marcará
          como usado al aplicarlo.
        </p>
        <button className="coupon-code" onClick={copyCode} type="button">
          <span>{result.coupon.code}</span>
          <Clipboard size={18} />
        </button>
        <p className="promo-text">{result.coupon.promotion_text}</p>
        <p className="microcopy">
          Vence el {new Date(result.coupon.expires_at).toLocaleDateString("es-MX")}.
          {copied ? " Folio copiado." : ""}
        </p>
      </main>
    );
  }

  return (
    <main className="survey-card">
      <Image
        alt="Stromboli Trattoria"
        className="card-logo card-logo-centered"
        height={960}
        src="/stromboli-logo.png"
        width={960}
      />
      <div className="form-header">
        <div>
          <p className="eyebrow">Encuesta de satisfacción</p>
          <h2>Queremos saber cómo estuvo tu visita</h2>
        </div>
        <div className="score-pill">
          {answeredCount}/{questions.length}
        </div>
      </div>

      <form onSubmit={submitSurvey}>
        <label className="field">
          <span>Sucursal</span>
          <input
            name="branch"
            readOnly
            required
            type="text"
            value={branch}
          />
          <small>Esta sucursal se detecta automáticamente desde el QR.</small>
        </label>

        <label className="field">
          <span>Teléfono</span>
          <input
            inputMode="tel"
            maxLength={20}
            minLength={8}
            name="contact"
            onChange={(event) => setContact(event.target.value)}
            placeholder="Ej. 662 123 4567"
            required
            type="tel"
            value={contact}
          />
        </label>

        <div className="question-list">
          {questions.map((question) => (
            <fieldset className="choice-field" key={question.name}>
              <legend>{question.label}</legend>
              <div className="choice-options">
                {question.options.map((option) => {
                  const inputId = `${question.name}-${option}`;
                  return (
                    <label
                      className={
                        answers[question.name] === option
                          ? "choice-option selected"
                          : "choice-option"
                      }
                      htmlFor={inputId}
                      key={option}
                    >
                      <input
                        checked={answers[question.name] === option}
                        id={inputId}
                        name={question.name}
                        onChange={() =>
                          setAnswers((current) => ({
                            ...current,
                            [question.name]: option,
                          }))
                        }
                        required
                        type="radio"
                        value={option}
                      />
                      <span>{option}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>

        <label className="field">
          <span>Comentario adicional opcional</span>
          <textarea
            maxLength={600}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Cuéntanos qué hicimos bien o qué podemos mejorar."
            rows={4}
            value={comment}
          />
        </label>

        {error ? <p className="error-message">{error}</p> : null}

        <button className="primary-button" disabled={submitting} type="submit">
          {submitting ? <Loader2 className="spin" size={18} /> : <CheckCircle2 size={18} />}
          Enviar y obtener folio
        </button>
      </form>
    </main>
  );
}
