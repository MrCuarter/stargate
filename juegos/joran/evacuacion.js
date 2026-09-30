// LA EVACUACIÓN · el primer juego de la sala de Joran (borrador).
// El simulacro que Joran convirtió en juego: correr por los pasillos de la Cero, de carril en carril, saltando vallas,
// agachándose bajo las vigas y esquivando los bloques, con la Estática pegada a la espalda. A los 3 minutos llega la
// cápsula de evacuación: si la alcanzas, te has salvado.
// Arcade o DESAFÍO (desafio.js, ?modo=desafio): en el desafío se te acaba el aliento y solo lo recuperas acertando.
import { THREE, $, azar, elegir, QS, estado, SON, audio, holo, personaje, objeto, cargar, medir, texBrillo, pantalla, cerrarPantalla, aviso, finDePartida, JUEGOS, EMBED } from './comun.js?v=961c239091';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import { crearDesafio, MODO, urlModo } from './desafio.js?v=961c239091';

const V3 = THREE.Vector3;
const CARRILES = [-2.4, 0, 2.4];
const DURACION = 180;            // segundos hasta la cápsula
// 27-sep (Norberto superó el oro a la primera): más velocidad al final, tramos más juntos y la Estática tarda más en
// soltarte tras un tropiezo. Así, llegar a la cápsula ya es una marca y el oro pide una carrera limpia.
const V0 = 15, VMAX = 36;        // m/s al empezar y al final (se llega al tope a los 150 s)
const RESPIRO = 8;               // s que tarda la Estática en soltarte tras un tropiezo (otro tropiezo antes: atrapado)
const SEG = 24, NSEG = 7;        // tramos del pasillo que se reciclan
const JUEGO = JUEGOS[0];

// ───────────────────────────────── escena
const lienzo = $('lienzo');
const render = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true });
render.setPixelRatio(Math.min(devicePixelRatio, 2));
render.outputColorSpace = THREE.SRGBColorSpace;
render.toneMapping = THREE.ACESFilmicToneMapping;
const escena = new THREE.Scene();
escena.background = new THREE.Color(0x01040c);
escena.fog = new THREE.Fog(0x01040c, 25, 135);
const camara = new THREE.PerspectiveCamera(65, 1, 0.1, 400);
escena.add(new THREE.HemisphereLight(0x9fe8ff, 0x140820, 1.1));
const luz = new THREE.DirectionalLight(0xffffff, 1.6); luz.position.set(2, 8, 6); escena.add(luz);
function ajustar() { render.setSize(innerWidth, innerHeight, false); camara.aspect = innerWidth / innerHeight; camara.fov = camara.aspect < 0.8 ? 80 : 65; camara.updateProjectionMatrix(); }
addEventListener('resize', ajustar); ajustar();

// ── texturas dibujadas (holograma: rejilla cian sobre azul noche)
function lienzoTex(w, h, pintar, rep) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; pintar(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); }
  return t;
}
const texSuelo = lienzoTex(256, 256, (x, w, h) => {
  x.fillStyle = '#020b18'; x.fillRect(0, 0, w, h);
  x.strokeStyle = 'rgba(95,244,255,.35)'; x.lineWidth = 2;
  for (let i = 0; i <= w; i += 32) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, h); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(w, i); x.stroke(); }
  x.strokeStyle = 'rgba(95,244,255,.9)'; x.lineWidth = 4; x.strokeRect(2, 2, w - 4, h - 4);
}, [3, 3]);
const texPared = lienzoTex(512, 256, (x, w, h) => {
  x.fillStyle = '#030d1c'; x.fillRect(0, 0, w, h);
  for (let i = 0; i < 8; i++) { x.fillStyle = `rgba(95,244,255,${0.15 + Math.random() * 0.25})`; x.fillRect(20 + i * 62, 40, 36, 150); }
  x.fillStyle = 'rgba(255,194,74,.8)'; for (let i = 0; i < 14; i++) x.fillRect(Math.random() * w, 210 + Math.random() * 30, 6, 6);
  x.strokeStyle = 'rgba(95,244,255,.8)'; x.lineWidth = 3; x.beginPath(); x.moveTo(0, 20); x.lineTo(w, 20); x.moveTo(0, 236); x.lineTo(w, 236); x.stroke();
}, [2, 1]);
const texRayas = lienzoTex(256, 64, (x, w, h) => { x.fillStyle = '#2a0018'; x.fillRect(0, 0, w, h); x.fillStyle = '#ff4dd8'; for (let i = -64; i < w; i += 40) { x.beginPath(); x.moveTo(i, h); x.lineTo(i + 20, h); x.lineTo(i + 20 + h, 0); x.lineTo(i + h, 0); x.fill(); } });
const matSuelo = new THREE.MeshStandardMaterial({ map: texSuelo, emissive: 0xffffff, emissiveMap: texSuelo, emissiveIntensity: 0.9, roughness: 0.5, metalness: 0.2 });
const matPared = new THREE.MeshStandardMaterial({ map: texPared, emissive: 0xffffff, emissiveMap: texPared, emissiveIntensity: 0.8, roughness: 0.7, side: THREE.DoubleSide });
const matArco = new THREE.MeshStandardMaterial({ color: 0x06202c, emissive: 0x2fd8f0, emissiveIntensity: 0.55, metalness: 0.4, roughness: 0.5 });
const matLinea = new THREE.MeshBasicMaterial({ color: 0x5ff4ff, transparent: true, opacity: 0.5 });
const matEst = new THREE.MeshStandardMaterial({ color: 0x2a0020, emissive: 0xff2ea6, emissiveIntensity: 1.1, roughness: 0.4 });
const matViga = new THREE.MeshStandardMaterial({ map: texRayas, emissive: 0xffffff, emissiveMap: texRayas, emissiveIntensity: 0.9 });

// ── el pasillo: tramos que se reciclan
const tramos = [];
function tramo() {
  const g = new THREE.Group();
  const s = new THREE.Mesh(new THREE.PlaneGeometry(8.4, SEG), matSuelo); s.rotation.x = -Math.PI / 2; s.position.z = -SEG / 2; g.add(s);
  for (const lado of [-1, 1]) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(SEG, 5.2), matPared); p.rotation.y = lado * Math.PI / 2; p.position.set(lado * 4.2, 2.6, -SEG / 2); g.add(p);
    const pilar = new THREE.Mesh(new THREE.BoxGeometry(0.22, 5.4, 0.22), matArco); pilar.position.set(lado * 4.05, 2.7, 0); g.add(pilar);
  }
  const techo = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.2, 0.22), matArco); techo.position.set(0, 5.35, 0); g.add(techo);
  for (const x of [-1.2, 1.2]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.02, SEG), matLinea); l.position.set(x, 0.02, -SEG / 2); g.add(l); }
  escena.add(g); return g;
}
for (let i = 0; i < NSEG; i++) { const t = tramo(); t.position.z = -i * SEG + SEG; tramos.push(t); }

// ── la Estática que te persigue: un velo de ruido que se acerca cuando tropiezas
const ruidoC = document.createElement('canvas'); ruidoC.width = 128; ruidoC.height = 64;
const ruidoX = ruidoC.getContext('2d'), texRuido = new THREE.CanvasTexture(ruidoC);
function pintarRuido() {
  const d = ruidoX.createImageData(128, 64);
  for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255, m = Math.random() < 0.5; d.data[i] = m ? 255 : v * 0.6; d.data[i + 1] = v * 0.25; d.data[i + 2] = m ? 216 : v; d.data[i + 3] = 150 + Math.random() * 105; }
  ruidoX.putImageData(d, 0, 0);
  for (let k = 0; k < 6; k++) { ruidoX.fillStyle = `rgba(95,244,255,${Math.random() * 0.5})`; ruidoX.fillRect(0, Math.random() * 64, 128, 1 + Math.random() * 3); }
  texRuido.needsUpdate = true;
}
const velo = new THREE.Mesh(new THREE.PlaneGeometry(11, 2.4), new THREE.MeshBasicMaterial({ map: texRuido, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending, depthWrite: false }));
velo.position.set(0, 0.9, 4.2); escena.add(velo);

// ───────────────────────────────── estado de la partida
let P = null;               // la partida
let jugador = null;         // { obj, poner, mezcla }
const cosas = [];           // obstáculos y premios
const chispasFx = [];
const modelos = {};

function nuevaPartida() {
  return { t: 0, v: V0, metros: 0, chispas: 0, llaves: 0, puntos: 0, carril: 1, x: 0, y: 0, vy: 0, agachado: 0, peligro: 0, tropiezos: 0,
    turbo: 0, iman: 0, siguiente: 18, sigPremio: 22, fin: false, cuenta: 3, capsula: null, vivo: true, racha: 0 };
}

// ── obstáculos y premios
function caja(w, h, d, mat) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); }
function brillo(color, esc = 2) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: texBrillo, color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); s.scale.setScalar(esc); return s; }
function poner(tipo, carril, z, y = 0) {
  let obj; const x = CARRILES[carril];
  if (tipo === 'valla') { obj = new THREE.Group(); const b = caja(2.1, 0.75, 0.3, matEst); b.position.y = 0.45; obj.add(b); const r = caja(2.1, 0.12, 0.32, matViga); r.position.y = 0.8; obj.add(r); }
  else if (tipo === 'viga') { obj = new THREE.Group(); const b = caja(2.2, 0.55, 0.5, matViga); b.position.y = 1.65; obj.add(b); for (const s of [-1, 1]) { const p = caja(0.12, 1.4, 0.12, matEst); p.position.set(s * 1.05, 0.7, 0); obj.add(p); } }
  else if (tipo === 'bloque') { obj = modelos.caja.clone(); obj.scale.setScalar(2.2); obj.position.y = 1.1; const g = new THREE.Group(); g.add(obj); const h = brillo(0xff2ea6, 3.5); h.position.set(0, 1.2, 0.8); g.add(h); obj = g; }
  else if (tipo === 'dron') { const d = modelos.dronFab(); obj = d.obj; obj.userData.d = d; }
  else if (tipo === 'chispa') { obj = brillo(0x5ff4ff, 0.9); const n = new THREE.Mesh(new THREE.OctahedronGeometry(0.18), new THREE.MeshBasicMaterial({ color: 0xe8ffff })); obj = new THREE.Group().add(obj, n); }
  else if (tipo === 'llave') { obj = modelos.llave.clone(); obj.add(brillo(0xffc24a, 2.4)); }
  else if (tipo === 'rayo') { obj = modelos.rayo.clone(); obj.add(brillo(0xffe14a, 2.6)); }
  else if (tipo === 'iman') { obj = modelos.esfera.clone(); obj.add(brillo(0x5dffa0, 2.6)); }
  obj.position.set(x, y + (tipo === 'chispa' ? 0.9 : tipo === 'llave' || tipo === 'rayo' || tipo === 'iman' ? 1.1 : 0), z);
  escena.add(obj);
  const c = { tipo, carril, obj, premio: /chispa|llave|rayo|iman/.test(tipo), baseY: obj.position.y, fase: Math.random() * 6 };
  if (tipo === 'dron') { c.baseY = 1.05; obj.position.y = 1.05; c.vaA = carril; c.cambio = azar(0.8, 1.6); }
  cosas.push(c); return c;
}
function quitar(c) { const i = cosas.indexOf(c); if (i >= 0) cosas.splice(i, 1); escena.remove(c.obj); if (c.obj.userData.d) c.obj.userData.d.mezcla.stopAllAction(); }
function filaChispas(carril, z0, n = 6, arco = false) { for (let i = 0; i < n; i++) poner('chispa', carril, z0 - i * 2.2, arco ? Math.sin((i / (n - 1)) * Math.PI) * 1.7 : 0); }

// el diseñador de tramos: siempre deja un camino (un carril libre, o una valla que se salta, o una viga que se pasa agachado)
function patron(z) {
  const f = Math.min(1, P.t / 150), libre = Math.floor(Math.random() * 3), otros = [0, 1, 2].filter((c) => c !== libre);
  const r = Math.random();
  if (r < 0.2) { const c = elegir([0, 1, 2]); poner(elegir(['valla', 'viga', 'bloque']), c, z); filaChispas(elegir(otros.concat(libre).filter((k) => k !== c)), z + 4, 6); }
  else if (r < 0.38) { otros.forEach((c) => poner('bloque', c, z)); filaChispas(libre, z + 6, 7); }
  else if (r < 0.5) { [0, 1, 2].forEach((c) => poner('valla', c, z)); filaChispas(elegir([0, 1, 2]), z + 5, 6, true); }
  else if (r < 0.6) { [0, 1, 2].forEach((c) => poner('viga', c, z)); filaChispas(elegir([0, 1, 2]), z + 2, 4); }
  else if (r < 0.74) { poner('dron', elegir([0, 1, 2]), z); if (f > 0.4) poner('bloque', elegir([0, 1, 2]), z - 12); }
  else if (r < 0.88) { const t = ['valla', 'viga', 'bloque'].sort(() => Math.random() - 0.5); [0, 1, 2].forEach((c, i) => poner(t[i], c, z)); }
  else { otros.forEach((c, i) => poner(i ? 'valla' : 'viga', c, z)); poner('bloque', libre, z - 14); filaChispas(otros[0], z - 16, 5); }
  // a partir del minuto, un segundo obstáculo pegado al tramo, cada vez más a menudo (siempre saltable o agachable:
  // nunca un bloque, que dejaría el carril sin salida)
  if (f > 0.35 && Math.random() < 0.15 + f * 0.4) poner(elegir(['valla', 'viga', f > 0.6 ? 'dron' : 'valla']), elegir([0, 1, 2]), z - 9);
}

// ───────────────────────────────── controles
const tecla = {};
// el modo desafío: el aliento del corredor. Solo se gasta corriendo (ni en la cuenta atrás ni en la pausa); al volver de la
// pregunta se sueltan las teclas, porque el keyup se lo tragó el panel y la tecla se quedaría «pulsada» (no cambiarías de carril)
const DES = crearDesafio({ nombre: 'Aliento', segundos: 40, recarga: 40, alPausar: (si) => { if (!si) { for (const k in tecla) tecla[k] = false; toqueIni = null; } }, enJuego: () => !!P && !P.fin && P.cuenta <= 0 && !pausa });
if (DES.activo) DES.preparar(); // se piden las preguntas mientras lees la portada
addEventListener('keydown', (e) => {
  if (!P || P.fin || P.cuenta > 0 || pausa) { if (e.code === 'KeyP' || e.code === 'Escape') pausar(); return; }
  if (tecla[e.code]) return; tecla[e.code] = true;
  if (/ArrowLeft|KeyA/.test(e.code)) mover(-1);
  if (/ArrowRight|KeyD/.test(e.code)) mover(1);
  if (/ArrowUp|KeyW|Space/.test(e.code)) { saltar(); e.preventDefault(); }
  if (/ArrowDown|KeyS/.test(e.code)) agacharse();
  if (e.code === 'KeyP' || e.code === 'Escape') pausar();
});
addEventListener('keyup', (e) => { tecla[e.code] = false; });
let toqueIni = null;
lienzo.addEventListener('pointerdown', (e) => { audio(); toqueIni = { x: e.clientX, y: e.clientY, t: performance.now() }; });
lienzo.addEventListener('pointermove', (e) => { if (!toqueIni) return; const dx = e.clientX - toqueIni.x, dy = e.clientY - toqueIni.y; if (Math.hypot(dx, dy) > 36) { deslizar(dx, dy); toqueIni = null; } });
addEventListener('pointerup', (e) => { if (!toqueIni) return; const dx = e.clientX - toqueIni.x, dy = e.clientY - toqueIni.y; if (Math.hypot(dx, dy) > 22) deslizar(dx, dy); else if (performance.now() - toqueIni.t < 250) saltar(); toqueIni = null; });
function deslizar(dx, dy) { if (!P || P.fin || P.cuenta > 0) return; if (Math.abs(dx) > Math.abs(dy)) mover(dx > 0 ? 1 : -1); else if (dy < 0) saltar(); else agacharse(); }
function mover(d) { const n = Math.max(0, Math.min(2, P.carril + d)); if (n !== P.carril) { P.carril = n; SON.carril(); } }
function saltar() { if (P.y <= 0.01 && P.vy <= 0) { P.vy = 9.8; P.agachado = 0; SON.salto(); jugador.poner('Jump', { una: true, fundido: 0.08, vel: 1.4 }); } }
function agacharse() { if (P.y > 0.05) { P.vy = -20; } P.agachado = 0.7; SON.agacha(); jugador.poner('Duck', { una: true, fundido: 0.08, vel: 1.6 }); }

// ───────────────────────────────── el juego
function tropezar(c) {
  if (P.turbo > 0) { romper(c, 0xffe14a); return; }
  P.racha = 0;
  if (c.tipo === 'bloque' || P.peligro > 0.05) { atrapado(c.tipo === 'bloque' ? 'Te has estrellado contra un bloque: esos no se saltan, se esquivan cambiando de carril.' : 'Has tropezado dos veces seguidas.'); return; }
  P.peligro = 1; P.tropiezos++; SON.golpe(); SON.alarma();
  aviso('¡CUIDADO! LA ESTÁTICA', '#ff4dd8', 1.2);
  jugador.poner('HitReact', { una: true, fundido: 0.05, vel: 1.5 });
  romper(c, 0xff2ea6);
  lienzo.style.filter = 'hue-rotate(40deg) brightness(1.4)'; setTimeout(() => (lienzo.style.filter = ''), 140);
}
function romper(c, color) { chispazo(c.obj.position.clone().add(new V3(0, 1, 0)), color, 30); quitar(c); }
function chispazo(p, color, n = 20) {
  const g = new THREE.BufferGeometry(), pos = new Float32Array(n * 3), vel = [];
  for (let i = 0; i < n; i++) { pos.set([p.x, p.y, p.z], i * 3); vel.push(new V3(azar(-1, 1), azar(-0.2, 1.4), azar(-1, 1)).normalize().multiplyScalar(azar(3, 9))); }
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const o = new THREE.Points(g, new THREE.PointsMaterial({ color, size: 0.35, map: texBrillo, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  escena.add(o); chispasFx.push({ o, vel, vida: 0.7 });
}
function atrapado(motivo) {
  if (P.fin) return; P.fin = true; P.vivo = false; SON.caida();
  jugador.poner('Death', { una: true, fundido: 0.1 });
  velo.material.opacity = 0.9;
  setTimeout(() => terminar(false, motivo), 1400);
}
function terminar(salvado, motivo) {
  DES.parar();
  let puntos = P.puntos + (salvado ? 3000 : 0);
  const bonus = DES.bonus(puntos); puntos += bonus; // el bonus de precisión, sobre la marca ya completa (con la cápsula)
  $('hud').classList.add('oculto');
  finDePartida({
    juego: JUEGO.id, titulo: salvado ? '¡Has llegado a la cápsula!' : 'Te ha alcanzado la Estática', puntos,
    texto: salvado ? 'Como los niños del refugio aquella noche: por una ruta que ya conocías de memoria. <b>+3.000</b> por salvarte.' : motivo,
    filas: [['Metros', Math.round(P.metros).toLocaleString('es-ES')], ['Chispas', P.chispas], ['Llaves', P.llaves], ['Tropiezos', P.tropiezos], ['Tiempo', `${Math.floor(P.t / 60)}:${String(Math.floor(P.t % 60)).padStart(2, '0')}`], ['Velocidad final', `${Math.round(P.v * 3.6)} km/h`], ...DES.filas(bonus)],
    alRepetir: empezar, extra: DES.extra(),
  });
}

function tick(dt) {
  if (!P) return;
  if (P.cuenta > 0) { P.cuenta -= dt; const n = Math.ceil(P.cuenta); if (n !== P._c) { P._c = n; if (n > 0) { aviso(String(n), '#5ff4ff', 0.6); SON.carril(); } else { aviso('¡CORRE!', '#5dffa0', 0.8); SON.turbo(); jugador.poner('Run', { fundido: 0.2 }); } } }
  const corriendo = P.cuenta <= 0 && !P.fin;
  if (corriendo) {
    P.t += dt;
    P.v = Math.min(VMAX, V0 + (VMAX - V0) * Math.min(1, P.t / 150)) * (P.turbo > 0 ? 1.5 : 1);
  }
  const avance = corriendo ? P.v * dt : (P.vivo ? 0 : 0);
  P.metros += avance;
  if (corriendo) P.puntos += avance * (P.turbo > 0 ? 2 : 1);

  // el pasillo
  for (const t of tramos) { t.position.z += avance; if (t.position.z > SEG * 1.5) t.position.z -= NSEG * SEG; }

  // el jugador
  P.x += (CARRILES[P.carril] - P.x) * Math.min(1, dt * 14);
  if (P.y > 0 || P.vy > 0) { P.vy -= 26 * dt; P.y = Math.max(0, P.y + P.vy * dt); if (P.y === 0 && P.vy < 0) { P.vy = 0; if (corriendo) jugador.poner(P.agachado > 0 ? 'Duck' : 'Run', { fundido: 0.1 }); } }
  if (P.agachado > 0) { P.agachado -= dt; if (P.agachado <= 0 && P.y === 0 && corriendo) jugador.poner('Run', { fundido: 0.12 }); }
  jugador.obj.position.set(P.x, P.y, 0);
  jugador.obj.rotation.y = (CARRILES[P.carril] - P.x) * -0.12;
  const run = jugador.acciones.Run; if (run) run.setEffectiveTimeScale(0.8 + P.v / 18);
  jugador.mezcla.update(dt);
  camara.position.set(P.x * 0.55, 3.3 + P.y * 0.3, 6.6);
  camara.lookAt(P.x * 0.65, 1.2 + P.y * 0.2, -9);

  // la Estática detrás
  P.peligro = Math.max(0, P.peligro - dt / RESPIRO);
  velo.material.opacity = P.fin && !P.vivo ? 0.8 : P.peligro * 0.55;
  velo.position.x = P.x * 0.5; velo.position.z = 4.2 - P.peligro * 1.4;
  document.body.style.setProperty('--peligro', (P.fin && !P.vivo ? 1 : P.peligro).toFixed(2));
  if (P.peligro > 0 || !P.vivo) pintarRuido();

  // turbo e imán
  P.turbo = Math.max(0, P.turbo - dt); P.iman = Math.max(0, P.iman - dt);
  $('extra').textContent = P.turbo > 0 ? `TURBO · invencible ${P.turbo.toFixed(1)} s` : P.iman > 0 ? `IMÁN · ${Math.ceil(P.iman)} s` : '';

  // aparecen cosas
  if (corriendo && P.t < DURACION) {
    P.siguiente -= avance;
    if (P.siguiente <= 0) { patron(-150); P.siguiente = Math.max(13, 30 - P.t * 0.11); }
    P.sigPremio -= dt;
    if (P.sigPremio <= 0) { poner(elegir(['llave', 'llave', 'rayo', 'iman']), elegir([0, 1, 2]), -150); P.sigPremio = azar(12, 22); }
  }
  if (corriendo && P.t >= DURACION && !P.capsula) {
    // la cápsula: la meta
    const g = new THREE.Group();
    const cap = new THREE.Mesh(new THREE.CapsuleGeometry(1.4, 2.4, 8, 20), new THREE.MeshStandardMaterial({ color: 0xdff8ff, emissive: 0x5dffa0, emissiveIntensity: 0.6, metalness: 0.5, roughness: 0.3 }));
    cap.rotation.x = Math.PI / 2; cap.position.y = 1.6; g.add(cap, brillo(0x5dffa0, 9));
    g.position.set(0, 0, -140); escena.add(g); P.capsula = g; aviso('¡LA CÁPSULA!', '#5dffa0', 1.6);
  }
  if (P.capsula) { P.capsula.position.z += avance; P.capsula.rotation.z += dt; if (P.capsula.position.z > -1 && !P.fin) { P.fin = true; SON.bien(); jugador.poner('Jump', { una: true }); setTimeout(() => terminar(true), 900); } }

  // las cosas: moverlas y ver si chocan
  const alto = P.agachado > 0 ? 0.9 : 1.7;
  for (const c of cosas.slice()) {
    const o = c.obj; o.position.z += avance;
    if (c.premio) { c.fase += dt * 4; o.rotation.y += dt * 3; o.position.y = c.baseY + Math.sin(c.fase) * 0.12; }
    if (c.tipo === 'dron') {
      const d = o.userData.d; d.mezcla.update(dt);
      c.cambio -= dt; if (c.cambio <= 0 && o.position.z > -60) { c.vaA = Math.max(0, Math.min(2, c.vaA + elegir([-1, 1]))); c.cambio = azar(0.9, 1.6); }
      o.position.x += (CARRILES[c.vaA] - o.position.x) * Math.min(1, dt * 3); c.carril = CARRILES.reduce((m, x, i) => Math.abs(x - o.position.x) < Math.abs(CARRILES[m] - o.position.x) ? i : m, 0);
      o.position.y = c.baseY + Math.sin(P.t * 6) * 0.1;
    }
    // el imán atrae las chispas de cualquier carril
    if (P.iman > 0 && c.tipo === 'chispa' && o.position.z > -14) { o.position.x += (P.x - o.position.x) * Math.min(1, dt * 8); o.position.y += (P.y + 1 - o.position.y) * Math.min(1, dt * 8); if (o.position.z > -2) c.carril = P.carril; }
    const mismo = Math.abs(o.position.x - P.x) < 1.1;
    if (!c.pasado && o.position.z > -0.6 && o.position.z < 0.9 && !P.fin) {
      if (c.premio) {
        if (mismo && Math.abs(o.position.y - (P.y + 0.9)) < 1.4) {
          c.pasado = true;
          if (c.tipo === 'chispa') { P.chispas++; P.puntos += 10 * (P.turbo > 0 ? 2 : 1); SON.chispa(); }
          else if (c.tipo === 'llave') { P.llaves++; P.puntos += 250; SON.llave(); aviso('+250 LLAVE', '#ffc24a', 0.9); }
          else if (c.tipo === 'rayo') { P.turbo = 3.5; SON.turbo(); aviso('¡TURBO!', '#ffe14a', 0.9); }
          else if (c.tipo === 'iman') { P.iman = 9; SON.bien(); aviso('¡IMÁN!', '#5dffa0', 0.9); }
          chispazo(o.position.clone(), c.tipo === 'chispa' ? 0x5ff4ff : 0xffc24a, 10); quitar(c); continue;
        }
      } else if (mismo) {
        let choca = false;
        if (c.tipo === 'valla') choca = P.y < 0.85;
        else if (c.tipo === 'viga') choca = P.agachado <= 0;
        else if (c.tipo === 'bloque') choca = true;
        else if (c.tipo === 'dron') choca = P.agachado <= 0 && P.y < 1.5;
        if (choca) { c.pasado = true; tropezar(c); continue; }
      }
    }
    if (o.position.z > 0.9 && !c.pasado) { c.pasado = true; if (!c.premio) { P.racha++; if (P.racha > 0 && P.racha % 10 === 0) { P.puntos += 200; aviso(`¡${P.racha} SIN TROPEZAR! +200`, '#5dffa0', 1); } } }
    if (o.position.z > 12) quitar(c);
  }
  for (const f of chispasFx.slice()) {
    f.vida -= dt; const p = f.o.geometry.attributes.position;
    for (let i = 0; i < f.vel.length; i++) { f.vel[i].y -= 12 * dt; p.setXYZ(i, p.getX(i) + f.vel[i].x * dt, p.getY(i) + f.vel[i].y * dt, p.getZ(i) + f.vel[i].z * dt + avance); }
    p.needsUpdate = true; f.o.material.opacity = Math.max(0, f.vida / 0.7);
    if (f.vida <= 0) { escena.remove(f.o); chispasFx.splice(chispasFx.indexOf(f), 1); }
  }
  $('h-pts').textContent = Math.round(P.puntos).toLocaleString('es-ES');
  $('h-m').textContent = Math.round(P.metros).toLocaleString('es-ES');
  $('h-ch').textContent = P.chispas;
  $('h-cap').style.width = Math.min(100, P.t / DURACION * 100) + '%';
  $('h-est').style.width = (P.fin && !P.vivo ? 100 : P.peligro * 100) + '%';
}

// ───────────────────────────────── arranque, pausa y bucle
let pausa = false;
function pausar() {
  if (!P || P.fin || DES.abierto) return; pausa = !pausa; // con la pregunta abierta el juego ya está parado
  if (pausa) { pantalla(`<h2>Pausa</h2><div class="botones"><button id="b-seg">Seguir</button>${EMBED ? '' : '<a class="boton sec" href="index.html?v=961c239091">Volver a la sala</a>'}</div>`); $('b-seg').onclick = pausar; }
  else cerrarPantalla();
}
document.addEventListener('visibilitychange', () => { if (document.hidden && P && !P.fin && !pausa && P.cuenta <= 0 && !DES.abierto && !window.__sinPausa) pausar(); });
async function empezar() {
  for (const c of cosas.slice()) quitar(c);
  P = nuevaPartida(); pausa = false; window.__t0Partida = performance.now();
  DES.empezar();
  velo.material.opacity = 0;
  jugador.poner('Idle', { fundido: 0 });
  $('hud').classList.remove('oculto'); cerrarPantalla();
  poner('chispa', 1, -20); filaChispas(1, -24, 6);
}
function portada() {
  const e = estado(), desafio = MODO === 'desafio';
  pantalla(`<div class="kicker">El simulador de Joran · máquina 1${desafio ? ' · modo desafío' : ''}</div><h2>La Evacuación</h2>
    <p>Joran convirtió el simulacro de evacuación del refugio en un juego. Aquella noche, los niños escaparon riendo por una ruta que conocían de memoria. <b>Ahora te toca a ti.</b></p>
    <div class="teclas"><kbd>← →  /  A D</kbd><span>Cambiar de carril (o desliza el dedo)</span><kbd>↑  /  W  /  Espacio</kbd><span>Saltar las vallas</span><kbd>↓  /  S</kbd><span>Agacharte bajo las vigas y los drones</span></div>
    <p>Los <b>bloques</b> no se saltan: cambia de carril. Si tropiezas, la Estática se te echa encima unos segundos; si vuelves a tropezar antes de que se aleje, te atrapa. Cada vez corres más. Recoge <b>chispas</b>, <b>llaves</b> (+250), el <b>turbo</b> y el <b>imán</b>. A los 3 minutos llega la cápsula.</p>
    ${DES.texto()}
    <p class="pista">Tu récord: <b>${(e.marcas.evacuacion || 0).toLocaleString('es-ES')}</b> · pilotas a <b>${e.avatar === 'barbara' ? 'Bárbara' : e.avatar === 'fernando' ? 'Fernando' : 'Finn'}</b></p>
    <div class="botones"><button id="b-ya">¡A correr!</button><a class="boton sec" href="${urlModo(desafio ? 'arcade' : 'desafio')}">${desafio ? 'Jugar en arcade' : 'Jugar en desafío'}</a>${EMBED ? '' : '<a class="boton sec" href="index.html?v=961c239091">Volver a la sala</a>'}</div>`);
  $('b-ya').onclick = async () => {
    audio();
    if (desafio) { // las preguntas tienen que estar antes de salir: sin ellas, el aliento no se podría recuperar
      const b = $('b-ya'); b.disabled = true; b.textContent = 'Cargando preguntas…';
      if (!(await DES.preparar())) aviso('Sin preguntas: juegas en arcade', '#ffc24a', 2.2);
    }
    empezar();
  };
}
let antes = performance.now();
function bucle(ahora) {
  requestAnimationFrame(bucle);
  const dt = Math.min(0.05, (ahora - antes) / 1000); antes = ahora;
  if (!pausa && !DES.abierto) { tick(dt); DES.tick(dt); } // con la pregunta abierta, nada corre
  if (!P && jugador) { jugador.mezcla.update(dt); camara.position.set(0, 3.3, 6.6); camara.lookAt(0, 1.2, -9); }
  render.render(escena, camara);
}
(async () => {
  const e = estado();
  const av = ['finn', 'barbara', 'fernando'].includes(QS.get('avatar')) ? QS.get('avatar') : e.avatar;
  jugador = await personaje(av, 1.7, Math.PI);
  jugador.escena.traverse((o) => { if (/Pistol/i.test(o.name)) o.visible = false; });
  if (!QS.get('sinholo')) holo(jugador.obj, 0x5ff4ff, 0.8);
  escena.add(jugador.obj); jugador.poner('Idle', { fundido: 0 });
  const [cajaM, llave, rayo, esfera] = await Promise.all([objeto('caja', 1), objeto('llave', 0.9), objeto('rayo', 1.1), objeto('esfera', 0.8)]);
  modelos.caja = holo(cajaM, 0xff2ea6, 1.2); modelos.llave = holo(llave, 0xffc24a, 0.8); modelos.rayo = holo(rayo, 0xffe14a, 0.8); modelos.esfera = holo(esfera, 0x5dffa0, 0.8);
  // cada dron es un clon con su esqueleto y su animación de vuelo
  const gd = await cargar('dron');
  modelos.dronFab = () => {
    const s = clone(gd.scene); s.traverse((o) => { if (o.isMesh) o.frustumCulled = false; }); const t = medir(s).getSize(new V3()), k = 1.1 / t.y; s.scale.setScalar(k);
    holo(s, 0xff2ea6, 1.3);
    const m = new THREE.AnimationMixer(s); const clip = gd.animations.find((a) => /Fast_Flying/.test(a.name)) || gd.animations[0]; if (clip) m.clipAction(clip).play();
    const g = new THREE.Group(); g.add(s); g.add(brillo(0xff2ea6, 2.2)); return { obj: g, mezcla: m };
  };
  $('carga').remove();
  requestAnimationFrame(bucle);
  portada();
})().catch((err) => { $('carga').textContent = 'No se pudo cargar: ' + err.message; console.error(err); });

window.EVAC = { get P() { return P; }, get jugador() { return jugador; }, cosas, empezar, poner, camara, THREE, DES };
