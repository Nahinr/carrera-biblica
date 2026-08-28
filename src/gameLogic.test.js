import { describe, it, expect } from 'vitest';
import {
  osc, colorEq, escalaPista, esc,
  cantPoder, totalMazo, armarMazo,
  esPasswordDebil, EMAIL_RE, mensajeError,
  PALETA, ESCALA_PISTAS,
} from './gameLogic.js';

describe('osc (oscurece un color para la sombra 3D)', () => {
  it('oscurece un color al 68% por defecto', () => {
    expect(osc('#ffffff')).toBe('#adadad');
  });
  it('respeta un factor explícito', () => {
    expect(osc('#ffffff', 0.5)).toBe('#808080');
  });
  it('con factor 1 devuelve el mismo color', () => {
    expect(osc('#6c3bf4', 1)).toBe('#6c3bf4');
  });
  it('con factor 0 devuelve negro', () => {
    expect(osc('#ff5c7a', 0)).toBe('#000000');
  });
});

describe('colorEq', () => {
  it('devuelve el color de la paleta según el índice', () => {
    expect(colorEq(0)).toBe(PALETA[0]);
    expect(colorEq(2)).toBe(PALETA[2]);
  });
  it('cicla la paleta cuando hay más equipos que colores', () => {
    expect(colorEq(PALETA.length)).toBe(PALETA[0]);
    expect(colorEq(PALETA.length + 3)).toBe(PALETA[3]);
  });
});

describe('escalaPista', () => {
  it('la primera pista vale el 100%', () => {
    expect(escalaPista(0)).toBe(1);
  });
  it('sigue la escala decreciente definida', () => {
    ESCALA_PISTAS.forEach((v, i) => expect(escalaPista(i)).toBe(v));
  });
  it('más allá de la última pista, se queda en el valor mínimo', () => {
    expect(escalaPista(99)).toBe(ESCALA_PISTAS[ESCALA_PISTAS.length - 1]);
  });
});

describe('esc (escape de HTML)', () => {
  it('escapa las 4 entidades peligrosas', () => {
    expect(esc(`<script>alert("x")&</script>`)).toBe('&lt;script&gt;alert(&quot;x&quot;)&amp;&lt;/script&gt;');
  });
  it('null/undefined se convierten en cadena vacía, no en "null"', () => {
    expect(esc(null)).toBe('');
    expect(esc(undefined)).toBe('');
  });
  it('convierte números a texto sin tocarlos', () => {
    expect(esc(42)).toBe('42');
  });
});

describe('poderes: cantPoder / totalMazo / armarMazo', () => {
  const catPoderes = [
    { id: 'a', def: 3 }, { id: 'b', def: 2 }, { id: 'c', def: 5 },
  ];

  it('cantPoder usa el valor configurado si existe', () => {
    expect(cantPoder({ a: 7 }, catPoderes[0])).toBe(7);
  });
  it('cantPoder usa el valor por defecto si no fue configurado', () => {
    expect(cantPoder({}, catPoderes[0])).toBe(3);
  });
  it('cantPoder nunca es negativo aunque se configure así', () => {
    expect(cantPoder({ a: -5 }, catPoderes[0])).toBe(0);
  });

  it('totalMazo suma todos los poderes con la configuración dada', () => {
    expect(totalMazo(catPoderes, {})).toBe(3 + 2 + 5);
    expect(totalMazo(catPoderes, { a: 0, b: 0, c: 0 })).toBe(0);
  });

  it('armarMazo respeta las cantidades configuradas cuando suman 8 o más', () => {
    const conf = { a: 4, b: 4, c: 4 };
    const mazo = armarMazo(catPoderes, conf);
    expect(mazo.length).toBe(12);
    expect(mazo.filter(id => id === 'a').length).toBe(4);
    expect(mazo.filter(id => id === 'b').length).toBe(4);
    expect(mazo.filter(id => id === 'c').length).toBe(4);
  });

  it('armarMazo ignora una configuración con menos de 8 números y usa los valores de fábrica', () => {
    // a=1,b=1,c=1 -> solo 3 números configurados; el juego no puede empezar así,
    // así que debe caer de vuelta a los "def" (3+2+5=10).
    const mazo = armarMazo(catPoderes, { a: 1, b: 1, c: 1 });
    expect(mazo.length).toBe(10);
  });

  it('armarMazo siempre devuelve solo ids conocidos', () => {
    const mazo = armarMazo(catPoderes, {});
    const idsValidos = new Set(catPoderes.map(p => p.id));
    expect(mazo.every(id => idsValidos.has(id))).toBe(true);
  });
});

describe('EMAIL_RE', () => {
  it('acepta correos con formato válido', () => {
    expect(EMAIL_RE.test('persona@dominio.com')).toBe(true);
    expect(EMAIL_RE.test('nombre.apellido+alias@sub.dominio.co')).toBe(true);
  });
  it('rechaza correos sin arroba o sin dominio', () => {
    expect(EMAIL_RE.test('no-es-correo')).toBe(false);
    expect(EMAIL_RE.test('persona@sindominio')).toBe(false);
    expect(EMAIL_RE.test('@dominio.com')).toBe(false);
  });
});

describe('esPasswordDebil', () => {
  it('rechaza contraseñas de la lista de comunes/filtradas', () => {
    expect(esPasswordDebil('password123')).toBe(true);
    expect(esPasswordDebil('QWERTY123')).toBe(true); // sin distinguir mayúsculas
  });
  it('rechaza una contraseña igual al usuario del correo', () => {
    expect(esPasswordDebil('nahin', 'nahin@ejemplo.com')).toBe(true);
    expect(esPasswordDebil('Nahin', 'NAHIN@ejemplo.com')).toBe(true);
  });
  it('rechaza caracteres repetidos', () => {
    expect(esPasswordDebil('aaaaaaaa')).toBe(true);
  });
  it('rechaza secuencias numéricas obvias', () => {
    expect(esPasswordDebil('12345678')).toBe(true);
  });
  it('acepta una contraseña razonablemente fuerte', () => {
    expect(esPasswordDebil('Cbtest#Segura2026!', 'nahin@ejemplo.com')).toBe(false);
  });
});

describe('mensajeError', () => {
  it('traduce errores conocidos de Supabase Auth', () => {
    expect(mensajeError({ message: 'Invalid login credentials' })).toBe('Correo o contraseña incorrectos.');
    expect(mensajeError({ message: 'User already registered' })).toMatch(/ya existe una cuenta/i);
    expect(mensajeError({ message: 'Email not confirmed' })).toMatch(/confirma tu correo/i);
  });
  it('no distingue mayúsculas/minúsculas al reconocer el error', () => {
    expect(mensajeError({ message: 'INVALID LOGIN CREDENTIALS' })).toBe('Correo o contraseña incorrectos.');
  });
  it('si no reconoce el mensaje, lo devuelve tal cual en vez de fallar en silencio', () => {
    expect(mensajeError({ message: 'Some obscure provider-specific error' })).toBe('Some obscure provider-specific error');
  });
  it('con un error vacío devuelve un mensaje genérico, nunca cadena vacía', () => {
    expect(mensajeError(undefined)).toBeTruthy();
    expect(mensajeError(null)).toBeTruthy();
  });
});
