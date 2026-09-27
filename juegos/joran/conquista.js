// LA CONQUISTA DE FÔRGE · la quinta máquina de la sala de Joran (borrador).
// Fôrge es el planeta de la forja. Joran hizo de él su prueba más dura: la CHIMENEA. Un pozo de roca por el que sube
// un mar de lava que no para y cada vez va más deprisa. No hay meta: se trepa de roca en roca hasta donde aguantes.
// Supervivencia vertical en canvas 2D: correr, saltar (más alto si mantienes), pisar a la Estática, coger enfriadores.
// Arcade o DESAFÍO (desafio.js, ?modo=desafio): en el desafío, la refrigeración del traje se gasta y se recarga acertando.
//
// La curva (decisión de diseño, pedida por el docente: «a partir de 10 minutos, súper difícil»):
//   · 0-2 min, amable: la lava va lenta y lejos; rocas anchas y saltos cortos (se aprende a saltar).
//   · ~5 min, exigente: losas que crujen, plataformas móviles, géiseres en la pared, la lava ya se ve.
//   · 10 min en adelante, ZONA ROJA: la lava va casi a la velocidad máxima a la que se puede trepar y apenas deja
//     margen (se acerca sola si te alejas mucho). Hacia los 15-17 min va más rápido de lo que nadie puede subir.
// El mundo se genera por TRAMOS de 50 m, cada uno con su semilla fija: todo el mundo trepa la misma chimenea (ranking justo).
//
// Gráficos: TODO dibujado por código en este fichero (rocas, lava, piloto, Estática, cristales, enfriadores), salvo el
// cielo del fondo, que es el arte de Fôrge de la propia serie STARGATE (p1_forge_llegada) y el retrato del piloto que
// elegiste en la sala. Sin recursos de terceros ni generadores de pago.
import { $, estado, SON, tono, ruido, audio, pantalla, cerrarPantalla, aviso, finDePartida, JUEGOS, AVATARES, EMBED } from './comun.js?v=4eafd61012';
import { crearDesafio, MODO, urlModo } from './desafio.js?v=4eafd61012';

const JUEGO = JUEGOS.find((j) => j.id === 'conquista') || { id: 'conquista', n: 'La conquista de Fôrge' };
const EN_WEB = location.pathname.includes('/juegos/');
// en la web, el fondo que ya sirve la Nave (un solo fichero); en el borrador, la copia reducida de img/
const FONDO = EN_WEB ? '../../assets/img/fondos/p1_forge_llegada.webp' : 'img/forge_fondo.webp';

// ───────────────────────────────── la física (unidades: píxeles del mundo y segundos; y crece hacia ABAJO)
const ANCHO = 640;                 // el ancho de la chimenea, de pared a pared
const VISTA = { w: 680, h: 620 };  // lo mínimo que se ve (en un móvil en vertical se ve más alto: mejor para trepar)
const G = 2300, CAIDA_MAX = 1150, VCORRE = 310, ACC_SUELO = 2800, ACC_AIRE = 1700;
const SALTO = 780, SALTO_CORTO = 320, REBOTE = 600;  // salto entero: ~132 px de alto
const COYOTE = 0.1, BUFFER = 0.13;                   // perdón al saltar tarde (ya fuera del borde) o pronto (aún en el aire)
const PASO = 1 / 120;                                // paso fijo: el mismo salto en un móvil lento que en un ordenador
const PJ = { w: 24, h: 40 };
const M = 32;                                        // px por metro (lo que se ve en el marcador)
const TRAMO_H = 50 * M;                              // cada tramo, 50 m de chimenea
const ESCUDOS = 3;                                   // la Estática y los géiseres quitan escudo; la lava, la partida entera
const LAVA0 = 300;                                   // la lava empieza 300 px por debajo de la primera cornisa
const ENFRIA = 5, ENFRIA_MAX = 8;                    // segundos que un enfriador para la lava (se acumula hasta 8)

// los puntos, en un sitio (la portada los cuenta de aquí). Todo lo que se gana se multiplica por el de la fase:
// así aguantar en la zona roja vale mucho más que trepar al principio (lo que se nota a partir de los 10 min).
const PT = { metro: 10, segundo: 3, cristal: 25, nucleo: 250, pisoton: 100, enfriador: 50 };
// las fases van por TIEMPO (no por altura): el reloj es lo que el alumnado entiende («aguanté 10 minutos»)
const FASES = [
  { t: 0, n: 'Calentamiento', x: 1, color: '#5ff4ff' },
  { t: 90, n: 'La lava despierta', x: 1.5, color: '#ffc24a' },
  { t: 180, n: 'La forja se calienta', x: 2, color: '#ffc24a' },
  { t: 300, n: 'Fôrge ruge', x: 2.5, color: '#ff8a3d' },
  { t: 450, n: 'Río de fuego', x: 3, color: '#ff8a3d' },
  { t: 600, n: 'Zona roja', x: 4, color: '#ff4a1c' },
  { t: 720, n: 'Fusión', x: 5, color: '#ff2e55' },
];
// la velocidad de la lava (px/s) según el tiempo. Trepar bien son ~100-130 px/s sostenidos y el techo físico ronda los
// 200: a 80 (10 min) ya no hay respiro, a 105 (13 min) casi nadie aguanta, y a 175-260 (17-18 min) es imposible.
const LAVA_V = [[0, 0], [5, 0], [8, 16], [60, 20], [90, 24], [180, 34], [300, 50], [450, 64], [600, 80], [720, 96], [780, 104], [900, 128], [1020, 175], [1080, 260]];
// el margen máximo que la lava te deja (px por encima de ella): si subes más deprisa, acelera hasta alcanzarlo. Al
// principio es más de una pantalla (no se ve); en la zona roja, poco más de un salto: «casi pisa los talones».
const LAVA_MARGEN = [[0, 900], [90, 820], [180, 640], [300, 480], [450, 360], [600, 250], [720, 190], [900, 150]];
const interp = (tabla, t) => {
  if (t <= tabla[0][0]) return tabla[0][1];
  for (let i = 1; i < tabla.length; i++) if (t <= tabla[i][0]) { const [t0, v0] = tabla[i - 1], [t1, v1] = tabla[i]; return v0 + (v1 - v0) * (t - t0) / (t1 - t0); }
  return tabla[tabla.length - 1][1];
};
const faseEn = (t) => { let i = 0; while (i + 1 < FASES.length && t >= FASES[i + 1].t) i++; return i; };

// ───────────────────────────────── el GENERADOR: tramo k → siempre lo mismo (semilla fija por tramo), sin estado global
function azarFijo(s) { return () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
// lo más lejos (en horizontal) que llega un salto a toda carrera hasta una roca `sube` px más alta. El generador nunca
// pone un hueco de más del ~72 % de esto: así todo se puede pasar, y con margen.
function alcance(sube) {
  const a = G / 2, d = SALTO * SALTO - 4 * a * sube;
  if (d < 0) return 0;
  return VCORRE * (SALTO + Math.sqrt(d)) / (2 * a);
}
const SEMILLA = 20261005, MARGEN = 14;
const NOMBRES = ['El fondo del cráter', 'Las rocas que crujen', 'La chimenea', 'Los géiseres', 'La pared de Fôrge', 'El nido de la Estática',
  'La garganta', 'Las losas de ceniza', 'La cumbre negra', 'El cielo de la forja'];
const nombreTramo = (k) => (k < NOMBRES.length ? NOMBRES[k] : `Más allá de la cumbre ${k - NOMBRES.length + 1}`);
// la dificultad del terreno según el tramo: 0 abajo, 1 hacia los 750 m (≈10 min al ritmo de la lava), hasta 1,3
const dificultad = (k) => Math.min(1.3, k / 15);
const lerp = (a, b, f) => a + (b - a) * f;
function tramo(k) {
  const r = azarFijo(SEMILLA + k * 7919), R = (a, b) => a + r() * (b - a);
  const d = dificultad(k), f = Math.min(1, d), mas = Math.max(0, d - 1); // `mas`: lo que pasa de 1 (solo acelera cosas)
  const Y0 = -k * TRAMO_H, Y1 = Y0 - TRAMO_H;
  const T = { k, n: nombreTramo(k), y: Y0, plats: [], camino: [], enemigos: [], geiseres: [], cristales: [], nucleos: [], enfriadores: [] };
  const dientes = (w) => { const p = []; for (let x = 0; x <= w; x += 16 + r() * 10) p.push([Math.min(x, w), x === 0 ? 0 : -1 - r() * 4]); p.push([w, 0]); return p; };
  const panza = (w, h) => [[w, h], [w * R(0.62, 0.8), h + R(4, 12)], [w * R(0.3, 0.5), h + R(8, 18)], [w * R(0.08, 0.22), h + R(2, 8)], [0, h]];
  const grieta = (w) => { const x = R(8, w - 8); return [[x, 4], [x + R(-8, 8), R(10, 16)], [x + R(-10, 10), R(18, 26)]]; };
  const roca = (tipo, x, y, w) => {
    const h = tipo === 'movil' ? 16 : tipo === 'fragil' ? 20 : 24;
    const p = { tipo, k, x, x0: x, y, y0: y, w, h, borde: dientes(w), panza: panza(w, h), grieta: tipo === 'roca' ? grieta(w) : null, t: -1, cae: false, vy: 0, vuelve: 0, dx: 0 };
    T.plats.push(p); return p;
  };
  // la cornisa del arranque del tramo: de pared a pared, se sube desde cualquier punto (y así los tramos siempre casan)
  const cornisa = roca('cornisa', 0, Y0, ANCHO); cornisa.h = 34; cornisa.panza = panza(ANCHO, 34);
  // cómo es este tramo (todo interpolado con la dificultad)
  const dy = [lerp(52, 84, f), lerp(78, 112, f)];                     // cuánto sube cada roca (salto entero: 132)
  const anchoR = [lerp(150, 66, f), lerp(230, 104, f)];               // rocas más estrechas arriba
  const hueco = [lerp(-0.5, 0.25, f), lerp(0.35, 0.72, f)];           // hueco horizontal, en fracción del alcance
  const pFragil = k < 1 ? 0 : lerp(0.14, 0.4, f), pMovil = k < 2 ? 0 : lerp(0.12, 0.3, f);
  const pGeiser = k < 3 ? 0 : lerp(0.12, 0.26, f), pDron = k < 4 ? 0 : lerp(0.1, 0.24, f) + mas * 0.2;
  const pAndante = k < 1 ? 0.22 : lerp(0.3, 0.5, f), pExtra = lerp(0.55, 0.18, f), pCristal = 0.42;
  const vAndante = lerp(55, 115, f) * (1 + mas), crujido = Math.max(0.25, lerp(0.6, 0.3, f) - mas * 0.1);
  const periodoMovil = Math.max(2, lerp(5, 2.6, f) - mas * 1.5), periodoGeiser = Math.max(1.9, lerp(3.4, 2.3, f) - mas);
  const nucleoEn = 4 + Math.floor(r() * 8), enfriaEn = 3 + Math.floor(r() * 9);
  let prev = { x: ANCHO / 2 - 80, x0: ANCHO / 2 - 80, w: 160, y: Y0 }, n = 0, enfriado = false;
  for (;;) {
    const resta = prev.y - Y1;
    if (resta <= dy[1]) break; // desde aquí, la cornisa del tramo siguiente queda a un salto (de pared a pared: siempre)
    const sube = Math.min(R(dy[0], dy[1]), resta - 30), ny = prev.y - sube, reach = alcance(sube);
    let tipo = 'roca';
    const q = r();
    if (n >= 2 && q < pMovil) tipo = 'movil'; else if (n >= 1 && q < pMovil + pFragil) tipo = 'fragil';
    const w = tipo === 'movil' ? R(96, 116) : tipo === 'fragil' ? R(62, 90) : R(anchoR[0], anchoR[1]);
    let x;
    if (n === 0) x = R(MARGEN + 40, ANCHO - MARGEN - 40 - w); // desde la cornisa se salta desde donde quieras
    else {
      const g = R(hueco[0], hueco[1]) * reach;
      const en = (dir) => (dir > 0 ? prev.x0 + prev.w + g : prev.x0 - g - w);
      let dir = r() < 0.5 ? -1 : 1; x = en(dir);
      if (x < MARGEN || x + w > ANCHO - MARGEN) { dir = -dir; x = en(dir); }
      x = Math.max(MARGEN, Math.min(ANCHO - MARGEN - w, x)); // pegar a la pared solo acorta el salto
    }
    const p = roca(tipo, x, ny, w);
    T.camino.push(p);
    if (tipo === 'movil') { // va y viene alrededor de su sitio (pasa por él: basta esperarla)
      const A = R(50, 120); Object.assign(p, { a: Math.max(MARGEN, x - A), b: Math.min(ANCHO - MARGEN - w, x + A), om: (2 * Math.PI) / periodoMovil, fase: r() * 6.3 });
    } else if (tipo === 'fragil') p.crujido = crujido;
    // la Estática: andantes que patrullan las rocas anchas, drones que flotan en los huecos
    if (tipo === 'roca' && w >= 96 && n >= (k === 0 ? 4 : 1) && r() < pAndante) {
      const v = vAndante * R(0.85, 1.15) * (r() < 0.5 ? -1 : 1);
      T.enemigos.push({ tipo: 'andante', k, x: x + w / 2 - 15, y: ny - 26, w: 30, h: 26, min: x + 4, max: x + w - 34, v });
    }
    if (n >= 1 && r() < pDron) {
      const cx = (prev.x0 + prev.w / 2 + x + w / 2) / 2 + R(-60, 60);
      T.enemigos.push({ tipo: 'dron', k, cx, cy: (prev.y + ny) / 2 - R(30, 60), ax: R(30, 75), ay: R(14, 28), f: R(1.1, 1.8) * (1 + mas * 0.5), fase: r() * 6, x: cx, y: 0, w: 30, h: 30 });
    }
    // géiser de pared: una grieta que escupe lava hacia dentro, a ratos (burbujea antes de salir). Nunca más del 60 %
    // del pozo: siempre queda un lado por donde pasar.
    if (n >= 1 && r() < pGeiser) {
      T.geiseres.push({ k, lado: r() < 0.5 ? -1 : 1, y: ny - R(40, 80), h: 26, largo: ANCHO * R(0.35, 0.6), periodo: periodoGeiser * R(0.9, 1.1), fase: r() * 3 });
    }
    // una roca de más al otro lado: atajos, cristales y a veces el enfriador (desviarse cuesta tiempo: esa es la gracia)
    let extra = null;
    if (n >= 1 && r() < pExtra) {
      const wE = R(80, 130), izq = x + w / 2 > ANCHO / 2;
      const xE = izq ? R(MARGEN, Math.max(MARGEN, x - 60 - wE)) : R(Math.min(ANCHO - MARGEN - wE, x + w + 60), ANCHO - MARGEN - wE);
      if (izq ? xE + wE <= x - 40 : xE >= x + w + 40) {
        extra = roca('roca', xE, ny + R(-24, 24), wE);
        T.cristales.push({ k, x: xE + wE / 2, y: extra.y - 34, ok: false });
      }
    }
    if (r() < pCristal) T.cristales.push({ k, x: x + w / 2, y: ny - 34, ok: false });
    if (n === nucleoEn) T.nucleos.push({ k, x: x + w / 2, y: ny - 118, ok: false }); // hace falta el salto entero
    if (n === enfriaEn) { const s = extra || p; T.enfriadores.push({ k, x: s.x + s.w / 2, y: s.y - 30, ok: false }); enfriado = true; }
    prev = p; n++;
  }
  if (!enfriado) T.enfriadores.push({ k, x: prev.x0 + prev.w / 2, y: prev.y - 30, ok: false }); // uno por tramo, siempre
  return T;
}

// ───────────────────────────────── estado
let N = null, J = null, P = null, jugando = false, pausa = false;
const cam = { x: ANCHO / 2 - VISTA.w / 2, y: -VISTA.h * 0.6 };
// el mundo vivo: los tramos que ya existen, en listas planas (lo que choca y se dibuja)
function nuevoMundo() { const W = { sig: 0, tramos: [], plats: [], enemigos: [], geiseres: [], cristales: [], nucleos: [], enfriadores: [] }; asegurar(W, 0); return W; }
function asegurar(W, yArriba) { // genera tramos hasta dos por encima de lo que se ve
  while (-W.sig * TRAMO_H > yArriba - 2 * TRAMO_H) {
    const T = tramo(W.sig++); W.tramos.push({ k: T.k, y: T.y, n: T.n });
    for (const c of ['plats', 'enemigos', 'geiseres', 'cristales', 'nucleos', 'enfriadores']) W[c].push(...T[c]);
  }
}
function podar(W, kMin) { // lo que se ha tragado la lava se olvida (una partida de 15 min son ~25 tramos)
  for (const c of ['plats', 'enemigos', 'geiseres', 'cristales', 'nucleos', 'enfriadores']) W[c] = W[c].filter((o) => o.k >= kMin);
}
function nuevoPiloto() { return { x: ANCHO / 2 - PJ.w / 2, y: -PJ.h, vx: 0, vy: 0, mira: 1, suelo: null, coyote: 0, buffer: 0, saltoAntes: false, muerto: 0, inv: 0 }; }
function nuevaPartida() {
  return { t: 0, ev: 0, escudos: ESCUDOS, lava: LAVA0, lavaV: 0, frio: 0, fase: 0, tramo: 0, maxM: 0, seg: 0,
    cristales: 0, nucleos: 0, pisotones: 0, enfriadores: 0, avisoFase: -1, motivo: '', fin: false };
}
const multi = () => FASES[P.fase].x;
const gana = (base) => { const v = base * multi(); P.ev += v; return Math.round(v); };
const puntosAhora = () => Math.round(P.ev);
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const fmtX = (x) => '×' + String(x).replace('.', ',');

// el modo desafío: la refrigeración del traje (en Fôrge hace calor). Mientras se contesta, el juego para (la lava
// también); al volver, se sueltan las teclas (si no, el piloto seguiría corriendo con la tecla de antes de la pregunta)
const DES = crearDesafio({ nombre: 'Refrigeración del traje', segundos: 40, recarga: 40, hud: $('des-slot'), alPausar: (si) => { if (!si) soltar(); }, enJuego: () => jugando && !pausa });
if (DES.activo) DES.preparar(); // se piden las preguntas mientras lees la portada

// ───────────────────────────────── entradas: teclado y botones en pantalla
const tecla = {}, toque = {};
if (matchMedia('(pointer: coarse)').matches) document.body.classList.add('tactil');
function soltar() { for (const k in tecla) tecla[k] = false; for (const k in toque) toque[k] = false; document.querySelectorAll('.mandos .activo').forEach((b) => b.classList.remove('activo')); }
addEventListener('keydown', (e) => {
  tecla[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code) && jugando) e.preventDefault();
  if (e.code === 'KeyP' || e.code === 'Escape') pausar();
});
addEventListener('keyup', (e) => { tecla[e.code] = false; });
addEventListener('blur', soltar);
for (const [id, k] of [['m-izq', 'izq'], ['m-der', 'der'], ['m-salto', 'salto']]) {
  const b = $(id);
  b.addEventListener('pointerdown', (e) => { e.preventDefault(); audio(); toque[k] = true; b.classList.add('activo'); try { b.setPointerCapture(e.pointerId); } catch (x) { /* nada */ } });
  const fin = () => { toque[k] = false; b.classList.remove('activo'); };
  b.addEventListener('pointerup', fin); b.addEventListener('pointercancel', fin); b.addEventListener('lostpointercapture', fin);
  b.addEventListener('contextmenu', (e) => e.preventDefault());
}
$('b-pausa').onclick = () => pausar();

// ───────────────────────────────── el mundo se mueve
const particulas = [], textos = [];
function chispas(x, y, n, color, fuerza = 220) {
  for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, v = fuerza * (0.3 + Math.random()); particulas.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 80, vida: 0.5 + Math.random() * 0.5, max: 1, color, g: 600 }); }
}
function flota(x, y, t, color = '#ffc24a') { textos.push({ x, y, t, color, vida: 1 }); }
function geiserChorro(g, t) { // 0 = en calma · 1 = chorro entero. Antes de salir, burbujea (el aviso)
  const c = ((t + g.fase) % g.periodo);
  if (c < 0.75) return { aviso: true, h: 0 };
  if (c < 1.65) { const q = c - 0.75; return { aviso: false, h: q < 0.15 ? q / 0.15 : q > 0.75 ? Math.max(0, (0.9 - q) / 0.15) : 1 }; }
  return { aviso: false, h: 0 };
}
function efectos(dt) {
  for (let i = particulas.length - 1; i >= 0; i--) { const q = particulas[i]; q.vida -= dt; if (q.vida <= 0) { particulas.splice(i, 1); continue; } q.x += q.vx * dt; q.y += q.vy * dt; q.vy += q.g * dt; }
  for (let i = textos.length - 1; i >= 0; i--) { const q = textos[i]; q.vida -= dt; q.y -= 40 * dt; if (q.vida <= 0) textos.splice(i, 1); }
}
function mundo(dt) {
  for (const l of N.plats) {
    if (l.tipo === 'movil') { const nx = l.a + (l.b - l.a) * (0.5 - 0.5 * Math.cos(P.t * l.om + l.fase)); l.dx = nx - l.x; l.x = nx; continue; }
    if (l.tipo !== 'fragil') continue;
    if (l.cae) { l.vy += G * 0.5 * dt; l.y += l.vy * dt; l.vuelve -= dt; if (l.vuelve <= 0) { l.cae = false; l.y = l.y0; l.vy = 0; l.t = -1; } continue; }
    if (l.t >= 0) { l.t += dt; if (l.t > l.crujido) { l.cae = true; l.vuelve = 2.5; ruido(0.25, 0.2, 600); } }
  }
  for (const e of N.enemigos) {
    if (e.muerto) continue;
    if (e.tipo === 'andante') { e.x += e.v * dt; if (e.x < e.min) { e.x = e.min; e.v = Math.abs(e.v); } if (e.x > e.max) { e.x = e.max; e.v = -Math.abs(e.v); } }
    else { e.x = e.cx - 15 + Math.sin(P.t * e.f + e.fase) * e.ax; e.y = e.cy - 15 + Math.cos(P.t * e.f * 1.3 + e.fase) * e.ay; }
  }
}
// la lava: su velocidad por el reloj, más lo que haga falta para no dejarte más margen del que toca (sin pasarse: así un
// enfriador sigue valiendo aunque luego la lava recupere), y parada del todo mientras dura el frío
function subirLava(dt) {
  if (P.frio > 0) { P.frio = Math.max(0, P.frio - dt); P.lavaV = 0; return; }
  const base = interp(LAVA_V, P.t), margen = P.lava - (J.y + PJ.h), lim = interp(LAVA_MARGEN, P.t);
  const extra = margen > lim ? Math.min(base * 0.9 + 10, (margen - lim) * 0.9) : 0;
  P.lavaV = base + extra; P.lava -= P.lavaV * dt;
}
const cruzan = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
// todas las rocas se atraviesan al subir y sostienen al bajar (como en cualquier juego de trepar: sin cabezazos injustos)
function chocarY(piesAntes) {
  if (J.vy < 0) return;
  for (const l of N.plats) {
    if (l.cae) continue;
    if (J.x + PJ.w > l.x + 2 && J.x < l.x + l.w - 2 && piesAntes <= l.y + 2 && J.y + PJ.h >= l.y) { J.y = l.y - PJ.h; J.vy = 0; J.suelo = l; }
  }
}
function paso(dt) {
  efectos(dt);
  if (J.muerto > 0) { J.muerto -= dt; if (J.muerto <= 0) terminar(); return; } // el reloj se para al caer
  P.t += dt;
  mundo(dt); subirLava(dt);
  // la fase (por el reloj): cada cambio, un aviso bien visible y el multiplicador nuevo
  const fi = faseEn(P.t);
  if (fi > P.fase) {
    P.fase = fi; const F = FASES[fi]; P.avisoFase = P.t;
    aviso(fi === 5 ? `ZONA ROJA · LA LAVA ACELERA · ${fmtX(F.x)}` : `LA LAVA ACELERA · ${fmtX(F.x)}`, F.color, 2.6); SON.alarma();
  }
  while (P.t >= P.seg + 1) { P.seg++; gana(PT.segundo); } // cada segundo vivo suma (y más en las fases altas)
  if (J.inv > 0) J.inv -= dt;
  const izq = !!(tecla.ArrowLeft || tecla.KeyA || toque.izq), der = !!(tecla.ArrowRight || tecla.KeyD || toque.der);
  const quiere = !!(tecla.Space || tecla.ArrowUp || tecla.KeyW || toque.salto);
  if (quiere && !J.saltoAntes) J.buffer = BUFFER;
  J.saltoAntes = quiere; J.buffer -= dt;
  const dir = (der ? 1 : 0) - (izq ? 1 : 0);
  if (dir) { J.vx += dir * (J.suelo ? ACC_SUELO : ACC_AIRE) * dt; J.mira = dir; }
  else { const f = (J.suelo ? ACC_SUELO : ACC_AIRE * 0.35) * dt; J.vx = Math.abs(J.vx) <= f ? 0 : J.vx - Math.sign(J.vx) * f; }
  J.vx = Math.max(-VCORRE, Math.min(VCORRE, J.vx));
  J.coyote = J.suelo ? COYOTE : J.coyote - dt;
  if (J.buffer > 0 && J.coyote > 0) { J.vy = -SALTO; J.buffer = 0; J.coyote = 0; J.suelo = null; SON.salto(); }
  if (!quiere && J.vy < -SALTO_CORTO) J.vy = -SALTO_CORTO; // soltar pronto = salto corto
  J.vy = Math.min(CAIDA_MAX, J.vy + G * dt);
  const sobre = J.suelo;
  if (sobre && sobre.dx) J.x += sobre.dx; // la plataforma móvil te lleva
  J.x += J.vx * dt;
  if (J.x < 0) { J.x = 0; J.vx = 0; } else if (J.x + PJ.w > ANCHO) { J.x = ANCHO - PJ.w; J.vx = 0; } // las paredes del pozo
  const piesAntes = J.y + PJ.h; J.y += J.vy * dt; J.suelo = null; chocarY(piesAntes);
  if (J.suelo && J.suelo.tipo === 'fragil' && J.suelo.t < 0) { J.suelo.t = 0; tono(180, 90, 0.2, 'sawtooth', 0.04); }
  if (J.suelo && !sobre && J.vy === 0) for (let i = 0; i < 4; i++) particulas.push({ x: J.x + PJ.w / 2, y: J.y + PJ.h, vx: (Math.random() - 0.5) * 120, vy: -Math.random() * 60, vida: 0.3, max: 0.3, color: '#8a6f68', g: 300 });
  if (J.y + PJ.h > P.lava + 6) return morir('lava');
  const yo = { x: J.x, y: J.y, w: PJ.w, h: PJ.h };
  // la Estática: si caes encima, la deshaces (y rebotas: manteniendo el salto, más alto); si no, te quita un escudo
  for (const e of N.enemigos) {
    if (e.muerto) continue;
    const caja = { x: e.x + 3, y: e.y + 3, w: e.w - 6, h: e.h - 3 };
    if (!cruzan(yo, caja)) continue;
    if (J.vy > 60 && piesAntes <= e.y + 12) {
      e.muerto = true; P.pisotones++; const v = gana(PT.pisoton); J.vy = quiere ? -SALTO * 0.92 : -REBOTE; J.coyote = 0;
      SON.boom(); chispas(e.x + e.w / 2, e.y + e.h / 2, 18, '#ff4dd8'); flota(e.x + e.w / 2, e.y, '+' + v, '#ff4dd8');
    } else if (J.inv <= 0) return golpe('estatica', e.x + e.w / 2);
  }
  for (const g of N.geiseres) {
    const s = geiserChorro(g, P.t); if (s.h < 0.3) continue;
    const largo = g.largo * s.h, x = g.lado < 0 ? 0 : ANCHO - largo;
    if (J.inv <= 0 && cruzan(yo, { x, y: g.y + 3, w: largo, h: g.h - 6 })) return golpe('geiser', g.lado < 0 ? 0 : ANCHO);
  }
  const cx = J.x + PJ.w / 2, cy = J.y + PJ.h / 2;
  for (const c of N.cristales) if (!c.ok && Math.abs(c.x - cx) < 20 && Math.abs(c.y - cy) < 26) { c.ok = true; P.cristales++; SON.chispa(); flota(c.x, c.y - 10, '+' + gana(PT.cristal), '#5ff4ff'); }
  for (const c of N.nucleos) if (!c.ok && Math.abs(c.x - cx) < 24 && Math.abs(c.y - cy) < 30) { c.ok = true; P.nucleos++; const v = gana(PT.nucleo); SON.llave(); chispas(c.x, c.y, 16, '#ffc24a', 160); flota(c.x, c.y - 14, '+' + v); if (P.t - P.avisoFase > 2.6) aviso(`NÚCLEO DE FORJA · +${v}`, '#ffc24a', 1.1); }
  for (const c of N.enfriadores) if (!c.ok && Math.abs(c.x - cx) < 22 && Math.abs(c.y - cy) < 28) {
    c.ok = true; P.enfriadores++; P.frio = Math.min(ENFRIA_MAX, P.frio + ENFRIA); const v = gana(PT.enfriador);
    SON.pulso(); chispas(c.x, c.y, 20, '#bff8ff', 180); flota(c.x, c.y - 14, '+' + v, '#bff8ff');
    if (P.t - P.avisoFase > 2.6) aviso(`LAVA ENFRIADA · ${Math.ceil(P.frio)} s`, '#bff8ff', 1.3);
  }
  // la altura cuenta al POSARSE (no en lo alto del salto): lo que se mide es hasta dónde has trepado de verdad
  if (J.suelo) {
    const m = Math.max(0, Math.floor(-(J.y + PJ.h) / M));
    if (m > P.maxM) { gana((m - P.maxM) * PT.metro); P.maxM = m; }
    const k = Math.floor(-(J.y + PJ.h) / TRAMO_H + 0.001);
    if (k > P.tramo) { P.tramo = k; if (P.t - P.avisoFase > 2.6) aviso(`${k * 50} m · ${nombreTramo(k).toUpperCase()}`, '#5ff4ff', 1.5); }
  }
  // el mundo crece por arriba y se olvida por abajo
  asegurar(N, J.y - 1000); // por el piloto, no por la cámara: así también vale con CON.avanzar y la pestaña oculta
  const kLava = Math.floor(-P.lava / TRAMO_H);
  if (kLava - 1 > (N.podado || 0)) { N.podado = kLava - 1; podar(N, N.podado); }
}
function golpe(motivo, desdeX) {
  P.escudos--; SON.golpe();
  chispas(J.x + PJ.w / 2, J.y + PJ.h / 2, 22, motivo === 'geiser' ? '#ffb347' : '#ff4dd8', 220);
  if (P.escudos <= 0) return morir(motivo);
  J.inv = 1.6; J.vy = -420; J.vx = (J.x + PJ.w / 2 < desdeX ? -1 : 1) * 260; J.suelo = null; // el empujón te aparta
  aviso(P.escudos === 1 ? 'ÚLTIMO ESCUDO' : `QUEDAN ${P.escudos} ESCUDOS`, motivo === 'geiser' ? '#ff8a3d' : '#ff4dd8', 1.1);
}
function morir(motivo) {
  if (J.muerto > 0) return;
  P.motivo = motivo; J.muerto = 1.2; J.vx = 0; J.vy = 0;
  const x = J.x + PJ.w / 2, y = J.y + PJ.h / 2;
  if (motivo === 'lava') { SON.caida(); chispas(x, P.lava - 4, 30, '#ffb347', 260); aviso('¡LA LAVA!', '#ff8a3d', 1.2); }
  else { SON.golpe(); chispas(x, y, 26, motivo === 'geiser' ? '#ffb347' : '#ff4dd8', 240); aviso('SIN ESCUDOS', motivo === 'geiser' ? '#ff8a3d' : '#ff4dd8', 1.2); }
}
function terminar() {
  if (P.fin) return; P.fin = true; jugando = false; DES.parar();
  const seg = Math.floor(P.t), F = FASES[P.fase];
  let puntos = puntosAhora();
  const filas = [['Tiempo', mmss(seg)], ['Altura', `${P.maxM.toLocaleString('es-ES')} m`], ['Fase', `${P.fase + 1} · ${F.n} (${fmtX(F.x)})`],
    ['Cristales', P.cristales], ['Núcleos de forja', P.nucleos], ['Estática pisada', P.pisotones], ['Enfriadores', P.enfriadores]];
  const bonus = DES.bonus(puntos); puntos += bonus; filas.push(...DES.filas(bonus));
  const como = P.motivo === 'lava' ? 'La lava te alcanzó' : 'Te quedaste sin escudos';
  const texto = `${como} a los <b>${mmss(seg)}</b>, a <b>${P.maxM.toLocaleString('es-ES')} m</b> de altura.` +
    (seg >= 600 ? ' Has aguantado en la <b>zona roja</b>: eso es de pilotos de Joran.' : seg >= 300 ? ' La lava ya no perdona: a ver si llegas a los 10 minutos.' : ' Los primeros minutos son para aprender: la próxima, más arriba.');
  setTimeout(() => {
    $('hud').classList.add('oculto');
    finDePartida({ juego: JUEGO.id, titulo: seg >= 600 ? '¡Superviviente de Fôrge!' : 'Fin de la escalada', puntos, filas, texto, alRepetir: empezar,
      // segundos / altura / fase: para la comprobación del servidor y para hitos futuros del Cuaderno
      extra: { ...DES.extra(), segundos: seg, altura: P.maxM, fase: P.fase + 1 } });
  }, 700);
}

// ───────────────────────────────── dibujo
const lienzo = $('lienzo'), c = lienzo.getContext('2d');
let esc = 1, vw = VISTA.w, vh = VISTA.h, dpr = 1;
function ajustar() {
  dpr = Math.min(devicePixelRatio || 1, 2); lienzo.width = Math.round(innerWidth * dpr); lienzo.height = Math.round(innerHeight * dpr);
  // siempre se ve el pozo entero de ancho y al menos 620 de alto; lo que sobra a los lados es pared de roca
  esc = Math.min(innerHeight / VISTA.h, innerWidth / VISTA.w); vw = innerWidth / esc; vh = innerHeight / esc;
}
addEventListener('resize', ajustar); ajustar();
const carga = (src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });
let imgFondo = null, imgPiloto = null;
// las sierras del fondo: se hunden a medida que trepas (quedas por encima de las montañas de Fôrge)
const sierra = (sem, n, alto) => { const r = azarFijo(sem); const v = []; let h = alto * 0.5; for (let i = 0; i < n; i++) { h = Math.max(alto * 0.15, Math.min(alto, h + (r() - 0.5) * alto * 0.45)); v.push(h); } return v; };
const SIERRAS = [{ p: 0.18, paso: 70, v: sierra(7, 64, 190), base: 0.74, color: '#1a0c1c', borde: 'rgba(95,244,255,.16)' }, { p: 0.36, paso: 54, v: sierra(11, 80, 150), base: 0.88, color: '#0f070f', borde: 'rgba(255,122,48,.32)' }];
const brasas = [];
const PARED_BLOQUE = 420;
function pared(lado, y0, y1, xa, xb) { // la roca de los lados del pozo, con grietas incandescentes (siempre las mismas: semilla por bloque)
  const gr = c.createLinearGradient(lado < 0 ? 0 : ANCHO, 0, lado < 0 ? xa : xb, 0); gr.addColorStop(0, '#2c1d22'); gr.addColorStop(0.25, '#170d11'); gr.addColorStop(1, '#0b0508');
  c.fillStyle = gr; c.fillRect(xa, y0, xb - xa, y1 - y0);
  c.lineCap = 'round'; c.lineJoin = 'round';
  for (let b = Math.floor(y0 / PARED_BLOQUE); b * PARED_BLOQUE < y1; b++) {
    const r = azarFijo(9000 + b * 31 + (lado < 0 ? 0 : 7));
    for (let i = 0; i < 3; i++) {
      let x = (lado < 0 ? -1 : 1) * (8 + r() * 110) + (lado < 0 ? 0 : ANCHO), y = b * PARED_BLOQUE + r() * PARED_BLOQUE; const pts = [[x, y]];
      for (let j = 0; j < 5; j++) { x += (r() - 0.5) * 30; y += 16 + r() * 26; pts.push([x, y]); }
      for (const [ancho, color] of [[5, 'rgba(255,110,30,.22)'], [1.5, 'rgba(255,179,71,.85)']]) { c.strokeStyle = color; c.lineWidth = ancho; c.beginPath(); pts.forEach(([px, py], j) => (j ? c.lineTo(px, py) : c.moveTo(px, py))); c.stroke(); }
    }
  }
  c.strokeStyle = 'rgba(95,244,255,.55)'; c.lineWidth = 2; c.beginPath(); c.moveTo(lado < 0 ? 0 : ANCHO, y0); c.lineTo(lado < 0 ? 0 : ANCHO, y1); c.stroke();
}
function pintarRoca(s) {
  const tiembla = s.tipo === 'fragil' && s.t > 0 && !s.cae ? (Math.random() - 0.5) * 4 * (s.t / s.crujido) : 0;
  c.save(); c.translate(s.x + tiembla, s.y);
  if (s.tipo === 'fragil' && s.cae) c.globalAlpha = Math.max(0, s.vuelve - 1.5);
  if (s.tipo === 'movil') {
    c.fillStyle = '#0b2233'; c.fillRect(0, 0, s.w, s.h); c.strokeStyle = '#5ff4ff'; c.lineWidth = 2; c.strokeRect(0, 0, s.w, s.h);
    c.fillStyle = 'rgba(95,244,255,.5)'; for (let i = 8; i < s.w - 8; i += 16) c.fillRect(i, 6, 8, 3);
    const pr = c.createLinearGradient(0, s.h, 0, s.h + 26); pr.addColorStop(0, 'rgba(95,244,255,.6)'); pr.addColorStop(1, 'rgba(95,244,255,0)');
    c.fillStyle = pr; c.fillRect(14, s.h, 16, 20 + Math.random() * 6); c.fillRect(s.w - 30, s.h, 16, 20 + Math.random() * 6);
    c.restore(); return;
  }
  const gr = c.createLinearGradient(0, 0, 0, s.h + 16); gr.addColorStop(0, s.tipo === 'fragil' ? '#3d2a2e' : '#3a2a30'); gr.addColorStop(1, '#140b0e');
  c.fillStyle = gr; c.beginPath(); c.moveTo(0, 0);
  for (const [dx, dy] of s.borde) c.lineTo(dx, dy);
  for (const [dx, dy] of s.panza) c.lineTo(dx, dy);
  c.closePath(); c.fill();
  c.lineCap = 'round';
  if (s.tipo === 'fragil') { c.strokeStyle = s.t >= 0 ? '#ff8a3d' : 'rgba(255,194,74,.8)'; c.lineWidth = 2; c.beginPath(); c.moveTo(s.w * 0.3, 2); c.lineTo(s.w * 0.45, 10); c.lineTo(s.w * 0.4, s.h); c.stroke(); }
  else if (s.grieta) for (const [ancho, color] of [[4, 'rgba(255,110,30,.25)'], [1.4, '#ffb347']]) { c.strokeStyle = color; c.lineWidth = ancho; c.beginPath(); s.grieta.forEach(([gx, gy], i) => (i ? c.lineTo(gx, gy) : c.moveTo(gx, gy))); c.stroke(); }
  c.strokeStyle = s.tipo === 'fragil' ? 'rgba(255,194,74,.7)' : 'rgba(95,244,255,.75)'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 0); for (const [dx, dy] of s.borde) c.lineTo(dx, dy); c.stroke();
  c.restore();
}

function pintar(dtReal, tt) {
  const W = lienzo.width, H = lienzo.height;
  const lava = P ? P.lava : LAVA0;
  // la cámara: fija de lado (se ve el pozo entero) y en vertical con el piloto algo por debajo del centro (se ve lo que
  // viene); nunca enseña más de 110 px por debajo de la lava
  cam.x = ANCHO / 2 - vw / 2;
  if (J) { const ty = Math.min(J.y + PJ.h - vh * 0.6, lava + 110 - vh); cam.y += (ty - cam.y) * Math.min(1, dtReal * 5); }
  const fase = P ? P.fase : 0;
  c.setTransform(1, 0, 0, 1, 0, 0);
  // el cielo de Fôrge: tormenta violeta que se enrojece con cada fase
  const cielo = c.createLinearGradient(0, 0, 0, H); cielo.addColorStop(0, '#140726'); cielo.addColorStop(0.6, '#231033'); cielo.addColorStop(1, '#2e0f10');
  c.fillStyle = cielo; c.fillRect(0, 0, W, H);
  const E = esc * dpr, alturaCam = Math.max(0, -(cam.y + vh * 0.6));
  if (imgFondo) { // el arte de Fôrge: se ve su parte de abajo al empezar y se va subiendo por él hasta los ~900 m
    const s = Math.max(vw / imgFondo.width, (vh * 1.5) / imgFondo.height), iw = imgFondo.width * s, ih = imgFondo.height * s;
    const prog = Math.min(1, alturaCam / (900 * M)), fy = (vh - ih) * (1 - prog);
    c.globalAlpha = 0.6; c.drawImage(imgFondo, ((vw - iw) / 2) * E, fy * E, iw * E, ih * E); c.globalAlpha = 1;
    c.fillStyle = 'rgba(12,4,20,.42)'; c.fillRect(0, 0, W, H);
  }
  if (fase) { c.fillStyle = `rgba(255,50,15,${0.035 * fase})`; c.fillRect(0, 0, W, H); } // el calor de la fase
  for (const s of SIERRAS) { // se hunden al trepar
    const baseY = vh * s.base + alturaCam * s.p * 0.25, ciclo = s.v.length * s.paso;
    if (baseY - 200 > vh) continue;
    c.beginPath(); c.moveTo(0, H);
    for (let sx = -s.paso; sx <= vw + s.paso; sx += s.paso / 2) {
      const wx = sx + cam.x * s.p, i = Math.floor(((wx % ciclo) + ciclo) % ciclo / s.paso), f = (((wx % ciclo) + ciclo) % ciclo) / s.paso - i;
      const h = s.v[i] * (1 - f) + s.v[(i + 1) % s.v.length] * f;
      c.lineTo(sx * E, (baseY - h) * E);
    }
    c.lineTo(W, H); c.closePath(); c.fillStyle = s.color; c.fill(); c.strokeStyle = s.borde; c.lineWidth = 2 * dpr; c.stroke();
  }
  // a partir de aquí, coordenadas del mundo
  c.setTransform(E, 0, 0, E, -cam.x * E, -cam.y * E);
  const x0 = cam.x - 20, x1 = cam.x + vw + 20, y0 = cam.y - 40, y1 = cam.y + vh + 40, t = P ? P.t : tt;
  const vis = (o, alto = 60) => o.y + alto > y0 && o.y - alto < y1;
  // el fondo del cráter, bajo la primera cornisa
  if (y1 > 0) { c.fillStyle = '#120a0d'; c.fillRect(0, 34, ANCHO, y1); }
  pared(-1, y0, y1, x0, 0); pared(1, y0, y1, ANCHO, x1);
  // el resplandor de la lava sobre todo lo de abajo
  const res = c.createLinearGradient(0, lava - 260, 0, lava); res.addColorStop(0, 'rgba(255,90,30,0)'); res.addColorStop(1, P && P.frio > 0 ? 'rgba(120,220,255,.28)' : 'rgba(255,90,30,.42)');
  c.fillStyle = res; c.fillRect(0, lava - 260, ANCHO, 260);
  // géiseres de pared: la boca siempre se ve (brilla más cuando va a escupir)
  for (const g of N.geiseres) {
    if (!vis(g)) continue;
    const s = geiserChorro(g, t), bx = g.lado < 0 ? 0 : ANCHO, cy = g.y + g.h / 2;
    c.fillStyle = s.aviso ? '#ffb347' : '#6a2a12'; c.beginPath(); c.ellipse(bx, cy, 7, 15, 0, 0, 7); c.fill();
    if (s.aviso) for (let i = 0; i < 3; i++) { c.fillStyle = 'rgba(255,190,90,.85)'; c.beginPath(); c.arc(bx - g.lado * (6 + ((tt * 70 + i * 17) % 30)), cy + Math.sin(tt * 20 + i) * 6, 2.5 + i, 0, 7); c.fill(); }
    if (s.h > 0) {
      const largo = g.largo * s.h, xa = g.lado < 0 ? 0 : ANCHO - largo;
      const col = c.createLinearGradient(bx, 0, bx - g.lado * largo, 0); col.addColorStop(0, '#ff4a1c'); col.addColorStop(0.7, '#ffb347'); col.addColorStop(1, '#fff3b0');
      c.fillStyle = col; c.beginPath(); c.moveTo(xa, g.y + 4);
      for (let x = xa; x <= xa + largo; x += 16) c.lineTo(x, g.y + 3 + Math.sin(x * 0.09 + tt * 14) * 3);
      for (let x = xa + largo; x >= xa; x -= 16) c.lineTo(x, g.y + g.h - 3 + Math.sin(x * 0.09 + tt * 14 + 1) * 3);
      c.closePath(); c.fill();
      if (Math.random() < 0.5) brasas.push({ x: xa + Math.random() * largo, y: g.y + Math.random() * g.h, vx: -g.lado * 60, vy: -60 - Math.random() * 80, vida: 0.7 });
    }
  }
  // las rocas (las cornisas, con su altura grabada)
  for (const s of N.plats) {
    if (!vis(s) || s.x + s.w < x0 || s.x > x1) continue;
    pintarRoca(s);
    if (s.tipo === 'cornisa' && s.k > 0) { c.font = '700 13px Orbitron, sans-serif'; c.textAlign = 'left'; c.fillStyle = 'rgba(95,244,255,.7)'; c.fillText(`${s.k * 50} m · ${nombreTramo(s.k).toUpperCase()}`, 16, s.y + 23); }
  }
  // cristales, núcleos y enfriadores
  for (const k of N.cristales) {
    if (k.ok || !vis(k)) continue;
    const sx = Math.cos(tt * 3 + k.x * 0.01);
    c.save(); c.translate(k.x, k.y + Math.sin(tt * 2 + k.x) * 2); c.scale(Math.max(0.15, Math.abs(sx)), 1);
    c.fillStyle = sx > 0 ? '#9ffaff' : '#35c9dc'; c.beginPath(); c.moveTo(0, -11); c.lineTo(7, 0); c.lineTo(0, 11); c.lineTo(-7, 0); c.closePath(); c.fill();
    c.strokeStyle = '#e8ffff'; c.lineWidth = 1.2; c.stroke(); c.restore();
  }
  for (const k of N.nucleos) {
    if (k.ok || !vis(k)) continue;
    const pul = 1 + Math.sin(tt * 4) * 0.12;
    c.fillStyle = 'rgba(255,194,74,.22)'; c.beginPath(); c.arc(k.x, k.y, 22 * pul, 0, 7); c.fill();
    c.fillStyle = '#ffc24a'; c.beginPath(); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + tt; c[i ? 'lineTo' : 'moveTo'](k.x + Math.cos(a) * 12, k.y + Math.sin(a) * 12); } c.closePath(); c.fill();
    c.fillStyle = '#fff6d8'; c.beginPath(); c.arc(k.x, k.y, 4.5, 0, 7); c.fill();
  }
  for (const k of N.enfriadores) { // una cápsula de refrigerante: aros de escarcha que giran
    if (k.ok || !vis(k)) continue;
    const y = k.y + Math.sin(tt * 2.4 + k.x) * 3;
    c.fillStyle = 'rgba(160,240,255,.2)'; c.beginPath(); c.arc(k.x, y, 24 + Math.sin(tt * 5) * 2, 0, 7); c.fill();
    c.strokeStyle = '#bff8ff'; c.lineWidth = 2;
    for (let i = 0; i < 3; i++) { c.beginPath(); c.ellipse(k.x, y, 16, 6, tt * 1.5 + i * Math.PI / 3, 0, 7); c.stroke(); }
    c.fillStyle = '#e8ffff'; c.beginPath(); c.roundRect(k.x - 6, y - 10, 12, 20, 5); c.fill();
    c.fillStyle = '#35c9dc'; c.fillRect(k.x - 4, y - 2, 8, 3);
  }
  // la Estática
  for (const e of N.enemigos) {
    if (e.muerto || !vis(e) || e.x + e.w < x0 || e.x > x1) continue;
    const j = () => (Math.random() - 0.5) * 3;
    if (e.tipo === 'andante') {
      c.fillStyle = '#2a0020'; c.beginPath(); c.moveTo(e.x + j(), e.y + e.h); c.lineTo(e.x + 2 + j(), e.y + 6 + j()); c.lineTo(e.x + 10, e.y + j()); c.lineTo(e.x + 20, e.y + 3 + j()); c.lineTo(e.x + e.w + j(), e.y + 8); c.lineTo(e.x + e.w, e.y + e.h); c.closePath(); c.fill();
      c.strokeStyle = '#ff4dd8'; c.lineWidth = 2; c.stroke();
      for (let i = 0; i < 5; i++) { c.fillStyle = Math.random() < 0.5 ? 'rgba(255,77,216,.8)' : 'rgba(95,244,255,.6)'; c.fillRect(e.x + Math.random() * e.w, e.y + 6 + Math.random() * (e.h - 8), 3, 3); }
      const ojo = e.v > 0 ? 3 : -3; c.fillStyle = '#fff'; c.fillRect(e.x + 8, e.y + 9, 5, 5); c.fillRect(e.x + 17, e.y + 9, 5, 5);
      c.fillStyle = '#000'; c.fillRect(e.x + 9 + ojo * 0.4 + 1, e.y + 10, 2, 3); c.fillRect(e.x + 18 + ojo * 0.4 + 1, e.y + 10, 2, 3);
    } else {
      const ox = e.x + 15, oy = e.y + 15;
      c.strokeStyle = 'rgba(255,77,216,.55)'; c.lineWidth = 2; c.beginPath(); c.ellipse(ox, oy, 22, 7, Math.sin(tt * 2) * 0.4, 0, 7); c.stroke();
      c.fillStyle = '#2a0020'; c.beginPath(); c.arc(ox + j(), oy + j(), 13, 0, 7); c.fill(); c.strokeStyle = '#ff4dd8'; c.stroke();
      c.fillStyle = '#ffd6f5'; c.beginPath(); c.arc(ox, oy, 4.5, 0, 7); c.fill();
      if (Math.random() < 0.3) { c.fillStyle = 'rgba(95,244,255,.7)'; c.fillRect(ox - 16 + Math.random() * 32, oy - 16 + Math.random() * 32, 6, 2); }
    }
  }
  // el piloto (parpadea mientras es invulnerable; si ha caído, solo quedan las chispas)
  if (J && J.muerto <= 0 && !(J.inv > 0 && Math.floor(J.inv * 12) % 2)) pintarPiloto(tt);
  // la lava: olas y brasas que suben; con el enfriador, costra oscura con reflejos de escarcha
  if (lava < y1 + 20) {
    const frio = P && P.frio > 0;
    const lv = c.createLinearGradient(0, lava - 6, 0, lava + 160);
    if (frio) { lv.addColorStop(0, '#d8fbff'); lv.addColorStop(0.06, '#4a6c7c'); lv.addColorStop(0.5, '#2a2a33'); lv.addColorStop(1, '#3a0c05'); }
    else { lv.addColorStop(0, '#ffe08a'); lv.addColorStop(0.08, '#ff9a2e'); lv.addColorStop(0.5, '#e0360f'); lv.addColorStop(1, '#5a0c05'); }
    const ola = frio ? 0.2 : 1;
    c.fillStyle = lv; c.beginPath(); c.moveTo(x0, Math.max(lava, y1) + 400);
    for (let x = x0; x <= x1; x += 12) c.lineTo(x, lava + (Math.sin(x * 0.02 + tt * 2) * 4 + Math.sin(x * 0.051 - tt * 1.3) * 3) * ola);
    c.lineTo(x1, Math.max(lava, y1) + 400); c.closePath(); c.fill();
    if (!frio && brasas.length < 70 && Math.random() < 0.6) brasas.push({ x: Math.random() * ANCHO, y: lava, vx: (Math.random() - 0.5) * 20, vy: -40 - Math.random() * 60, vida: 1.5 + Math.random() * 2 });
  }
  for (let i = brasas.length - 1; i >= 0; i--) { const b = brasas[i]; b.vida -= dtReal; if (b.vida <= 0) { brasas.splice(i, 1); continue; } b.x += b.vx * dtReal; b.y += b.vy * dtReal; c.fillStyle = `rgba(255,${140 + (b.vida * 40) | 0},60,${Math.min(1, b.vida)})`; c.fillRect(b.x, b.y, 2.5, 2.5); }
  for (const q of particulas) { c.globalAlpha = Math.max(0, q.vida / q.max); c.fillStyle = q.color; c.fillRect(q.x - 2, q.y - 2, 4, 4); }
  c.globalAlpha = 1;
  c.font = '700 16px Orbitron, sans-serif'; c.textAlign = 'center';
  for (const q of textos) { c.globalAlpha = Math.max(0, q.vida); c.fillStyle = q.color; c.fillText(q.t, q.x, q.y); }
  c.globalAlpha = 1;
  // si la lava no se ve, una flecha abajo con lo lejos que está (para no olvidarse de ella)
  if (P && jugando && lava > cam.y + vh) {
    const m = Math.round((lava - (J.y + PJ.h)) / M), sy = cam.y + vh - (document.body.classList.contains('tactil') ? 150 : 34), sx = ANCHO / 2;
    c.fillStyle = 'rgba(255,138,61,.9)'; c.beginPath(); c.moveTo(sx - 12, sy + 4); c.lineTo(sx + 12, sy + 4); c.lineTo(sx, sy + 16); c.closePath(); c.fill();
    c.font = '700 14px Orbitron, sans-serif'; c.fillText(`LAVA A ${m} m`, sx, sy - 4);
  }
}
function pintarPiloto(tt) {
  const cx = J.x + PJ.w / 2, pies = J.y + PJ.h, corre = J.suelo && Math.abs(J.vx) > 20;
  const f = corre ? Math.sin(tt * 18) : J.suelo ? 0 : 0.7;
  c.save(); c.translate(cx, pies); c.scale(J.mira, 1);
  c.shadowColor = '#5ff4ff'; c.shadowBlur = 10;
  c.strokeStyle = '#5ff4ff'; c.lineWidth = 4; c.lineCap = 'round';
  c.beginPath(); c.moveTo(-4, -11); c.lineTo(-4 + f * 6, 0); c.moveTo(4, -11); c.lineTo(4 - f * 6, J.suelo ? 0 : -4); c.stroke();
  c.fillStyle = '#ffc24a'; c.fillRect(-13, -22, 5, 12); // el propulsor de la espalda
  c.fillStyle = '#0b2a3d'; c.beginPath(); c.roundRect(-8, -23, 16, 14, 5); c.fill(); c.lineWidth = 2; c.stroke();
  c.beginPath(); c.moveTo(4, -18); c.lineTo(11, -14 + (corre ? f * 4 : 2)); c.stroke(); // el brazo
  c.shadowBlur = 0;
  // el casco: el retrato del piloto que elegiste en la sala, dentro de un anillo de luz
  c.save(); c.beginPath(); c.arc(0, -30, 10, 0, 7); c.clip();
  if (imgPiloto) { const s = Math.min(imgPiloto.width, imgPiloto.height); c.scale(J.mira, 1); c.drawImage(imgPiloto, (imgPiloto.width - s) / 2, (imgPiloto.height - s) * 0.3, s, s, -10, -40, 20, 20); }
  else { c.fillStyle = '#123'; c.fillRect(-10, -40, 20, 20); }
  c.restore();
  c.strokeStyle = '#5ff4ff'; c.lineWidth = 2.5; c.beginPath(); c.arc(0, -30, 10.5, 0, 7); c.stroke();
  c.restore();
}
function pintarHUD() {
  if (!P || !jugando) return;
  const F = FASES[P.fase], margen = P.lava - (J.y + PJ.h);
  $('h-pts').textContent = puntosAhora().toLocaleString('es-ES');
  $('h-m').textContent = P.maxM.toLocaleString('es-ES');
  $('h-vid').textContent = Math.max(0, P.escudos);
  $('h-t').textContent = mmss(P.t);
  $('h-tramo').textContent = P.frio > 0 ? `Lava enfriada · ${Math.ceil(P.frio)} s` : `Fase ${P.fase + 1} · ${F.n} · ${fmtX(F.x)}`;
  // la barra: el margen que te queda sobre la lava (llena = lejos; en rojo, a menos de ~4 m)
  $('h-prog').style.width = Math.max(2, Math.min(100, margen / 6)) + '%';
  $('h-barra').classList.toggle('peligro', margen < 130);
}

// ───────────────────────────────── bucle
function pausar() {
  if (!jugando || !P || P.fin || DES.abierto) return;
  pausa = !pausa; soltar();
  if (pausa) { pantalla(`<h2>Pausa</h2><p>La lava también espera.</p><div class="botones"><button id="b-seg">Seguir</button>${EMBED ? '' : '<a class="boton sec" href="index.html?v=4eafd61012">Volver a la sala</a>'}</div>`); $('b-seg').onclick = pausar; }
  else cerrarPantalla();
}
document.addEventListener('visibilitychange', () => { if (document.hidden && jugando && !pausa && !DES.abierto && !window.__sinPausa) pausar(); });
let antes = performance.now(), acum = 0;
function bucle(ahora) {
  requestAnimationFrame(bucle);
  const dt = Math.min(0.05, (ahora - antes) / 1000); antes = ahora;
  if (jugando && !pausa && !DES.abierto) {
    acum += dt; let n = 0;
    while (acum >= PASO && n < 8) { paso(PASO); acum -= PASO; n++; if (!jugando) break; }
    if (jugando) DES.tick(dt);
  } else if (!jugando) efectos(dt);
  pintar(dt, ahora / 1000); pintarHUD();
}
function empezar() {
  N = nuevoMundo(); J = nuevoPiloto(); P = nuevaPartida(); particulas.length = 0; textos.length = 0; brasas.length = 0;
  cam.y = J.y + PJ.h - vh * 0.6;
  jugando = true; pausa = false; acum = 0; soltar(); window.__t0Partida = performance.now();
  DES.empezar();
  $('hud').classList.remove('oculto'); cerrarPantalla();
  aviso('¡TREPA! LA LAVA SUBE', '#ffc24a', 1.8);
}
function portada() {
  const e = estado(), desafio = MODO === 'desafio';
  pantalla(`<div class="kicker">El simulador de Joran · máquina 5${desafio ? ' · modo desafío' : ''}</div><h2>La conquista de Fôrge</h2>
    <p>La prueba más dura de Joran: la <b>chimenea de Fôrge</b>. Por el pozo sube un mar de lava que <b>no para</b> y cada vez va más deprisa. Trepa de roca en roca <b>hasta donde aguantes</b>: no hay meta. La Estática patrulla las rocas: <b>písala</b> desde arriba o esquívala.</p>
    <div class="teclas"><kbd>← →  /  A D</kbd><span>Correr</span><kbd>↑  /  W  /  Espacio</kbd><span>Saltar (mantén para llegar más alto; las rocas se atraviesan desde abajo)</span><kbd>P</kbd><span>Pausa</span></div>
    <p>Si tocas la lava, se acabó. La Estática y los <b>géiseres de la pared</b> te quitan un escudo (tienes ${ESCUDOS}). Los <b>enfriadores</b> paran la lava ${ENFRIA} s: hay uno cada 50 m. Suman la altura (+${PT.metro} por metro), cada segundo vivo (+${PT.segundo}), los <b>cristales</b> (+${PT.cristal}), los <b>núcleos de forja</b> (+${PT.nucleo}), cada Estática pisada (+${PT.pisoton}) y cada enfriador (+${PT.enfriador}).</p>
    <p>Cada pocos minutos <b>la lava acelera</b> y todo vale más: ${FASES.slice(1).map((F) => `${mmss(F.t)} ${fmtX(F.x)}`).join(' · ')}. A partir de los 10 minutos, la <b>zona roja</b>.</p>
    ${DES.texto()}
    <p class="pista">Tu récord: <b>${(e.marcas[JUEGO.id] || 0).toLocaleString('es-ES')}</b> · La chimenea es la misma para todos · Dibujado por código · el cielo, de la serie STARGATE</p>
    <div class="botones"><button id="b-ya">¡A trepar!</button><a class="boton sec" href="${urlModo(desafio ? 'arcade' : 'desafio')}">${desafio ? 'Jugar en arcade' : 'Jugar en desafío'}</a>${EMBED ? '' : '<a class="boton sec" href="index.html?v=4eafd61012">Volver a la sala</a>'}</div>`);
  $('b-ya').onclick = async () => {
    audio();
    if (desafio) { // las preguntas tienen que estar antes de salir: sin ellas, el depósito no se podría rellenar
      const b = $('b-ya'); b.disabled = true; b.textContent = 'Cargando preguntas…';
      if (!(await DES.preparar())) aviso('Sin preguntas: juegas en arcade', '#ffc24a', 2.2);
    }
    empezar();
  };
}
(async () => {
  const av = AVATARES.find((a) => a.id === estado().avatar) || AVATARES[0];
  [imgFondo, imgPiloto] = await Promise.all([carga(FONDO), carga(av.img)]);
  N = nuevoMundo(); J = nuevoPiloto(); P = null; cam.y = J.y + PJ.h - vh * 0.6;
  $('carga').remove(); requestAnimationFrame(bucle); portada();
})().catch((err) => { console.error(err); $('carga').textContent = 'No se pudo cargar: ' + err.message; });
// para probar desde la consola: CON.avanzar(2) simula 2 s (también con la pestaña oculta) · CON.subir(300) te sube a
// la roca más cercana a 300 m · CON.tramo(k) da el tramo k tal cual lo genera la semilla
window.CON = { get N() { return N; }, get J() { return J; }, get P() { return P; }, DES, tecla, empezar, tramo, FASES, LAVA_V, LAVA_MARGEN, PT,
  subir: (m) => {
    if (!J) return; asegurar(N, -m * M - 800);
    const p = N.plats.filter((l) => l.tipo === 'roca' || l.tipo === 'cornisa').sort((a, b) => Math.abs(a.y + m * M) - Math.abs(b.y + m * M))[0];
    Object.assign(J, { x: p.x + p.w / 2 - PJ.w / 2, y: p.y - PJ.h, vx: 0, vy: 0 });
  },
  dibujar: () => { pintar(1 / 60, performance.now() / 1000); pintarHUD(); },
  avanzar: (seg) => { for (let i = 0; i < seg / PASO && jugando && !DES.abierto; i++) { paso(PASO); DES.tick(PASO); } } };
