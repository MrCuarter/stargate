// RUTA AZUL · máquina 3 de la sala de Joran (borrador).
// El arcade con el que Joran entrenaba a los pilotos del refugio: neón puro, cuatro oleadas de la Estática en formación
// (que se descuelgan en picado) y, al final, RUTA AZUL, el simulador que cobró vida, con sus tres nodos de escudo.
// Arcade puro: dispara solo; tú esquivas. Unos 3 minutos.
import { $, azar, elegir, estado, SON, audio, pantalla, cerrarPantalla, aviso, finDePartida, JUEGOS, EMBED } from './comun.js';

const JUEGO = JUEGOS[2];
const lienzo = $('lienzo'), g = lienzo.getContext('2d');
let W = 0, H = 0, AX = 0, AW = 0, K = 1; // pantalla, arena (columna central) y escala
function ajustar() {
  const r = Math.min(devicePixelRatio, 2); W = innerWidth; H = innerHeight;
  lienzo.width = W * r; lienzo.height = H * r; g.setTransform(r, 0, 0, r, 0, 0);
  AW = Math.min(W, H * 0.72); AX = (W - AW) / 2; K = AW / 520;
}
addEventListener('resize', ajustar); ajustar();
// las imágenes del holograma, con un fundido ovalado: el fondo de la foto no se ve como un rectángulo
const img = (src) => { const i = new Image(); const c = document.createElement('canvas'); c.listo = false;
  i.onload = () => { c.width = i.naturalWidth; c.height = i.naturalHeight; const x = c.getContext('2d'); x.drawImage(i, 0, 0);
    const gr = x.createRadialGradient(c.width / 2, c.height * 0.45, 0, c.width / 2, c.height * 0.45, Math.max(c.width, c.height) * 0.5);
    gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.62, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    x.globalCompositeOperation = 'destination-in'; x.fillStyle = gr; x.fillRect(0, 0, c.width, c.height); c.listo = true; };
  i.src = src; return c; };
const IMG = { rival: img('img/rival.jpg'), ataque: img('img/rival_ataque.jpg'), danado: img('img/rival_danado.jpg'), derrotado: img('img/rival_derrotado.jpg') };

// ───────────────────────────────── estado
let S = null;
const estrellas = Array.from({ length: 140 }, () => ({ x: Math.random(), y: Math.random(), v: azar(0.03, 0.18), r: azar(0.5, 1.8) }));
function nueva() {
  return { t: 0, puntos: 0, vidas: 3, bombas: 3, nivel: 1, x: 0.5, y: 0.86, inv: 2, escudo: false, cad: 0, balas: [], enemigas: [], enemigos: [], premios: [], chispas: [],
    ola: 0, entreOlas: 2.5, jefe: null, fin: false, cadena: 0, ultimaMuerte: -9, derribos: 0, t0: performance.now() };
}
// oleadas: cuántos de cada tipo (cubo: cae de un golpe · ojo: dispara · rayo: se lanza en picado)
const OLAS = [
  { cubo: 10 }, { cubo: 7, ojo: 5 }, { cubo: 6, ojo: 4, rayo: 4 }, { cubo: 6, ojo: 6, rayo: 6 },
];
const PUNTOS = { cubo: 100, ojo: 150, rayo: 200 };

// ───────────────────────────────── controles
const tecla = {}; let puntero = null;
addEventListener('keydown', (e) => { tecla[e.code] = true; if (e.code === 'Space') { bomba(); e.preventDefault(); } if (e.code === 'KeyP' || e.code === 'Escape') pausar(); });
addEventListener('keyup', (e) => { tecla[e.code] = false; });
lienzo.addEventListener('pointerdown', (e) => { audio(); puntero = { x: e.clientX, y: e.clientY }; });
lienzo.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' || puntero) puntero = { x: e.clientX, y: e.clientY }; });
addEventListener('pointerup', (e) => { if (e.pointerType !== 'mouse') puntero = null; });
$('b-bomba').addEventListener('pointerdown', (e) => { e.stopPropagation(); bomba(); });

// ── coordenadas: todo el juego vive en 0..1 dentro de la arena
const px = (x) => AX + x * AW, py = (y) => y * H;

function lanzarOla() {
  const o = OLAS[S.ola], tipos = []; for (const [k, n] of Object.entries(o)) for (let i = 0; i < n; i++) tipos.push(k);
  const cols = 6, filas = Math.ceil(tipos.length / cols);
  tipos.sort(() => Math.random() - 0.5).forEach((tipo, i) => {
    const c = i % cols, f = Math.floor(i / cols);
    const slot = { x: 0.14 + c * (0.72 / (cols - 1)), y: 0.12 + f * 0.08 };
    const lado = i % 2 ? 1 : -1;
    S.enemigos.push({ tipo, hp: tipo === 'ojo' ? 2 : 1, x: lado > 0 ? 1.1 : -0.1, y: 0.35 + Math.random() * 0.1, slot, fase: 'entra', t: -i * 0.18, curva: [lado > 0 ? 1.1 : -0.1, 0.35, 0.5 + lado * 0.4, -0.05], disparo: azar(1.5, 4), osc: Math.random() * 6 });
  });
  aviso(`OLEADA ${S.ola + 1}`, '#5ff4ff', 1.2);
}
function lanzarJefe() {
  S.jefe = { x: 0.5, y: -0.25, hp: 70, max: 70, nodos: [0, 1, 2].map((i) => ({ a: i * 2.094, hp: 14, vivo: true })), t: 0, ataque: 0, patron: 0, golpe: 0, muriendo: null };
  $('jefe').classList.remove('oculto'); SON.alarma(); aviso('¡RUTA AZUL!', '#5ff4ff', 1.8);
}
function bomba() {
  if (!S || S.fin || S.bombas <= 0) return; S.bombas--; SON.pulso();
  S.enemigas = []; S.chispas.push({ aro: true, x: S.x, y: S.y, r: 0, vida: 0.7 });
  for (const e of S.enemigos) { e.hp -= 3; if (e.hp <= 0) matar(e); }
  if (S.jefe && !S.jefe.muriendo) for (const n of S.jefe.nodos) if (n.vivo) { n.hp -= 4; if (n.hp <= 0) romperNodo(n); }
  lienzo.style.filter = 'brightness(2)'; setTimeout(() => (lienzo.style.filter = ''), 120);
}
function estallar(x, y, color, n = 16, v = 0.5) { for (let i = 0; i < n; i++) { const a = Math.random() * 7, s = azar(0.1, 1) * v; S.chispas.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, vida: azar(0.4, 0.8), color }); } }
function matar(e) {
  const i = S.enemigos.indexOf(e); if (i < 0) return; S.enemigos.splice(i, 1);
  S.cadena = S.t - S.ultimaMuerte < 1 ? S.cadena + 1 : 1; S.ultimaMuerte = S.t;
  const pts = PUNTOS[e.tipo] * (e.fase === 'picado' ? 2 : 1) * Math.min(4, S.cadena); S.puntos += pts; S.derribos++;
  estallar(e.x, e.y, e.tipo === 'rayo' ? '#ffe14a' : e.tipo === 'ojo' ? '#ff4dd8' : '#b15cff', 18); SON.boom();
  if (S.cadena >= 3) aviso(`CADENA ×${Math.min(4, S.cadena)}`, '#5dffa0', 0.6);
  if (Math.random() < 0.12) S.premios.push({ x: e.x, y: e.y, tipo: elegir(['P', 'P', 'S', 'B']) });
}
function romperNodo(n) { n.vivo = false; estallar(S.jefe.x + Math.cos(n.a) * 0.2, S.jefe.y + Math.sin(n.a) * 0.12, '#5ff4ff', 30, 0.7); SON.boom(); S.puntos += 500; aviso('¡NODO ROTO!', '#5ff4ff', 0.8); }
function perderVida() {
  if (S.inv > 0) return;
  if (S.escudo) { S.escudo = false; S.inv = 1; SON.golpe(); aviso('ESCUDO ROTO', '#5ff4ff', 0.8); return; }
  S.vidas--; S.nivel = Math.max(1, S.nivel - 1); SON.caida(); estallar(S.x, S.y, '#5ff4ff', 40, 0.8);
  if (S.vidas <= 0) { acabar(false, 'La Estática te ha derribado.'); return; }
  S.inv = 2.5; S.enemigas = []; aviso(`QUEDAN ${S.vidas}`, '#ff4dd8', 1);
}

function tick(dt) {
  if (!S) return;
  S.t += dt;
  for (const s of estrellas) { s.y += s.v * dt * (S.jefe ? 1.8 : 1); if (s.y > 1) { s.y = 0; s.x = Math.random(); } }
  if (S.fin) { for (const c of S.chispas) { c.x += (c.vx || 0) * dt; c.y += (c.vy || 0) * dt; c.vida -= dt; } S.chispas = S.chispas.filter((c) => c.vida > 0); return; }
  // tope de tiempo: nadie pasa de 3 minutos y medio
  if (S.t > 210) { acabar(false, 'RUTA AZUL se ha replegado: se acabó el tiempo.'); return; }
  // la nave
  let dx = 0, dy = 0;
  if (tecla.ArrowLeft || tecla.KeyA) dx -= 1; if (tecla.ArrowRight || tecla.KeyD) dx += 1; if (tecla.ArrowUp || tecla.KeyW) dy -= 1; if (tecla.ArrowDown || tecla.KeyS) dy += 1;
  if (dx || dy) { S.x += dx * 0.9 * dt; S.y += dy * 0.6 * dt; puntero = null; }
  else if (puntero) { const tx = (puntero.x - AX) / AW, ty = puntero.y / H - 0.06; S.x += (tx - S.x) * Math.min(1, dt * 12); S.y += (ty - S.y) * Math.min(1, dt * 12); }
  S.x = Math.max(0.04, Math.min(0.96, S.x)); S.y = Math.max(0.5, Math.min(0.94, S.y));
  S.inv = Math.max(0, S.inv - dt);
  // disparo automático (sube de nivel con las P)
  S.cad -= dt;
  if (S.cad <= 0) {
    S.cad = 0.13; SON.laser();
    const disp = S.nivel === 1 ? [0] : S.nivel === 2 ? [-0.018, 0.018] : [-0.03, 0, 0.03];
    for (const o of disp) S.balas.push({ x: S.x + o, y: S.y - 0.03, vx: S.nivel === 3 ? o * 3 : 0 });
  }
  for (const b of S.balas) { b.y -= 1.5 * dt; b.x += b.vx * dt; }
  S.balas = S.balas.filter((b) => b.y > -0.05);
  // oleadas
  if (!S.enemigos.length && !S.jefe) {
    S.entreOlas -= dt;
    if (S.entreOlas <= 0) { if (S.ola < OLAS.length) { lanzarOla(); S.ola++; S.entreOlas = 2.2; } else lanzarJefe(); }
  }
  // enemigos: entran en curva, esperan en formación y algunos se lanzan en picado
  for (const e of S.enemigos.slice()) {
    e.t += dt; e.osc += dt;
    if (e.fase === 'entra') {
      if (e.t < 0) continue;
      const u = Math.min(1, e.t / 1.6), [x0, y0, cx, cy] = e.curva, x1 = e.slot.x, y1 = e.slot.y;
      e.x = (1 - u) ** 2 * x0 + 2 * (1 - u) * u * cx + u * u * x1; e.y = (1 - u) ** 2 * y0 + 2 * (1 - u) * u * cy + u * u * y1;
      if (u >= 1) e.fase = 'forma';
    } else if (e.fase === 'forma') {
      e.x = e.slot.x + Math.sin(S.t * 1.2) * 0.04; e.y = e.slot.y + Math.sin(e.osc * 2) * 0.008;
      if ((e.tipo === 'rayo' && Math.random() < dt * 0.35) || Math.random() < dt * 0.04 * S.ola) { e.fase = 'picado'; e.vx = (S.x - e.x) * 0.7; e.vy = 0.55; SON.alarma(); }
    } else if (e.fase === 'picado') {
      e.x += e.vx * dt + Math.sin(e.t * 8) * (e.tipo === 'rayo' ? 0.6 : 0.1) * dt; e.y += e.vy * dt; e.vy += 0.2 * dt;
      if (e.y > 1.05) { e.fase = 'entra'; e.t = 0; e.curva = [e.x, -0.1, e.slot.x, -0.05]; }
    }
    if (e.tipo === 'ojo' && e.fase !== 'entra') { e.disparo -= dt; if (e.disparo <= 0) { e.disparo = azar(2, 3.6); const a = Math.atan2(S.y - e.y, S.x - e.x); S.enemigas.push({ x: e.x, y: e.y, vx: Math.cos(a) * 0.32, vy: Math.sin(a) * 0.45 }); } }
    // choques
    for (const b of S.balas) if (Math.abs(b.x - e.x) < 0.035 && Math.abs(b.y - e.y) < 0.025) { b.y = -1; e.hp--; if (e.hp <= 0) { matar(e); break; } else estallar(e.x, e.y, '#fff', 4, 0.2); }
    if (S.enemigos.includes(e) && Math.abs(S.x - e.x) < 0.04 && Math.abs(S.y - e.y) < 0.03) { perderVida(); matar(e); }
  }
  // el jefe
  const J = S.jefe;
  if (J) {
    J.t += dt; J.golpe = Math.max(0, J.golpe - dt);
    if (J.muriendo != null) {
      J.muriendo += dt; if (Math.random() < 0.4) estallar(J.x + azar(-0.15, 0.15), J.y + azar(-0.1, 0.1), elegir(['#5ff4ff', '#ff4dd8', '#fff']), 14, 0.6);
      if (J.muriendo > 2.6) { S.puntos += 5000 + S.vidas * 1000; acabar(true, `RUTA AZUL vuelve a ser solo un simulador. <b>+5.000</b> y <b>+${(S.vidas * 1000).toLocaleString('es-ES')}</b> por las vidas.`); }
    } else {
      J.y += (0.27 - J.y) * Math.min(1, dt * 1.5); J.x = 0.5 + Math.sin(J.t * 0.6) * 0.25;
      for (const n of J.nodos) n.a += dt * 1.4;
      // ataques: espiral, abanico y ráfaga dirigida
      J.ataque -= dt;
      if (J.ataque <= 0 && J.y > 0.15) {
        const fase2 = J.nodos.every((n) => !n.vivo);
        J.patron = (J.patron + 1) % 3;
        if (J.patron === 0) { for (let i = 0; i < 14; i++) { const a = i / 14 * 6.283 + J.t; S.enemigas.push({ x: J.x, y: J.y, vx: Math.cos(a) * 0.22, vy: Math.sin(a) * 0.3 + 0.12 }); } J.ataque = fase2 ? 1.0 : 1.5; }
        else if (J.patron === 1) { for (let i = -3; i <= 3; i++) { const a = Math.atan2(S.y - J.y, S.x - J.x) + i * 0.16; S.enemigas.push({ x: J.x, y: J.y + 0.05, vx: Math.cos(a) * 0.38, vy: Math.sin(a) * 0.5 }); } J.ataque = fase2 ? 0.9 : 1.3; }
        else { let k = 0; const r = () => { if (!S.jefe || S.fin || k++ > 5) return; const a = Math.atan2(S.y - J.y, S.x - J.x); S.enemigas.push({ x: J.x, y: J.y + 0.05, vx: Math.cos(a) * 0.5, vy: Math.sin(a) * 0.7 }); setTimeout(r, 110); }; r(); J.ataque = fase2 ? 1.1 : 1.6; }
        SON.alarma();
      }
      for (const b of S.balas) {
        for (const n of J.nodos) { if (!n.vivo) continue; const nx = J.x + Math.cos(n.a) * 0.2, ny = J.y + Math.sin(n.a) * 0.12; if (Math.abs(b.x - nx) < 0.035 && Math.abs(b.y - ny) < 0.03) { b.y = -1; n.hp--; estallar(nx, ny, '#5ff4ff', 3, 0.2); if (n.hp <= 0) romperNodo(n); } }
        if (b.y > 0 && Math.abs(b.x - J.x) < 0.1 && Math.abs(b.y - J.y) < 0.08) {
          b.y = -1;
          if (J.nodos.some((n) => n.vivo)) { estallar(b.x, J.y + 0.08, '#5ff4ff', 2, 0.15); } // blindado mientras queden nodos
          else { J.hp--; J.golpe = 0.12; S.puntos += 20; if (J.hp <= 0) { J.muriendo = 0; S.enemigas = []; SON.caida(); aviso('¡RUTA AZUL CAE!', '#5dffa0', 2); } }
        }
      }
      $('h-jefe').style.width = (J.nodos.filter((n) => n.vivo).length ? 100 : J.hp / J.max * 100) + '%';
    }
  }
  // balas enemigas
  for (const b of S.enemigas) { b.x += b.vx * dt; b.y += b.vy * dt; if (Math.abs(b.x - S.x) < 0.018 && Math.abs(b.y - S.y) < 0.018) { b.y = 9; perderVida(); } }
  S.enemigas = S.enemigas.filter((b) => b.y < 1.05 && b.y > -0.1 && b.x > -0.1 && b.x < 1.1);
  // premios
  for (const p of S.premios) { p.y += 0.25 * dt; if (Math.abs(p.x - S.x) < 0.05 && Math.abs(p.y - S.y) < 0.04) { p.y = 9; SON.bien();
    if (p.tipo === 'P') { S.nivel = Math.min(3, S.nivel + 1); aviso('¡MÁS POTENCIA!', '#ffe14a', 0.8); } else if (p.tipo === 'S') { S.escudo = true; aviso('¡ESCUDO!', '#5ff4ff', 0.8); } else { S.bombas++; aviso('+1 BOMBA', '#ff4dd8', 0.8); } } }
  S.premios = S.premios.filter((p) => p.y < 1.05);
  for (const c of S.chispas) { if (c.aro) { c.r += dt * 1.6; } else { c.x += c.vx * dt; c.y += c.vy * dt; } c.vida -= dt; }
  S.chispas = S.chispas.filter((c) => c.vida > 0);
  $('h-pts').textContent = Math.round(S.puntos).toLocaleString('es-ES');
  $('h-ola').textContent = S.jefe ? 'JEFE' : `${Math.max(1, S.ola)}/${OLAS.length}`;
  $('h-vid').innerHTML = [0, 1, 2].map((i) => `<i class="${i < S.vidas ? '' : 'no'}"></i>`).join('');
  $('h-bom').textContent = S.bombas;
  $('extra').textContent = `Potencia ${S.nivel}/3${S.escudo ? ' · escudo' : ''}`;
}

// ───────────────────────────────── dibujo (neón: todo con brillo)
function neon(color, blur = 12) { g.shadowColor = color; g.shadowBlur = blur; g.strokeStyle = color; g.fillStyle = color; }
function dibujar() {
  g.globalCompositeOperation = 'source-over'; g.shadowBlur = 0;
  g.fillStyle = '#01040c'; g.fillRect(0, 0, W, H);
  // la rejilla de fondo que avanza
  const off = ((S ? S.t : performance.now() / 1000) * 60) % 40;
  g.strokeStyle = 'rgba(95,244,255,.07)'; g.lineWidth = 1;
  for (let y = off - 40; y < H; y += 40) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  for (let x = AX % 40; x < W; x += 40) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
  for (const s of estrellas) { g.fillStyle = `rgba(200,240,255,${0.3 + s.v * 3})`; g.fillRect(px(s.x), py(s.y), s.r, s.r * (1 + s.v * 8)); }
  // bordes de la arena
  neon('rgba(95,244,255,.6)', 16); g.lineWidth = 2; g.strokeRect(AX + 1, -2, AW - 2, H + 4);
  if (!S) return;
  // el jefe
  const J = S.jefe;
  if (J) {
    const cx = px(J.x), cy = py(J.y), r = 95 * K;
    const im = J.muriendo != null ? IMG.derrotado : J.golpe > 0 ? IMG.danado : J.ataque < 0.3 ? IMG.ataque : IMG.rival;
    if (im.listo) {
      g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = J.muriendo != null ? Math.max(0, 1 - J.muriendo / 2.6) : 1;
      if (Math.random() < 0.06) g.translate(azar(-8, 8), 0);
      const h = r * 2.3, w = h * im.width / im.height; g.drawImage(im, cx - w / 2, cy - h * 0.55, w, h); g.restore();
    }
    for (const n of J.nodos) { if (!n.vivo) continue; const nx = px(J.x + Math.cos(n.a) * 0.2), ny = py(J.y + Math.sin(n.a) * 0.12); neon('#5ff4ff', 20); g.lineWidth = 3; g.beginPath(); g.arc(nx, ny, 14 * K, 0, 7); g.stroke(); g.beginPath(); g.arc(nx, ny, 6 * K * (n.hp / 14 + 0.3), 0, 7); g.fill(); }
    if (J.nodos.some((n) => n.vivo) && J.muriendo == null) { neon('rgba(95,244,255,.5)', 20); g.lineWidth = 2; g.beginPath(); g.ellipse(cx, cy, r * 1.05, r * 0.9, 0, 0, 7); g.stroke(); }
  }
  // enemigos
  for (const e of S.enemigos) {
    const x = px(e.x), y = py(e.y), s = 15 * K;
    if (e.tipo === 'cubo') { neon('#b15cff'); g.lineWidth = 2.5; g.save(); g.translate(x, y); g.rotate(Math.sin(e.osc * 3) * 0.3); g.strokeRect(-s, -s, s * 2, s * 2); g.fillRect(-s * 0.35, -s * 0.35, s * 0.7, s * 0.7); g.restore(); }
    else if (e.tipo === 'ojo') { neon('#ff4dd8'); g.lineWidth = 2.5; g.beginPath(); g.arc(x, y, s * 1.1, 0, 7); g.stroke(); const a = Math.atan2(S.y - e.y, S.x - e.x); g.beginPath(); g.arc(x + Math.cos(a) * s * 0.45, y + Math.sin(a) * s * 0.45, s * 0.4, 0, 7); g.fill(); if (e.hp < 2) { g.globalAlpha = 0.5; } g.globalAlpha = 1; }
    else { neon('#ffe14a'); g.lineWidth = 3; g.beginPath(); g.moveTo(x - s, y - s); g.lineTo(x + s * 0.2, y - s * 0.1); g.lineTo(x - s * 0.2, y + s * 0.1); g.lineTo(x + s, y + s); g.stroke(); }
  }
  // balas
  neon('#5dffa0', 10); for (const b of S.balas) g.fillRect(px(b.x) - 2, py(b.y) - 9 * K, 4, 18 * K);
  neon('#ff2e55', 14); for (const b of S.enemigas) { g.beginPath(); g.arc(px(b.x), py(b.y), 5 * K, 0, 7); g.fill(); }
  // premios
  for (const p of S.premios) { const c = p.tipo === 'P' ? '#ffe14a' : p.tipo === 'S' ? '#5ff4ff' : '#ff4dd8'; neon(c, 16); g.lineWidth = 2; g.strokeRect(px(p.x) - 13 * K, py(p.y) - 13 * K, 26 * K, 26 * K); g.shadowBlur = 0; g.font = `800 ${16 * K}px Orbitron`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(p.tipo, px(p.x), py(p.y) + 1); }
  // la nave
  if (!(S.fin && S.vidas <= 0) && (S.inv <= 0 || Math.floor(S.t * 12) % 2 === 0)) {
    const x = px(S.x), y = py(S.y), s = 20 * K;
    neon('#5ff4ff', 18); g.lineWidth = 3;
    g.beginPath(); g.moveTo(x, y - s * 1.2); g.lineTo(x + s, y + s * 0.8); g.lineTo(x + s * 0.3, y + s * 0.4); g.lineTo(x, y + s * 0.8); g.lineTo(x - s * 0.3, y + s * 0.4); g.lineTo(x - s, y + s * 0.8); g.closePath(); g.stroke();
    neon('#ffc24a', 20); g.beginPath(); g.arc(x, y + s * 0.95, (3 + Math.random() * 3) * K, 0, 7); g.fill();
    if (S.escudo) { neon('rgba(95,244,255,.7)', 20); g.lineWidth = 2; g.beginPath(); g.arc(x, y, s * 1.6, 0, 7); g.stroke(); }
  }
  for (const c of S.chispas) {
    if (c.aro) { neon('rgba(255,77,216,.8)', 30); g.lineWidth = 6; g.globalAlpha = c.vida / 0.7; g.beginPath(); g.arc(px(c.x), py(c.y), c.r * H, 0, 7); g.stroke(); g.globalAlpha = 1; continue; }
    neon(c.color, 8); g.globalAlpha = Math.max(0, c.vida / 0.8); g.fillRect(px(c.x) - 1.5, py(c.y) - 1.5, 3, 3); g.globalAlpha = 1;
  }
  g.shadowBlur = 0;
}

function acabar(gana, motivo) {
  if (S.fin) return; S.fin = true;
  if (gana) SON.bien();
  setTimeout(() => {
    $('hud').classList.add('oculto');
    const seg = Math.round((performance.now() - S.t0) / 1000);
    finDePartida({ juego: JUEGO.id, titulo: gana ? '¡Has vencido a RUTA AZUL!' : 'Fin de la partida', puntos: S.puntos, texto: motivo,
      filas: [['Oleada', S.jefe ? 'Jefe' : `${S.ola}/${OLAS.length}`], ['Derribos', S.derribos], ['Vidas', S.vidas], ['Tiempo', `${Math.floor(seg / 60)}:${String(seg % 60).padStart(2, '0')}`]],
      alRepetir: empezar });
  }, gana ? 800 : 1300);
}
let pausa = false;
function pausar() {
  if (!S || S.fin) return; pausa = !pausa;
  if (pausa) { pantalla(`<h2>Pausa</h2><div class="botones"><button id="b-seg">Seguir</button>${EMBED ? '' : '<a class="boton sec" href="index.html">Volver a la sala</a>'}</div>`); $('b-seg').onclick = pausar; }
  else cerrarPantalla();
}
document.addEventListener('visibilitychange', () => { if (document.hidden && S && !S.fin && !pausa && !window.__sinPausa) pausar(); });
function empezar() { S = nueva(); pausa = false; window.__t0Partida = performance.now(); $('hud').classList.remove('oculto'); $('jefe').classList.add('oculto'); cerrarPantalla(); $('b-bomba').classList.toggle('oculto', !matchMedia('(pointer: coarse)').matches); }
function portada() {
  const e = estado();
  pantalla(`<div class="kicker">El simulador de Joran · máquina 3</div><h2>RUTA AZUL</h2>
    <p>El arcade con el que Joran entrenaba a los pilotos del refugio. Cuatro oleadas de la Estática en formación, que se descuelgan en picado… y al final, <b>RUTA AZUL</b>: rompe sus <b>tres nodos de escudo</b> y después dale en el núcleo.</p>
    <div class="teclas"><kbd>Ratón / dedo / flechas</kbd><span>Mover la nave (dispara sola)</span><kbd>Espacio</kbd><span>Bomba: borra las balas y daña a todos (tienes 3)</span></div>
    <p>Premios: <b style="color:#ffe14a">P</b> más potencia · <b style="color:#5ff4ff">S</b> escudo · <b style="color:#ff4dd8">B</b> bomba. Derribar seguidos multiplica; los que vienen en picado valen el doble.</p>
    <p class="pista">Tu récord: <b>${(e.marcas['ruta-azul'] || 0).toLocaleString('es-ES')}</b></p>
    <div class="botones"><button id="b-ya">¡Insertar ficha!</button>${EMBED ? '' : '<a class="boton sec" href="index.html">Volver a la sala</a>'}</div>`);
  $('b-ya').onclick = () => { audio(); empezar(); };
}
let antes = performance.now();
function bucle(ahora) { requestAnimationFrame(bucle); const dt = Math.min(0.05, (ahora - antes) / 1000); antes = ahora; if (!pausa) tick(dt); dibujar(); }
requestAnimationFrame(bucle); portada();
window.RA = { get S() { return S; }, empezar, lanzarJefe };
