import Image from "next/image";
import SurveyForm from "@/components/SurveyForm";

export default async function Home({ searchParams }) {
  const params = await searchParams;
  const tableNumber = params?.mesa || params?.table || "";
  const restaurantName =
    process.env.NEXT_PUBLIC_RESTAURANT_NAME || "Stromboli Trattoria";

  return (
    <div className="public-shell">
      <section className="survey-hero">
        <div>
          <Image
            alt="Stromboli Trattoria"
            className="hero-logo"
            height={960}
            src="/stromboli-logo.png"
            width={960}
            priority
          />
          <p className="eyebrow">Encuesta de visita</p>
          <h1>{restaurantName}</h1>
          <p className="hero-copy">
            Cuentanos como estuvo tu experiencia y recibe una promocion para tu
            proxima visita.
          </p>
        </div>
      </section>
      <SurveyForm initialTable={tableNumber} />
    </div>
  );
}
