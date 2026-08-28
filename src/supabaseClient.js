// Cliente de Supabase para el navegador.
//
// SEGURIDAD: la "anon key" está pensada para vivir en el cliente (queda embebida en
// el JS compilado que cualquiera puede leer). Eso es normal y seguro en Supabase
// SIEMPRE que Row Level Security (RLS) esté activo y bien escrito en cada tabla
// (ver supabase/schema.sql) — la protección real vive en esas políticas, no en
// esconder esta llave. Jamás pongas aquí la "service_role key": esa sí se salta
// RLS por completo y solo debe usarse en un backend de confianza (este proyecto
// no la necesita).
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // No es un error fatal: el juego funciona perfectamente sin cuentas, guardando
  // todo en localStorage como siempre. Solo se pierde la sincronización en la nube.
  console.warn(
    '[carrera-biblica] Supabase no está configurado (faltan VITE_SUPABASE_URL / ' +
    'VITE_SUPABASE_ANON_KEY). El juego funcionará solo en modo local, sin cuentas.'
  );
}

export const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
