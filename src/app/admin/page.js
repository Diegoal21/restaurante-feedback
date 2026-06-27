"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Check,
  LogOut,
  RefreshCw,
  Search,
  ShieldCheck,
  Ticket,
} from "lucide-react";
import { createBrowserSupabase } from "@/lib/supabase-browser";

const surveyBreakdowns = [
  ["branch", "Sucursal"],
  ["how_found", "1. Como nos encontraron"],
  ["service_attention", "2. Atencion del personal"],
  ["wait_time", "3. Tiempo de espera"],
  ["food_quality", "4. Alimentos y bebidas"],
  ["cleanliness", "5. Limpieza y presentacion"],
  ["payment_experience", "6. Cobro y pago"],
  ["overall_satisfaction", "7. Satisfaccion general"],
  ["recommend_likelihood", "8. Probabilidad de recomendacion"],
];

export default function AdminPage() {
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const hasSupabaseEnv = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState(
    hasSupabaseEnv
      ? ""
      : "Configura NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY."
  );
  const [data, setData] = useState(null);
  const [query, setQuery] = useState("");

  const loadStats = useCallback(async (token) => {
    if (!token) return;
    setError("");
    const response = await fetch("/api/admin/stats", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error || "No se pudieron cargar las estadisticas.");
      return;
    }
    setData(payload);
  }, []);

  useEffect(() => {
    if (!hasSupabaseEnv) {
      return;
    }

    clearStoredSupabaseSessions();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
        if (nextSession) loadStats(nextSession.access_token);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [hasSupabaseEnv, loadStats, supabase]);

  async function signIn(event) {
    event.preventDefault();
    setError("");
    if (!hasSupabaseEnv) {
      setError("Primero configura las variables de Supabase en .env.local.");
      return;
    }
    setSigningIn(true);
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (authError || !authData.session) {
      setError("Credenciales incorrectas o usuario no registrado.");
      setSigningIn(false);
      return;
    }

    setSession(authData.session);
    setPassword("");
    await loadStats(authData.session.access_token);
    setSigningIn(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setSession(null);
    setData(null);
  }

  async function redeemCoupon(code) {
    const response = await fetch("/api/admin/coupons/redeem", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error || "No se pudo marcar el folio.");
      return;
    }
    setData((current) => ({
      ...current,
      coupons: current.coupons.map((coupon) =>
        coupon.code === code ? payload.coupon : coupon
      ),
      summary: {
        ...current.summary,
        coupons_unused: Math.max(0, current.summary.coupons_unused - 1),
        coupons_redeemed: current.summary.coupons_redeemed + 1,
      },
    }));
  }

  const filteredCoupons = useMemo(() => {
    if (!data?.coupons) return [];
    const normalized = query.trim().toLowerCase();
    if (!normalized) return data.coupons;
    return data.coupons.filter((coupon) =>
      coupon.code.toLowerCase().includes(normalized)
    );
  }, [data, query]);

  if (loading) {
    return <div className="admin-shell center-state">Cargando panel...</div>;
  }

  if (!session) {
    return (
      <main className="admin-login">
        <section className="login-panel">
          <Image
            alt="Stromboli Trattoria"
            className="login-logo"
            height={960}
            src="/stromboli-logo.png"
            width={960}
          />
          <ShieldCheck size={34} />
          <p className="eyebrow">Panel privado</p>
          <h1>Entrar como dueno</h1>
          <form onSubmit={signIn}>
            <label className="field">
              <span>Email</span>
              <input
                autoComplete="email"
                onChange={(event) => setEmail(event.target.value)}
                required
                type="email"
                value={email}
              />
            </label>
            <label className="field">
              <span>Contrasena</span>
              <input
                autoComplete="current-password"
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
            </label>
            {error ? <p className="error-message">{error}</p> : null}
            <button className="primary-button" disabled={signingIn} type="submit">
              <ShieldCheck size={18} />
              Entrar
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div className="admin-brand">
          <Image
            alt="Stromboli Trattoria"
            className="admin-logo"
            height={960}
            src="/stromboli-logo.png"
            width={960}
          />
          <p className="eyebrow">Dashboard</p>
          <h1>
            {process.env.NEXT_PUBLIC_RESTAURANT_NAME || "Stromboli Trattoria"}
          </h1>
        </div>
        <div className="admin-actions">
          <button
            className="icon-button"
            onClick={() => loadStats(session?.access_token)}
            title="Actualizar"
          >
            <RefreshCw size={18} />
          </button>
          <button className="icon-button" onClick={signOut} title="Salir">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {error ? <p className="error-message">{error}</p> : null}

      <section className="metric-grid">
        <Metric label="Encuestas" value={data?.summary?.survey_count || 0} />
        <Metric
          label="Satisfaccion positiva"
          value={`${Math.round(data?.summary?.satisfaction_positive_rate || 0)}%`}
        />
        <Metric label="Folios activos" value={data?.summary?.coupons_unused || 0} />
        <Metric label="Folios usados" value={data?.summary?.coupons_redeemed || 0} />
      </section>

      <section className="dashboard-grid">
        <div className="panel">
          <div className="panel-title">
            <BarChart3 size={20} />
            <h2>Indicadores de satisfaccion</h2>
          </div>
          <ScoreBar label="Satisfaccion" value={data?.summary?.rating_general || 0} />
          <ScoreBar label="Alimentos y bebidas" value={data?.summary?.rating_food || 0} />
          <ScoreBar label="Atencion" value={data?.summary?.rating_service || 0} />
          <ScoreBar label="Limpieza" value={data?.summary?.rating_cleanliness || 0} />
        </div>

        <div className="panel">
          <div className="panel-title">
            <Ticket size={20} />
            <h2>Folios</h2>
          </div>
          <label className="search-field">
            <Search size={18} />
            <input
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar folio"
              value={query}
            />
          </label>
          <div className="coupon-list">
            {filteredCoupons.map((coupon) => (
              <article className="coupon-row" key={coupon.id}>
                <div>
                  <strong>{coupon.code}</strong>
                  <span>{statusLabel(coupon.status)}</span>
                </div>
                {coupon.status === "unused" ? (
                  <button onClick={() => redeemCoupon(coupon.code)} type="button">
                    <Check size={16} />
                    Usar
                  </button>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="panel survey-breakdowns-panel">
        <div className="panel-title">
          <BarChart3 size={20} />
          <h2>Respuestas de encuesta</h2>
        </div>
        <div className="survey-breakdowns-grid">
          {surveyBreakdowns.map(([key, title]) => (
            <BreakdownList
              items={data?.breakdowns?.[key]}
              key={key}
              title={title}
            />
          ))}
        </div>
      </section>

      <section className="panel comments-panel">
        <h2>Registros recientes</h2>
        <div className="comments-list">
          {data?.recent_surveys?.length ? (
            data.recent_surveys.map((survey) => (
              <article className="comment-item" key={survey.id}>
                <p>{survey.comment || "Sin comentario adicional."}</p>
                <span>
                  Sucursal {survey.branch || survey.table_number || "sin dato"} -{" "}
                  Tel. {survey.contact || "sin dato"} -{" "}
                  {new Date(survey.created_at).toLocaleDateString("es-MX")}
                </span>
              </article>
            ))
          ) : (
            <p className="muted">Todavia no hay registros.</p>
          )}
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function clearStoredSupabaseSessions() {
  if (typeof window === "undefined") return;

  [window.localStorage, window.sessionStorage].forEach((storage) => {
    Object.keys(storage)
      .filter((key) => key.startsWith("sb-") && key.endsWith("-auth-token"))
      .forEach((key) => storage.removeItem(key));
  });
}

function ScoreBar({ label, value }) {
  const width = `${Math.min(100, (Number(value) / 5) * 100)}%`;
  return (
    <div className="score-row">
      <div>
        <span>{label}</span>
        <strong>{Number(value || 0).toFixed(1)}</strong>
      </div>
      <div className="bar-track">
        <span style={{ width }} />
      </div>
    </div>
  );
}

function BreakdownList({ items, title }) {
  const rows = Object.entries(items || {}).sort((first, second) => second[1] - first[1]);
  const max = rows.reduce((result, [, count]) => Math.max(result, count), 0);

  if (!rows.length) return null;

  return (
    <div className="breakdown-list">
      <h3>{title}</h3>
      {rows.slice(0, 5).map(([label, count]) => (
        <div className="breakdown-row" key={label}>
          <div>
            <span>{label}</span>
            <strong>{count}</strong>
          </div>
          <div className="bar-track">
            <span style={{ width: `${max ? (count / max) * 100 : 0}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function statusLabel(status) {
  return {
    unused: "Disponible",
    redeemed: "Usado",
    expired: "Vencido",
  }[status] || status;
}
