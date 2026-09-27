// EL SIMULADOR DE JORAN · lo común de la sala y sus minijuegos (borrador).
// Joran Pike convirtió el simulacro de evacuación del refugio en un juego para los niños: cada máquina de su sala
// ensaya algo de verdad (huir, orientarse, defender la nave). Todo es un HOLOGRAMA: por eso el mundo es de neón y los
// pilotos de pruebas llevan las mascotas que eligieron los niños (Finn, Bárbara y Fernando).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

export const $ = (id) => document.getElementById(id);
export const azar = (a, b) => a + Math.random() * (b - a);
export const elegir = (xs) => xs[Math.floor(Math.random() * xs.length)];
export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const QS = new URLSearchParams(location.search);
export const EMBED = QS.get('embed') === '1';

// ── LAS MÁQUINAS DE LA SALA (un dato, un sitio: la sala, los juegos y el servidor leen de aquí)
// abre = qué marca la desbloquea · precio = o pagarla con créditos (◈). La primera viene abierta.
// 27-sep · el equilibrio que aprobó Norberto: la sala NO da xp (pilotar bien no es aprender). Da créditos solo con los
// HITOS de cada máquina (bronce, plata y oro de marca), UNA vez cada uno: 5 + 10 + 15 = 30 ◈ por máquina, 120 ◈ las cuatro.
// Encender las tres cerradas con créditos cuesta 180 ◈: quien las compra, gasta más de lo que la sala le devuelve; quien
// las abre jugando, se las ahorra. Y la regla para abrir la siguiente es siempre la misma: la PLATA de la anterior.
// hitos = [bronce, plata, oro] en puntos (🔧 a recalibrar con partidas reales: un jugador medio, plata en ~3 intentos).
export const HITO_CR = { bronce: 5, plata: 10, oro: 15 };
export const ESCALONES = ['bronce', 'plata', 'oro'];
export const JUEGOS = [
  { id: 'evacuacion', n: 'La Evacuación', lema: 'Corre por los pasillos de la Cero antes de que la Estática te alcance.', controles: '← → cambiar de carril · ↑ saltar · ↓ agacharse (o desliza el dedo)', abre: null, precio: 0, hitos: [1200, 2500, 5000], img: 'img/maq_evacuacion.jpg', url: 'evacuacion.html' },
  { id: 'laberinto', n: 'El Laberinto de la Cero', lema: 'La nave se ha apagado. Encuentra las tres llaves y llega a la cápsula… a oscuras.', controles: 'Flechas / WASD o el joystick del dedo · Espacio: pulso que aturde', abre: { juego: 'evacuacion', puntos: 2500 }, precio: 40, hitos: [1500, 3000, 6000], img: 'img/maq_laberinto.jpg', url: 'laberinto.html' },
  { id: 'ruta-azul', n: 'RUTA AZUL', lema: 'El arcade que Joran programó para entrenar pilotos. Oleadas de la Estática y el jefe final.', controles: '← → o el dedo para moverte · dispara solo · Espacio: bomba', abre: { juego: 'laberinto', puntos: 3000 }, precio: 60, hitos: [1500, 3000, 6000], img: 'img/maq_rutaazul.jpg', url: 'ruta-azul.html' },
  { id: 'descenso', n: 'El Descenso', lema: 'Posa el Módulo Lunar en los ocho planetas: cada uno con su gravedad, su viento solar y su truco.', controles: '← → girar · ↑ / Espacio propulsor (en el móvil, los botones)', abre: { juego: 'ruta-azul', puntos: 3000 }, precio: 80, hitos: [1200, 3000, 5500], img: 'img/maq_descenso.jpg', url: 'descenso.html' },
  // el REPASO: la Ruta de la Estática con niveles. Abierta desde el principio y sin créditos (repetir preguntas no puede ser
  // una fuente de premios): solo su ranking y el hito «Repaso de oro» del Cuaderno.
  { id: 'vuelo', n: 'Simulador de vuelo', lema: 'La Ruta de la Estática para repasar: cualquier tramo, en fácil, media o difícil, o todo el viaje de una vez.', controles: 'Como en la Ruta: ratón, teclado o el dedo · las respuestas, pilotando', abre: null, precio: 0, repaso: true, hitos: [2000, 4000, 7000], img: 'img/maq_vuelo.jpg', url: (location.pathname.includes('/juegos/') ? '../ruta/' : '../ruta-estatica/') + 'index.html?repaso=1' },
];
export const ARCADE = JUEGOS.filter((j) => !j.repaso);
// 🔴 En la web, lo que se cuenta de cada máquina y cómo se enciende (marca y precio) llega de _site_data.py → datos.js
// (lo escribe el build): un dato, un sitio. En el borrador no hay datos.js y se queda lo de arriba.
let DATOS = null;
try { DATOS = (await import('./datos.js')).SALA_JORAN; for (const [id, n, lema, abre, precio, hitos] of DATOS.maquinas) { const j = JUEGOS.find((x) => x.id === id); if (j) Object.assign(j, { n, lema, abre: abre ? { juego: abre[0], puntos: abre[1] } : null, precio }, hitos ? { hitos } : {}); } if (DATOS.hito_cr) Object.assign(HITO_CR, DATOS.hito_cr); } catch (e) { /* borrador: sin datos.js */ }
export const AVATARES = [
  { id: 'finn', n: 'Finn', que: 'la rana', img: 'img/finn.jpg' },
  { id: 'barbara', n: 'Bárbara', que: 'la abeja', img: 'img/barbara.jpg' },
  { id: 'fernando', n: 'Fernando', que: 'el flamenco', img: 'img/fernando.jpg' },
];

// ── lo guardado. En el juego de verdad: la ficha del recluta (marcas, desbloqueos) y sus créditos, por el servidor.
// En el borrador, el navegador, con 100 ◈ de prueba para poder ensayar la compra.
const PER = QS.get('per') || '';
const CLAVE = 'sgJoran' + (PER ? ':' + PER : '');
export function estado() {
  let e = null; try { e = JSON.parse(localStorage.getItem(CLAVE) || 'null'); } catch (x) { /* nada */ }
  return Object.assign({ avatar: 'finn', alias: 'Vega', marcas: {}, desbloqueados: ['evacuacion'], creditos: 100, partidas: {}, hitos: {}, logros: {} }, e || {});
}
export function guardar(e) { try { localStorage.setItem(CLAVE, JSON.stringify(e)); } catch (x) { /* sin almacenamiento */ } }
export function abierto(e, j) { return !j.abre || e.desbloqueados.includes(j.id); }
// al terminar una partida: guarda la marca y abre lo que toque. Devuelve lo nuevo que se ha abierto.
// En la web (dentro de la Nave, que carga el motor), las marcas y las compras van al servidor (stargateSala) y lo de este
// navegador es solo la copia para pintar al momento. Fuera, o sin la función desplegada, solo el navegador (ensayo).
// el motor está en la Nave (la sala va en su marco; y cada máquina, en el mismo marco que la sala)
function motor() {
  let w = window;
  for (let i = 0; i < 3 && w.parent && w.parent !== w; i++) { w = w.parent; try { if (w.SG && w.SG.MOTOR && w.SG.MOTOR.llamar) return w.SG.MOTOR; } catch (e) { return null; } }
  return null;
}
export const WEB = !!(PER && motor());
// 🔴 el ?per= viaja con cada enlace de la sala (a las máquinas, al Simulador de vuelo y de vuelta a la sala): sin él, la
// partida no llegaría al servidor
if (PER) document.addEventListener('click', (ev) => {
  const a = ev.target.closest && ev.target.closest('a[href]'); if (!a) return;
  const h = a.getAttribute('href'); if (!h || /^(https?:|#|mailto:)/.test(h) || /[?&]per=/.test(h)) return;
  a.setAttribute('href', h + (h.includes('?') ? '&' : '?') + 'per=' + encodeURIComponent(PER));
}, true);
// EN LA WEB: al entrar en la sala se trae lo tuyo (marcas, máquinas encendidas, hitos, créditos) y lo de tu clase; lo de
// este navegador es solo la copia para pintar al momento
export let CLASE_SRV = {}, RUTA_SRV = null;
export async function sincronizar() {
  if (!WEB) return false;
  const [r, ru] = await Promise.all([alServidor({ accion: 'estado' }), motor().llamar('stargateRuta', { accion: 'marcas', projectId: PER }).catch(() => null)]);
  if (!r) return false;
  const e = estado();
  Object.assign(e, { marcas: r.sala.marcas || {}, desbloqueados: r.sala.abiertas || ['evacuacion'], hitos: r.sala.hitos || {}, logros: r.sala.logros || {},
    votados: r.sala.votados || {}, creditos: r.coins, alias: r.alias || e.alias, ensayo: !!r.ensayo });
  guardar(e); CLASE_SRV = r.clase || {};
  if (ru && ru.marcas) RUTA_SRV = ru.marcas;
  return true;
}
export async function alServidor(datos) { const m = motor(); if (!m || !PER) return null; try { return await m.llamar('stargateSala', { projectId: PER, ...datos }); } catch (e) { console.warn('La sala, sin servidor:', e && e.message); return null; } }
const T0 = performance.now();
// extra = lo que cada juego sabe de la partida y cuenta para el Cuaderno de vuelo (intocable, perfecto, nivel del repaso)
export function registrarPartida(juego, puntos, extra = {}) {
  const e = estado(), antes = e.marcas[juego] || 0, nuevos = [], hitos = [], j = JUEGOS.find((x) => x.id === juego);
  puntos = Math.round(puntos);
  e.marcas[juego] = Math.max(antes, puntos);
  e.partidas[juego] = (e.partidas[juego] || 0) + 1;
  for (const x of JUEGOS) if (x.abre && !e.desbloqueados.includes(x.id) && (e.marcas[x.abre.juego] || 0) >= x.abre.puntos) { e.desbloqueados.push(x.id); nuevos.push(x); }
  // los hitos de la máquina: cada escalón, una vez; el repaso no paga
  if (j && j.hitos) ESCALONES.forEach((esc, i) => {
    const k = juego + ':' + esc;
    if (!e.hitos[k] && puntos >= j.hitos[i]) { const cr = j.repaso ? 0 : HITO_CR[esc]; e.hitos[k] = true; e.creditos += cr; hitos.push({ esc, cr, puntos: j.hitos[i] }); }
  });
  if (extra.intocable) e.logros.intocable = true;
  if (extra.perfecto) e.logros.perfecto = true;
  if (juego === 'vuelo' && extra.nivel === 'dificil' && j && puntos >= j.hitos[2]) e.logros.repasoOro = true;
  guardar(e);
  alServidor({ accion: 'marca', juego, puntos, extra, segundos: Math.round((performance.now() - (window.__t0Partida || T0)) / 1000) })
    .then((r) => { if (r && r.ok && !r.ensayo) { const e2 = estado(); e2.creditos = r.coins; e2.desbloqueados = r.abiertas; guardar(e2); } });
  try { window.parent !== window && window.parent.postMessage({ sgJoran: { juego, puntos, record: puntos > antes } }, '*'); } catch (x) { /* sin padre */ }
  return { record: puntos > antes, antes, nuevos, hitos, mejor: e.marcas[juego] };
}

// ── EL CUADERNO DE VUELO: los hitos de la Ruta y de la sala. Todo junto da el título y el marco «As de Joran» (cosmético:
// ni xp ni nota). 🔴 Fuera de los Logros de a bordo a propósito: un juego opcional no puede cerrar el paso al Contramaestre.
const leerLS = (k) => { try { return JSON.parse(localStorage.getItem(k) || '{}'); } catch (x) { return {}; } };
export function galeria() { if (WEB) return { votos: estado().votados || {}, mio: null }; return Object.assign({ votos: {}, mio: null }, leerLS('sgGaleria')); }
export const CUADERNO = [
  { k: 'despegue', t: 'Primer vuelo', que: 'Termina tu primera misión de la Ruta de la Estática.', ok: (c) => c.medallasRuta >= 1 },
  { k: 'ruta', t: 'La Ruta entera', que: 'Medalla en las diez misiones de la Ruta.', ok: (c) => c.medallasRuta >= 10 },
  { k: 'oros', t: 'Piloto de oro', que: 'Oro en las diez misiones de la Ruta.', ok: (c) => c.orosRuta >= 10 },
  { k: 'probador', t: 'Probador de la sala', que: 'Juega a las cuatro máquinas arcade.', ok: (c) => ARCADE.every((j) => c.e.partidas[j.id]) },
  { k: 'marcador', t: 'En el marcador', que: 'Tu primer hito (bronce) en una máquina.', ok: (c) => ARCADE.some((j) => c.e.hitos[j.id + ':bronce']) },
  { k: 'oro1', t: 'Récord de Joran', que: 'Oro en una máquina arcade.', ok: (c) => ARCADE.some((j) => c.e.hitos[j.id + ':oro']) },
  { k: 'oro4', t: 'Maestro de la sala', que: 'Oro en las cuatro máquinas arcade.', ok: (c) => ARCADE.every((j) => c.e.hitos[j.id + ':oro']) },
  { k: 'intocable', t: 'Intocable', que: 'Vence a RUTA AZUL sin perder una vida.', ok: (c) => !!c.e.logros.intocable },
  { k: 'perfecto', t: 'Ocho mundos, cero golpes', que: 'Pósate en los ocho planetas de El Descenso sin perder un módulo.', ok: (c) => !!c.e.logros.perfecto },
  { k: 'repasoOro', t: 'Repaso de oro', que: 'Oro en el Simulador de vuelo en nivel difícil.', ok: (c) => !!c.e.logros.repasoOro },
  { k: 'critico', t: 'Crítico de Ludo', que: 'Valora cinco juegos de la Galería de la tripulación.', ok: (c) => Object.keys(c.g.votos).length >= 5 },
];
export const PREMIO_CUADERNO = (DATOS && DATOS.premio_cuaderno) || 'el título «As de Joran» y el marco holográfico para tu avatar';
// los textos del Cuaderno, de _site_data.py (aquí solo manda CÓMO se comprueba cada hito)
if (DATOS && DATOS.cuaderno) for (const [k, t, que] of DATOS.cuaderno) { const h = CUADERNO.find((x) => x.k === k); if (h) Object.assign(h, { t, que }); }
export function cuaderno() {
  const ruta = Object.entries(RUTA_SRV || (WEB ? {} : leerLS('sgRutaMarcas'))).filter(([k]) => k !== 'repaso').map(([, v]) => v || {});
  const c = { e: estado(), g: galeria(), medallasRuta: ruta.filter((m) => m.medalla && m.medalla !== 'nada').length, orosRuta: ruta.filter((m) => m.medalla === 'oro').length };
  const lista = CUADERNO.map((h) => ({ ...h, hecho: !!h.ok(c) }));
  return { lista, hechos: lista.filter((h) => h.hecho).length, total: lista.length };
}
export async function comprar(id) {
  const e = estado(), j = JUEGOS.find((x) => x.id === id);
  if (WEB) { // lo cobra el servidor
    try { const r = await motor().llamar('stargateSala', { accion: 'comprar', projectId: PER, juego: id });
      if (r && r.ensayo) return { ok: false, motivo: 'Sin ficha de recluta en este grupo: solo se puede mirar.' };
      e.desbloqueados = r.abiertas; e.creditos = r.coins; guardar(e); return { ok: true }; }
    catch (x) { return { ok: false, motivo: (x && x.message) || 'No se ha podido.' }; }
  }
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
// algunos modelos libres (el Módulo Lunar de la NASA) vienen comprimidos con Draco: su descompresor, de la misma CDN que three
const draco = new DRACOLoader(); draco.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/libs/draco/gltf/'); cargador.setDRACOLoader(draco);
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
export function finDePartida({ juego, titulo, puntos, filas, texto = '', alRepetir, extra = {} }) {
  const r = registrarPartida(juego, puntos, extra), j = JUEGOS.find((x) => x.id === juego);
  const NOM = { bronce: 'Bronce', plata: 'Plata', oro: 'Oro' };
  const hitos = r.hitos.map((h) => `<div class="premio hito ${h.esc}">Hito de <b>${NOM[h.esc]}</b> en ${esc(j.n)} (${h.puntos.toLocaleString('es-ES')} puntos)${h.cr ? `: <b>+${h.cr} ◈</b>` : ''}</div>`).join('');
  const sigHito = j.hitos && ESCALONES.map((e2, i) => [e2, j.hitos[i]]).find(([, p]) => r.mejor < p);
  const nuevos = r.nuevos.map((n) => `<div class="premio">¡Nueva máquina desbloqueada en la sala: <b>${esc(n.n)}</b>!</div>`).join('');
  const sig = JUEGOS.find((x) => x.abre && x.abre.juego === juego && !estado().desbloqueados.includes(x.id));
  pantalla(`<div class="kicker">${esc(j.n)}</div><h2>${esc(titulo)}</h2>${texto ? `<p>${texto}</p>` : ''}
    <div class="gran">${Math.round(puntos).toLocaleString('es-ES')}<small>puntos${r.record ? ' · ¡récord!' : ` · tu récord: ${r.mejor.toLocaleString('es-ES')}`}</small></div>
    <div class="filas">${filas.map(([a, b]) => `<div><span>${esc(a)}</span><b>${esc(b)}</b></div>`).join('')}</div>
    ${hitos}${nuevos}${sigHito ? `<p class="pista">Siguiente hito: <b>${NOM[sigHito[0]]}</b> con ${sigHito[1].toLocaleString('es-ES')} puntos${j.repaso ? '' : ` (+${HITO_CR[sigHito[0]]} ◈)`}.</p>` : ''}${sig ? `<p class="pista">Con <b>${sig.abre.puntos.toLocaleString('es-ES')}</b> puntos aquí se abre <b>${esc(sig.n)}</b> (o se compra por ${sig.precio} ◈ en la sala).</p>` : ''}
    <div class="botones"><button id="b-otra">Otra partida</button>${EMBED ? '' : '<a class="boton sec" href="index.html">Volver a la sala</a>'}</div>`);
  $('b-otra').onclick = () => { cerrarPantalla(); alRepetir(); };
  return r;
}
export { THREE };
