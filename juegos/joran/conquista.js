// LA CONQUISTA DE FÔRGE · la quinta máquina de la sala de Joran (borrador).
// Fôrge es el planeta de la forja: roca agrietada, acantilados y ríos de lava. Joran hizo de él su prueba más dura: cruzarlo
// a saltos hasta la Puerta de la cumbre, con la Estática patrullando las rocas. Plataformas 2D en canvas, como las de
// siempre: correr, saltar (más alto si mantienes), pisar a la Estática, balizas de control y meta.
// Arcade o DESAFÍO (desafio.js, ?modo=desafio): en el desafío, la refrigeración del traje se gasta y se recarga acertando.
//
// Gráficos: TODO dibujado por código en este fichero (rocas, lava, piloto, Estática, cristales, Puerta), salvo el cielo
// del fondo, que es el arte de Fôrge de la propia serie STARGATE (p1_forge_llegada) y el retrato del piloto que elegiste
// en la sala. Sin recursos de terceros ni generadores de pago.
import { $, estado, SON, tono, ruido, audio, pantalla, cerrarPantalla, aviso, finDePartida, JUEGOS, AVATARES, EMBED } from './comun.js?v=cdadcf2641';
import { crearDesafio, MODO, urlModo } from './desafio.js?v=cdadcf2641';

const JUEGO = JUEGOS.find((j) => j.id === 'conquista') || { id: 'conquista', n: 'La conquista de Fôrge' };
const EN_WEB = location.pathname.includes('/juegos/');
// en la web, el fondo que ya sirve la Nave (un solo fichero); en el borrador, la copia reducida de img/
const FONDO = EN_WEB ? '../../assets/img/fondos/p1_forge_llegada.webp' : 'img/forge_fondo.webp';

// ───────────────────────────────── la física (unidades: píxeles del mundo y segundos)
const ALTO = 540;                 // alto mínimo de lo que se ve
const LAVA = 600, PIE = LAVA + 80; // el mar de lava y el fondo de las rocas (se hunden en ella)
const G = 2300, CAIDA_MAX = 1150, VCORRE = 310, ACC_SUELO = 2800, ACC_AIRE = 1700;
const SALTO = 780, SALTO_CORTO = 320, REBOTE = 600;  // salto: ~132 px de alto y ~210 px de largo a toda carrera
const COYOTE = 0.1, BUFFER = 0.13;                   // perdón al saltar tarde (ya fuera del borde) o pronto (aún en el aire)
const PASO = 1 / 120;                                // paso fijo: el mismo salto en un móvil lento que en un ordenador
const PJ = { w: 24, h: 40 };
const M = 32;                                        // px por metro (lo que se ve en el marcador)
const VIDAS = 3;
// los puntos, en un sitio (la portada los cuenta de aquí)
const PT = { metro: 3, cristal: 25, nucleo: 250, pisoton: 100, baliza: 250, meta: 1500, vida: 500, segundo: 6, limite: 300 };

// ───────────────────────────────── el nivel: siempre el mismo (semilla fija), para que el ranking sea justo
function azarFijo(s) { return () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
// lo más lejos que llega un salto a toda carrera hasta una roca `sube` px más alta (negativo: más baja). El generador
// nunca pone un hueco de más del ~70 % de esto: así todo el nivel se puede pasar, y con margen.
function alcance(sube) {
  const a = G / 2, d = SALTO * SALTO - 4 * a * sube;
  if (d < 0) return 0;
  return VCORRE * (SALTO + Math.sqrt(d)) / (2 * a);
}
// S = salto entre acantilados · F = losas que crujen · G = géiser de lava · M = plataforma móvil sobre un lago
const TRAMOS = [
  { n: 'El borde del cráter', piezas: 'SSSSSS', hueco: [50, 110], dy: 40, ancho: [180, 300], andantes: 0.45, drones: 0 },
  { n: 'Las rocas que crujen', piezas: 'SFSFSF', hueco: [70, 130], dy: 45, ancho: [150, 260], andantes: 0.5, drones: 0 },
  { n: 'Los géiseres', piezas: 'GSGSFG', hueco: [80, 140], dy: 45, ancho: [150, 250], andantes: 0.5, drones: 0.25 },
  { n: 'El lago de magma', piezas: 'MSGMSM', hueco: [90, 140], dy: 40, ancho: [150, 240], andantes: 0.55, drones: 0.5 },
  { n: 'La pared de Fôrge', piezas: 'SSSSSSSS', subida: true, hueco: [50, 105], ancho: [110, 170], andantes: 0.2, drones: 0.35 },
  { n: 'La cumbre', piezas: 'SFSGMSFS', relativo: true, hueco: [90, 150], dy: 40, ancho: [140, 240], andantes: 0.65, drones: 0.5 },
];
function generar() {
  const r = azarFijo(20261005), R = (a, b) => a + r() * (b - a);
  const N = { rocas: [], losas: [], geiseres: [], enemigos: [], cristales: [], nucleos: [], balizas: [], tramos: [], meta: null, inicio: 0 };
  // el borde de arriba, dentado, y las grietas de lava de cada roca (solo se dibujan: el choque usa el borde recto)
  const dientes = (w) => { const p = []; for (let x = 0; x <= w; x += 18 + r() * 10) p.push([Math.min(x, w), x === 0 ? 0 : -1 - r() * 5]); p.push([w, 0]); return p; };
  const grietas = (w, h) => {
    const gs = []; const n = 1 + Math.floor(w / 110 + r() * 2);
    for (let i = 0; i < n; i++) { let x = 10 + r() * (w - 20), y = 6 + r() * 20; const g = [[x, y]]; const largo = Math.min(h - 30, 60 + r() * 220);
      while (y < largo) { x = Math.max(6, Math.min(w - 6, x + (r() - 0.5) * 26)); y += 14 + r() * 22; g.push([x, y]); } gs.push(g); }
    return gs;
  };
  const roca = (x, w, y) => { const s = { tipo: 'roca', x, y, w, h: PIE - y, borde: dientes(w), grietas: grietas(w, PIE - y) }; N.rocas.push(s); return s; };
  const andante = (s) => { const v = R(55, 85) * (r() < 0.5 ? -1 : 1); N.enemigos.push({ tipo: 'andante', x: s.x + s.w / 2 - 15, y: s.y - 26, w: 30, h: 26, min: s.x + 12, max: s.x + s.w - 42, v }); };
  const dron = (cx, top) => N.enemigos.push({ tipo: 'dron', cx, cy: top - R(150, 185), ax: R(25, 60), ay: R(28, 42), f: R(1.1, 1.8), fase: r() * 6, x: cx, y: top - 160, w: 30, h: 30 });
  // tres cristales siguiendo el arco del salto (a la altura del cuerpo a toda carrera)
  const arco = (x0, y0, x1, y1) => { for (let i = 1; i <= 3; i++) { const f = i / 4; N.cristales.push({ x: x0 + (x1 - x0) * f, y: y0 + (y1 - y0) * f - 22 - 118 * 4 * f * (1 - f), ok: false }); } };
  let x = -360, top = 420;
  roca(-420, 60, 120);                // la pared de detrás: no se puede volver hacia atrás
  roca(x, 620, top); x += 620; N.inicio = -240;
  TRAMOS.forEach((T, ti) => {
    N.tramos.push({ x: x - 40, n: T.n });
    const base = top, lo = T.relativo ? base - 70 : 300, hi = T.relativo ? base + 60 : 470;
    const altura = (desde) => (T.subida ? desde - R(45, 88) : Math.max(lo, Math.min(hi, desde + R(-T.dy, T.dy))));
    const conNucleo = [...T.piezas].map((c, i) => (c === 'S' ? i : -1)).filter((i) => i > 0);
    const nucleoEn = conNucleo[Math.floor(r() * conNucleo.length)];
    [...T.piezas].forEach((pieza, pi) => {
      if (pieza === 'S') {
        const nt = altura(top), h = Math.max(45, Math.min(R(T.hueco[0], T.hueco[1]), alcance(top - nt) * 0.7));
        if (pi === nucleoEn) N.nucleos.push({ x: x + h / 2, y: top - 140, ok: false }); // a la altura del salto entero desde el borde
        else if (r() < 0.6) arco(x, top, x + h, nt);
        if (r() < T.drones) dron(x + h / 2, Math.min(top, nt));
        x += h; const w = R(T.ancho[0], T.ancho[1]), s = roca(x, w, nt);
        if (w >= 180 && r() < T.andantes) andante(s);
        x += w; top = nt;
      } else if (pieza === 'F') {
        // dos o tres losas flotando sobre la lava: crujen al pisarlas y a medio segundo se caen (vuelven a los 3 s)
        let cy = top; const n = r() < 0.5 ? 2 : 3;
        for (let i = 0; i < n; i++) {
          const ny = Math.max(lo - 40, Math.min(hi, cy + R(-35, 25))), h = Math.min(R(75, 115), alcance(cy - ny) * 0.68);
          x += h; const w = R(66, 92);
          N.losas.push({ tipo: 'fragil', x, y: ny, y0: ny, w, h: 22, t: -1, vy: 0, cae: false, vuelve: 0, borde: dientes(w) });
          N.cristales.push({ x: x + w / 2, y: ny - 42, ok: false });
          x += w; cy = ny;
        }
        const nt = Math.max(lo, Math.min(hi, cy + R(-30, 30))), h = Math.min(R(75, 115), alcance(cy - nt) * 0.68);
        x += h; const w = R(T.ancho[0], T.ancho[1]); const s = roca(x, w, nt); if (w >= 180 && r() < T.andantes) andante(s); x += w; top = nt;
      } else if (pieza === 'G') {
        const nt = altura(top), h = Math.max(110, Math.min(R(120, 165), alcance(top - nt) * 0.72));
        N.geiseres.push({ x: x + h / 2 - 22, w: 44, techo: Math.min(top, nt) - 200, periodo: R(2.4, 3.2), fase: r() * 3 });
        x += h; const w = R(T.ancho[0], T.ancho[1]); const s = roca(x, w, nt); if (w >= 180 && r() < T.andantes) andante(s); x += w; top = nt;
      } else if (pieza === 'M') {
        // un lago de lava que solo se cruza subido a una plataforma que va y viene (hay que esperarla)
        const lago = R(360, 440), nt = Math.max(lo, Math.min(hi, top + R(-20, 20))), py = (top + nt) / 2 + R(0, 15), w = 110;
        const a = x + 34, b = x + lago - 34 - w;
        N.losas.push({ tipo: 'movil', x: a, y: py, w, h: 18, a, b, om: (2 * Math.PI) / R(4.6, 5.6), fase: 0, dx: 0 });
        for (let i = 1; i <= 3; i++) N.cristales.push({ x: x + lago * i / 4, y: py - 44, ok: false });
        if (r() < T.drones) dron(x + lago / 2, py);
        x += lago; const w2 = R(T.ancho[0], T.ancho[1]); roca(x, w2, nt); x += w2; top = nt;
      }
    });
    if (ti < TRAMOS.length - 1) { // la baliza del final del tramo: una roca ancha y llana para respirar
      const nt = T.subida ? top - 40 : Math.max(lo, Math.min(hi, top + R(-20, 20))), h = Math.min(R(60, 100), alcance(top - nt) * 0.7);
      x += h; roca(x, 300, nt); N.balizas.push({ x: x + 150, y: nt, ok: false, n: ti + 1 }); x += 300; top = nt;
    }
  });
  // la cumbre: la Puerta, y una pared detrás para no caerse de largo
  const h = 90; x += h; roca(x, 480, top); N.meta = { x: x + 300, y: top }; x += 480; roca(x, 80, top - 320);
  N.fin = x;
  return N;
}

// ───────────────────────────────── estado
let N = generar(), J = null, P = null, jugando = false, pausa = false;
const cam = { x: -420, y: 0 };
function nuevoPiloto() { const r0 = N.rocas[1]; return { x: N.inicio, y: r0.y - PJ.h, vx: 0, vy: 0, mira: 1, suelo: null, coyote: 0, buffer: 0, saltoAntes: false, muerto: 0, inv: 0 }; }
function nuevaPartida() { return { t: 0, vidas: VIDAS, ev: 0, maxX: N.inicio, cristales: 0, nucleos: 0, pisotones: 0, balizas: 0, tramo: 0, respawn: { x: N.inicio, y: N.rocas[1].y - PJ.h }, fin: false }; }
const metros = () => Math.max(0, Math.floor((P.maxX - N.inicio) / M));
const puntosAhora = () => P.ev + metros() * PT.metro;

// el modo desafío: la refrigeración del traje (en Fôrge hace calor). Mientras se contesta, el juego para; al volver, se sueltan
// las teclas (si no, el piloto seguiría corriendo con la tecla que pulsaste antes de la pregunta)
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
function geiserAltura(g, t) { // 0 = en calma · 1 = columna entera. Antes de salir, burbujea (fase de aviso)
  const c = ((t + g.fase) % g.periodo);
  if (c < 0.7) return { aviso: true, h: 0 };
  if (c < 1.6) { const k = c - 0.7; return { aviso: false, h: k < 0.18 ? k / 0.18 : k > 0.72 ? Math.max(0, (0.9 - k) / 0.18) : 1 }; }
  return { aviso: false, h: 0 };
}
function mundo(dt) {
  for (const l of N.losas) {
    if (l.tipo === 'movil') { const nx = l.a + (l.b - l.a) * (0.5 - 0.5 * Math.cos(P.t * l.om + l.fase)); l.dx = nx - l.x; l.x = nx; continue; }
    if (l.cae) { l.vy += G * 0.5 * dt; l.y += l.vy * dt; l.vuelve -= dt; if (l.vuelve <= 0) { l.cae = false; l.y = l.y0; l.vy = 0; l.t = -1; } continue; }
    if (l.t >= 0) { l.t += dt; if (l.t > 0.5) { l.cae = true; l.vuelve = 3; ruido(0.25, 0.2, 600); } }
  }
  for (const e of N.enemigos) {
    if (e.muerto) continue;
    if (e.tipo === 'andante') { e.x += e.v * dt; if (e.x < e.min) { e.x = e.min; e.v = Math.abs(e.v); } if (e.x > e.max) { e.x = e.max; e.v = -Math.abs(e.v); } }
    else { e.x = e.cx - 15 + Math.sin(P.t * e.f + e.fase) * e.ax; e.y = e.cy - 15 + Math.cos(P.t * e.f * 1.3 + e.fase) * e.ay; }
  }
  for (let i = particulas.length - 1; i >= 0; i--) { const q = particulas[i]; q.vida -= dt; if (q.vida <= 0) { particulas.splice(i, 1); continue; } q.x += q.vx * dt; q.y += q.vy * dt; q.vy += q.g * dt; }
  for (let i = textos.length - 1; i >= 0; i--) { const q = textos[i]; q.vida -= dt; q.y -= 40 * dt; if (q.vida <= 0) textos.splice(i, 1); }
}
const cruzan = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
function chocarX() {
  const yo = { x: J.x, y: J.y, w: PJ.w, h: PJ.h };
  for (const s of N.rocas) {
    if (s.x > J.x + PJ.w + 2 || s.x + s.w < J.x - 2) continue;
    yo.x = J.x; if (!(J.y + PJ.h > s.y + 0.01 && J.y < s.y + s.h) || !cruzan(yo, s)) continue;
    J.x = J.x + PJ.w / 2 < s.x + s.w / 2 ? s.x - PJ.w : s.x + s.w; J.vx = 0;
  }
}
function chocarY(piesAntes) {
  const yo = { x: J.x, y: J.y, w: PJ.w, h: PJ.h };
  for (const s of N.rocas) {
    if (s.x > J.x + PJ.w || s.x + s.w < J.x || !cruzan(yo, s)) continue;
    if (piesAntes <= s.y + 0.5) { J.y = s.y - PJ.h; J.vy = 0; J.suelo = s; yo.y = J.y; }
    else if (J.vy < 0) { J.y = s.y + s.h; J.vy = 0; yo.y = J.y; }
  }
  // las losas y las móviles solo sostienen desde arriba (se atraviesan al subir: menos cabezazos injustos)
  for (const l of N.losas) {
    if (l.cae || J.vy < 0) continue;
    if (J.x + PJ.w > l.x + 2 && J.x < l.x + l.w - 2 && piesAntes <= l.y + 2 && J.y + PJ.h >= l.y) { J.y = l.y - PJ.h; J.vy = 0; J.suelo = l; }
  }
}
function paso(dt) {
  P.t += dt;
  mundo(dt);
  if (J.muerto > 0) { J.muerto -= dt; if (J.muerto <= 0) { if (P.vidas <= 0) terminar(false); else reaparecer(); } return; }
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
  J.x += J.vx * dt; chocarX();
  const piesAntes = J.y + PJ.h; J.y += J.vy * dt; J.suelo = null; chocarY(piesAntes);
  if (J.suelo && J.suelo.tipo === 'fragil' && J.suelo.t < 0) { J.suelo.t = 0; tono(180, 90, 0.2, 'sawtooth', 0.04); }
  if (J.suelo && !sobre && J.vy === 0) for (let i = 0; i < 4; i++) particulas.push({ x: J.x + PJ.w / 2, y: J.y + PJ.h, vx: (Math.random() - 0.5) * 120, vy: -Math.random() * 60, vida: 0.3, max: 0.3, color: '#8a6f68', g: 300 });
  if (J.y + PJ.h > LAVA + 4) return morir('lava');
  const yo = { x: J.x, y: J.y, w: PJ.w, h: PJ.h };
  // la Estática: si caes encima, la deshaces (y rebotas: manteniendo el salto, más alto); si no, te deshace a ti
  for (const e of N.enemigos) {
    if (e.muerto) continue;
    const caja = { x: e.x + 3, y: e.y + 3, w: e.w - 6, h: e.h - 3 };
    if (!cruzan(yo, caja)) continue;
    if (J.vy > 60 && piesAntes <= e.y + 12) {
      e.muerto = true; P.ev += PT.pisoton; P.pisotones++; J.vy = quiere ? -SALTO * 0.92 : -REBOTE; J.coyote = 0;
      SON.boom(); chispas(e.x + e.w / 2, e.y + e.h / 2, 18, '#ff4dd8'); flota(e.x + e.w / 2, e.y, '+' + PT.pisoton, '#ff4dd8');
    } else if (J.inv <= 0) return morir('estatica');
  }
  for (const g of N.geiseres) {
    const s = geiserAltura(g, P.t); if (s.h < 0.3) continue;
    const arriba = LAVA - (LAVA - g.techo) * s.h;
    if (J.inv <= 0 && cruzan(yo, { x: g.x + 6, y: arriba, w: g.w - 12, h: LAVA - arriba })) return morir('geiser');
  }
  const cx = J.x + PJ.w / 2, cy = J.y + PJ.h / 2;
  for (const c of N.cristales) if (!c.ok && Math.abs(c.x - cx) < 20 && Math.abs(c.y - cy) < 26) { c.ok = true; P.cristales++; P.ev += PT.cristal; SON.chispa(); flota(c.x, c.y - 10, '+' + PT.cristal, '#5ff4ff'); }
  for (const c of N.nucleos) if (!c.ok && Math.abs(c.x - cx) < 24 && Math.abs(c.y - cy) < 30) { c.ok = true; P.nucleos++; P.ev += PT.nucleo; SON.llave(); chispas(c.x, c.y, 16, '#ffc24a', 160); aviso(`NÚCLEO DE FORJA · +${PT.nucleo}`, '#ffc24a', 1.1); }
  for (const b of N.balizas) if (!b.ok && cx >= b.x - 8 && J.y + PJ.h <= b.y + 2) {
    b.ok = true; P.balizas++; P.ev += PT.baliza; P.respawn = { x: b.x - PJ.w / 2, y: b.y - PJ.h }; SON.bien();
    aviso(`BALIZA ${b.n} ENCENDIDA · +${PT.baliza}`, '#5dffa0', 1.3);
  }
  P.maxX = Math.max(P.maxX, J.x);
  while (P.tramo + 1 < N.tramos.length && J.x > N.tramos[P.tramo + 1].x) {
    P.tramo++; aviso(`${P.tramo + 1}/${N.tramos.length} · ${N.tramos[P.tramo].n.toUpperCase()}`, '#5ff4ff', 1.6); $('h-tramo').textContent = N.tramos[P.tramo].n;
  }
  if (J.suelo && cx >= N.meta.x - 16) terminar(true);
}
function morir(motivo) {
  if (J.muerto > 0) return;
  P.vidas--; J.muerto = 1.3; J.vx = 0; J.vy = 0;
  const x = J.x + PJ.w / 2, y = J.y + PJ.h / 2;
  if (motivo === 'lava') { SON.caida(); chispas(x, LAVA - 4, 26, '#ffb347', 260); aviso('¡A LA LAVA!', '#ff8a3d', 1.2); }
  else { SON.golpe(); chispas(x, y, 26, motivo === 'geiser' ? '#ffb347' : '#ff4dd8', 240); aviso(motivo === 'geiser' ? '¡EL GÉISER!' : '¡LA ESTÁTICA!', motivo === 'geiser' ? '#ff8a3d' : '#ff4dd8', 1.2); }
}
function reaparecer() {
  Object.assign(J, { x: P.respawn.x, y: P.respawn.y, vx: 0, vy: 0, suelo: null, inv: 1.8, buffer: 0, coyote: 0 });
  aviso(P.vidas === 1 ? 'ÚLTIMA VIDA' : `QUEDAN ${P.vidas} VIDAS`, '#5ff4ff', 1.1);
}
function terminar(llego) {
  if (P.fin) return; P.fin = true; jugando = false; DES.parar();
  const seg = Math.round(P.t), mmss = `${Math.floor(seg / 60)}:${String(seg % 60).padStart(2, '0')}`;
  let puntos = puntosAhora();
  const filas = [['Metros', metros().toLocaleString('es-ES')], ['Cristales', `${P.cristales}/${N.cristales.length}`], ['Núcleos de forja', `${P.nucleos}/${N.nucleos.length}`],
    ['Estática pisada', P.pisotones], ['Balizas', `${P.balizas}/${N.balizas.length}`], ['Tiempo', mmss]];
  let texto;
  if (llego) {
    const bt = Math.max(0, PT.limite - seg) * PT.segundo, bv = P.vidas * PT.vida;
    puntos += PT.meta + bt + bv;
    filas.push(['Conquista', `+${PT.meta.toLocaleString('es-ES')}`], ['Bonus de tiempo', `+${bt.toLocaleString('es-ES')}`], ['Vidas que te quedan', `+${bv.toLocaleString('es-ES')}`]);
    SON.bien(); chispas(N.meta.x, N.meta.y - 90, 60, '#5ff4ff', 320);
    texto = `Has cruzado Fôrge y encendido la Puerta de la cumbre en <b>${mmss}</b>.`;
  } else texto = `Fôrge te ha podido esta vez: llegaste a <b>${metros().toLocaleString('es-ES')} m</b>. Las balizas no se olvidan… pero la partida sí: vuelta al borde del cráter.`;
  const bonus = DES.bonus(puntos); puntos += bonus; filas.push(...DES.filas(bonus));
  setTimeout(() => {
    $('hud').classList.add('oculto');
    finDePartida({ juego: JUEGO.id, titulo: llego ? '¡Fôrge conquistado!' : 'Fin de la conquista', puntos, filas, texto, alRepetir: empezar,
      // conquista / sinCaer: para un hito futuro del Cuaderno («Conquistador sin caer»); hoy registrarPartida no los usa
      extra: { ...DES.extra(), conquista: llego, sinCaer: llego && P.vidas === VIDAS } });
  }, llego ? 1200 : 700);
}

// ───────────────────────────────── dibujo
const lienzo = $('lienzo'), c = lienzo.getContext('2d');
let esc = 1, vw = 960, vh = ALTO, dpr = 1;
function ajustar() {
  dpr = Math.min(devicePixelRatio || 1, 2); lienzo.width = Math.round(innerWidth * dpr); lienzo.height = Math.round(innerHeight * dpr);
  // se ve siempre un alto de 540 como mínimo; en un móvil en vertical, además, un ancho de 600 (para ver venir los saltos)
  esc = Math.min(innerHeight / ALTO, innerWidth / 600); vw = innerWidth / esc; vh = innerHeight / esc;
}
addEventListener('resize', ajustar); ajustar();
const carga = (src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });
let imgFondo = null, imgPiloto = null;
// las sierras del fondo: dos capas que se mueven más despacio que el suelo (paralaje)
const sierra = (sem, n, alto) => { const r = azarFijo(sem); const v = []; let h = alto * 0.5; for (let i = 0; i < n; i++) { h = Math.max(alto * 0.15, Math.min(alto, h + (r() - 0.5) * alto * 0.45)); v.push(h); } return v; };
const SIERRAS = [{ p: 0.22, paso: 70, v: sierra(7, 64, 190), base: 0.74, color: '#1a0c1c', borde: 'rgba(95,244,255,.16)' }, { p: 0.45, paso: 54, v: sierra(11, 80, 150), base: 0.86, color: '#0f070f', borde: 'rgba(255,122,48,.32)' }];
const brasas = [];

function pintar(dtReal, tt) {
  const W = lienzo.width, H = lienzo.height;
  // la cámara: adelantada hacia donde corres; nunca por debajo de la lava
  if (J) {
    const tx = J.x + PJ.w / 2 - vw * 0.38 + J.vx * 0.25, ty = Math.min(J.y + PJ.h - vh * 0.64, LAVA + 70 - vh);
    const k = Math.min(1, dtReal * 5); cam.x += (Math.max(-440, tx) - cam.x) * k; cam.y += (ty - cam.y) * Math.min(1, dtReal * 4);
  }
  c.setTransform(1, 0, 0, 1, 0, 0);
  // el cielo de Fôrge: tormenta violeta
  const cielo = c.createLinearGradient(0, 0, 0, H); cielo.addColorStop(0, '#140726'); cielo.addColorStop(0.6, '#231033'); cielo.addColorStop(1, '#2e0f10');
  c.fillStyle = cielo; c.fillRect(0, 0, W, H);
  if (imgFondo) { // el arte de Fôrge, que se recorre de izquierda a derecha a lo largo de todo el nivel
    const ih = Math.max(vh * 1.08, (vw * 1.35) * imgFondo.height / imgFondo.width), iw = ih * imgFondo.width / imgFondo.height;
    const prog = Math.max(0, Math.min(1, (cam.x - N.inicio) / (N.fin - N.inicio)));
    const fx = -(iw - vw) * prog, fy = Math.max(vh - ih, Math.min(0, -(ih - vh) * 0.5 - (cam.y - (LAVA + 70 - vh)) * 0.04));
    c.globalAlpha = 0.62; c.drawImage(imgFondo, fx * esc * dpr, fy * esc * dpr, iw * esc * dpr, ih * esc * dpr); c.globalAlpha = 1;
    c.fillStyle = 'rgba(12,4,20,.42)'; c.fillRect(0, 0, W, H);
  }
  const E = esc * dpr;
  // sierras (en coordenadas de pantalla, con su propio paralaje)
  for (const s of SIERRAS) {
    const baseY = vh * s.base - (cam.y - (LAVA + 70 - vh)) * s.p * 0.5, ciclo = s.v.length * s.paso;
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
  const x0 = cam.x - 40, x1 = cam.x + vw + 40, t = P ? P.t : tt;
  // el resplandor de la lava sobre todo lo de abajo
  const res = c.createLinearGradient(0, LAVA - 220, 0, LAVA); res.addColorStop(0, 'rgba(255,90,30,0)'); res.addColorStop(1, 'rgba(255,90,30,.38)');
  c.fillStyle = res; c.fillRect(x0, LAVA - 220, x1 - x0, 220);
  // géiseres (detrás de las rocas no: van en los huecos)
  for (const g of N.geiseres) {
    if (g.x + g.w < x0 || g.x > x1) continue;
    const s = geiserAltura(g, t);
    if (s.aviso) { for (let i = 0; i < 3; i++) { c.fillStyle = 'rgba(255,190,90,.8)'; c.beginPath(); c.arc(g.x + 8 + ((tt * 60 + i * 13) % (g.w - 16)), LAVA - 4 - ((tt * 40 + i * 9) % 14), 3 + i, 0, 7); c.fill(); } }
    if (s.h > 0) {
      const arriba = LAVA - (LAVA - g.techo) * s.h, col = c.createLinearGradient(0, arriba, 0, LAVA);
      col.addColorStop(0, '#fff3b0'); col.addColorStop(0.25, '#ffb347'); col.addColorStop(1, '#ff4a1c');
      c.fillStyle = col; c.beginPath(); c.moveTo(g.x + 4, LAVA);
      for (let y = LAVA; y > arriba; y -= 18) c.lineTo(g.x + 4 + Math.sin(y * 0.08 + tt * 12) * 4, y);
      c.quadraticCurveTo(g.x + g.w / 2, arriba - 18, g.x + g.w - 4, arriba);
      for (let y = arriba; y < LAVA; y += 18) c.lineTo(g.x + g.w - 4 + Math.sin(y * 0.08 + tt * 12 + 1) * 4, y);
      c.closePath(); c.fill();
      if (Math.random() < 0.5) brasas.push({ x: g.x + Math.random() * g.w, y: arriba, vx: (Math.random() - 0.5) * 80, vy: -80 - Math.random() * 120, vida: 0.8 });
    }
  }
  // las rocas: acantilados que se hunden en la lava, con grietas incandescentes y el borde de holograma de Joran
  for (const s of N.rocas) {
    if (s.x + s.w < x0 || s.x > x1) continue;
    const gr = c.createLinearGradient(0, s.y, 0, Math.min(PIE, s.y + 420)); gr.addColorStop(0, '#3a2a30'); gr.addColorStop(0.3, '#22161b'); gr.addColorStop(1, '#120a0d');
    c.fillStyle = gr; c.beginPath(); c.moveTo(s.x, s.y);
    for (const [dx, dy] of s.borde) c.lineTo(s.x + dx, s.y + dy);
    c.lineTo(s.x + s.w - 5, PIE); c.lineTo(s.x + 5, PIE); c.closePath(); c.fill();
    c.lineCap = 'round'; c.lineJoin = 'round';
    for (const g of s.grietas) { // grieta: halo ancho y tenue + línea fina brillante (más barato que shadowBlur)
      for (const [ancho, color] of [[5, 'rgba(255,110,30,.25)'], [1.6, '#ffb347']]) { c.strokeStyle = color; c.lineWidth = ancho; c.beginPath(); g.forEach(([gx, gy], i) => (i ? c.lineTo(s.x + gx, s.y + gy) : c.moveTo(s.x + gx, s.y + gy))); c.stroke(); }
    }
    c.strokeStyle = 'rgba(95,244,255,.75)'; c.lineWidth = 2; c.beginPath(); c.moveTo(s.x, s.y); for (const [dx, dy] of s.borde) c.lineTo(s.x + dx, s.y + dy); c.stroke();
  }
  // losas que crujen y plataformas móviles
  for (const l of N.losas) {
    if (l.x + l.w < x0 || l.x > x1) continue;
    if (l.tipo === 'movil') {
      c.fillStyle = '#0b2233'; c.fillRect(l.x, l.y, l.w, l.h); c.strokeStyle = '#5ff4ff'; c.lineWidth = 2; c.strokeRect(l.x, l.y, l.w, l.h);
      c.fillStyle = 'rgba(95,244,255,.5)'; for (let i = 8; i < l.w - 8; i += 16) c.fillRect(l.x + i, l.y + 6, 8, 3);
      const pr = c.createLinearGradient(0, l.y + l.h, 0, l.y + l.h + 26); pr.addColorStop(0, 'rgba(95,244,255,.6)'); pr.addColorStop(1, 'rgba(95,244,255,0)');
      c.fillStyle = pr; c.fillRect(l.x + 14, l.y + l.h, 16, 20 + Math.random() * 6); c.fillRect(l.x + l.w - 30, l.y + l.h, 16, 20 + Math.random() * 6);
      continue;
    }
    const tiembla = l.t > 0 && !l.cae ? (Math.random() - 0.5) * 4 * (l.t / 0.5) : 0;
    c.save(); c.translate(tiembla, 0); c.globalAlpha = l.cae ? Math.max(0, l.vuelve - 2) : 1;
    c.fillStyle = '#34242a'; c.beginPath(); c.moveTo(l.x, l.y); for (const [dx, dy] of l.borde) c.lineTo(l.x + dx, l.y + dy);
    c.lineTo(l.x + l.w - 8, l.y + l.h); c.lineTo(l.x + l.w / 2, l.y + l.h + 8); c.lineTo(l.x + 8, l.y + l.h); c.closePath(); c.fill();
    c.strokeStyle = l.t >= 0 ? '#ff8a3d' : 'rgba(255,194,74,.8)'; c.lineWidth = 2; c.beginPath(); c.moveTo(l.x + l.w * 0.3, l.y + 2); c.lineTo(l.x + l.w * 0.45, l.y + 12); c.lineTo(l.x + l.w * 0.4, l.y + l.h); c.stroke();
    c.strokeStyle = 'rgba(95,244,255,.6)'; c.beginPath(); c.moveTo(l.x, l.y); c.lineTo(l.x + l.w, l.y); c.stroke();
    c.restore();
  }
  // la lava: olas y brasas que suben
  const lv = c.createLinearGradient(0, LAVA - 6, 0, LAVA + 120); lv.addColorStop(0, '#ffe08a'); lv.addColorStop(0.08, '#ff9a2e'); lv.addColorStop(0.5, '#e0360f'); lv.addColorStop(1, '#5a0c05');
  c.fillStyle = lv; c.beginPath(); c.moveTo(x0, LAVA + 400);
  for (let x = x0; x <= x1; x += 12) c.lineTo(x, LAVA + Math.sin(x * 0.02 + tt * 2) * 4 + Math.sin(x * 0.051 - tt * 1.3) * 3);
  c.lineTo(x1, LAVA + 400); c.closePath(); c.fill();
  if (brasas.length < 70 && Math.random() < 0.6) brasas.push({ x: x0 + Math.random() * (x1 - x0), y: LAVA, vx: (Math.random() - 0.5) * 20, vy: -40 - Math.random() * 60, vida: 1.5 + Math.random() * 2 });
  for (let i = brasas.length - 1; i >= 0; i--) { const b = brasas[i]; b.vida -= dtReal; if (b.vida <= 0) { brasas.splice(i, 1); continue; } b.x += b.vx * dtReal; b.y += b.vy * dtReal; c.fillStyle = `rgba(255,${140 + (b.vida * 40) | 0},60,${Math.min(1, b.vida)})`; c.fillRect(b.x, b.y, 2.5, 2.5); }
  // balizas
  for (const b of N.balizas) {
    if (b.x < x0 || b.x > x1) continue;
    if (b.ok) { const haz = c.createLinearGradient(0, b.y - 460, 0, b.y - 70); haz.addColorStop(0, 'rgba(95,244,255,0)'); haz.addColorStop(1, 'rgba(95,244,255,.35)'); c.fillStyle = haz; c.fillRect(b.x - 9, b.y - 460, 18, 390); }
    c.fillStyle = '#1b2a36'; c.fillRect(b.x - 14, b.y - 6, 28, 6); c.fillRect(b.x - 3, b.y - 70, 6, 66);
    c.fillStyle = b.ok ? '#5ff4ff' : '#4a5663'; c.beginPath(); c.arc(b.x, b.y - 74, 9, 0, 7); c.fill();
    if (b.ok) { c.strokeStyle = 'rgba(95,244,255,.5)'; c.lineWidth = 2; c.beginPath(); c.arc(b.x, b.y - 74, 14 + Math.sin(tt * 5) * 2, 0, 7); c.stroke(); }
  }
  // la Puerta de la cumbre: el anillo (de la serie) que se enciende al llegar
  if (N.meta && N.meta.x + 120 > x0 && N.meta.x - 120 < x1) {
    const mx = N.meta.x, my = N.meta.y - 92, ok = P && P.fin && J && J.x > N.meta.x - 40;
    const h = c.createRadialGradient(mx, my, 10, mx, my, 70); h.addColorStop(0, ok ? 'rgba(200,255,255,.95)' : 'rgba(95,244,255,.28)'); h.addColorStop(1, ok ? 'rgba(95,244,255,.5)' : 'rgba(95,244,255,.06)');
    c.fillStyle = h; c.beginPath(); c.arc(mx, my, 66, 0, 7); c.fill();
    c.strokeStyle = '#2a3440'; c.lineWidth = 16; c.beginPath(); c.arc(mx, my, 76, 0, 7); c.stroke();
    c.strokeStyle = 'rgba(95,244,255,.8)'; c.lineWidth = 2; c.beginPath(); c.arc(mx, my, 84, 0, 7); c.stroke(); c.beginPath(); c.arc(mx, my, 68, 0, 7); c.stroke();
    for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + i * (Math.PI * 2 / 9) + tt * 0.2; c.fillStyle = ok || Math.sin(tt * 3 + i) > 0.6 ? '#ffc24a' : '#7a5a2a'; c.beginPath(); c.arc(mx + Math.cos(a) * 76, my + Math.sin(a) * 76, 5, 0, 7); c.fill(); }
    c.fillStyle = '#1b2a36'; c.fillRect(mx - 60, N.meta.y - 10, 120, 10);
  }
  // cristales y núcleos
  for (const k of N.cristales) {
    if (k.ok || k.x < x0 || k.x > x1) continue;
    const sx = Math.cos(tt * 3 + k.x * 0.01);
    c.save(); c.translate(k.x, k.y + Math.sin(tt * 2 + k.x) * 2); c.scale(Math.max(0.15, Math.abs(sx)), 1);
    c.fillStyle = sx > 0 ? '#9ffaff' : '#35c9dc'; c.beginPath(); c.moveTo(0, -11); c.lineTo(7, 0); c.lineTo(0, 11); c.lineTo(-7, 0); c.closePath(); c.fill();
    c.strokeStyle = '#e8ffff'; c.lineWidth = 1.2; c.stroke(); c.restore();
  }
  for (const k of N.nucleos) {
    if (k.ok || k.x < x0 || k.x > x1) continue;
    const pul = 1 + Math.sin(tt * 4) * 0.12;
    c.fillStyle = 'rgba(255,194,74,.22)'; c.beginPath(); c.arc(k.x, k.y, 22 * pul, 0, 7); c.fill();
    c.fillStyle = '#ffc24a'; c.beginPath(); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + tt; c[i ? 'lineTo' : 'moveTo'](k.x + Math.cos(a) * 12, k.y + Math.sin(a) * 12); } c.closePath(); c.fill();
    c.fillStyle = '#fff6d8'; c.beginPath(); c.arc(k.x, k.y, 4.5, 0, 7); c.fill();
  }
  // la Estática
  for (const e of N.enemigos) {
    if (e.muerto || e.x + e.w < x0 || e.x > x1) continue;
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
  for (const q of particulas) { c.globalAlpha = Math.max(0, q.vida / q.max); c.fillStyle = q.color; c.fillRect(q.x - 2, q.y - 2, 4, 4); }
  c.globalAlpha = 1;
  c.font = '700 16px Orbitron, sans-serif'; c.textAlign = 'center';
  for (const q of textos) { c.globalAlpha = Math.max(0, q.vida); c.fillStyle = q.color; c.fillText(q.t, q.x, q.y); }
  c.globalAlpha = 1;
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
  const seg = Math.floor(P.t);
  $('h-pts').textContent = puntosAhora().toLocaleString('es-ES');
  $('h-m').textContent = metros().toLocaleString('es-ES');
  $('h-vid').textContent = Math.max(0, P.vidas);
  $('h-t').textContent = `${Math.floor(seg / 60)}:${String(seg % 60).padStart(2, '0')}`;
  $('h-prog').style.width = Math.min(100, (P.maxX - N.inicio) / (N.meta.x - N.inicio) * 100) + '%';
}

// ───────────────────────────────── bucle
function pausar() {
  if (!jugando || !P || P.fin || DES.abierto) return;
  pausa = !pausa; soltar();
  if (pausa) { pantalla(`<h2>Pausa</h2><div class="botones"><button id="b-seg">Seguir</button>${EMBED ? '' : '<a class="boton sec" href="index.html?v=cdadcf2641">Volver a la sala</a>'}</div>`); $('b-seg').onclick = pausar; }
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
  }
  pintar(dt, ahora / 1000); pintarHUD();
}
function empezar() {
  N = generar(); J = nuevoPiloto(); P = nuevaPartida(); particulas.length = 0; textos.length = 0;
  jugando = true; pausa = false; acum = 0; soltar(); window.__t0Partida = performance.now();
  DES.empezar();
  $('h-tramo').textContent = N.tramos[0].n;
  $('hud').classList.remove('oculto'); cerrarPantalla();
  aviso(`1/${N.tramos.length} · ${N.tramos[0].n.toUpperCase()}`, '#5ff4ff', 1.6);
}
function portada() {
  const e = estado(), desafio = MODO === 'desafio';
  pantalla(`<div class="kicker">El simulador de Joran · máquina 5${desafio ? ' · modo desafío' : ''}</div><h2>La conquista de Fôrge</h2>
    <p>Fôrge es el planeta de la forja: roca agrietada, acantilados y ríos de lava. Joran hizo de él su prueba más dura: cruzarlo a saltos, <b>de acantilado en acantilado</b>, hasta la <b>Puerta de la cumbre</b>. La Estática patrulla las rocas: <b>písala</b> desde arriba o esquívala.</p>
    <div class="teclas"><kbd>← →  /  A D</kbd><span>Correr</span><kbd>↑  /  W  /  Espacio</kbd><span>Saltar (mantén para llegar más alto y más lejos)</span><kbd>P</kbd><span>Pausa</span></div>
    <p>Seis tramos, con una <b>baliza</b> al final de cada uno: si caes, vuelves a la última que encendiste. Tienes ${VIDAS} vidas. Suman los metros, los <b>cristales</b> (+${PT.cristal}), los <b>núcleos de forja</b> (+${PT.nucleo}), cada Estática pisada (+${PT.pisoton}) y cada baliza (+${PT.baliza}). Si conquistas la cumbre: +${PT.meta.toLocaleString('es-ES')}, más lo que te sobre de ${PT.limite / 60} minutos y +${PT.vida} por vida.</p>
    ${DES.texto()}
    <p class="pista">Tu récord: <b>${(e.marcas[JUEGO.id] || 0).toLocaleString('es-ES')}</b> · Dibujado por código · el cielo, de la serie STARGATE</p>
    <div class="botones"><button id="b-ya">¡A conquistar!</button><a class="boton sec" href="${urlModo(desafio ? 'arcade' : 'desafio')}">${desafio ? 'Jugar en arcade' : 'Jugar en desafío'}</a>${EMBED ? '' : '<a class="boton sec" href="index.html?v=cdadcf2641">Volver a la sala</a>'}</div>`);
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
  J = nuevoPiloto(); P = null; cam.x = J.x - vw * 0.38; cam.y = LAVA + 70 - vh;
  $('carga').remove(); requestAnimationFrame(bucle); portada();
})().catch((err) => { console.error(err); $('carga').textContent = 'No se pudo cargar: ' + err.message; });
// para probar desde la consola: CON.irA(3) te lleva a la baliza 3 · CON.avanzar(2) simula 2 s (también con la pestaña oculta)
window.CON = { get N() { return N; }, get J() { return J; }, get P() { return P; }, DES, tecla, empezar,
  irA: (n) => { const b = N.balizas[n - 1]; if (b && J) Object.assign(J, { x: b.x, y: b.y - PJ.h, vx: 0, vy: 0 }); },
  dibujar: () => { pintar(1 / 60, performance.now() / 1000); pintarHUD(); },
  avanzar: (seg) => { for (let i = 0; i < seg / PASO && jugando && !DES.abierto; i++) { paso(PASO); DES.tick(PASO); } } };
