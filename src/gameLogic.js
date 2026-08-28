// Lógica pura del juego: sin DOM, sin `window`, sin estado oculto en closures.
// Todo lo que vive aquí recibe sus datos por parámetro y devuelve un resultado,
// así que se puede probar con Vitest en Node sin necesidad de un navegador.
// `src/main.js` importa estas funciones y las conecta con el estado real del
// juego (CATS, BANCO, CONF_PODERES, el DOM, etc.).

export const PALETA = ['#6C3BF4', '#1BA8F0', '#12BF88', '#FFB020', '#FF5C7A', '#A855F7', '#00C2CB', '#F4711F'];

/** Oscurece un color hex (para la sombra 3D de los botones). f=0..1, 1=sin cambio. */
export function osc(hex, f) {
  f = f === undefined ? 0.68 : f;
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * f);
  const g = Math.round(((n >> 8) & 255) * f);
  const b = Math.round((n & 255) * f);
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/** Color de equipo por índice, ciclando la paleta si hay más equipos que colores. */
export function colorEq(i) {
  return PALETA[i % PALETA.length];
}

// Cuánto vale acertar según cuántas pistas ya se revelaron (100%, 70%, 40%, 20%, 10%).
export const ESCALA_PISTAS = [1, 0.7, 0.4, 0.2, 0.1];
export function escalaPista(i) {
  return ESCALA_PISTAS[i] !== undefined ? ESCALA_PISTAS[i] : ESCALA_PISTAS[ESCALA_PISTAS.length - 1];
}

/** Escapa HTML antes de insertarlo con innerHTML — la única barrera contra XSS
 *  en un motor que renderiza todo con plantillas de texto en vez de un framework. */
export function esc(t) {
  return String(t == null ? '' : t).replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
}

/** Cuántos números de este poder hay en el mazo, según la configuración del
 *  usuario (`conf`) o el valor por defecto del poder (`p.def`) si no lo tocó. */
export function cantPoder(conf, p) {
  const c = conf[p.id];
  return c === undefined ? p.def : Math.max(0, c | 0);
}

/** Total de números en el mazo con la configuración actual. */
export function totalMazo(catPoderes, conf) {
  return catPoderes.reduce((s, p) => s + cantPoder(conf, p), 0);
}

/** Arma y baraja el mazo de números/poderes. Si la configuración deja menos de
 *  8 números (muy pocos para una partida), se ignora y se usan los valores de
 *  fábrica — evita que un ajuste manual deje el juego sin poder empezar. */
export function armarMazo(catPoderes, conf) {
  let m = [];
  catPoderes.forEach(p => { for (let i = 0; i < cantPoder(conf, p); i++) m.push(p.id); });
  if (m.length < 8) {
    m = [];
    catPoderes.forEach(p => { for (let i = 0; i < p.def; i++) m.push(p.id); });
  }
  for (let i = m.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const x = m[i]; m[i] = m[j]; m[j] = x;
  }
  return m;
}

// Lista corta de contraseñas extremadamente comunes/filtradas.
// Supabase puede revisar contra HaveIBeenPwned (protección real y mucho más
// completa), pero esa función es solo para planes Pro en adelante. Esta lista
// es un mínimo gratuito para bloquear los casos más obvios (ver SECURITY.md).
export const PASS_DEBILES = new Set([
  'password', 'password1', 'password123', '12345678', '123456789', '1234567890',
  '123456', '1234567', '111111', '000000', '11111111', '12341234', 'qwerty123',
  'qwertyui', 'qwerty12', '1q2w3e4r', 'iloveyou', 'letmein', 'trustno1', 'admin123',
  'welcome1', 'sunshine', 'superman', 'football', 'baseball', 'dragon123', 'monkey123',
  'abc123456', 'abcd1234', 'password12', 'contrasena', 'contraseña', 'clave1234',
  '12345678910', 'asdfghjk', 'asdf1234', 'changeme', 'changeme1', 'p@ssword',
  'p@ssw0rd', 'passw0rd', 'qazwsx123', 'zxcvbnm12', 'starwars1',
]);

export function esPasswordDebil(pass, email) {
  const p = pass.toLowerCase().trim();
  if (PASS_DEBILES.has(p)) return true;
  if (email && p === email.split('@')[0].toLowerCase()) return true;
  if (/^([a-z0-9])\1{5,}$/.test(p)) return true; // ej: "aaaaaaaa"
  if (/^(0123456789|1234567890|01234567|12345678){1,}/.test(p)) return true;
  return false;
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Traduce los mensajes de error más comunes de Supabase Auth a español llano.
 *  Si no reconocemos el mensaje, mostramos el original en vez de fallar en
 *  silencio: mejor un mensaje en inglés que ninguna pista de qué pasó. */
export function mensajeError(err) {
  const m = (err && err.message) || String(err || '');
  const mapa = [
    [/invalid login credentials/i, 'Correo o contraseña incorrectos.'],
    [/user already registered|already been registered/i, 'Ya existe una cuenta con ese correo. Intenta iniciar sesión.'],
    [/email not confirmed/i, 'Confirma tu correo antes de iniciar sesión — revisa tu bandeja de entrada.'],
    [/password should be at least/i, 'La contraseña es muy corta.'],
    [/unable to validate email address|invalid email/i, 'Ese correo no parece válido.'],
    [/rate limit|too many requests|security purposes/i, 'Espera unos segundos antes de intentar de nuevo.'],
    [/network|fetch/i, 'No hay conexión con el servidor. Revisa tu internet e intenta otra vez.'],
  ];
  for (const [re, txt] of mapa) if (re.test(m)) return txt;
  return m || 'No se pudo completar la acción. Intenta de nuevo.';
}
