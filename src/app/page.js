import SurveyForm from "@/components/SurveyForm";

export default async function Home({ searchParams }) {
  const params = await searchParams;
  const branch = params?.sucursal || params?.branch || params?.mesa || params?.table || "";
  const restaurantName =
    process.env.NEXT_PUBLIC_RESTAURANT_NAME || "Stromboli Trattoria";

  return (
    <div className="public-shell">
      <section className="survey-hero">
        <div>
          <p className="eyebrow">Encuesta de visita</p>
          <h1>{restaurantName}</h1>
          <p className="hero-copy">
            Comparte tu experiencia y recibe una promocion para tu proxima
            visita.
          </p>
        </div>
      </section>
      <SurveyForm initialBranch={branch} />
    </div>
  );
}
