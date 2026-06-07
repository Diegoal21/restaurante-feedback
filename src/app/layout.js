import "./globals.css";

export const metadata = {
  title: "Mesa Viva | Encuesta y promociones",
  description: "Encuesta con folios promocionales para restaurante.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
