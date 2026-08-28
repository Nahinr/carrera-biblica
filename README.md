# 🏁 Carrera Bíblica

Juego de trivia bíblica para grupos (jóvenes, familias, iglesias): equipos que
avanzan en una pista respondiendo preguntas de personajes, animales, lugares y
citas bíblicas, con poderes y bloqueos al estilo juego de mesa.

Es un sitio 100% estático (HTML/CSS/JS, sin backend propio) que además permite
iniciar sesión para guardar **tu propio banco de preguntas en la nube**
(Supabase), disponible en cualquier dispositivo donde inicies sesión. Sin
cuenta, el juego funciona igual de bien guardando todo en el navegador
(`localStorage`), como siempre.

## Arquitectura

- **Frontend**: HTML/CSS/JS “vanilla”, empaquetado con [Vite](https://vitejs.dev).
- **Cuentas y datos en la nube**: [Supabase](https://supabase.com) (Auth +
  Postgres), accedido directamente desde el navegador con la librería oficial
  `@supabase/supabase-js`. No hay servidor propio.
- **Seguridad de los datos**: Row Level Security (RLS) en Postgres — cada
  usuario únicamente puede leer/escribir su propia fila. Ver
  [`supabase/schema.sql`](supabase/schema.sql) y [`SECURITY.md`](SECURITY.md).
- **CI/CD**: GitHub Actions. Cada push a `main` construye el sitio y lo
  publica en GitHub Pages. Cada Pull Request corre un build de verificación +
  auditoría de dependencias.

## Desarrollo local

Requisitos: Node.js 20+.

```bash
npm install
cp .env.example .env.local   # y coloca ahí tu URL y anon key de Supabase
npm run dev
```

Si no configuras `.env.local`, el juego funciona igual de bien: simplemente no
habrá inicio de sesión ni sincronización en la nube (todo queda en
`localStorage`, como siempre).

## Poner en marcha Supabase (una sola vez)

1. Crea una cuenta/proyecto gratis en <https://supabase.com/dashboard> (esto
   lo tienes que hacer tú: requiere tu propia cuenta).
2. En el proyecto nuevo, ve a **SQL Editor → New query**, pega **todo** el
   contenido de [`supabase/schema.sql`](supabase/schema.sql) y ejecútalo. Esto
   crea la tabla `user_game_data` con Row Level Security activado.
3. Ve a **Authentication → Providers** y confirma que **Email** esté
   habilitado (viene así por defecto).
4. Ve a **Authentication → Settings** (o **Policies**, según la versión del
   dashboard) y revisa/activa, recomendado para producción:
   - **Confirm email** (ON) — evita cuentas falsas creadas al vuelo. **Ya
     verificado en producción: activo.**
   - **Leaked password protection** — bloquea contraseñas ya filtradas usando
     HaveIBeenPwned. **Solo disponible en planes Pro en adelante de Supabase**
     (en el plan gratis, "Attack Protection" muestra el interruptor pero lo
     rechaza con "available on Pro Plans and up"). Mientras el proyecto esté
     en el plan gratis, esto se compensa con una lista corta de contraseñas
     comunes/filtradas que el propio juego rechaza antes de llamar a Supabase
     (`PASS_DEBILES` en `src/main.js`) — no es tan completo como
     HaveIBeenPwned, pero bloquea los casos más obvios sin costo.
   - Una política de contraseña de **mínimo 8 caracteres** (el formulario del
     juego ya exige 8 como mínimo en el navegador; esto lo refuerza también en
     el servidor).
   - **Rate limiting** de Auth (Supabase trae límites por defecto; no los
     desactives).
   - Opcional pero recomendado si el sitio se vuelve público/conocido: activa
     **CAPTCHA** (hCaptcha o Cloudflare Turnstile) en el formulario de
     Auth para frenar bots.
5. En **Authentication → URL Configuration**, configura:
   - **Site URL**: `https://<tu-usuario>.github.io/carrera-biblica/`
   - **Redirect URLs**: la misma URL de arriba, y `http://localhost:5173/`
     para desarrollo local.
   (Esto evita que alguien use tu proyecto de Supabase para mandar enlaces de
   confirmación/recuperación hacia un dominio ajeno.)
6. Copia la **Project URL** y la **anon public key** desde
   **Project Settings → API** — las necesitas para `.env.local` (desarrollo) y
   para los secrets de GitHub (producción, ver abajo). **Nunca copies la
   `service_role key` a ningún lado de este proyecto.**

## Publicar en GitHub Pages (CI/CD)

El repositorio ya incluye el workflow [`/.github/workflows/deploy.yml`](.github/workflows/deploy.yml).
Para activarlo:

1. En GitHub, ve a **Settings → Pages** del repositorio y confirma que
   **Source** esté en **GitHub Actions** (si este repo se creó con la ayuda de
   Claude Code, es probable que ya haya quedado así configurado).
2. En **Settings → Secrets and variables → Actions**, agrega dos secrets
   (hazlo tú mismo desde la web de GitHub, o con la CLI `gh` **en tu propia
   terminal**, para que el valor nunca quede en ningún historial ni se lo
   pases a nadie más):

   ```bash
   gh secret set SUPABASE_URL
   gh secret set SUPABASE_ANON_KEY
   ```

   (Cada comando te pedirá pegar el valor de forma interactiva.)
3. Haz push a `main`. La Action construye el sitio con esas llaves y lo
   publica en `https://<tu-usuario>.github.io/carrera-biblica/`.

Sin esos dos secrets, el sitio igual se publica y funciona — solo que sin
inicio de sesión ni sincronización en la nube, hasta que los agregues.

## Estructura del proyecto

```
index.html              Punto de entrada (pantallas del juego)
src/main.js             Todo el motor del juego + integración con Supabase
src/style.css           Estilos (idénticos al diseño original)
src/supabaseClient.js   Inicialización del cliente de Supabase
supabase/schema.sql     Tabla + políticas de Row Level Security
.github/workflows/      CI (build de verificación) y CD (deploy a Pages)
```

## Seguridad

Ver [`SECURITY.md`](SECURITY.md) para el detalle de las medidas aplicadas
(RLS, CSP, manejo de llaves, hardening de Auth) y qué falta configurar del
lado del dashboard de Supabase.
