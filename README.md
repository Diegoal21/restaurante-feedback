# Stromboli Trattoria Feedback

Aplicación Next.js para encuesta de Stromboli Trattoria con generación de folios y panel admin.

## Configuración

1. Crea un proyecto en Supabase.
2. En Supabase SQL Editor, ejecuta `supabase-schema.sql`.
3. En Supabase Auth, crea el usuario del dueño del restaurante.
4. Copia `.env.example` a `.env.local` y llena las variables.
5. Asegúrate de poner el email del dueño en `ADMIN_EMAILS`.

```bash
cp .env.example .env.local
```

## Desarrollo

```bash
npm install
npm run dev
```

Rutas principales:

- `/` encuesta pública. Para QR por sucursal usa `/`.
- `/admin` panel privado del dueño.

## Vercel

En Vercel agrega las mismas variables de `.env.local` en Project Settings > Environment Variables.

Nunca expongas `SUPABASE_SERVICE_ROLE_KEY` en código del navegador.

## Uso

El cliente responde la encuesta y recibe un folio único. En `/admin`, el dueño puede revisar estadísticas básicas, buscar folios y marcar un folio como usado.
