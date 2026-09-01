# Seguridad de este proyecto

Resumen de las medidas aplicadas y por qué, para que quede documentado y se
pueda auditar/mantener con el tiempo.

## 1. El modelo de amenaza

Este es un sitio 100% estático: no hay servidor propio, ni base de datos que
tú administres, ni backend con lógica de negocio. Todo el "backend" es
Supabase (Auth + Postgres gestionado). Eso significa que:

- No hay servidor propio que parchear, asegurar o que se pueda caer.
- La única superficie de ataque real son (a) el propio código del navegador,
  y (b) la configuración de Supabase (políticas de base de datos + Auth).

## 2. La "anon key" de Supabase es pública **a propósito**

`VITE_SUPABASE_ANON_KEY` termina embebida en el JavaScript que descarga
cualquier visitante — eso es **el diseño esperado de Supabase**, no un
descuido. Esa llave por sí sola no da acceso a nada: todo el acceso a datos
pasa por Postgres, y Postgres solo lo autoriza si las políticas de **Row
Level Security (RLS)** lo permiten fila por fila.

Por eso la regla de oro de este proyecto es:

> **La seguridad vive en las políticas de RLS, no en esconder la anon key.**

La `service_role key` es completamente distinta: esa sí se salta RLS por
completo y equivale a acceso de administrador a toda la base de datos. **Este
proyecto no la usa en ningún lado**, y no debe agregarse jamás a código de
cliente/navegador, ni a este repositorio, ni a un secret de un workflow que
compile código que corre en el navegador.

## 3. Row Level Security (RLS)

Definido en [`supabase/schema.sql`](supabase/schema.sql):

- La tabla `user_game_data` tiene **una fila por usuario** (`user_id` es su
  llave primaria y referencia a `auth.users`).
- RLS está **activado** en la tabla, con cuatro políticas (select/insert/
  update/delete) que exigen siempre `auth.uid() = user_id`.
- Como refuerzo adicional (no solo depender de RLS), se revocan
  explícitamente todos los privilegios del rol `anon` sobre la tabla: un
  visitante sin sesión iniciada no puede ni intentarlo.
- Límite defensivo (`check (pg_column_size(data) < 2000000)`) para que una
  cuenta no pueda inflar su fila a un tamaño abusivo.
- La función de trigger usa `security invoker` y fija `search_path = ''`,
  siguiendo la recomendación de Supabase para evitar el problema clásico de
  "search_path mutable" en funciones de Postgres.

**Antes de agregar cualquier tabla nueva**: actívale RLS y escribe sus
políticas en el mismo momento en que la creas. Una tabla sin RLS con la anon
key dando vueltas en el cliente es 100% pública para leer/escribir.

**Verificado en producción (28-ago-2026)**, con peticiones REST directas
contra el proyecto real (dos cuentas de prueba, luego borradas):

- Lectura y escritura anónimas (sin sesión) a `user_game_data` →
  `401 permission denied for table user_game_data`.
- Un usuario autenticado intentando escribir en la fila de **otro**
  `user_id` → `403 new row violates row-level security policy`.
- Un usuario autenticado leyendo la tabla **sin filtro** (`select=*` sin
  `.eq(...)`) → solo recibe su propia fila, nunca las de otras cuentas.

Estas tres pruebas son la validación real de que ni la anon key pública ni
una cuenta comprometida de otro usuario alcanzan para leer datos ajenos.

## 4. Autenticación

- Se usa Supabase Auth con **correo + contraseña** (sin roles especiales de
  administrador en esta primera versión: cada usuario solo ve sus propios
  datos).
- El formulario exige un mínimo de 8 caracteres en el navegador; el
  `README.md` recomienda reforzarlo también del lado de Supabase, junto con:
  - Confirmación de correo obligatoria (evita cuentas falsas/de un solo uso).
    **Verificado en producción** (28-ago-2026): una cuenta sin confirmar
    recibe `email_not_confirmed` al intentar iniciar sesión.
  - Protección contra contraseñas filtradas (HaveIBeenPwned) — **solo
    disponible en planes Pro de Supabase en adelante**; en el plan gratis el
    dashboard rechaza el interruptor con "available on Pro Plans and up".
    Mientras el proyecto esté en el plan gratis, se compensa con
    `PASS_DEBILES`/`esPasswordDebil()` en `src/main.js`: una lista corta de
    contraseñas comunes/filtradas (p. ej. `password123`, `qwerty123`) que el
    juego rechaza en el navegador antes de siquiera llamar a Supabase. No
    reemplaza una verificación real contra una base de datos de miles de
    millones de contraseñas filtradas, pero bloquea gratis los casos más
    obvios. Si el proyecto pasa a un plan de pago, activar el interruptor
    real de Supabase y esta lista pueden convivir sin problema.
  - Rate limiting de Auth (viene activado por defecto en Supabase — no
    desactivarlo).
  - `Site URL` / `Redirect URLs` restringidos al dominio real de GitHub Pages
    (y `localhost` en desarrollo), para que los enlaces de confirmación o
    recuperación de contraseña no puedan apuntar a un dominio ajeno.
    **Verificado**: Site URL configurado a la URL real de GitHub Pages.
- Supabase JS guarda la sesión (JWT) en `localStorage` del navegador — es el
  comportamiento estándar de la librería; el token de acceso expira solo y se
  renueva automáticamente mientras la sesión siga activa.

## 5. Cabeceras y CSP

`index.html` define una Content-Security-Policy estricta vía `<meta>`:

- `script-src 'self'`: cero scripts inline, cero scripts de terceros — todo
  el JS (incluida la librería de Supabase) va empaquetado por Vite y servido
  desde el mismo origen. Esto elimina por completo el riesgo de que un script
  de un CDN externo sea comprometido y afecte este sitio.
- `connect-src 'self' https://*.supabase.co wss://*.supabase.co`: el
  navegador solo puede llamar a este mismo origen y a Supabase. Ninguna otra
  petición de red es posible aunque se inyectara HTML malicioso. El `wss://`
  es explícito a propósito: en la práctica el navegador NO trata un origen
  `https://` como si ya cubriera su equivalente `wss://` (lo confirmamos al
  construir el multijugador — sin esta línea, Supabase Realtime quedaba
  bloqueado por el propio CSP).
- `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`: cierran rutas
  clásicas de explotación de XSS.
- `style-src` incluye `'unsafe-inline'` porque el motor del juego pinta
  colores por equipo con `element.style.cssText` en JavaScript (no ejecuta
  scripts; solo aplica estilos). Es una concesión consciente y de bajo riesgo,
  documentada aquí en vez de dejarla sin explicar.

**Limitación conocida**: GitHub Pages no permite configurar cabeceras HTTP
propias, así que protecciones que solo funcionan como cabecera real (no como
`<meta>`) —como `X-Frame-Options` o `frame-ancestors` en la CSP, que
mitigarían clickjacking— no se pueden aplicar aquí. Si esto llega a importar
más adelante, la solución es mover el hosting a Cloudflare Pages o Netlify,
donde sí se pueden definir cabeceras personalizadas.

## 6. Multijugador: canales Realtime efímeros

El modo multijugador (cada equipo se conecta desde su propio celular y usa
un botón de timbre) usa **Supabase Realtime** en vez de una tabla nueva:

- **Sin tabla, sin RLS que mantener**: el canal es de difusión efímera —
  existe mientras haya alguien conectado y desaparece solo. No queda ningún
  registro guardado en ningún lado después de que termina la partida.
- **El código de sesión ES el control de acceso**, igual que el PIN de un
  Kahoot: 5 caracteres de un alfabeto de 32 (sin `0/O/1/I/L`, para que no se
  confundan al leerlos en voz alta) ≈ 33 millones de combinaciones posibles.
  Cualquiera que conozca el código puede unirse o escuchar ese canal
  mientras dura la sesión — es una limitación de diseño inherente a "unirse
  con un código corto" (la misma que tiene Kahoot), no algo que se pueda
  evitar sin pedirle una cuenta a cada jugador, que es justo la fricción que
  este modo busca evitar.
- **No hace falta iniciar sesión** para usar Realtime aquí: se confirmó en
  la práctica (dos pestañas independientes intercambiando mensajes solo con
  la anon key) que los canales de difusión pública funcionan sin
  autenticación en este proyecto. Ni el anfitrión ni los equipos manejan la
  `service_role key` en ningún momento — no la necesitan.
- **Nada sensible viaja por el canal**: solo nombres de equipo (los que el
  propio jugador escribe), fichas, puntajes y posiciones en el tablero.

## 7. Prevención de XSS en el contenido

Todo el texto dinámico que se inserta en el DOM (nombres de equipo, preguntas,
respuestas, categorías — incluyendo lo que llega desde la nube una vez que el
usuario inicia sesión) pasa por la función `esc()` de `src/main.js`, que
escapa `< > & "` antes de insertarse con `innerHTML`. Esto aplica igual a los
datos que vienen de Supabase que a los que ya vivían en `localStorage`: es el
mismo pipeline de renderizado para ambos casos, así que no hay una ruta nueva
sin escapar.

## 8. Manejo de secretos en el repositorio

- `.env`, `.env.local` y cualquier `.env.*.local` están en `.gitignore`: las
  llaves reales de Supabase nunca se comitean.
- `.env.example` solo tiene placeholders.
- En CI/CD, las llaves se inyectan como **GitHub Actions secrets**
  (`SUPABASE_URL`, `SUPABASE_ANON_KEY`), nunca escritas en los workflows.
- `dist/` y `node_modules/` están en `.gitignore` — el repositorio solo
  contiene código fuente, nunca artefactos de build ni dependencias.

## 9. Dependencias

- `.github/dependabot.yml` mantiene actualizadas automáticamente las
  dependencias de `npm` y las de GitHub Actions (ambas con PRs semanales).
- El workflow de CI (`ci.yml`) corre `npm audit --audit-level=high` en cada
  Pull Request, para detectar vulnerabilidades conocidas antes de fusionar.

## 10. Lo que TÚ debes hacer (no automatizable desde aquí)

Por diseño, hay pasos que requieren tu propia cuenta/credenciales y que un
asistente no debe (ni puede, de forma segura) hacer por ti:

- Crear el proyecto de Supabase y aplicar `supabase/schema.sql`.
- Configurar los interruptores de Auth mencionados en la sección 4.
- Agregar los secrets `SUPABASE_URL` / `SUPABASE_ANON_KEY` al repositorio
  (con `gh secret set`, tecleando el valor tú mismo cuando el comando te lo
  pida — así nunca queda expuesto en ningún chat, log o historial).
- Activar 2FA en tu cuenta de GitHub y en tu cuenta de Supabase (muy
  recomendado, de forma general).
- Si el juego se vuelve público, considerar activar CAPTCHA en el formulario
  de Auth.
