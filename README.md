# Stromboli Trattoria Feedback

Aplicacion Next.js para encuesta de Stromboli Trattoria con generacion de folios y panel admin.

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

- `/` encuesta publica. Para QR por mesa usa `/?mesa=12`.
- `/admin` panel privado del dueño.

## Vercel

En Vercel agrega las mismas variables de `.env.local` en Project Settings > Environment Variables.

Nunca expongas `SUPABASE_SERVICE_ROLE_KEY` en código del navegador.

## Uso

El cliente responde la encuesta y recibe un folio unico. En `/admin`, el dueño puede revisar estadisticas basicas, buscar folios y marcar un folio como usado.
