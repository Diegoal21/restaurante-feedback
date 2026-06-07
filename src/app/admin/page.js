"use client";

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

export default function AdminPage() {
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const hasSupabaseEnv = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(hasSupabaseEnv);
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
      setError(payload.error || "No se pudieron cargar las estadísticas.");
      return;
    }
    setData(payload);
  }, []);

  useEffect(() => {
    if (!hasSupabaseEnv) {
      return;
    }

    supabase.auth.getSession().then(({ data: authData }) => {
      setSession(authData.session);
      setLoading(false);
      if (authData.session) loadStats(authData.session.access_token);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
        if (nextSession) loadStats(nextSession.access_token);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, [hasSupabaseEnv, loadStats, supabase]);

  async function signIn(event) {
    event.preventDefault();
    setError("");
    if (!hasSupabaseEnv) {
      setError("Primero configura las variables de Supabase en .env.local.");
      return;
    }
    setSigningIn(true);
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (authError) setError("Credenciales incorrectas o usuario no registrado.");
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
          <ShieldCheck size={34} />
          <p className="eyebrow">Panel privado</p>
          <h1>Entrar como dueño</h1>
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
              <span>Contraseña</span>
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
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1>{process.env.NEXT_PUBLIC_RESTAURANT_NAME || "Mesa Viva"}</h1>
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
          label="Promedio"
          value={(data?.summary?.rating_average || 0).toFixed(1)}
        />
        <Metric label="Folios activos" value={data?.summary?.coupons_unused || 0} />
        <Metric label="Folios usados" value={data?.summary?.coupons_redeemed || 0} />
      </section>

      <section className="dashboard-grid">
        <div className="panel">
          <div className="panel-title">
            <BarChart3 size={20} />
            <h2>Calificaciones</h2>
          </div>
          <ScoreBar label="General" value={data?.summary?.rating_general || 0} />
          <ScoreBar label="Comida" value={data?.summary?.rating_food || 0} />
          <ScoreBar label="Servicio" value={data?.summary?.rating_service || 0} />
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

      <section className="panel comments-panel">
        <h2>Comentarios recientes</h2>
        <div className="comments-list">
          {data?.comments?.length ? (
            data.comments.map((survey) => (
              <article className="comment-item" key={survey.id}>
                <p>{survey.comment}</p>
                <span>
                  Mesa {survey.table_number || "sin dato"} -{" "}
                  {new Date(survey.created_at).toLocaleDateString("es-MX")}
                </span>
              </article>
            ))
          ) : (
            <p className="muted">Todavía no hay comentarios.</p>
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

function statusLabel(status) {
  return {
    unused: "Disponible",
    redeemed: "Usado",
    expired: "Vencido",
  }[status] || status;
}
