import SurveyForm from "@/components/SurveyForm";

export default async function Home({ searchParams }) {
  const params = await searchParams;
  const tableNumber = params?.mesa || params?.table || "";

  return (
    <div className="public-shell">
      <section className="survey-hero">
        <div>
          <p className="eyebrow">Encuesta de visita</p>
          <h1>{process.env.NEXT_PUBLIC_RESTAURANT_NAME || "Mesa Viva"}</h1>
          <p className="hero-copy">
            Cuéntanos cómo estuvo tu experiencia y recibe una promoción para tu
            próxima visita.
          </p>
        </div>
      </section>
      <SurveyForm initialTable={tableNumber} />
    </div>
  );
}
