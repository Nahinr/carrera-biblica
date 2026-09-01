// Multijugador: cada equipo se conecta desde su propio celular y usa un
// botón de "timbre" (buzz) en vez de compartir una sola pantalla. El
// moderador (host) sigue siendo quien decide qué categoría toca y quién
// ganó el punto — el timbre solo le dice quién tocó primero.
//
// Arquitectura deliberadamente simple: SIN tabla nueva en la base de datos.
// Usamos un canal de Supabase Realtime (difusión efímera) cuyo nombre es el
// código de la sesión. No hace falta ninguna política de RLS porque no hay
// ninguna tabla involucrada — es un canal de radio temporal, no algo que se
// guarde. Verificado en vivo: dos pestañas independientes intercambiando
// mensajes por el canal, usando solo la anon key, sin iniciar sesión.
//
// Seguridad: el código de sesión ES el control de acceso, igual que un PIN
// de Kahoot — cualquiera que lo conozca puede unirse o escuchar el canal
// mientras dura la partida. Por eso el código no es corto ni adivinable a
// simple vista (5 caracteres de un alfabeto de 32 sin ambigüedades ≈ 33
// millones de combinaciones) y el canal deja de existir en cuanto todos se
// desconectan — no queda ningún rastro guardado en ningún lado.
import { supabase } from './supabaseClient.js';

// Sin 0/O, 1/I/L: para que nadie confunda el código al leerlo en voz alta.
const ALFABETO_CODIGO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generarCodigo(largo = 5) {
  let s = '';
  for (let i = 0; i < largo; i++) s += ALFABETO_CODIGO[Math.floor(Math.random() * ALFABETO_CODIGO.length)];
  return s;
}

export function generarIdEquipo() {
  return 'eq_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function nombreCanal(codigo) {
  return `carrera-biblica-sesion-${codigo}`;
}

/** Abre (o reutiliza) el canal Realtime de una sesión. Devuelve null si
 *  Supabase no está configurado — el multijugador no puede funcionar sin
 *  eso, así que quien llame debe avisarle al usuario en ese caso. */
export function abrirCanal(codigo) {
  if (!supabase) return null;
  return supabase.channel(nombreCanal(codigo), {
    config: { broadcast: { self: false }, presence: { key: '' } },
  });
}

export function enviar(canal, evento, payload) {
  if (!canal) return;
  canal.send({ type: 'broadcast', event: evento, payload });
}

export function cerrarCanal(canal) {
  if (canal && supabase) supabase.removeChannel(canal);
}
