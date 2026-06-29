import SurveyForm from "@/components/SurveyForm";
import { getBranchByQrToken, normalizeQrToken, QR_TOKEN_PARAM } from "@/lib/branch-qr";

export default async function Home({ searchParams }) {
  const params = await searchParams;
  const qrToken = normalizeQrToken(params?.[QR_TOKEN_PARAM]);
  const branch = getBranchByQrToken(qrToken);
  const restaurantName =
    process.env.NEXT_PUBLIC_RESTAURANT_NAME || "Stromboli Trattoria";

  return (
    <div className="public-shell">
      <section className="survey-hero">
        <div>
          <p className="eyebrow">Encuesta de visita</p>
          <h1>{restaurantName}</h1>
          <p className="hero-copy">
            Comparte tu experiencia y recibe una promoción para tu próxima
            visita.
          </p>
        </div>
      </section>
      {branch ? (
        <SurveyForm initialBranch={branch} qrToken={qrToken} />
      ) : (
        <QrRequiredCard />
      )}
    </div>
  );
}

function QrRequiredCard() {
  return (
    <main className="survey-card qr-required-card">
      <p className="eyebrow">Acceso por QR</p>
      <h2>Escanea el QR de tu cuenta</h2>
      <p className="muted">
        Para responder la encuesta y recibir tu folio, usa el código QR que te
        entregó el restaurante al final de tu visita.
      </p>
    </main>
  );
}
