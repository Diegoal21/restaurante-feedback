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

- `/` muestra un aviso si no se abre desde un QR válido.
- `/?qr=gf-a9k4mp7xq2rl8vn5tc3zy6` encuesta de Gómez Farías.
- `/?qr=nv-r8m2qk5zv7xp4tn9la6cd3` encuesta de Navarrete.
- `/?qr=hc-p6x3va9lt2rq7mk4nz8yw5` encuesta de Hotel Colonial.
- `/admin` panel privado del dueño.

Para imprimir QR, usa el dominio final de Vercel antes de cada ruta. Ejemplo:
`https://tu-dominio.vercel.app/?qr=gf-a9k4mp7xq2rl8vn5tc3zy6`.

## Vercel

En Vercel agrega las mismas variables de `.env.local` en Project Settings > Environment Variables.

Nunca expongas `SUPABASE_SERVICE_ROLE_KEY` en código del navegador.

## Uso

El cliente responde la encuesta y recibe un folio único. En `/admin`, el dueño puede revisar estadísticas básicas, buscar folios y marcar un folio como usado.
