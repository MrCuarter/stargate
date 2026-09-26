// EL SIMULADOR DE JORAN · lo común de la sala y sus minijuegos (borrador).
// Joran Pike convirtió el simulacro de evacuación del refugio en un juego para los niños: cada máquina de su sala
// ensaya algo de verdad (huir, orientarse, defender la nave). Todo es un HOLOGRAMA: por eso el mundo es de neón y los
// pilotos de pruebas llevan las mascotas que eligieron los niños (Finn, Bárbara y Fernando).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

export const $ = (id) => document.getElementById(id);
export const azar = (a, b) => a + Math.random() * (b - a);
export const elegir = (xs) => xs[Math.floor(Math.random() * xs.length)];
export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const QS = new URLSearchParams(location.search);
export const EMBED = QS.get('embed') === '1';

// ── LAS MÁQUINAS DE LA SALA (un dato, un sitio: la sala, los juegos y el servidor leen de aquí)
// abre = qué marca la desbloquea · precio = o pagarla con créditos (◈). La primera viene abierta.
export const JUEGOS = [
  { id: 'evacuacion', n: 'La Evacuación', lema: 'Corre por los pasillos de la Cero antes de que la Estática te alcance.', controles: '← → cambiar de carril · ↑ saltar · ↓ agacharse (o desliza el dedo)', abre: null, precio: 0, img: 'img/maq_evacuacion.jpg', url: 'evacuacion.html' },
  { id: 'laberinto', n: 'El Laberinto de la Cero', lema: 'La nave se ha apagado. Encuentra las tres llaves y llega a la cápsula… a oscuras.', controles: 'Flechas / WASD o el joystick del dedo · Espacio: pulso que aturde', abre: { juego: 'evacuacion', puntos: 2500 }, precio: 40, img: 'img/maq_laberinto.jpg', url: 'laberinto.html' },
  { id: 'ruta-azul', n: 'RUTA AZUL', lema: 'El arcade que Joran programó para entrenar pilotos. Oleadas de la Estática y el jefe final.', controles: '← → o el dedo para moverte · dispara solo · Espacio: bomba', abre: { juego: 'laberinto', puntos: 3000 }, precio: 60, img: 'img/maq_rutaazul.jpg', url: 'ruta-azul.html' },
];
// 🔴 En la web, lo que se cuenta de cada máquina y cómo se enciende (marca y precio) llega de _site_data.py → datos.js
// (lo escribe el build): un dato, un sitio. En el borrador no hay datos.js y se queda lo de arriba.
try { const D = await import('./datos.js'); for (const [id, n, lema, abre, precio] of D.SALA_JORAN.maquinas) { const j = JUEGOS.find((x) => x.id === id); if (j) Object.assign(j, { n, lema, abre: abre ? { juego: abre[0], puntos: abre[1] } : null, precio }); } } catch (e) { /* borrador: sin datos.js */ }
export const AVATARES = [
  { id: 'finn', n: 'Finn', que: 'la rana', img: 'img/finn.jpg' },
  { id: 'barbara', n: 'Bárbara', que: 'la abeja', img: 'img/barbara.jpg' },
  { id: 'fernando', n: 'Fernando', que: 'el flamenco', img: 'img/fernando.jpg' },
];

// ── lo guardado. En el juego de verdad: la ficha del recluta (marcas, desbloqueos) y sus créditos, por el servidor.
// En el borrador, el navegador, con 100 ◈ de prueba para poder ensayar la compra.
const CLAVE = 'sgJoran';
export function estado() {
  let e = null; try { e = JSON.parse(localStorage.getItem(CLAVE) || 'null'); } catch (x) { /* nada */ }
  return Object.assign({ avatar: 'finn', marcas: {}, desbloqueados: ['evacuacion'], creditos: 100, partidas: {} }, e || {});
}
export function guardar(e) { try { localStorage.setItem(CLAVE, JSON.stringify(e)); } catch (x) { /* sin almacenamiento */ } }
export function abierto(e, j) { return !j.abre || e.desbloqueados.includes(j.id); }
// al terminar una partida: guarda la marca y abre lo que toque. Devuelve lo nuevo que se ha abierto.
// En la web (dentro de la Nave, que carga el motor), las marcas y las compras van al servidor (stargateSala) y lo de este
// navegador es solo la copia para pintar al momento. Fuera, o sin la función desplegada, solo el navegador (ensayo).
const PER = QS.get('per') || '';
function motor() { try { return window.parent !== window && window.parent.SG && window.parent.SG.MOTOR && window.parent.SG.MOTOR.llamar ? window.parent.SG.MOTOR : null; } catch (e) { return null; } }
export async function alServidor(datos) { const m = motor(); if (!m || !PER) return null; try { return await m.llamar('stargateSala', { projectId: PER, ...datos }); } catch (e) { console.warn('La sala, sin servidor:', e && e.message); return null; } }
const T0 = performance.now();
export function registrarPartida(juego, puntos) {
  const e = estado(), antes = e.marcas[juego] || 0, nuevos = [];
  e.marcas[juego] = Math.max(antes, Math.round(puntos));
  e.partidas[juego] = (e.partidas[juego] || 0) + 1;
  for (const j of JUEGOS) if (j.abre && !e.desbloqueados.includes(j.id) && (e.marcas[j.abre.juego] || 0) >= j.abre.puntos) { e.desbloqueados.push(j.id); nuevos.push(j); }
  guardar(e);
  alServidor({ accion: 'marca', juego, puntos: Math.round(puntos), segundos: Math.round((performance.now() - (window.__t0Partida || T0)) / 1000) });
  try { window.parent !== window && window.parent.postMessage({ sgJoran: { juego, puntos: Math.round(puntos), record: puntos > antes } }, '*'); } catch (x) { /* sin padre */ }
  return { record: puntos > antes, antes, nuevos, mejor: e.marcas[juego] };
}
export function comprar(id) {
  const e = estado(), j = JUEGOS.find((x) => x.id === id);
  if (!j || abierto(e, j)) return { ok: true };
  if (e.creditos < j.precio) return { ok: false, motivo: `Te faltan ${j.precio - e.creditos} ◈.` };
  e.creditos -= j.precio; e.desbloqueados.push(j.id); guardar(e); return { ok: true };
}

// ── sonido sintetizado (0 ficheros)
let actx = null;
export function audio() { try { if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === 'suspended') actx.resume(); } catch (e) { /* sin audio */ } return actx; }
export function tono(f0, f1, dur, tipo = 'square', vol = 0.05, retraso = 0) {
  const a = audio(); if (!a) return; const o = a.createOscillator(), g = a.createGain(), t = a.currentTime + retraso;
  o.type = tipo; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(f1, 1), t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur);
}
export function ruido(dur, vol = 0.2, corte = 900) {
  const a = audio(); if (!a) return; const n = a.sampleRate * dur, b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2);
  const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
  f.type = 'lowpass'; f.frequency.value = corte; g.gain.value = vol; s.buffer = b; s.connect(f).connect(g).connect(a.destination); s.start();
}
export const SON = {
  chispa: () => tono(1320, 1760, 0.07, 'triangle', 0.04),
  llave: () => [880, 1109, 1319, 1760].forEach((f, i) => tono(f, f, 0.12, 'triangle', 0.06, i * 0.06)),
  salto: () => tono(300, 700, 0.18, 'sine', 0.06),
  agacha: () => tono(500, 200, 0.16, 'sine', 0.05),
  carril: () => tono(600, 800, 0.05, 'square', 0.025),
  golpe: () => { ruido(0.3, 0.45, 1500); tono(160, 50, 0.3, 'sawtooth', 0.08); },
  caida: () => { ruido(1.0, 0.5, 500); tono(200, 30, 1, 'sawtooth', 0.09); },
  turbo: () => tono(200, 1200, 0.5, 'sawtooth', 0.05),
  bien: () => [523, 659, 784, 1047].forEach((f, i) => tono(f, f, 0.16, 'triangle', 0.08, i * 0.09)),
  laser: () => tono(1600, 500, 0.07, 'square', 0.025),
  boom: () => ruido(0.4, 0.3, 800),
  pulso: () => { tono(120, 900, 0.35, 'sine', 0.08); ruido(0.3, 0.15, 3000); },
  alarma: () => [0, 0.25].forEach((r) => tono(880, 660, 0.2, 'square', 0.04, r)),
};

// ── el aspecto de holograma: el color de siempre + un contorno de luz cian (efecto Fresnel) y algo de brillo propio
export function holo(obj, color = 0x5ff4ff, fuerza = 0.9) {
  const c = new THREE.Color(color);
  obj.traverse((o) => {
    if (!o.isMesh) return;
    const ms = Array.isArray(o.material) ? o.material : [o.material];
    const nuevos = ms.map((m0) => {
      const m = m0.clone();
      m.onBeforeCompile = (sh) => {
        sh.uniforms.uRim = { value: c }; sh.uniforms.uFuerza = { value: fuerza };
        sh.fragmentShader = 'uniform vec3 uRim; uniform float uFuerza;\n' + sh.fragmentShader.replace('#include <dithering_fragment>',
          'float rim = 1.0 - max(dot(normalize(normal), normalize(vViewPosition)), 0.0);\n gl_FragColor.rgb += uRim * pow(rim, 2.2) * uFuerza;\n#include <dithering_fragment>');
      };
      m.customProgramCacheKey = () => 'holo' + color + fuerza;
      return m;
    });
    o.material = Array.isArray(o.material) ? nuevos : nuevos[0];
  });
  return obj;
}

// ── modelos
const cargador = new GLTFLoader();
const cache = {};
export function cargar(nombre) {
  if (!cache[nombre]) cache[nombre] = new Promise((ok, mal) => cargador.load(`modelos/${nombre}.glb`, ok, undefined, mal));
  return cache[nombre];
}
// 🔴 medir un modelo con esqueleto: la malla y los huesos pueden venir a escalas distintas (los de Quaternius, sí);
// lo que se VE es la malla deformada por los huesos, así que se mide eso (y no la caja de la malla quieta)
export function medir(obj) {
  obj.updateMatrixWorld(true);
  const caja = new THREE.Box3();
  obj.traverse((o) => {
    if (!o.visible) return;
    if (o.isSkinnedMesh) { o.computeBoundingBox(); caja.union(o.boundingBox.clone().applyMatrix4(o.matrixWorld)); }
    else if (o.isMesh) caja.expandByObject(o);
  });
  return caja;
}
// una copia con su esqueleto y su mezclador de animaciones · alto = tamaño final · giro = hacia dónde mira
export async function personaje(nombre, alto = 1.8, giro = 0) {
  const g = await cargar(nombre);
  const escena = SkeletonUtils.clone(g.scene);
  escena.traverse((o) => { if (o.isMesh) o.frustumCulled = false; }); // la esfera de un modelo con esqueleto engaña al recorte de cámara
  const caja = medir(escena), t = caja.getSize(new THREE.Vector3());
  const k = alto / t.y; escena.scale.setScalar(k); escena.position.y = -caja.min.y * k;
  const piv = new THREE.Group(); const dentro = new THREE.Group(); dentro.rotation.y = giro; dentro.add(escena); piv.add(dentro);
  const mezcla = new THREE.AnimationMixer(escena);
  const acciones = {};
  for (const clip of g.animations) acciones[clip.name.split('|').pop()] = mezcla.clipAction(clip);
  let actual = null;
  const poner = (n, { una = false, fundido = 0.15, vel = 1 } = {}) => {
    const a = acciones[n]; if (!a) return null;
    if (actual === a && !una) return a;
    a.reset(); a.setEffectiveTimeScale(vel); a.setLoop(una ? THREE.LoopOnce : THREE.LoopRepeat, una ? 1 : Infinity); a.clampWhenFinished = una;
    if (actual) a.crossFadeFrom(actual, fundido, false); a.play(); actual = a; return a;
  };
  return { obj: piv, escena, mezcla, acciones, poner };
}
export async function objeto(nombre, medida = 1) {
  const g = await cargar(nombre);
  const o = g.scene.clone(true);
  const caja = new THREE.Box3().setFromObject(o), t = caja.getSize(new THREE.Vector3()), c = caja.getCenter(new THREE.Vector3());
  const k = medida / Math.max(t.x, t.y, t.z); o.scale.setScalar(k); o.position.copy(c.multiplyScalar(-k));
  const piv = new THREE.Group(); piv.add(o); return piv;
}

// ── la textura de brillo (chispas, halos)
export const texBrillo = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,.7)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();

// ── pantallas y avisos
export function pantalla(html) { $('pantalla').classList.remove('oculto'); $('pantalla-caja').innerHTML = html; }
export function cerrarPantalla() { $('pantalla').classList.add('oculto'); }
let avisoHasta = 0;
export function aviso(t, color = '#fff', seg = 1.2) { const a = $('aviso'); if (!a) return; a.textContent = t; a.style.color = color; a.classList.add('ver'); clearTimeout(a._t); a._t = setTimeout(() => a.classList.remove('ver'), seg * 1000); }
// el panel del final de partida, igual en todos los juegos
export function finDePartida({ juego, titulo, puntos, filas, texto = '', alRepetir }) {
  const r = registrarPartida(juego, puntos), j = JUEGOS.find((x) => x.id === juego);
  const nuevos = r.nuevos.map((n) => `<div class="premio">¡Nueva máquina desbloqueada en la sala: <b>${esc(n.n)}</b>!</div>`).join('');
  const sig = JUEGOS.find((x) => x.abre && x.abre.juego === juego && !estado().desbloqueados.includes(x.id));
  pantalla(`<div class="kicker">${esc(j.n)}</div><h2>${esc(titulo)}</h2>${texto ? `<p>${texto}</p>` : ''}
    <div class="gran">${Math.round(puntos).toLocaleString('es-ES')}<small>puntos${r.record ? ' · ¡récord!' : ` · tu récord: ${r.mejor.toLocaleString('es-ES')}`}</small></div>
    <div class="filas">${filas.map(([a, b]) => `<div><span>${esc(a)}</span><b>${esc(b)}</b></div>`).join('')}</div>
    ${nuevos}${sig ? `<p class="pista">Con <b>${sig.abre.puntos.toLocaleString('es-ES')}</b> puntos aquí se abre <b>${esc(sig.n)}</b> (o se compra por ${sig.precio} ◈ en la sala).</p>` : ''}
    <div class="botones"><button id="b-otra">Otra partida</button>${EMBED ? '' : '<a class="boton sec" href="index.html">Volver a la sala</a>'}</div>`);
  $('b-otra').onclick = () => { cerrarPantalla(); alRepetir(); };
  return r;
}
export { THREE };
