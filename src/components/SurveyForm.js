"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { CheckCircle2, Clipboard, Loader2, Star } from "lucide-react";

const ratingFields = [
  ["rating_general", "Experiencia general"],
  ["rating_food", "Comida"],
  ["rating_service", "Servicio"],
  ["rating_cleanliness", "Limpieza"],
];

const initialRatings = {
  rating_general: 5,
  rating_food: 5,
  rating_service: 5,
  rating_cleanliness: 5,
};

export default function SurveyForm({ initialTable }) {
  const [ratings, setRatings] = useState(initialRatings);
  const [tableNumber, setTableNumber] = useState(initialTable || "");
  const [comment, setComment] = useState("");
  const [contact, setContact] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const average = useMemo(() => {
    const values = Object.values(ratings);
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }, [ratings]);

  async function submitSurvey(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table_number: tableNumber.trim(),
          comment: comment.trim(),
          contact: contact.trim(),
          ...ratings,
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
          src="/stromboli-logo.jpg"
          width={960}
        />
        <CheckCircle2 className="success-icon" size={42} />
        <p className="eyebrow">Grazie por tu opinion</p>
        <h2>Tu promocion esta lista</h2>
        <p className="muted">
          Presenta este folio en tu proxima visita. El restaurante lo marcara
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
      <div className="form-header">
        <div>
          <Image
            alt="Stromboli Trattoria"
            className="card-logo"
            height={960}
            src="/stromboli-logo.jpg"
            width={960}
          />
          <p className="eyebrow">Toma menos de un minuto</p>
          <h2>Como estuvo tu visita?</h2>
        </div>
        <div className="score-pill">
          <Star size={16} fill="currentColor" />
          {average.toFixed(1)}
        </div>
      </div>

      <form onSubmit={submitSurvey}>
        <label className="field">
          <span>Mesa</span>
          <input
            inputMode="numeric"
            name="table_number"
            onChange={(event) => setTableNumber(event.target.value)}
            placeholder="Ej. 12"
            value={tableNumber}
          />
        </label>

        <div className="ratings-grid">
          {ratingFields.map(([name, label]) => (
            <fieldset className="rating-field" key={name}>
              <legend>{label}</legend>
              <div className="rating-buttons">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    aria-label={`${label}: ${value}`}
                    className={ratings[name] === value ? "active" : ""}
                    key={value}
                    onClick={() =>
                      setRatings((current) => ({ ...current, [name]: value }))
                    }
                    type="button"
                  >
                    {value}
                  </button>
                ))}
              </div>
            </fieldset>
          ))}
        </div>

        <label className="field">
          <span>Comentario opcional</span>
          <textarea
            maxLength={600}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Cuentanos que hicimos bien o que podemos mejorar."
            rows={4}
            value={comment}
          />
        </label>

        <label className="field">
          <span>Telefono o email opcional</span>
          <input
            onChange={(event) => setContact(event.target.value)}
            placeholder="Solo si quieres que te contactemos"
            value={contact}
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
