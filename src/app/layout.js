import "./globals.css";

export const metadata = {
  title: "Stromboli Trattoria | Encuesta y promociones",
  description: "Encuesta con folios promocionales para Stromboli Trattoria.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
