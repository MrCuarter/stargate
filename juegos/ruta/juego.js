// LA RUTA DE LA ESTÁTICA · borrador jugable (tipo Lylat Wars)
// Diez misiones de 2-3 minutos: la salida tras la presentación, una al cerrar cada tema (el viaje al planeta
// siguiente) y Vaeon al final. Las preguntas se contestan PILOTANDO (atravesando la puerta buena).
// Se puntúa por separado SABER (lo sabe el servidor) y PERICIA (derribos, puntería, anillos, escudo).
// ?mision=m3 abre directamente esa misión (así se embebe en la sesión); ?embed=1 quita el mapa.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { PREMIOS, CRITERIOS, ORDEN, NIVELES } from './servidor-local.js?v=1d51f06d26';
import { SERVIDOR, enEnsayo } from './servidor.js?v=1d51f06d26';

const V3 = THREE.Vector3;
const $ = (id) => document.getElementById(id);
const azar = (a, b) => a + Math.random() * (b - a);
const elegir = (xs) => xs[Math.floor(Math.random() * xs.length)];
const barajar = (xs) => { const a = xs.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const QS = new URLSearchParams(location.search);
const EMBED = QS.get('embed') === '1';
// ?repaso=1 → el SIMULADOR DE VUELO de la sala de Joran: cualquier tramo, en tres niveles, sin premio (solo la marca)
const REPASO = QS.get('repaso') === '1';
let NIVEL = REPASO ? (NIVELES[QS.get('nivel')] ? QS.get('nivel') : 'media') : null;
// en la web los juegos viven en juegos/ruta y juegos/joran; en el borrador, en ruta-estatica y sala-joran
const EN_WEB = location.pathname.includes('/juegos/');
const SALA = EN_WEB ? '../joran/' : '../sala-joran/';
const BASE_WEB = EN_WEB ? '../../' : ''; // las ilustraciones de las preguntas (assets/img/batalla/p/…)
// 30-sep · EL MODO ACADEMIA (?banco=academia&mision=m5): las preguntas de un planeta de la Academia de la Cero, que pasa la
// página que abre el juego (academia.js → window.SG_BANCO_JUEGO; son públicas y traen la buena). Norberto: «¡usa los minijuegos
// para preguntar! Las que fallen se vuelven a lanzar; cuando acierten todas… Enhorabuena, has acertado todas: puedes seguir
// jugando o pasar al siguiente módulo». La que se falla vuelve detrás de las demás, con su hueco en el vuelo; las pendientes
// sobreviven a una caída («Volver a volar» solo trae las que faltan). Sin servidor, sin medallas ni premios.
const ACADEMIA = QS.get('banco') === 'academia';
const ACA = ACADEMIA ? (() => {
  let lista = null;
  try { lista = window.parent && window.parent !== window && window.parent.SG_BANCO_JUEGO; } catch (e) { lista = null; }
  if (!lista) try { lista = JSON.parse(sessionStorage.getItem('sgBancoJuego') || 'null'); } catch (e) { lista = null; }
  const qs = (Array.isArray(lista) ? lista : []).filter((x) => x && x.p && Array.isArray(x.o) && x.o.length >= 2)
    .map((x, i) => ({ id: 'a' + i, p: x.p, o: x.o.slice(0, 4), ok: Math.min(3, Number(x.ok) || 0), porque: x.porque || '' }));
  return { qs, pendientes: new Set(qs.map((q) => q.id)), dicho: false };
})() : null;
function preguntaAcademia(x) {
  const orden = barajar(x.o.map((_, i) => i));
  return { id: x.id, tipo: 'una', enunciado: x.p, opciones: orden.map((i) => x.o[i]), pasos: 1, buena: orden.indexOf(x.ok), correccion: x.porque };
}
function avisarAcademia(que) {
  try { if (window.parent && window.parent !== window) window.parent.postMessage({ sgAcademia: Object.assign({ tanda: QS.get('tanda') || '' }, que) }, location.origin); } catch (e) { /* sin marco */ }
}

// ───────────────────────────────────────── EL MAPA Y LAS MISIONES (un dato, un sitio)
const NODOS = [
  { k: 'cero', n: 'La Constancia', nave: true },
  { k: 'p1_forge', n: 'Fôrge', glb: 'forge' },
  { k: 'p2_ecos', n: 'Ecos' },
  { k: 'p3_sendara', n: 'Sendara' },
  { k: 'p4_reliae', n: 'Reliae', anillo: true },
  { k: 'p5_umbral', n: 'Umbral' },
  { k: 'p6_ludo', n: 'Ludo' },
  { k: 'p7_vinculo', n: 'Vínculo' },
  { k: 'p8_liminar', n: 'Liminar' },
  { k: 'estatica', n: 'La Estática', grande: true },
];
// mezcla = peso de cada tipo de oleada · ambiente = color de la niebla (y lo cerca que empieza, si se quiere agobiar)
const MISIONES = [
  { id: 'm0', n: 0, de: 0, a: 1, tema: 0, cuando: 'Tras la presentación', titulo: 'Primer vuelo',
    lema: 'NEBULA te enseña a pilotar camino de Fôrge. Las preguntas son de la asignatura.', tutorial: true,
    mezcla: { roca: 5, rocaG: 1, chatarra: 2, dron: 1, anillo: 3 }, ambiente: { niebla: 0x02030a } },
  { id: 'm1', n: 1, de: 1, a: 2, tema: 1, cuando: 'Al cerrar el tema 1', titulo: 'La tormenta de chatarra',
    lema: 'Los restos de las fundiciones de Fôrge flotan en la ruta a Ecos.',
    mezcla: { roca: 3, rocaG: 1, chatarra: 5, dron: 2, anillo: 2, enjambre: 1 }, ambiente: { niebla: 0x0b0612 } },
  { id: 'm2', n: 2, de: 2, a: 3, tema: 2, cuando: 'Al cerrar el tema 2', titulo: 'Los ecos que vuelven',
    lema: 'Las señales de Ecos rebotan: escuadrillas que vuelven una y otra vez.',
    mezcla: { roca: 2, dron: 3, enjambre: 3, anillo: 2 }, ambiente: { niebla: 0x03101a } },
  { id: 'm3', n: 3, de: 3, a: 4, tema: 3, cuando: 'Al cerrar el tema 3', titulo: 'Los 48 senderos',
    lema: 'Muros de roca: siempre hay un hueco, pero nunca en el mismo sitio.',
    mezcla: { muro: 3, roca: 2, dron: 2, anillo: 1 }, ambiente: { niebla: 0x06100a } },
  { id: 'm4', n: 4, de: 4, a: 5, tema: 4, cuando: 'Al cerrar el tema 4', titulo: 'Los anillos de Reliae',
    lema: 'Hielo y anillos: vuela limpio y recarga el escudo.',
    mezcla: { hielo: 5, hieloG: 1, anillo: 4, dron: 2 }, ambiente: { niebla: 0x04101c } },
  { id: 'm5', n: 5, de: 5, a: 6, tema: 5, cuando: 'Al cerrar el tema 5', titulo: 'La niebla de Umbral',
    lema: 'Casi no se ve nada. Y hay minas.',
    mezcla: { mina: 4, roca: 3, dron: 2, anillo: 1 }, ambiente: { niebla: 0x0b0b12, cerca: 40, lejos: 230 } },
  { id: 'm6', n: 6, de: 6, a: 7, tema: 6, cuando: 'Al cerrar el tema 6', titulo: 'El parque de Joran',
    lema: 'Joran dejó su parque de pruebas encendido: anillos y escuadrillas.',
    mezcla: { anillo: 4, enjambre: 3, dron: 2, roca: 2 }, ambiente: { niebla: 0x12061a } },
  { id: 'm7', n: 7, de: 7, a: 8, tema: 7, cuando: 'Al cerrar el tema 7', titulo: 'La formación de Vínculo',
    lema: 'La Estática ha aprendido a volar en escuadrilla.',
    mezcla: { enjambre: 4, dron: 4, mina: 1, roca: 2 }, ambiente: { niebla: 0x100408 } },
  { id: 'm8', n: 8, de: 8, a: 9, tema: 8, cuando: 'Al cerrar el tema 8', titulo: 'Las capas de Liminar',
    lema: 'La realidad parpadea: nada está donde parece.', glitch: true,
    mezcla: { dron: 3, enjambre: 2, mina: 2, muro: 2, roca: 2 }, ambiente: { niebla: 0x080010 } },
  { id: 'm9', n: 9, de: 9, a: 9, tema: 'final', cuando: 'Al final de la última sesión', titulo: 'Vaeon',
    lema: 'La batalla final: sus manos, su núcleo y su cabeza.', final: true, ambiente: { niebla: 0x02030a } },
];

// 🔴 En la web, lo que se CUENTA de cada misión (título, lema, cuándo) llega de _site_data.py → datos.js (lo escribe el
// build); aquí manda solo la jugabilidad. En el borrador no hay datos.js y se queda lo de arriba.
try { const D = await import('./datos.js?v=1d51f06d26'); for (const d of D.RUTA.misiones) { const m = MISIONES.find((x) => x.id === d.id); if (m) Object.assign(m, { titulo: d.titulo, lema: d.lema, cuando: d.cuando, tema: d.final ? 'final' : d.tema }); } } catch (e) { /* borrador: sin datos.js */ }

// el tramo que solo existe en el repaso: preguntas de los ocho temas, rumbo a la Estática
const VIAJE = { id: 'viaje', n: '∞', de: 0, a: 9, tema: 'todo', cuando: 'Simulador de vuelo', titulo: 'Todo el viaje',
  lema: 'Seis preguntas de los ocho temas, mezcladas, y todo lo que la Estática ha ido aprendiendo.',
  mezcla: { roca: 2, dron: 3, enjambre: 2, mina: 1, muro: 1, anillo: 2 }, ambiente: { niebla: 0x080010 } };

// ───────────────────────────────────────── motor gráfico
const lienzo = $('lienzo');
const render = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true });
render.setPixelRatio(Math.min(devicePixelRatio, 2));
render.toneMapping = THREE.ACESFilmicToneMapping;
render.outputColorSpace = THREE.SRGBColorSpace;
const escena = new THREE.Scene();
escena.background = new THREE.Color(0x02030a);
escena.fog = new THREE.Fog(0x02030a, 260, 700);
const camara = new THREE.PerspectiveCamera(62, 1, 0.1, 3000);
const cielo = new THREE.HemisphereLight(0x9fd8ff, 0x1a0b24, 0.9); escena.add(cielo);
const sol = new THREE.DirectionalLight(0xfff0d8, 2.4); sol.position.set(6, 10, 8); escena.add(sol);
const contra = new THREE.DirectionalLight(0x5ff4ff, 1.6); contra.position.set(-8, 4, -10); escena.add(contra);
function ajustar() { render.setSize(innerWidth, innerHeight, false); camara.aspect = innerWidth / innerHeight; camara.updateProjectionMatrix(); }
addEventListener('resize', ajustar); ajustar();

const texChispa = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,.7)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
// estrellas: se mueven hacia la cámara a la velocidad del mundo
const N_EST = 2600;
const estGeo = new THREE.BufferGeometry();
const estPos = new Float32Array(N_EST * 3);
for (let i = 0; i < N_EST; i++) { estPos[i * 3] = azar(-400, 400); estPos[i * 3 + 1] = azar(-260, 260); estPos[i * 3 + 2] = azar(-1200, 60); }
estGeo.setAttribute('position', new THREE.BufferAttribute(estPos, 3));
const estrellas = new THREE.Points(estGeo, new THREE.PointsMaterial({ color: 0xcfe9ff, size: 2.2, sizeAttenuation: true, fog: false, map: texChispa, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
escena.add(estrellas);

const cargador = new GLTFLoader();
const texturas = new THREE.TextureLoader();
// los modelos de Magnific miran hacia +x: `giro` los pone mirando hacia la cámara (+z) o hacia delante (-z)
function pivotar(obj0, medida, eje = 'y', giro = 0) {
  const piv = new THREE.Group();
  const obj = new THREE.Group(); obj.add(obj0); obj.rotation.y = giro; obj.updateMatrixWorld(true);
  const caja = new THREE.Box3().setFromObject(obj);
  const t = caja.getSize(new V3()), c = caja.getCenter(new V3());
  const k = medida / t[eje];
  obj.scale.setScalar(k); obj.position.copy(c.multiplyScalar(-k));
  piv.add(obj); return piv;
}
// un planeta a partir de su imagen de disco (proyectada a un mapa equirectangular, sin créditos)
const texPlaneta = {};
function esfera(k, r) {
  if (!texPlaneta[k]) { texPlaneta[k] = texturas.load(`tex/${k}.jpg`); texPlaneta[k].colorSpace = THREE.SRGBColorSpace; }
  const tex = texPlaneta[k];
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 64, 40), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.25 }));
  m.rotation.y = -Math.PI / 2;
  return m;
}
function sinNiebla(o) { o.traverse((x) => { if (x.material) { x.material = x.material.clone(); x.material.fog = false; } }); }

// ───────────────────────────────────────── sonido (sintetizado: 0 ficheros)
let actx = null;
function audio() { try { if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === 'suspended') actx.resume(); } catch (e) { /* sin audio */ } return actx; }
function tono(f0, f1, dur, tipo = 'square', vol = 0.06) {
  const a = audio(); if (!a) return; const o = a.createOscillator(), g = a.createGain();
  o.type = tipo; o.frequency.setValueAtTime(f0, a.currentTime); o.frequency.exponentialRampToValueAtTime(Math.max(f1, 1), a.currentTime + dur);
  g.gain.setValueAtTime(vol, a.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
  o.connect(g).connect(a.destination); o.start(); o.stop(a.currentTime + dur);
}
function ruido(dur, vol = 0.2, corte = 900) {
  const a = audio(); if (!a) return; const n = a.sampleRate * dur, b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2);
  const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
  f.type = 'lowpass'; f.frequency.value = corte; g.gain.value = vol; s.buffer = b; s.connect(f).connect(g).connect(a.destination); s.start();
}
const SON = {
  laser: () => tono(1400, 380, 0.09, 'square', 0.03),
  boom: () => ruido(0.5, 0.35, 700),
  grande: () => { ruido(1.2, 0.5, 400); tono(120, 30, 1, 'sawtooth', 0.08); },
  golpe: () => { ruido(0.25, 0.4, 2000); tono(200, 60, 0.25, 'sawtooth', 0.08); },
  anillo: () => { tono(660, 1320, 0.18, 'sine', 0.08); },
  bien: () => { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tono(f, f, 0.16, 'triangle', 0.09), i * 90)); },
  mal: () => { tono(180, 90, 0.5, 'sawtooth', 0.09); },
  tonel: () => tono(300, 900, 0.35, 'sine', 0.06),
  blindado: () => tono(2200, 1800, 0.05, 'triangle', 0.025),
  escuadrilla: () => { [784, 988, 1175].forEach((f, i) => setTimeout(() => tono(f, f * 1.01, 0.12, 'square', 0.05), i * 70)); },
  // Vaeon: el impacto en un cristal se tiene que OÍR (antes era el «blindado», casi mudo)
  impacto: () => { tono(1800, 700, 0.07, 'square', 0.05); ruido(0.08, 0.18, 4000); },
  carga: () => tono(120, 720, 1.1, 'sawtooth', 0.05),
  rayo: () => { ruido(0.6, 0.35, 2500); tono(90, 40, 0.6, 'sawtooth', 0.1); },
  rugido: () => { ruido(1.4, 0.45, 300); tono(70, 35, 1.4, 'sawtooth', 0.12); },
};
// ───────────────────────────────────────── LA BANDA SONORA DE VAEON (sintetizada con WebAudio: 0 ficheros, 0 licencias)
// 27-sep · Norberto: «genera una banda sonora de batalla más épica». Sin generadores de pago: se compone aquí, nota a
// nota, y suena igual en cualquier navegador. Re menor, progresión Rem – Si♭ – Sol m – La (la dominante mayor da la
// tensión), bajo en semicorcheas, bombo, caja, charles, cuerdas de fondo y, por fases, metales y melodía:
//   fase 1: bajo + batería + cuerdas · fase 2: +metales, +taikos, más rápido · fase 3: +melodía, charles a 16, un
//   semitono más arriba. Al romperse el último cristal, fanfarria en Re mayor.
// Programador con margen (lookahead de 0,15 s): las notas se encolan en el reloj del audio, no en el de la pantalla.
const BATALLA = (() => {
  let on = false, timer = null, sig = 0, paso = 0, fase = 1, master = null, ruidoB = null;
  const ACORDES = [[62, 65, 69], [58, 62, 65], [55, 58, 62], [57, 61, 64]]; // Rem, Si♭, Solm, La (MIDI)
  const RAIZ = [38, 34, 31, 33];
  const BAJO = [0, 0, 12, 0, 0, 0, 12, 0, 0, 0, 12, 0, 0, 12, 7, 12]; // el ostinato (semitonos sobre la raíz)
  // la melodía de la fase 3: 4 compases × 8 corcheas (null = silencio)
  const MELODIA = [74, null, 74, 77, 76, null, 74, 72, 70, null, 70, 74, 72, null, 69, null, 67, null, 70, 74, 72, 70, 69, 67, 69, null, 73, null, 76, null, 81, null];
  const hz = (n) => 440 * Math.pow(2, (n - 69 + (fase >= 3 ? 1 : 0)) / 12);
  const bpm = () => 128 + fase * 10;
  function ruidoBuf(a) { if (ruidoB) return ruidoB; const n = a.sampleRate, b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; return (ruidoB = b); }
  function env(a, g, t, vol, at, dur) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + at); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); }
  function osc(a, tipo, f, t, dur, vol, corte = 0, at = 0.005, det = 0) {
    const o = a.createOscillator(), g = a.createGain(); o.type = tipo; o.frequency.setValueAtTime(f, t); o.detune.value = det;
    let n = o; if (corte) { const fl = a.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.setValueAtTime(corte, t); fl.Q.value = 3; o.connect(fl); n = fl; }
    n.connect(g).connect(master); env(a, g, t, vol, at, dur); o.start(t); o.stop(t + dur + 0.05);
  }
  function golpeRuido(a, t, dur, vol, tipo, f) {
    const s = a.createBufferSource(), fl = a.createBiquadFilter(), g = a.createGain(); s.buffer = ruidoBuf(a);
    fl.type = tipo; fl.frequency.value = f; s.connect(fl).connect(g).connect(master); env(a, g, t, vol, 0.002, dur); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  }
  function bombo(a, t, vol = 0.9) { const o = a.createOscillator(), g = a.createGain(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(38, t + 0.18); o.connect(g).connect(master); env(a, g, t, vol, 0.002, 0.35); o.start(t); o.stop(t + 0.4); }
  function taiko(a, t) { const o = a.createOscillator(), g = a.createGain(); o.frequency.setValueAtTime(95, t); o.frequency.exponentialRampToValueAtTime(52, t + 0.3); o.connect(g).connect(master); env(a, g, t, 0.7, 0.004, 0.6); o.start(t); o.stop(t + 0.65); golpeRuido(a, t, 0.12, 0.25, 'lowpass', 900); }
  function nota(a, t, s16) {
    const c = Math.floor(paso / 16) % 4, i = paso % 16, raiz = RAIZ[c];
    // batería
    const bombos = fase === 1 ? [0, 8, 10] : fase === 2 ? [0, 6, 8, 10, 14] : [0, 4, 6, 8, 10, 12, 14];
    if (bombos.includes(i)) bombo(a, t);
    if (i === 4 || i === 12) { golpeRuido(a, t, 0.2, 0.45, 'bandpass', 1800); osc(a, 'triangle', 190, t, 0.12, 0.2); }
    if (fase >= 2 && i === 15 && c % 2 === 1) golpeRuido(a, t, 0.18, 0.3, 'bandpass', 1800); // redoble de entrada
    if (fase >= 3 || i % 2 === 0) golpeRuido(a, t, 0.04, i % 4 === 2 ? 0.16 : 0.09, 'highpass', 7000);
    if (fase >= 2 && c === 3 && (i === 12 || i === 14 || i === 15)) taiko(a, t);
    // bajo ostinato (sierra filtrada, dos osciladores un pelín desafinados)
    const fb = hz(raiz + BAJO[i]);
    osc(a, 'sawtooth', fb, t, s16 * 0.9, 0.2, 420 + fase * 120); osc(a, 'sawtooth', fb, t, s16 * 0.9, 0.12, 420 + fase * 120, 0.005, 9);
    // cuerdas de fondo: el acorde entero, una vez por compás
    if (i === 0) for (const n of ACORDES[c]) for (const det of [-8, 8]) osc(a, 'sawtooth', hz(n - 12), t, s16 * 16, 0.035, 1400, 0.25, det);
    // metales: golpes del acorde (fase 2+)
    if (fase >= 2 && (i === 0 || i === 3 || i === 6 || (fase >= 3 && i === 10))) for (const n of ACORDES[c]) osc(a, 'sawtooth', hz(n), t, s16 * 2.2, 0.05, 2400, 0.01);
    // melodía (fase 3): una octava de brillo, con un eco suave
    if (fase >= 3 && i % 2 === 0) { const m = MELODIA[c * 8 + i / 2]; if (m) { osc(a, 'square', hz(m), t, s16 * 1.9, 0.06, 3200, 0.01); osc(a, 'triangle', hz(m + 12), t + s16 * 3, s16 * 1.5, 0.025); } }
  }
  function programar() {
    const a = actx; if (!a || !on) return;
    while (sig < a.currentTime + 0.15) { const s16 = 60 / bpm() / 4; nota(a, sig, s16); sig += s16; paso++; }
  }
  return {
    empezar() {
      const a = audio(); if (!a) return; this.parar(true);
      master = a.createGain(); master.gain.value = 0.0001; const comp = a.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 4;
      master.connect(comp).connect(a.destination); master.gain.exponentialRampToValueAtTime(0.5, a.currentTime + 1.5);
      on = true; fase = 1; paso = 0; sig = a.currentTime + 0.1; timer = setInterval(programar, 25);
    },
    parar(ya = false) {
      on = false; clearInterval(timer); timer = null;
      if (master && actx) { const m = master; try { m.gain.cancelScheduledValues(actx.currentTime); m.gain.setValueAtTime(m.gain.value, actx.currentTime); m.gain.linearRampToValueAtTime(0, actx.currentTime + (ya ? 0.05 : 1.2)); } catch (e) { /* ya parado */ } setTimeout(() => m.disconnect(), ya ? 100 : 1400); }
      master = null;
    },
    // al subir de fase: redoble y subida de ruido (la tensión), y el patrón cambia en el siguiente compás
    fase(n) { fase = n; const a = actx; if (!a || !on) return; const t = a.currentTime; for (let i = 0; i < 8; i++) golpeRuido(a, t + i * 0.07, 0.1, 0.2 + i * 0.04, 'bandpass', 1500); paso = Math.ceil(paso / 16) * 16; },
    // durante las preguntas, más baja (hay que leer)
    suave(si) { if (master && actx) master.gain.setTargetAtTime(si ? 0.2 : 0.5, actx.currentTime, 0.3); },
    victoria() {
      const a = actx; if (!a || !on) return this.parar(); on = false; clearInterval(timer);
      const t = a.currentTime + 0.1; fase = 1;
      [[62, 66, 69, 0], [62, 66, 69, 0.25], [64, 67, 71, 0.5], [66, 69, 74, 0.75], [62, 66, 69, 1.1]].forEach(([x, y, z, d], k) => { for (const n of [x, y, z, x + 12]) osc(a, 'sawtooth', hz(n), t + d, k === 4 ? 2.4 : 0.22, 0.06, 3000, 0.01); bombo(a, t + d, 0.7); });
      const m = master; setTimeout(() => { if (m === master) this.parar(); }, 3800);
    },
  };
})();

// ───────────────────────────────────────── NEBULA en su ventanita
const comRender = new THREE.WebGLRenderer({ canvas: $('com-lienzo'), antialias: true, alpha: true });
comRender.outputColorSpace = THREE.SRGBColorSpace;
const comEscena = new THREE.Scene();
comEscena.add(new THREE.HemisphereLight(0xbff8ff, 0x0a1a2a, 1.6));
const comLuz = new THREE.DirectionalLight(0x9ff6ff, 2.2); comLuz.position.set(1, 1, 2); comEscena.add(comLuz);
const comCam = new THREE.PerspectiveCamera(30, 1, 0.01, 50);
let nebula = null, comHasta = 0, comHablando = 0;
function decir(texto, seg = 4.5) { $('com-t').textContent = texto; $('com').style.opacity = 1; comHasta = reloj + seg; comHablando = 1.2; }

// ───────────────────────────────────────── entrada
const teclas = {};
let raton = null, ratonVisto = -99, disparando = false, toque = false;
addEventListener('keydown', (e) => {
  teclas[e.code] = true;
  if (e.code === 'Space') { disparando = true; e.preventDefault(); }
  if (/^(ShiftLeft|ShiftRight|KeyQ|KeyE)$/.test(e.code)) tonel();
  if (e.code === 'KeyT') activarTurbo();
  if (e.code === 'KeyP' || e.code === 'Escape') pausar();
  if (/^(Arrow|Key[WASD])/.test(e.code)) ratonVisto = -99; // el teclado manda hasta que se mueva el ratón
});
addEventListener('keyup', (e) => { teclas[e.code] = false; if (e.code === 'Space') disparando = false; });
const leerPuntero = (e) => { raton = { x: e.clientX / innerWidth * 2 - 1, y: -(e.clientY / innerHeight * 2 - 1) }; ratonVisto = reloj; };
lienzo.addEventListener('pointermove', leerPuntero);
lienzo.addEventListener('pointerdown', (e) => { audio(); if (e.pointerType === 'touch') toque = true; disparando = true; leerPuntero(e); if (modo === 'mapa') clicMapa(); });
addEventListener('pointerup', () => { disparando = false; toque = false; });
lienzo.addEventListener('dblclick', () => tonel());
// en el móvil: dos dedos = tonel
lienzo.addEventListener('touchstart', (e) => { if (e.touches.length >= 2) tonel(); }, { passive: true });

// ───────────────────────────────────────── estado
let modo = 'carga', reloj = 0, pausa = false;
let M = null; // la misión en curso
const modelos = {};

// ───────────────────────────────────────── ASTEROIDES REALES (NASA, dominio público) + plan B generado
function ruido3(x, y, z, sem) {
  const h = (a, b, c) => { const n = Math.sin(a * 127.1 + b * 311.7 + c * 74.7 + sem * 13.3) * 43758.5453; return n - Math.floor(n); };
  const X = Math.floor(x), Y = Math.floor(y), Z = Math.floor(z), fx = x - X, fy = y - Y, fz = z - Z;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), w = fz * fz * (3 - 2 * fz);
  const l = (a, b, t) => a + (b - a) * t;
  return l(l(l(h(X, Y, Z), h(X + 1, Y, Z), u), l(h(X, Y + 1, Z), h(X + 1, Y + 1, Z), u), v),
           l(l(h(X, Y, Z + 1), h(X + 1, Y, Z + 1), u), l(h(X, Y + 1, Z + 1), h(X + 1, Y + 1, Z + 1), u), v), w);
}
function formaDeRoca(sem) {
  let g = new THREE.IcosahedronGeometry(1, 5); g.deleteAttribute('normal'); g.deleteAttribute('uv'); g = mergeVertices(g);
  const p = g.attributes.position, n = p.count, v = new V3(), col = new Float32Array(n * 3);
  const base = new THREE.Color().setHSL(azar(0.05, 0.09), azar(0.12, 0.25), 0.34);
  for (let i = 0; i < n; i++) {
    v.fromBufferAttribute(p, i).normalize();
    let f = 0, a = 1, fr = 1.3;
    for (let o = 0; o < 5; o++) { f += (ruido3(v.x * fr + 5, v.y * fr + 5, v.z * fr + 5, sem + o) - 0.5) * a; a *= 0.5; fr *= 2.1; }
    v.multiplyScalar(1 + f * 0.55); p.setXYZ(i, v.x, v.y, v.z);
    const luz = 0.75 + f * 0.9; col[i * 3] = base.r * luz; col[i * 3 + 1] = base.g * luz; col[i * 3 + 2] = base.b * luz;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
  return g;
}
let FORMAS = Array.from({ length: 4 }, (_, i) => formaDeRoca(i + 1));
const texFobos = texturas.load('tex/fobos.jpg'); texFobos.colorSpace = THREE.SRGBColorSpace;
const matRoca = new THREE.MeshStandardMaterial({ vertexColors: true, map: texFobos, roughness: 1, metalness: 0 });
const matHielo = new THREE.MeshStandardMaterial({ color: 0xbfe9ff, map: texFobos, roughness: 0.25, metalness: 0.1, emissive: 0x2a6f99, emissiveIntensity: 0.35 });
function prepararAsteroide(g0, sem) {
  let g = new THREE.BufferGeometry(); g.setAttribute('position', g0.attributes.position.clone());
  if (g0.index) g.setIndex(g0.index.clone());
  g.computeBoundingSphere(); const c = g.boundingSphere.center.clone(), r = g.boundingSphere.radius;
  g.translate(-c.x, -c.y, -c.z); g.scale(1 / r, 1 / r, 1 / r);
  g = mergeVertices(g, 1e-4);
  const p = g.attributes.position, n = p.count, uv = new Float32Array(n * 2), col = new Float32Array(n * 3), v = new V3();
  const base = new THREE.Color().setHSL(azar(0.05, 0.08), azar(0.1, 0.22), 0.62);
  for (let i = 0; i < n; i++) {
    v.fromBufferAttribute(p, i); const d = v.clone().normalize();
    uv[i * 2] = 0.5 + Math.atan2(d.z, d.x) / (Math.PI * 2); uv[i * 2 + 1] = 0.5 + Math.asin(THREE.MathUtils.clamp(d.y, -1, 1)) / Math.PI;
    const f = 0.8 + (ruido3(v.x * 4 + 3, v.y * 4 + 3, v.z * 4 + 3, sem) - 0.5) * 0.5;
    col[i * 3] = base.r * f; col[i * 3 + 1] = base.g * f; col[i * 3 + 2] = base.b * f;
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.computeVertexNormals(); g.computeBoundingSphere();
  return g;
}
async function cargarAsteroides() {
  const stl = new STLLoader(), nombres = ['geographos', 'kleopatra', 'toutatis', 'mithra', 'golevka', 'hw1'];
  const geos = await Promise.all(nombres.map((k) => new Promise((ok) => stl.load(`modelos/asteroides/${k}.stl`, ok, undefined, () => ok(null)))));
  const bennu = await new Promise((ok) => cargador.load('modelos/asteroides/bennu.glb', (g) => { let geo = null; g.scene.updateMatrixWorld(true); g.scene.traverse((o) => { if (o.isMesh && !geo) geo = o.geometry.clone().applyMatrix4(o.matrixWorld); }); ok(geo); }, undefined, () => ok(null)));
  const listas = [...geos, bennu].filter(Boolean).map((g, i) => prepararAsteroide(g, i + 1));
  if (listas.length) FORMAS = listas;
}
function roca(r, hielo = false) {
  const m = new THREE.Mesh(elegir(FORMAS), hielo ? matHielo : matRoca);
  m.scale.set(r * azar(0.85, 1.15), r * azar(0.85, 1.15), r * azar(0.85, 1.15));
  m.rotation.set(azar(0, 6), azar(0, 6), azar(0, 6));
  return m;
}
// chatarra: restos de satélite
const texPanel = (() => { const c = document.createElement('canvas'); c.width = 256; c.height = 128; const x = c.getContext('2d');
  x.fillStyle = '#0b1f3d'; x.fillRect(0, 0, 256, 128); x.strokeStyle = '#6fa8ff'; x.lineWidth = 2;
  for (let i = 0; i <= 256; i += 32) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 128); x.stroke(); }
  for (let j = 0; j <= 128; j += 32) { x.beginPath(); x.moveTo(0, j); x.lineTo(256, j); x.stroke(); }
  x.fillStyle = 'rgba(0,0,0,.55)'; x.beginPath(); x.moveTo(160, 0); x.lineTo(256, 0); x.lineTo(256, 128); x.lineTo(200, 128); x.closePath(); x.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const matMetal = new THREE.MeshStandardMaterial({ color: 0xb4bcc8, metalness: 0.85, roughness: 0.35 });
const matOro = new THREE.MeshStandardMaterial({ color: 0xd9a441, metalness: 1, roughness: 0.3 });
const matPanel = new THREE.MeshStandardMaterial({ map: texPanel, metalness: 0.4, roughness: 0.4, side: THREE.DoubleSide, emissive: 0x0a2244, emissiveIntensity: 0.4 });
function chatarra() {
  const g = new THREE.Group();
  const cuerpo = new THREE.Mesh(new THREE.CapsuleGeometry(0.7, azar(1.2, 2), 6, 14), Math.random() < 0.5 ? matMetal : matOro); cuerpo.rotation.z = Math.PI / 2; g.add(cuerpo);
  const brazo = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.6, 8), matMetal); brazo.position.x = 1.6; brazo.rotation.z = Math.PI / 2; g.add(brazo);
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(azar(2.4, 3.4), 1.4), matPanel); panel.position.x = 3.3; panel.rotation.x = azar(-0.6, 0.6); g.add(panel);
  const plato = new THREE.Mesh(new THREE.SphereGeometry(0.6, 20, 10, 0, Math.PI * 2, 0, Math.PI / 3), matMetal); plato.position.set(-1.4, 0.3, 0); plato.rotation.z = Math.PI / 2; g.add(plato);
  const luz = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), new THREE.MeshBasicMaterial({ color: 0xff8a3c })); luz.position.set(0, 0.72, 0); g.add(luz);
  g.userData.luz = luz;
  return g;
}
function dron(escala = 1) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.OctahedronGeometry(1.3), new THREE.MeshStandardMaterial({ color: 0x160c24, emissive: 0x6a1bff, emissiveIntensity: 0.6, flatShading: true })));
  const w = new THREE.Mesh(new THREE.OctahedronGeometry(1.75), new THREE.MeshBasicMaterial({ color: 0x5ff4ff, wireframe: true, transparent: true, opacity: 0.7 }));
  g.add(w); g.userData.w = w;
  const ojo = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 8), new THREE.MeshBasicMaterial({ color: 0xff3d6b })); ojo.position.z = 1.2; g.add(ojo);
  g.scale.setScalar(escala);
  return g;
}
const geoPua = new THREE.ConeGeometry(0.28, 1.1, 8);
function mina() {
  const g = new THREE.Group(), mat = new THREE.MeshStandardMaterial({ color: 0x5a3038, metalness: 0.7, roughness: 0.35, emissive: 0x7a0a18, emissiveIntensity: 0.6 });
  g.add(new THREE.Mesh(new THREE.SphereGeometry(1.1, 20, 14), mat));
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: texChispa, color: 0xff3b3b, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.55 })); halo.scale.setScalar(5.5); g.add(halo); g.userData.halo = halo;
  for (const d of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1], [0.7, 0.7, 0], [-0.7, -0.7, 0]]) {
    const p = new THREE.Mesh(geoPua, mat); const v = new V3(...d).normalize();
    p.position.copy(v.clone().multiplyScalar(1.2)); p.quaternion.setFromUnitVectors(new V3(0, 1, 0), v); g.add(p);
  }
  const luz = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8), new THREE.MeshBasicMaterial({ color: 0xff2e2e })); luz.position.z = 1.05; g.add(luz);
  g.userData.luz = luz; return g;
}
function anillo() {
  return new THREE.Mesh(new THREE.TorusGeometry(3, 0.28, 10, 40), new THREE.MeshStandardMaterial({ color: 0xffc24a, emissive: 0xffa800, emissiveIntensity: 1.4, metalness: 0.6 }));
}

// ───────────────────────────────────────── EL MAPA
const mapa = new THREE.Group(); escena.add(mapa);
const nodosMapa = [];
let naveMapa = null, elegido = null, marcasMapa = {}, repasoMapa = {};
const lineasMapa = [];
const COLOR_MED = { nada: 0x3b5266, bronce: 0xe0945a, plata: 0xcfe3f0, oro: 0xffd54a };
function posNodo(i) {
  if (i === 0) return new V3(-11.2, -1.4, -2.2);
  if (i === 9) return new V3(11.3, 1.1, -3);
  const t = (i - 1) / 7;
  return new V3(-8.4 + t * 15.4, Math.sin(t * Math.PI * 2) * 1.5 - 0.3, -2 - Math.cos(t * Math.PI) * 1.2);
}
function montarMapa() {
  NODOS.forEach((p, i) => {
    const g = new THREE.Group();
    let cuerpo;
    if (p.nave) { cuerpo = modelos.nave.clone(); cuerpo.scale.setScalar(0.45); cuerpo.rotation.y = -0.6; }
    else if (p.glb) cuerpo = modelos.forge.clone();
    else cuerpo = esfera(p.k, p.grande ? 1.3 : 0.5);
    g.add(cuerpo);
    if (p.anillo) { const r = new THREE.Mesh(new THREE.RingGeometry(0.7, 1.05, 64), new THREE.MeshBasicMaterial({ color: 0xffc24a, side: THREE.DoubleSide, transparent: true, opacity: 0.6 })); r.rotation.x = Math.PI / 2.6; g.add(r); }
    g.position.copy(posNodo(i));
    g.userData = { p, i, cuerpo };
    mapa.add(g); nodosMapa.push(g);
    const e = document.createElement('div'); e.className = 'etq'; $('etiquetas').appendChild(e); g.userData.etq = e;
  });
  for (let i = 0; i < 9; i++) {
    const geo = new THREE.BufferGeometry().setFromPoints([posNodo(i), posNodo(i + 1)]);
    const l = new THREE.Line(geo, new THREE.LineDashedMaterial({ color: COLOR_MED.nada, dashSize: 0.25, gapSize: 0.18, transparent: true, opacity: 0.9 }));
    l.computeLineDistances(); mapa.add(l); lineasMapa.push(l);
  }
  naveMapa = modelos.nave.clone(); naveMapa.scale.multiplyScalar(0.22); mapa.add(naveMapa);
}
const medDe = (id) => (marcasMapa[id] && marcasMapa[id].medalla) || 'nada';
const NOMBRE_MED = { nada: 'Sin medalla', bronce: 'Bronce', plata: 'Plata', oro: 'Oro' };
function pintarEtiquetas() {
  nodosMapa.forEach((g) => {
    const { p, i } = g.userData;
    const llegan = MISIONES.filter((m) => m.a === i);
    g.userData.etq.innerHTML = `<b>${esc(p.n)}</b>${llegan.map((m) => `<span class="med ${medDe(m.id)}">${m.final ? 'Vaeon · ' : ''}${NOMBRE_MED[medDe(m.id)]}</span>`).join('<br>')}`;
  });
  lineasMapa.forEach((l, i) => l.material.color.set(COLOR_MED[medDe(MISIONES[i].id)]));
}
async function entrarMapa() {
  if (EMBED) return;
  modo = 'mapa'; limpiarMision(); mapa.visible = true; ponerAmbiente(MISIONES[0].ambiente);
  escena.fog.near = 260; escena.fog.far = 700;
  $('hud').classList.add('oculto'); $('mapa-ui').classList.remove('oculto'); $('pantalla').classList.add('oculto');
  camara.position.set(0, 1.2, 12); camara.lookAt(0, 0, -2);
  BATALLA.parar();
  marcasMapa = await SERVIDOR.marcas(); if (REPASO) repasoMapa = await SERVIDOR.repaso(); pintarEtiquetas();
  // la nave espera en la primera misión sin medalla
  const sig = MISIONES.find((m) => medDe(m.id) === 'nada') || MISIONES[9];
  elegirNodo(nodosMapa[sig.a]);
}
function elegirNodo(g) {
  elegido = g; const { i } = g.userData, f = $('ficha-planeta');
  // la Cero no es destino de nadie: pulsarla abre la primera misión (la que sale de ella)
  const llegan = i === 0 ? [MISIONES[0]] : MISIONES.filter((m) => m.a === i);
  f.classList.remove('oculto');
  const mejor = (id) => Math.max(0, ...Object.keys(NIVELES).map((k) => repasoMapa[id + '|' + k] || 0));
  f.innerHTML = llegan.map((m) => `<div class="mis"><div><div class="cuando">Misión ${m.n} · ${esc(m.cuando)}</div><h3>${esc(m.final ? 'Vaeon · la batalla final' : NODOS[m.de].n + ' → ' + NODOS[m.a].n + ' · ' + m.titulo)}</h3><p>${esc(m.lema)}</p>${REPASO ? `<span class="med">Tu mejor repaso: ${mejor(m.id).toLocaleString('es-ES')}</span>` : `<span class="med ${medDe(m.id)}">${NOMBRE_MED[medDe(m.id)]}</span>`}</div><button data-m="${m.id}">${REPASO ? 'Repasar' : 'Despegar'}</button></div>`).join('');
  f.querySelectorAll('[data-m]').forEach((b) => { b.onclick = () => { audio(); briefing(MISIONES.find((m) => m.id === b.dataset.m)); }; });
}
const rayo = new THREE.Raycaster();
function clicMapa() {
  if (!raton) return;
  rayo.setFromCamera(new THREE.Vector2(raton.x, raton.y), camara);
  const hit = rayo.intersectObjects(nodosMapa, true)[0];
  if (!hit) return;
  let o = hit.object; while (o && !nodosMapa.includes(o)) o = o.parent;
  if (o) elegirNodo(o);
}
function tickMapa(dt) {
  nodosMapa.forEach((g, i) => {
    if (!g.userData.p.nave) g.userData.cuerpo.rotation.y += dt * (0.25 + i * 0.02);
    const sel = g === elegido, s = sel ? 1.3 : 1; g.scale.lerp(new V3(s, s, s), 0.12);
    const v = g.position.clone().add(new V3(0, g.userData.p.grande ? -1.8 : -1.0, 0)).project(camara);
    const e = g.userData.etq; e.style.left = (v.x * 0.5 + 0.5) * innerWidth + 'px'; e.style.top = (-v.y * 0.5 + 0.5) * innerHeight + 'px';
    e.style.opacity = sel ? 1 : 0.8;
  });
  if (elegido && naveMapa) {
    const obj = elegido.position.clone().add(new V3(0, 1.15 + Math.sin(reloj * 2) * 0.1, 0.9));
    naveMapa.position.lerp(obj, 0.05); naveMapa.rotation.y = Math.PI * 0.5 + Math.sin(reloj) * 0.3;
  }
  // que quepan de la Cero a la Estática sea cual sea el ancho de la pantalla
  const dist = Math.max(12, 13.9 / (Math.tan(THREE.MathUtils.degToRad(camara.fov / 2)) * camara.aspect)) + 2;
  camara.position.set(Math.sin(reloj * 0.15) * 0.6, 1.2 + dist * 0.05, dist - 2);
  camara.lookAt(0, 0, -2);
}

// ───────────────────────────────────────── briefing
function pantalla(html) { $('pantalla').classList.remove('oculto'); $('pantalla-caja').innerHTML = html; }
function teclasHTML() {
  return matchMedia('(pointer: coarse)').matches
    ? '<div class="teclas"><kbd>Arrastra el dedo</kbd><span>La nave te sigue y dispara mientras tocas</span><kbd>Dos dedos</kbd><span>Tonel: esquivas los disparos un instante</span><kbd>Botón TURBO</kbd><span>¿Lo tienes claro? Cruza tu puerta ya (+250 si aciertas)</span></div>'
    : '<div class="teclas"><kbd>Ratón / WASD / flechas</kbd><span>Pilotar</span><kbd>Clic / Espacio (mantén)</kbd><span>Disparar</span><kbd>Mayús / Q / E / doble clic</kbd><span>Tonel: esquivas los disparos un instante</span><kbd>T / botón TURBO</kbd><span>¿Lo tienes claro? Cruza tu puerta ya (+250 si aciertas)</span></div>';
}
const titMision = (m) => m.final ? 'Vaeon · la batalla final' : m.tema === 'todo' ? 'Todo el viaje' : NODOS[m.de].n + ' → ' + NODOS[m.a].n;
async function briefing(m) {
  $('mapa-ui').classList.add('oculto');
  if (REPASO) { // el Simulador de vuelo: se elige el nivel; no hay premio
    const mejores = await SERVIDOR.repaso();
    pantalla(`<div class="kicker">Simulador de vuelo · repaso</div>
    <h2>${esc(titMision(m))}</h2>
    <p><b>${esc(m.titulo)}.</b> ${esc(m.lema)}</p>
    <div class="niveles">${Object.entries(NIVELES).map(([k, v]) => `<button class="nivel${k === NIVEL ? ' si' : ''}" data-nivel="${k}"><b>${v.n} <em>×${String(v.mult).replace('.', ',')}</em></b><span>${esc(v.que)}</span><small>Tu mejor marca: ${(mejores[m.id + '|' + k] || 0).toLocaleString('es-ES')}</small></button>`).join('')}</div>
    ${teclasHTML()}
    <p style="font-size:15px">El repaso <b>no da xp ni créditos</b>: tu marca (tus puntos × el nivel) va al ranking del Simulador de vuelo en la sala de Joran.</p>
    <div class="botones"><button id="b-ya">¡Despegar!</button><button class="sec" id="b-mapa">Volver al mapa</button></div>`);
    document.querySelectorAll('[data-nivel]').forEach((b) => { b.onclick = () => { NIVEL = b.dataset.nivel; document.querySelectorAll('[data-nivel]').forEach((x) => x.classList.toggle('si', x === b)); }; });
  } else if (ACADEMIA) {
    const quedan = ACA.pendientes.size;
    pantalla(`<div class="kicker">Academia de la Cero · rumbo a ${esc(NODOS[m.a].n)}</div>
    <h2>Las preguntas, en las puertas</h2>
    <p>${quedan ? `Te esperan <b>${quedan === 1 ? 'una pregunta' : quedan + ' preguntas'}</b> de este planeta. Cuando llegue una, el tiempo se frena: vuela hacia la puerta de la respuesta buena. La que falles <b>vuelve a salir</b> más adelante; cuando las aciertes todas, sesión superada.` : 'Ya las has acertado todas: vuela por gusto.'}</p>
    <p><b>Aquí no puedes perder:</b> en la Academia tienes vidas ilimitadas, para que nadie se quede atascado. Tu alumnado, en la sala de Joran, sí las tendrá limitadas.</p>
    ${teclasHTML()}
    <div class="botones"><button id="b-ya">¡Despegar!</button></div>`);
  } else {
    const tabla = ['bronce', 'plata', 'oro'].map((e) => `<span class="med ${e}">${NOMBRE_MED[e]} +${PREMIOS[e].xp} xp +${PREMIOS[e].cr} ◈</span>`).join(' ');
    pantalla(`<div class="kicker">Misión ${m.n} · ${esc(m.cuando)}</div>
    <h2>${esc(titMision(m))}</h2>
    <p><b>${esc(m.titulo)}.</b> ${esc(m.lema)}</p>
    <p>${m.final ? 'Rompe los cristales de sus manos. Cada vez que caiga un punto débil, una pregunta: si aciertas se abre el siguiente (núcleo y cabeza, y el golpe final); si fallas, se regenera. Y cada pocos segundos lanza una descarga de la Estática: otra pregunta (acertar recarga el escudo).' : 'Unas diez veces el tiempo se ralentiza y llegan puertas con respuestas: <b>atraviesa la correcta</b> (si hay dos huecos, dos tandas de puertas). La puerta que se ilumina en blanco es la que vas a cruzar, no la buena. Llegar ya es medalla de bronce.'}</p>
    ${teclasHTML()}
    <p style="font-size:15px"><b style="color:var(--ambar)">SABER</b> da xp y <b style="color:var(--cian)">PERICIA</b> da créditos; el oro pide las dos. Cada medalla se cobra una vez: ${tabla}</p>
    <div class="botones"><button id="b-ya">¡Despegar!</button>${EMBED ? '' : '<button class="sec" id="b-mapa">Volver al mapa</button>'}</div>`);
  }
  $('b-ya').onclick = () => { audio(); $('pantalla').classList.add('oculto'); empezar(m); };
  if ($('b-mapa')) $('b-mapa').onclick = () => entrarMapa();
}

// ───────────────────────────────────────── LA MISIÓN
const VEL = 44;              // velocidad del mundo (u/s)
const LIM = { x: 15, yMin: -7, yMax: 8 };
const LIM_NORMAL = { ...LIM }, LIM_JEFE = { x: 21, yMin: -13, yMax: 12 };
const TOPE_MS = 4 * 60 * 1000; // nunca más de 4 minutos
let nave = null, motores = null;
const cosas = [], laseres = [], balas = [], chispas = [];
const matLaser = new THREE.MeshBasicMaterial({ color: 0x7dffb0 });
const geoLaser = new THREE.CylinderGeometry(0.09, 0.09, 3.2, 6); geoLaser.rotateX(Math.PI / 2);
const matBala = new THREE.MeshBasicMaterial({ color: 0xff3d6b });
const geoBala = new THREE.SphereGeometry(0.45, 10, 8);

function ponerAmbiente(a) {
  const c = new THREE.Color(a.niebla || 0x02030a);
  escena.background = c.clone().multiplyScalar(0.6); escena.fog.color.copy(c);
  escena.fog.near = a.cerca || 200; escena.fog.far = a.lejos || 620;
}
function nuevaMision(m) {
  return {
    m, tipo: m.final ? 'final' : 'ruta', t: 0, juego: 0, lenta: 1, lentaObj: 1, escudo: 100, saber: 0, pericia: 0, combo: 0, maxCombo: 0,
    disparos: 0, impactos: 0, derribos: 0, anillos: 0, daño: 0, aciertos: 0, preguntas: 0, racha: 0, maxRacha: 0,
    doble: 0, tonel: -1, cadencia: 0, sigSpawn: 2, pregunta: null, fin: false, pos: new V3(0, 0, 0), velN: new V3(), velK: new V3(), sacudida: 0,
    preguntasCola: [], partida: null, momentos: [], duracion: duracionDe(m, m.tema === 'todo' ? 12 : 10), guion: m.tutorial ? GUION_TUTORIAL.slice() : [],
    escuadrillas: {}, inicio: performance.now(), llegando: null,
  };
}
// Cuándo llegan las puertas (en segundos de vuelo). 28-sep · Norberto: «un estudiante debería responder entre 6 y 14
// preguntas por partida; lo ideal, 10». CUÁNTAS las decide el servidor (RUTA.PREGUNTAS…: 10, 12 en todo el viaje);
// aquí solo se reparten, una cada HUECO_PREG segundos de vuelo, y el vuelo dura lo que haga falta para todas.
const HUECO_PREG = 11;
const primeraPregunta = (m) => (m.tutorial ? 24 : 14);
function momentosDe(m, n) { return Array.from({ length: n }, (_, i) => primeraPregunta(m) + i * HUECO_PREG); }
function duracionDe(m, n) { return primeraPregunta(m) + Math.max(0, n - 1) * HUECO_PREG + 14; }
const GUION_TUTORIAL = [
  { t: 1, txt: 'Aquí NEBULA. Es tu primer vuelo: mueve el ratón (o el dedo) y la nave te sigue.' },
  { t: 7, txt: 'Mantén pulsado el clic, o Espacio, para disparar. Rompe esas rocas.' },
  { t: 15, txt: '¿Ves los anillos dorados? Crúzalos: recargan tu escudo y suman pericia.' },
  { t: 22, txt: 'Viene una pregunta. El tiempo se frena: vuela hacia la puerta de la respuesta buena.' },
  { t: 31, txt: 'Truco de piloto: Mayús, Q o doble clic hacen un tonel. Esquivas los disparos.' },
  { t: 75, txt: 'Los drones de la Estática disparan. Si destruyes varios seguidos, sube tu combo.' },
  { t: 128, txt: 'Fôrge a la vista. ¡Ya casi estamos!' },
];
async function empezar(mis) {
  limpiarMision(); mapa.visible = false; $('mapa-ui').classList.add('oculto');
  M = nuevaMision(mis); modo = 'mision';
  Object.assign(LIM, mis.final ? LIM_JEFE : LIM_NORMAL);
  ponerAmbiente(mis.ambiente || {});
  $('hud').classList.remove('oculto'); $('pregunta').classList.add('oculto');
  $('prog').classList.toggle('oculto', !!mis.final); $('jefe').classList.toggle('oculto', !mis.final);
  $('mision-t').textContent = (REPASO ? `REPASO ${NIVELES[NIVEL].n.toUpperCase()} · ` : `MISIÓN ${mis.n} · `) + mis.titulo.toUpperCase();
  $('prog-t').textContent = mis.final ? '' : `Rumbo a ${NODOS[mis.a].n}`;
  if (!nave) {
    nave = modelos.nave.clone();
    // el brillo de los motores
    motores = new THREE.Group();
    for (const x of [-0.75, 0.75]) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: texChispa, color: 0x6fe8ff, blending: THREE.AdditiveBlending, depthWrite: false })); s.position.set(x, -0.1, 2.6); s.scale.setScalar(0.7); s.material.opacity = 0.75; motores.add(s); }
    nave.add(motores);
  }
  nave.position.set(0, 0, 0); nave.visible = true; escena.add(nave);
  const d = NODOS[mis.a];
  if (mis.final) {
    M.destino = esfera('estatica', 260); M.destino.position.set(-120, 60, -1500); sinNiebla(M.destino); escena.add(M.destino);
    montarVaeon(); BATALLA.empezar();
    decir('Es Vaeon. Los cristales de sus manos son su punto débil: apunta al aro rosa y, cuando la mira se ponga rosa, dispara sin parar.', 8);
  } else {
    M.destino = d.glb ? modelos.forge.clone() : esfera(d.k, 1);
    M.destinoBase = d.glb ? 60 : 55; M.destino.scale.setScalar(M.destinoBase);
    if (d.anillo) { const r = new THREE.Mesh(new THREE.RingGeometry(1.4, 2.1, 96), new THREE.MeshBasicMaterial({ color: 0xffc24a, side: THREE.DoubleSide, transparent: true, opacity: 0.55 })); r.rotation.x = Math.PI / 2.5; M.destino.scale.setScalar(1); M.destino = new THREE.Group().add(M.destino, r); M.destino.scale.setScalar(M.destinoBase); }
    M.destino.position.set(40, 30, -1100); sinNiebla(M.destino); escena.add(M.destino);
    if (!mis.tutorial) decir(`Rumbo a ${d.n}. ${mis.lema}`, 5);
  }
  aviso(mis.final ? 'VAEON' : d.n.toUpperCase(), '#5ff4ff', 2.2);
  // las preguntas las da «el servidor» (sin la respuesta)
  const r = ACADEMIA ? { partida: null, preguntas: barajar(ACA.qs.filter((q) => ACA.pendientes.has(q.id))).map(preguntaAcademia) }
    : await SERVIDOR.empezar(mis, { nivel: NIVEL });
  if (!M || M.m !== mis) return;
  M.partida = r.partida; M.preguntasCola = r.preguntas;
  if (!mis.final) { const n = r.preguntas.length; M.momentos = momentosDe(mis, n).filter((t) => t > M.juego); M.duracion = duracionDe(mis, n); }
}
function limpiarMision() {
  for (const c of cosas.splice(0)) escena.remove(c.obj);
  for (const l of laseres.splice(0)) escena.remove(l);
  for (const b of balas.splice(0)) escena.remove(b.obj);
  for (const c of chispas.splice(0)) escena.remove(c.obj);
  if (M && M.destino) escena.remove(M.destino);
  if (M && M.vaeon) { escena.remove(M.vaeon.piv); for (const o of M.vaeon.extras) escena.remove(o); for (const p of Object.values(M.vaeon.puntos)) p.div.remove(); }
  BATALLA.parar();
  if (nave) escena.remove(nave);
  $('pregunta').classList.add('oculto');
  M = null;
}
let avisoHasta = 0;
function aviso(t, color = '#fff', seg = 1.4) { const a = $('aviso'); a.textContent = t; a.style.color = color; a.classList.add('ver'); avisoHasta = reloj + seg; }

// ── oleadas
function poner(tipo, x, y, z = -330, extra = {}) {
  let obj, c;
  if (tipo === 'roca' || tipo === 'rocaG' || tipo === 'hielo' || tipo === 'hieloG') {
    const grande = tipo.endsWith('G'), r = grande ? azar(2.8, 3.6) : azar(1.2, 1.9);
    obj = roca(r, tipo.startsWith('hielo'));
    c = { r: r * 1.0, hp: grande ? 4 : 1, pts: grande ? 120 : 50, gira: new V3(azar(-1, 1), azar(-1, 1), azar(-1, 1)), grande };
  } else if (tipo === 'chatarra') { obj = chatarra(); c = { r: 2.4, hp: 2, pts: 80, gira: new V3(azar(-2, 2), azar(-2, 2), azar(-2, 2)) }; }
  else if (tipo === 'dron') { obj = dron(); c = { r: 1.9, hp: 2, pts: 150, fase: azar(0, 6), disparo: azar(1.5, 3), bx: x }; }
  else if (tipo === 'mini') { obj = dron(0.6); c = { r: 1.3, hp: 1, pts: 90, fase: extra.fase || 0, disparo: azar(3, 6), bx: x, grupo: extra.grupo }; }
  else if (tipo === 'mina') { obj = mina(); obj.scale.setScalar(1.3); c = { r: 2, hp: 1, pts: 100, gira: new V3(0.3, 0.6, 0) }; }
  else if (tipo === 'anillo') { obj = anillo(); c = { r: 0, hp: Infinity, anillo: true }; }
  obj.position.set(x, y, z); escena.add(obj);
  const cosa = { tipo, obj, ...c }; cosas.push(cosa); return cosa;
}
function oleada() {
  const f = Math.min(1, M.juego / 90), mez = M.m.mezcla, suma = Object.values(mez).reduce((a, b) => a + b, 0);
  let r = Math.random() * suma, tipo = 'roca';
  for (const [k, w] of Object.entries(mez)) { if ((r -= w) <= 0) { tipo = k; break; } }
  const tut = M.m.tutorial ? 0.6 : 1;
  if (tipo === 'roca' || tipo === 'hielo') for (let i = 0; i < Math.max(1, Math.round((2 + f * 3) * tut)); i++) poner(Math.random() < 0.18 ? tipo + 'G' : tipo, azar(-LIM.x, LIM.x), azar(LIM.yMin, LIM.yMax), -330 - i * 18);
  else if (tipo === 'rocaG' || tipo === 'hieloG' || tipo === 'chatarra' || tipo === 'mina') { const n = tipo === 'mina' ? 2 + Math.floor(f * 2) : 1; for (let i = 0; i < n; i++) poner(tipo, azar(-LIM.x, LIM.x), azar(LIM.yMin, LIM.yMax), -330 - i * 30); }
  else if (tipo === 'dron') { const n = Math.max(1, Math.round((2 + f * 2) * tut)), lado = Math.random() < 0.5 ? -1 : 1; for (let i = 0; i < n; i++) poner('dron', lado * azar(4, 12), azar(-3, 6), -320 - i * 26); }
  else if (tipo === 'enjambre') {
    const g = 'e' + Math.random().toString(36).slice(2, 7), bx = azar(-8, 8), by = azar(-3, 5);
    M.escuadrillas[g] = { total: 5, caidos: 0 };
    [[0, 0, 0], [-2.4, -1, 14], [2.4, -1, 14], [-4.8, -2, 28], [4.8, -2, 28]].forEach(([dx, dy, dz], i) => poner('mini', bx + dx, by + dy, -330 - dz, { grupo: g, fase: i * 0.3 }));
  } else if (tipo === 'muro') {
    // un muro de rocas con un hueco (y un anillo en el hueco): hay que buscar el sendero
    const hx = Math.floor(azar(0, 6)), hy = Math.floor(azar(0, 3));
    for (let ix = 0; ix < 7; ix++) for (let iy = 0; iy < 4; iy++) {
      if ((ix === hx || ix === hx + 1) && (iy === hy || iy === hy + 1)) continue;
      const c = poner('roca', -15 + ix * 5 + azar(-0.4, 0.4), -6.5 + iy * 4.8 + azar(-0.4, 0.4), -330 + azar(-1.5, 1.5), {}); c.hp = 3; c.muro = true; c.obj.scale.multiplyScalar(3.1 / Math.max(1.2, c.r)); c.r = 2.5; c.gira.multiplyScalar(0.3);
    }
    poner('anillo', -15 + (hx + 0.5) * 5, -6.5 + (hy + 0.5) * 4.8, -330);
    M.sigSpawn = 3.2; return;
  } else if (tipo === 'anillo') poner('anillo', azar(-10, 10), azar(-4, 6));
  M.sigSpawn = (azar(1.1, 2.0) - f * 0.5) / tut / (NIVEL ? NIVELES[NIVEL].ritmo : 1);
}

// ── la nave
function tonel() { if (!M || M.tonel > -0.4 || modo !== 'mision' || M.fin) return; M.tonel = 0.7; SON.tonel(); }
function disparar() {
  const n = M.doble > 0 ? [-1.1, 1.1] : [0];
  const fijo = M.vaeon ? blancoVaeon() : null;
  for (const dx of n) { const l = new THREE.Mesh(geoLaser, matLaser); l.position.copy(nave.position).add(new V3(dx, 0.1, -2.5)); l.userData.blanco = fijo && fijo.k; escena.add(l); laseres.push(l); }
  M.disparos++; SON.laser();
}
function moverNave(dt) {
  const antes = M.pos.clone();
  if (raton && reloj - ratonVisto < 3) { // ratón y dedo: la nave persigue el puntero (sin cambios)
    let tx = raton.x * LIM.x * 1.1, ty = raton.y * (LIM.yMax - LIM.yMin) * 0.55 + (LIM.yMax + LIM.yMin) / 2;
    tx = THREE.MathUtils.clamp(tx, -LIM.x, LIM.x); ty = THREE.MathUtils.clamp(ty, LIM.yMin, LIM.yMax);
    M.pos.x += (tx - M.pos.x) * Math.min(1, dt * 7); M.pos.y += (ty - M.pos.y) * Math.min(1, dt * 7);
    M.velK.set(0, 0, 0);
  } else {
    // 27-sep · Norberto: «con el teclado la nave va muy lenta». Antes la tecla movía un objetivo que la nave perseguía
    // con retardo (≈ 3 u/s de verdad). Ahora el teclado da VELOCIDAD: cruza la pantalla en algo más de medio segundo,
    // acelera en un suspiro y frena casi en seco al soltar (si no, patina y no se puede apuntar).
    const kx = (teclas.KeyD || teclas.ArrowRight ? 1 : 0) - (teclas.KeyA || teclas.ArrowLeft ? 1 : 0);
    const ky = (teclas.KeyW || teclas.ArrowUp ? 1 : 0) - (teclas.KeyS || teclas.ArrowDown ? 1 : 0);
    const vmax = LIM.x * 3.2; // 48 u/s en la ruta, 67 contra Vaeon (su escenario es más ancho)
    const f = Math.min(1, dt * ((kx || ky) ? 14 : 18));
    M.velK.x += (kx * vmax - M.velK.x) * f; M.velK.y += (ky * vmax * 0.85 - M.velK.y) * f;
    M.pos.x = THREE.MathUtils.clamp(M.pos.x + M.velK.x * dt, -LIM.x, LIM.x);
    M.pos.y = THREE.MathUtils.clamp(M.pos.y + M.velK.y * dt, LIM.yMin, LIM.yMax);
  }
  M.velN.copy(M.pos).sub(antes).divideScalar(Math.max(dt, 1e-4));
  nave.position.copy(M.pos);
  if (M.llegando != null) nave.position.z = -M.llegando * M.llegando * 60;
  const alabeo = THREE.MathUtils.clamp(-M.velN.x * 0.05, -0.9, 0.9);
  M.tonel -= dt;
  const giro = M.tonel > 0 ? (1 - M.tonel / 0.7) * Math.PI * 2 : 0;
  nave.rotation.set(0, 0, alabeo + giro); nave.rotateX(THREE.MathUtils.clamp(M.velN.y * 0.03, -0.4, 0.4));
  if (motores) motores.children.forEach((s) => s.scale.setScalar(0.55 + Math.random() * 0.25 + (M.llegando != null ? 1.2 : 0)));
  camara.position.lerp(new V3(M.pos.x * 0.55, M.pos.y * 0.5 + 3.2, M.tipo === 'final' ? 16 : 13), Math.min(1, dt * 4));
  camara.lookAt(M.pos.x * 0.7, M.pos.y * 0.6 + 0.8, -30);
  if (M.sacudida > 0) { M.sacudida = Math.max(0, M.sacudida - dt * 2.5); const s = M.sacudida * 0.9; camara.position.x += azar(-s, s); camara.position.y += azar(-s, s); }
  camara.updateMatrixWorld();
  // contra Vaeon la mira se dibuja a SU distancia: el láser vuela recto y, con la cámara por encima, la mira a 45 u
  // señalaba un sitio que no era donde el láser lo alcanza (27-sep · «no sé dónde disparar»)
  const zMira = M.vaeon ? M.vaeon.piv.position.z : -45;
  const m = new V3(M.pos.x, M.pos.y + 0.1, zMira).project(camara);
  const mira = $('mira'); mira.style.left = (m.x * 0.5 + 0.5) * innerWidth + 'px'; mira.style.top = (-m.y * 0.5 + 0.5) * innerHeight + 'px';
  mira.classList.toggle('oculto', !!M.pregunta || M.fin);
  mira.classList.toggle('fijado', !!(M.vaeon && blancoVaeon()));
}

// ── explosiones
function explotar(p, color = 0xffa24a, n = 40, tam = 1) {
  const g = new THREE.BufferGeometry(), pos = new Float32Array(n * 3), vel = [];
  for (let i = 0; i < n; i++) { pos.set([p.x, p.y, p.z], i * 3); vel.push(new V3(azar(-1, 1), azar(-1, 1), azar(-1, 1)).normalize().multiplyScalar(azar(6, 22) * tam)); }
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const obj = new THREE.Points(g, new THREE.PointsMaterial({ color, size: 1.1 * tam, map: texChispa, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  escena.add(obj); chispas.push({ obj, vel, vida: 0.9 });
  const fl = new THREE.Mesh(new THREE.SphereGeometry(1.4 * tam, 12, 10), new THREE.MeshBasicMaterial({ color: 0xfff1c4, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
  fl.position.copy(p); escena.add(fl); chispas.push({ obj: fl, flash: true, vida: 0.25 });
}

// ── puntos
function sumarPericia(n) { const mult = 1 + Math.min(M.combo, 20) * 0.1; M.pericia += Math.round(n * mult); M.combo++; M.maxCombo = Math.max(M.maxCombo, M.combo); }
function recibirDaño(n) {
  if (M.fin) return false;
  if (M.tonel > 0) { SON.blindado(); return false; }
  n *= NIVEL ? NIVELES[NIVEL].daño : 1; M.escudo -= n; M.daño += n; M.combo = 0; SON.golpe();
  lienzo.style.filter = 'brightness(1.8) saturate(0.5)'; setTimeout(() => (lienzo.style.filter = ''), 90);
  // 3-oct · en la Academia no se cae (Norberto: «haz que no se pueda morir»): con el escudo a cero, NEBULA lo recarga
  if (M.escudo <= 0) { if (ACADEMIA) { M.escudo = 40; aviso('¡AUCH! EN LA ACADEMIA NO SE PIERDE', '#5ff4ff', 1.3); } else { M.escudo = 0; derrota(); } }
  return true;
}

// ── PUERTAS DE PREGUNTA
function textoPuerta(letra, texto) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 256; const x = c.getContext('2d');
  x.fillStyle = 'rgba(4,16,32,.85)'; x.fillRect(0, 0, 512, 256);
  x.strokeStyle = '#5ff4ff'; x.lineWidth = 6; x.strokeRect(3, 3, 506, 250);
  x.fillStyle = '#ffc24a'; x.font = '800 120px Orbitron, sans-serif'; x.textBaseline = 'middle'; x.fillText(letra, 26, 128);
  x.fillStyle = '#e8f6ff'; x.font = '600 34px "Exo 2", sans-serif';
  const pal = texto.split(' '); let l = '', ls = [];
  for (const p of pal) { if (x.measureText(l + p).width > 330) { ls.push(l); l = ''; } l += p + ' '; } ls.push(l);
  ls = ls.slice(0, 5); ls.forEach((t, i) => x.fillText(t.trim(), 160, 128 + (i - (ls.length - 1) / 2) * 40));
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; return tex;
}
// Las preguntas de VARIOS pasos (completar dos huecos, o las de varias correctas) se vuelan en tandas: una tanda de
// puertas por hueco (en orden) o por respuesta buena (en cualquier orden). Lo que ya has elegido no vuelve a salir.
const LETRAS = 'ABCDEF';
function htmlVisual(v) {
  if (!v) return '';
  if (v.svg) return `<div class="vis ${esc(v.tipo)}">${v.svg}</div>`; // el SVG lo dibuja el servidor (ya escapado)
  if (v.src) return `<div class="vis imagen"><img src="${BASE_WEB}${esc(v.src)}" alt="${esc(v.alt || '')}"></div>`;
  return '';
}
function panelPregunta(P) {
  const q = P.q, n = P.elegidas.length;
  let enun = esc(q.enunciado);
  if (q.tipo === 'hueco') { let k = 0; enun = enun.replace(/_{2,}/g, () => { const i = k++, w = P.elegidas[i]; return `<span class="hueco${i === n ? ' ahora' : ''}">${w != null ? esc(q.opciones[w]) : '?'}</span>`; }); }
  const tit = q.pasos > 1 ? (q.tipo === 'hueco' ? `HUECO ${n + 1} DE ${q.pasos} · UNA PUERTA POR HUECO` : `BUENA ${n + 1} DE ${q.pasos} · CRUZA TODAS LAS CORRECTAS`) : 'ATRAVIESA LA PUERTA CORRECTA';
  return `<div class="tit">PREGUNTA ${M.preguntas + 1} · ${tit}</div><div class="cuerpo">${htmlVisual(q.visual)}<div class="texto"><div class="enun">${enun}</div><ol>${q.opciones.map((o, i) => `<li class="${P.elegidas.includes(i) ? 'usada' : ''}"><b>${LETRAS[i]}</b><span>${esc(o)}</span></li>`).join('')}</ol></div></div><div class="reloj-fila"><div class="reloj" id="p-reloj"></div><button type="button" class="turbo${P.turbo ? ' on' : ''}" id="b-turbo" title="¿Lo tienes claro? Apunta a tu puerta y crúzala ya (tecla T): +${TURBO_PTS} si aciertas"><b>TURBO</b><span>tecla T · +${TURBO_PTS} si aciertas</span></button></div>`;
}
function ponerPuertas(P) {
  const jefe = M.tipo === 'final', libres = P.q.opciones.map((_, i) => i).filter((i) => !P.elegidas.includes(i)), sep = 30 / libres.length;
  const z = jefe ? -72 : P.elegidas.length ? -140 : -190; // la segunda tanda llega antes: ya vas a cámara lenta
  P.puertas = [];
  libres.forEach((i, k) => {
    const g = new THREE.Group(), marco = new THREE.MeshBasicMaterial({ color: 0x5ff4ff });
    const W = Math.min(sep - 0.4, 7.4), H = 7;
    for (const [w, h, x, y] of [[W, 0.3, 0, H / 2], [W, 0.3, 0, -H / 2], [0.3, H, -W / 2, 0], [0.3, H, W / 2, 0]]) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.3), marco); b.position.set(x, y, 0); g.add(b); }
    const cartel = new THREE.Mesh(new THREE.PlaneGeometry(W * 1.02, W * 0.51), new THREE.MeshBasicMaterial({ map: textoPuerta(LETRAS[i], P.q.opciones[i]), transparent: true, side: THREE.DoubleSide }));
    cartel.position.y = H / 2 + W * 0.28; g.add(cartel);
    const velo = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshBasicMaterial({ color: 0x5ff4ff, transparent: true, opacity: 0.08, side: THREE.DoubleSide }));
    g.add(velo);
    g.position.set(-15 + sep * (k + 0.5), jefe ? -5 : 0, z); escena.add(g);
    const c = { tipo: 'puerta', obj: g, r: 0, hp: Infinity, puerta: true, i, W, H, marco, velo }; cosas.push(c); P.puertas.push(c);
  });
  P.turbo = false;
  $('pregunta').innerHTML = panelPregunta(P);
  $('pregunta').classList.remove('oculto');
  const bt = $('b-turbo'); if (bt) bt.onclick = (e) => { e.stopPropagation(); activarTurbo(); };
  // la cámara lenta se calcula para que las puertas tarden en llegar lo que se tarda en LEER la pregunta y las
  // opciones que quedan (27-sep · Norberto: «en difícil no da tiempo a leer»). Los segundos base, por nivel, están en
  // NIVELES.lectura; aquí se suma lo largo del texto. La segunda tanda ya tiene el enunciado leído: menos tiempo.
  const letras = P.q.enunciado.length + libres.reduce((n, i) => n + String(P.q.opciones[i]).length, 0) + (P.q.visual ? 80 : 0);
  const base = jefe ? 14 : NIVEL ? NIVELES[NIVEL].lectura : 15;
  const seg = THREE.MathUtils.clamp((base + letras * 0.05) * (P.elegidas.length ? 0.6 : 1), 8, 26);
  M.lentaObj = Math.min(1, -z / (VEL * seg));
}
/**
 * 28-sep · EL TURBO. Norberto: «cuando el estudiante está seguro de la respuesta, un botón de TURBO para que la nave atraviese
 * la respuesta correcta rápidamente». Quita la cámara lenta de la pregunta y multiplica la velocidad del mundo: las puertas
 * llegan en un suspiro. Vale para la tanda que está delante (en las de dos huecos, se pulsa en cada una) y, si se acierta,
 * premia la seguridad con puntos de saber. No cambia qué se contesta: se cruza la puerta a la que se apunta.
 */
const TURBO_X = 2.6, TURBO_PTS = 250;
function activarTurbo() {
  const P = M && M.pregunta; if (!P || P.turbo || pausa) return;
  P.turbo = true; P.turboAlguna = true; M.lentaObj = 1;
  const b = $('b-turbo'); if (b) b.classList.add('on');
  aviso('TURBO', '#ffc24a', 0.8); SON.anillo();
}
function lanzarPregunta(alAcabar) {
  // sin preguntas (la web sin servidor todavía): Vaeon no se queda regenerándose para siempre, se abre la fase siguiente
  const q = M.preguntasCola.shift(); if (!q) return alAcabar && alAcabar(true);
  q.pasos = q.pasos || 1;
  for (const c of cosas.slice()) if (!c.anillo && !c.puerta) { explotar(c.obj.position, 0x5ff4ff, 16, 0.6); quitar(c); }
  for (const b of balas.splice(0)) escena.remove(b.obj);
  M.pregunta = { q, t: 0, alAcabar, puertas: [], elegidas: [] };
  M.lenta = Math.min(M.lenta, 0.35); // el frenazo, de golpe: si no, las puertas se comen segundos de lectura al llegar
  ponerPuertas(M.pregunta);
  if (M.tipo === 'final') BATALLA.suave(true);
}
async function resolverPregunta(i) {
  const P = M.pregunta; if (!P) return;
  if (i != null && P.elegidas.length + 1 < P.q.pasos) { // queda otra tanda
    P.elegidas.push(i);
    const viejas = P.puertas; for (const c of viejas) c.marco.color.set(c.i === i ? 0xffc24a : 0x5ff4ff);
    setTimeout(() => { for (const c of viejas) quitar(c); }, 500);
    SON.anillo(); aviso(P.q.tipo === 'hueco' ? `HUECO ${P.elegidas.length + 1}` : 'OTRA BUENA', '#ffc24a', 1);
    ponerPuertas(P); return;
  }
  if (i != null) P.elegidas.push(i);
  M.pregunta = null; M.lentaObj = 1; M.preguntas++;
  if (M.tipo === 'final') BATALLA.suave(false);
  $('pregunta').classList.add('oculto');
  const r = ACADEMIA ? { ok: i === P.q.buena, correccion: P.q.correccion } : await SERVIDOR.responder(M.partida, P.q.id, P.q.pasos > 1 ? P.elegidas : i);
  if (!M) return;
  const ok = !!r.ok;
  let vuelve = '';
  if (ACADEMIA) {
    if (ok) ACA.pendientes.delete(P.q.id);
    else { // la que se falla vuelve a salir, detrás de las demás, con su hueco en el vuelo
      M.preguntasCola.push(preguntaAcademia(ACA.qs.find((x) => x.id === P.q.id)));
      const t = Math.max(M.juego, ...M.momentos) + HUECO_PREG; M.momentos.push(t); M.duracion = Math.max(M.duracion, t + 14);
      vuelve = ' Esta pregunta volverá a salir.';
    }
    if (ok && !ACA.pendientes.size && !ACA.dicho) { ACA.dicho = true; avisarAcademia({ todas: true, aciertos: M.aciertos + 1, respondidas: M.preguntas }); setTimeout(enhorabuena, 1800); }
  }
  for (const c of P.puertas) c.marco.color.set(c.i === i ? (ok ? 0x5dffa0 : 0xff4d6d) : 0x5ff4ff);
  if (ok) {
    M.aciertos++; M.racha++; M.maxRacha = Math.max(M.maxRacha, M.racha);
    const pts = 500 * P.q.pasos * (1 + (M.racha - 1) * 0.5), extra = P.turboAlguna ? TURBO_PTS : 0; M.saber += pts + extra;
    M.escudo = Math.min(100, M.escudo + 20); M.doble = 14;
    SON.bien(); aviso(`¡CORRECTO! +${pts}` + (extra ? ` · TURBO +${extra}` : ''), '#5dffa0', 1.8);
    decir('¡Correcto! ' + (r.correccion || '') + ' Te paso el láser doble.', 7);
  } else {
    M.racha = 0; SON.mal(); recibirDaño(10);
    aviso(i == null ? 'SIN RESPUESTA' : 'FALLO', '#ff4d6d', 1.8);
    decir((i == null ? 'Hay que atravesar una puerta. ' : P.q.pasos > 1 ? 'No era esa combinación. ' : 'No era esa. ') + (r.correccion || '') + vuelve, 9);
  }
  setTimeout(() => { for (const c of P.puertas) quitar(c); }, 700);
  P.alAcabar && P.alAcabar(ok);
}
function quitar(c) { const i = cosas.indexOf(c); if (i >= 0) cosas.splice(i, 1); escena.remove(c.obj); }
// la Academia: acertadas todas, la enhorabuena (el vuelo se para mientras se elige)
function enhorabuena() {
  if (!M || M.fin || modo !== 'mision') return;
  pausa = true; try { if (actx) actx.suspend(); } catch (e) { /* sin audio */ }
  pantalla(`<div class="kicker">Academia · ${ACA.qs.length} de ${ACA.qs.length}</div>
    <h2 style="color:var(--ambar)">Enhorabuena, has acertado todas</h2>
    <p>Puedes seguir jugando o pasar al siguiente módulo.</p>
    <div class="botones"><button class="sec" id="b-seguir">Seguir jugando</button><button id="b-sig">Pasar al siguiente módulo</button></div>`);
  $('b-seguir').onclick = () => { pausa = false; try { if (actx) actx.resume(); } catch (e) { /* sin audio */ } $('pantalla').classList.add('oculto'); };
  $('b-sig').onclick = () => { avisarAcademia({ siguiente: true }); if (window.parent === window) location.href = '../../academia.html?v=1d51f06d26'; };
}

// ───────────────────────────────────────── VAEON
// 27-sep · Norberto: «no le quito nada de vida, no sé dónde disparar… es muy estático». Lo que pasaba: el daño SÍ
// entraba, pero (1) la mira se pintaba a 45 u y Vaeon está a 85: con la cámara por encima, apuntar con la mira era
// fallar; (2) cada cristal pedía 22 impactos y la barra bajaba un 0,75 % por impacto (no se veía); (3) nada decía
// dónde disparar. Ahora: marcadores sobre cada punto débil con su vida, la mira a su distancia y que se pone rosa
// cuando lo tienes fijado (el láser va solo al cristal), la barra suma la vida de todos los cristales y parpadea con
// cada impacto, y Vaeon entra, flota, embiste, retrocede al romperse un cristal y ataca AVISANDO (carga, rayos).
const VIDA_V = { izq: 14, der: 14, nucleo: 24, cabeza: 28 };
const NOMBRE_V = { izq: 'MANO', der: 'MANO', nucleo: 'NÚCLEO', cabeza: 'CABEZA' };
const FASE_V = { 1: 'FASE 1 · ROMPE SUS MANOS', 2: 'FASE 2 · DISPARA AL NÚCLEO', 3: 'FASE 3 · SU CABEZA' };
const ASISTE = 6.5; // la ayuda de puntería: a menos de esto (en el plano de la pantalla) el láser busca el cristal
const matRayo = () => new THREE.MeshBasicMaterial({ color: 0xff2e7a, transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
function montarVaeon() {
  const piv = pivotar(modelos.vaeonFresco(), 52, 'y', -Math.PI / 2);
  piv.position.set(0, -9, -85);
  escena.add(piv);
  const huesos = []; piv.traverse((o) => { if (o.isBone) huesos.push(o); });
  piv.updateMatrixWorld(true);
  const w = (b) => b.getWorldPosition(new V3());
  const cabeza = huesos.find((b) => /Head_1/.test(b.name)) || huesos.find((b) => /Head/.test(b.name));
  let izq = huesos[0], der = huesos[0];
  for (const b of huesos) { if (w(b).x < w(izq).x) izq = b; if (w(b).x > w(der).x) der = b; }
  const hombro = (mano) => { let b = mano; while (b.parent && b.parent.isBone && Math.abs(w(b.parent).x - piv.position.x) > 52 * 0.1) b = b.parent; return b; };
  const hI = hombro(izq), hD = hombro(der);
  const qBase = new Map([[hI, hI.quaternion.clone()], [hD, hD.quaternion.clone()]]);
  function girar(b, ang) {
    b.quaternion.copy(qBase.get(b)); piv.updateMatrixWorld(true);
    const pq = b.parent.getWorldQuaternion(new THREE.Quaternion()), wq = b.getWorldQuaternion(new THREE.Quaternion());
    const q = new THREE.Quaternion().setFromAxisAngle(new V3(0, 0, 1), ang).multiply(wq);
    b.quaternion.copy(pq.invert().multiply(q));
  }
  const cristal = (hueso, r, color) => {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshStandardMaterial({ color: 0x2a0030, emissive: color, emissiveIntensity: 2.2, flatShading: true }));
    const halo = new THREE.Mesh(new THREE.SphereGeometry(1.7, 16, 12), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false }));
    m.add(halo);
    const s = new V3(); hueso.getWorldScale(s); m.scale.setScalar(r / s.x);
    hueso.add(m);
    // el marcador en pantalla: un aro que late, el nombre y la vida de ese cristal
    const div = document.createElement('div'); div.className = 'blanco oculto';
    div.innerHTML = '<div class="aro"></div><b></b><span class="v"><i></i></span>'; $('hud').appendChild(div);
    return { m, halo, r, hp: 0, max: 0, vivo: false, roto: false, hueso, s0: m.scale.x, flash: 0, div };
  };
  const raiz = huesos.find((b) => /Root/.test(b.name)) || huesos[0];
  const nucleoH = new THREE.Object3D();
  const pc = w(raiz).lerp(w(cabeza), 0.62); pc.z += 52 * 0.1; piv.worldToLocal(pc); nucleoH.position.copy(pc); piv.add(nucleoH);
  const V = {
    piv, cabeza, fase: 1, t: 0, disparo: 4, girar, hI, hD, sI: 1,
    entrada: 0, retroceso: 0, embestida: 0, ataque: null, sigAtaque: 5.5, sigPregunta: 9, extras: [], golpeHasta: 0,
    puntos: { izq: cristal(izq, 2.4, 0xff2ea6), der: cristal(der, 2.4, 0xff2ea6), nucleo: cristal(nucleoH, 3.2, 0xffb02e), cabeza: cristal(cabeza, 2.6, 0x5ff4ff) },
  };
  girar(hI, 0.6); piv.updateMatrixWorld(true); const yA = w(izq).y; girar(hI, -0.6); piv.updateMatrixWorld(true); const yB = w(izq).y;
  V.sI = yA < yB ? 1 : -1;
  piv.position.z = -190; // entra desde el fondo (tickVaeon lo acerca)
  M.vaeon = V;
  activar(['izq', 'der']);
  ['nucleo', 'cabeza'].forEach((k) => { V.puntos[k].m.visible = false; });
  $('jefe-f').textContent = FASE_V[1];
}
function activar(ks) {
  const V = M.vaeon;
  for (const k of ks) { const p = V.puntos[k]; p.vivo = true; p.roto = false; p.hp = p.max = VIDA_V[k]; p.m.visible = true; p.flash = 1; }
}
// la barra: la vida que le queda sumando TODOS los cristales (los rotos no cuentan; los que aún no se han abierto, enteros)
function vidaJefe() {
  const V = M.vaeon; let queda = 0, total = 0;
  for (const [k, p] of Object.entries(V.puntos)) { total += VIDA_V[k]; queda += p.roto ? 0 : p.vivo ? p.hp : VIDA_V[k]; }
  return queda / total;
}
// el punto débil que tienes fijado (el más cerca de tu línea de tiro), o null
function blancoVaeon() {
  const V = M && M.vaeon; if (!V || M.pregunta || V.muriendo != null || V.entrada < 1) return null;
  let mejor = null;
  for (const [k, p] of Object.entries(V.puntos)) {
    if (!p.vivo) continue; const wp = p.m.getWorldPosition(new V3());
    const d = Math.hypot(wp.x - M.pos.x, wp.y - M.pos.y);
    if (d < ASISTE + p.r && (!mejor || d < mejor.d)) mejor = { k, p, d };
  }
  return mejor;
}
function golpearVaeon(k, pos) {
  const V = M.vaeon, p = V.puntos[k];
  p.hp--; M.impactos++; p.flash = 1; V.golpeHasta = reloj + 0.12;
  SON.impacto(); explotar(pos, k === 'nucleo' ? 0xffc46b : k === 'cabeza' ? 0x9ff8ff : 0xff9ee0, 14, 0.8);
  if (p.hp <= 0) cristalRoto(k);
}
function quitarExtra(V, o) { escena.remove(o); const i = V.extras.indexOf(o); if (i >= 0) V.extras.splice(i, 1); }
function cancelarAtaque(V) { if (V.ataque && V.ataque.obj) quitarExtra(V, V.ataque.obj); V.ataque = null; }
function empezarAtaque(V) {
  const tipos = V.fase === 1 ? ['rafaga', 'barrido', 'rafaga'] : V.fase === 2 ? ['rafaga', 'barrido', 'lluvia', 'barridoV'] : ['rafaga', 'barrido', 'barridoV', 'lluvia'];
  const tipo = elegir(tipos), A = { tipo, t: 0, aviso: tipo === 'lluvia' ? 1 : 1.35 - V.fase * 0.1, hecho: false };
  if (tipo === 'rafaga') {
    const vivos = Object.values(V.puntos).filter((p) => p.vivo);
    A.org = vivos.length ? elegir(vivos).m : V.cabeza;
    A.obj = new THREE.Sprite(new THREE.SpriteMaterial({ map: texChispa, color: 0xff4dd8, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false }));
    escena.add(A.obj); V.extras.push(A.obj);
    aviso('¡CARGA!', '#ff4dd8', 1); SON.carga();
  } else if (tipo === 'barrido' || tipo === 'barridoV') {
    // el rayo avisa: una franja que parpadea donde estás; cuando se enciende, hace daño si sigues dentro
    const h = tipo === 'barrido';
    A.eje = h ? M.pos.y : M.pos.x;
    A.obj = new THREE.Mesh(h ? new THREE.PlaneGeometry(LIM.x * 2 + 30, 3.2) : new THREE.PlaneGeometry(3.4, LIM.yMax - LIM.yMin + 30), matRayo());
    A.obj.position.set(h ? 0 : A.eje, h ? A.eje : (LIM.yMax + LIM.yMin) / 2, -3); escena.add(A.obj); V.extras.push(A.obj);
    aviso(h ? '¡RAYO! SUBE O BAJA' : '¡RAYO! APÁRTATE', '#ff4dd8', 1.2); SON.carga();
  } else { aviso('¡ESCOMBROS!', '#ff8a3c', 1.2); V.embestida = 1; SON.carga(); }
  V.ataque = A;
}
function tickAtaque(V, dt) {
  const A = V.ataque; A.t += dt;
  const tele = Math.min(1, A.t / A.aviso);
  if (A.tipo === 'rafaga') {
    A.obj.position.copy(A.org.getWorldPosition(new V3())); A.obj.scale.setScalar(3 + tele * 16 + Math.sin(reloj * 30) * 1.5);
    if (A.t >= A.aviso) {
      const org = A.obj.position.clone(), n = 3 + V.fase * 2;
      for (let i = 0; i < n; i++) {
        const obj = new THREE.Mesh(geoBala, matBala); obj.position.copy(org); escena.add(obj);
        const meta = M.pos.clone().add(new V3((i - (n - 1) / 2) * 3.2, azar(-1.5, 1.5), 0));
        balas.push({ obj, vel: meta.sub(org).normalize().multiplyScalar(40 + V.fase * 5) });
      }
      V.embestida = 0.6; M.sacudida = Math.max(M.sacudida, 0.35); SON.golpe();
      cancelarAtaque(V);
    }
  } else if (A.tipo === 'barrido' || A.tipo === 'barridoV') {
    const h = A.tipo === 'barrido';
    if (A.t < A.aviso) A.obj.material.opacity = 0.1 + (Math.sin(A.t * 26) > 0 ? 0.22 : 0.04);
    else {
      A.obj.material.opacity = 0.85; A.obj.scale.set(h ? 1 : 1 + Math.sin(reloj * 40) * 0.1, h ? 1 + Math.sin(reloj * 40) * 0.1 : 1, 1);
      if (!A.hecho) {
        A.hecho = true; SON.rayo(); M.sacudida = Math.max(M.sacudida, 0.5);
        if (Math.abs((h ? M.pos.y : M.pos.x) - A.eje) < 2.2) { if (!recibirDaño(12)) aviso('¡ESQUIVADO!', '#5ff4ff', 0.6); }
      }
      if (A.t > A.aviso + 0.45) cancelarAtaque(V);
    }
  } else if (A.tipo === 'lluvia' && A.t >= A.aviso) {
    for (let i = 0; i < 4 + V.fase * 2; i++) poner(Math.random() < 0.3 ? 'chatarra' : 'roca', THREE.MathUtils.clamp(M.pos.x + azar(-9, 9), -LIM.x, LIM.x), THREE.MathUtils.clamp(M.pos.y + azar(-6, 6), LIM.yMin, LIM.yMax), -200 - i * 14);
    cancelarAtaque(V);
  }
}
function marcadores(V) {
  const fijo = blancoVaeon();
  for (const [k, p] of Object.entries(V.puntos)) {
    const ver = p.vivo && !M.pregunta && V.muriendo == null && V.entrada >= 1 && !M.fin;
    p.div.classList.toggle('oculto', !ver); if (!ver) continue;
    const s = p.m.getWorldPosition(new V3()).project(camara);
    p.div.style.left = (s.x * 0.5 + 0.5) * innerWidth + 'px'; p.div.style.top = (-s.y * 0.5 + 0.5) * innerHeight + 'px';
    p.div.classList.toggle('fijo', !!fijo && fijo.k === k);
    p.div.querySelector('b').textContent = (fijo && fijo.k === k ? '¡FIJADO! ' : 'DISPARA · ') + NOMBRE_V[k];
    p.div.querySelector('i').style.width = (p.hp / p.max) * 100 + '%';
  }
}
function tickVaeon(dt) {
  const V = M.vaeon; if (!V) return;
  V.t += dt;
  const f = V.fase;
  // entra desde el fondo, flota, se mece más cuanto más herido, embiste al atacar y retrocede al perder un cristal
  if (V.entrada < 1) { V.entrada = Math.min(1, V.entrada + dt / 3); if (V.entrada === 1) { aviso('¡DISPARA A SUS MANOS!', '#ff4dd8', 2); M.sacudida = 0.6; } }
  V.retroceso = Math.max(0, V.retroceso - dt * 6); V.embestida = Math.max(0, V.embestida - dt * 1.4);
  const ent = 1 - Math.pow(1 - V.entrada, 3);
  const amp = 3 + f * 2.2, vx = 0.45 + f * 0.18;
  V.piv.position.x = Math.sin(V.t * vx) * amp + Math.sin(V.t * vx * 2.3) * 1.2;
  V.piv.position.y = -9 + Math.sin(V.t * 0.9) * 1.5 + (f >= 2 ? Math.sin(V.t * 1.7) * 1.1 : 0);
  V.piv.position.z = THREE.MathUtils.lerp(-190, -85, ent) - V.retroceso + Math.sin(Math.min(1, V.embestida) * Math.PI) * 14;
  V.piv.rotation.y = Math.sin(V.t * 0.35) * 0.22; V.piv.rotation.z = Math.sin(V.t * 0.6) * 0.05;
  if (V.muriendo == null) V.piv.scale.setScalar(1 + Math.sin(V.t * 1.6) * 0.015);
  const carga = V.ataque && V.ataque.tipo === 'rafaga' ? Math.min(1, V.ataque.t / V.ataque.aviso) * 0.45 : 0;
  const a = 1.05 + Math.sin(V.t * (1.3 + f * 0.4)) * (0.15 + f * 0.04) + carga;
  V.girar(V.hI, V.sI * a); V.girar(V.hD, -V.sI * a);
  if (Math.random() < 0.02 + f * 0.01) { V.piv.position.x += azar(-1.2, 1.2); V.piv.position.y += azar(-0.6, 0.6); }
  for (const p of Object.values(V.puntos)) if (p.vivo) {
    p.flash = Math.max(0, p.flash - dt * 7);
    p.halo.scale.setScalar(1 + Math.sin(reloj * 6) * 0.15 + p.flash * 0.6); p.m.rotation.y += dt * 2;
    p.m.material.emissiveIntensity = 2.2 + p.flash * 7; p.m.scale.setScalar(p.s0 * (1 + p.flash * 0.35));
  }
  $('jefe').classList.toggle('golpe', reloj < V.golpeHasta);
  $('jefe-b').style.width = vidaJefe() * 100 + '%';
  marcadores(V);
  if (V.muriendo != null) {
    V.muriendo += dt;
    if (Math.random() < 0.3) explotar(V.piv.position.clone().add(new V3(azar(-12, 12), azar(-16, 18), azar(-3, 6))), Math.random() < 0.5 ? 0xff2ea6 : 0x5ff4ff, 30, 2);
    V.piv.traverse((o) => { if (o.material && o.material.opacity != null) { o.material.transparent = true; o.material.opacity = Math.max(0, 1 - V.muriendo / 3.5); } });
    V.piv.scale.setScalar(1 + V.muriendo * 0.03); V.piv.position.x += azar(-2, 2); M.sacudida = Math.max(M.sacudida, 0.3);
    if (V.muriendo > 3.6 && !M.fin) { escena.remove(V.piv); victoria(); }
    return;
  }
  if (M.pregunta) { cancelarAtaque(V); return; }
  if (V.entrada < 1) return;
  // 28-sep · Norberto: «entre 6 y 14 preguntas por partida». Además de las que abren cada punto débil, cada ~12 s Vaeon
  // lanza una DESCARGA DE LA ESTÁTICA: otra pregunta (acertar recarga escudo y da láser doble; fallar, daño). Siempre se
  // guardan las que hacen falta para las fases que quedan (4 − fase) y nunca con todos los cristales rotos: entonces
  // está a punto de salir la pregunta de la fase.
  if ((V.sigPregunta -= dt) <= 0 && !V.ataque && M.preguntasCola.length > 4 - V.fase && Object.values(V.puntos).some((p) => p.vivo)) {
    V.sigPregunta = 12; aviso('DESCARGA DE LA ESTÁTICA', '#ff4dd8', 1.4); decir('¡Una descarga de la Estática! Acierta y tu escudo aguanta.', 4); lanzarPregunta(); return;
  }
  // los ataques con aviso
  if (V.ataque) tickAtaque(V, dt);
  else if ((V.sigAtaque -= dt) <= 0) { empezarAtaque(V); V.sigAtaque = azar(4.2, 5.4) - f * 0.7; }
  // y el goteo de siempre (más suave que antes: ahora los golpes fuertes van avisados)
  V.disparo -= dt;
  if (V.disparo <= 0 && !V.ataque) {
    const vivos = Object.values(V.puntos).filter((p) => p.vivo);
    const org = (vivos.length ? elegir(vivos).m : V.cabeza).getWorldPosition(new V3());
    for (let i = 0; i < f; i++) {
      const obj = new THREE.Mesh(geoBala, matBala); obj.position.copy(org); escena.add(obj);
      balas.push({ obj, vel: M.pos.clone().add(new V3(azar(-3, 3), azar(-2, 2), 0)).sub(org).normalize().multiplyScalar(44 + f * 6) });
    }
    V.disparo = Math.max(1, 2.3 - f * 0.4);
  }
  if (Math.random() < dt * 0.3) poner(Math.random() < 0.5 ? 'roca' : 'chatarra', azar(-LIM.x, LIM.x), azar(LIM.yMin, LIM.yMax), -260);
}
function cristalRoto(k) {
  const V = M.vaeon, p = V.puntos[k];
  p.vivo = false; p.roto = true; p.m.visible = false; p.div.classList.add('oculto');
  explotar(p.m.getWorldPosition(new V3()), 0xff2ea6, 90, 2.4); SON.grande();
  sumarPericia(400); V.retroceso = 12; M.sacudida = 0.9; cancelarAtaque(V);
  if (Object.values(V.puntos).some((x) => x.vivo)) { aviso('¡CRISTAL ROTO!', '#5dffa0', 1.4); decir('¡Uno menos! Ahora la otra mano: busca el aro rosa.', 4); return; }
  if (V.fase === 3) { // el golpe final también se gana respondiendo
    aviso('¡VAEON SE TAMBALEA!', '#5dffa0', 2); decir('¡Tocado en la cabeza! Una respuesta más y cae.', 4);
    setTimeout(() => M && M.vaeon === V && lanzarPregunta((ok) => {
      if (!M || M.vaeon !== V) return;
      if (ok) { V.muriendo = 0; aviso('¡VAEON CAE!', '#5dffa0', 3); decir('¡Lo has conseguido! La Estática se deshace…', 6); BATALLA.victoria(); }
      else { activar(['cabeza']); aviso('SE REGENERA', '#ff4d6d', 2); decir('Se ha regenerado la cabeza. Rómpela otra vez.', 5); }
    }), 900);
    return;
  }
  aviso('¡VAEON SE TAMBALEA!', '#5dffa0', 2);
  decir('Vaeon se tambalea. Responde bien y se abrirá su ' + (V.fase === 1 ? 'núcleo.' : 'cabeza.'), 5);
  setTimeout(() => M && M.vaeon === V && lanzarPregunta((ok) => {
    if (!M || M.vaeon !== V) return;
    if (ok) {
      V.fase++; BATALLA.fase(V.fase); M.sacudida = 1.1; V.sigAtaque = 3; SON.rugido();
      $('jefe-f').textContent = FASE_V[V.fase];
      if (V.fase === 2) { activar(['nucleo']); aviso('¡NÚCLEO ABIERTO!', '#ffb02e', 2); decir('¡El núcleo está al descubierto! ¡Dispara al pecho, al aro naranja!', 5); }
      else { activar(['cabeza']); aviso('¡LA CABEZA!', '#5ff4ff', 2); decir('Último punto débil: su cabeza. ¡Ahora! Y ojo: está furioso.', 5); }
    } else { activar(V.fase === 1 ? [elegir(['izq', 'der'])] : ['nucleo']); aviso('SE REGENERA', '#ff4d6d', 2); decir('Se ha regenerado: la barra vuelve a subir. Rómpelo otra vez.', 5); }
  }), 900);
}

// ───────────────────────────────────────── bucle de la misión
function tickMision(dtReal) {
  M.lenta += (M.lentaObj - M.lenta) * Math.min(1, dtReal * 4);
  const dt = dtReal * M.lenta;
  M.t += dtReal; if (!M.pregunta && !M.fin) M.juego += dt;
  moverNave(dtReal);
  const vel = VEL * M.lenta * (M.llegando != null ? 3 : 1) * (M.pregunta && M.pregunta.turbo ? TURBO_X : 1);
  const trans = Math.floor((performance.now() - M.inicio) / 1000);
  $('reloj-m').textContent = `${Math.floor(trans / 60)}:${String(trans % 60).padStart(2, '0')}`;

  // estrellas
  const p = estGeo.attributes.position;
  for (let i = 0; i < N_EST; i++) { let z = p.getZ(i) + vel * dtReal * 3; if (z > 60) z -= 1260; p.setZ(i, z); }
  p.needsUpdate = true;

  // guion de una misión de ruta
  if (M.tipo === 'ruta' && !M.fin) {
    if (M.guion.length && M.juego >= M.guion[0].t) decir(M.guion.shift().txt, 6);
    if (!M.pregunta && M.llegando == null) {
      M.sigSpawn -= dt; if (M.sigSpawn <= 0 && M.juego < M.duracion - 6) oleada();
      if (M.momentos.length && M.juego >= M.momentos[0] && M.preguntasCola.length) { M.momentos.shift(); lanzarPregunta(); }
    }
    const pr = Math.min(1, M.juego / M.duracion); $('prog-b').style.width = pr * 100 + '%';
    M.destino.position.z = -1100 + pr * 700 + (M.llegando || 0) * 300; M.destino.rotation.y += dt * 0.05;
    M.destino.scale.setScalar(M.destinoBase * (1 + pr * 0.7 + (M.llegando || 0) * 1.5));
    if (pr >= 1 && !M.pregunta && M.llegando == null && !cosas.some((c) => !c.anillo && c.obj.position.z < 0)) { M.llegando = 0; aviso(`¡${NODOS[M.m.a].n.toUpperCase()}!`, '#5dffa0', 2); }
    if (M.llegando != null) { M.llegando += dtReal; if (M.llegando > 1.6) victoria(); }
  }
  if (M.tipo === 'final') { tickVaeon(dt); M.destino.rotation.y += dt * 0.02; }
  // tope de tiempo: nadie se queda más de 4 minutos
  if (!M.fin && performance.now() - M.inicio > TOPE_MS) { M.fin = true; fin(false, M.tipo === 'final' ? 'Vaeon se repliega: se acabó el tiempo.' : 'Se acabó el tiempo de la misión.'); return; }

  // disparar
  M.cadencia -= dtReal; M.doble -= dt;
  if ((disparando || toque) && M.cadencia <= 0 && !M.fin && M.llegando == null) { disparar(); M.cadencia = 0.13; }
  $('extra').textContent = M.doble > 0 ? `Láser doble · ${Math.ceil(M.doble)} s` : '';

  // láseres
  for (const l of laseres.slice()) {
    const antes = l.position.clone(), paso = 260 * dtReal;
    // contra Vaeon, el láser que sale con un cristal fijado va a por él (la ayuda de puntería)
    const fk = M.vaeon && l.userData.blanco, fp = fk && M.vaeon.puntos[fk];
    if (fp && fp.vivo && !M.pregunta) {
      const wp = fp.m.getWorldPosition(new V3()), dir = wp.clone().sub(l.position), dist = dir.length();
      if (dist <= paso + fp.r) { escena.remove(l); laseres.splice(laseres.indexOf(l), 1); golpearVaeon(fk, wp); continue; }
      l.position.addScaledVector(dir.divideScalar(dist), paso); l.lookAt(wp);
    } else l.position.z -= paso;
    let dio = false;
    for (const c of cosas) {
      if (c.anillo || c.puerta || c.hp <= 0) continue;
      if (l.position.distanceTo(c.obj.position) < c.r + 0.6) { dio = true; golpear(c); break; }
    }
    if (!dio && M.vaeon) for (const [k, pc] of Object.entries(M.vaeon.puntos)) {
      if (!pc.vivo) continue; const wp = pc.m.getWorldPosition(new V3());
      // distancia al TRAMO recorrido en este fotograma (a 260 u/s un láser puede saltarse un cristal entre dos fotogramas)
      const seg = new THREE.Line3(antes, l.position), cerca = seg.closestPointToPoint(wp, true, new V3());
      if (cerca.distanceTo(wp) < pc.r * 1.6) { dio = true; golpearVaeon(k, cerca); break; }
    }
    if (dio || l.position.z < -480) { escena.remove(l); laseres.splice(laseres.indexOf(l), 1); }
  }

  // las cosas del mundo
  for (const c of cosas.slice()) {
    const o = c.obj;
    o.position.z += vel * dtReal;
    if (c.gira) { o.rotation.x += c.gira.x * dt; o.rotation.y += c.gira.y * dt; o.rotation.z += c.gira.z * dt; }
    if (c.tipo === 'dron' || c.tipo === 'mini') {
      c.fase += dt * (c.tipo === 'mini' ? 2.6 : 2); o.position.x = c.bx + Math.sin(c.fase) * (c.tipo === 'mini' ? 6 : 5); o.position.y += Math.cos(c.fase * 1.3) * dt * 3;
      o.userData.w.rotation.y += dt * 3; o.visible = Math.random() > 0.03;
      c.disparo -= dt;
      if (c.disparo <= 0 && o.position.z > -200 && o.position.z < -25) {
        const obj = new THREE.Mesh(geoBala, matBala); obj.position.copy(o.position); escena.add(obj);
        balas.push({ obj, vel: M.pos.clone().sub(o.position).normalize().multiplyScalar(45) }); c.disparo = azar(2.2, 3.6) * (c.tipo === 'mini' ? 1.6 : 1);
      }
    }
    if (c.tipo === 'mina') { const on = Math.sin(reloj * 8) > 0; o.userData.luz.visible = on; o.userData.halo.material.opacity = on ? 0.7 : 0.3; }
    if (c.tipo === 'chatarra') o.userData.luz.visible = Math.sin(reloj * 7 + o.id) > 0;
    if (c.anillo) o.rotation.z += dt;
    if (M.m.glitch && !c.puerta && !c.anillo && Math.random() < 0.012) { o.position.x += elegir([-3, 3]); explotar(o.position, 0xb15cff, 6, 0.4); }
    // ANILLOS · 27-sep · Norberto: «para activar los anillos tengo que usar el botón de esquivar». Se miraba una sola
    // vez (en z = -1,5) y con radio 3: con la cámara por encima, la nave «dentro» del aro a la vista quedaba fuera por
    // centímetros. Ahora cuenta la MENOR distancia de todo el cruce, con el grosor del aro y la envergadura de la nave,
    // y el aro se enciende en verde cuando vas a pasar por él (así se ve antes de llegar).
    if (c.anillo && !c.pasado) {
      const d = Math.hypot(o.position.x - M.pos.x, o.position.y - M.pos.y);
      if (o.position.z > -6) c.minD = Math.min(c.minD ?? Infinity, d);
      const va = o.position.z > -160 && d < 4.4;
      o.material.color.set(va ? 0x5dffa0 : 0xffc24a); o.material.emissive.set(va ? 0x22ff88 : 0xffa800);
      if (o.position.z > 3) {
        c.pasado = true;
        if (c.minD < 4.4) { M.anillos++; M.escudo = Math.min(100, M.escudo + 10); sumarPericia(200); SON.anillo(); aviso('+ ANILLO', '#ffc24a', 0.9); explotar(o.position, 0xffc24a, 18, 0.6); o.visible = false; }
      }
    }
    // cruce con la nave
    if (!c.anillo && o.position.z > -1.5 && !c.pasado) {
      c.pasado = true;
      const dx = o.position.x - M.pos.x, dy = o.position.y - M.pos.y, d = Math.hypot(dx, dy);
      if (c.puerta) {
        if (M.pregunta && c === M.pregunta.puertas[0]) {
          const P = M.pregunta, cerca = P.puertas.reduce((a, b) => Math.abs(b.obj.position.x - M.pos.x) < Math.abs(a.obj.position.x - M.pos.x) ? b : a);
          resolverPregunta(Math.abs(M.pos.y - cerca.obj.position.y) < cerca.H / 2 + 1.5 ? cerca.i : null);
        }
      } else if (d < c.r + (c.tipo === 'mina' ? 2.2 : 1.4)) {
        recibirDaño(c.tipo === 'mina' ? 20 : 14); explotar(o.position, c.tipo === 'mina' ? 0xff4d2e : 0xffa24a, 30); quitar(c); continue;
      }
    }
    if (c.puerta && M.pregunta) {
      const cerca = M.pregunta.puertas.reduce((a, b) => Math.abs(b.obj.position.x - M.pos.x) < Math.abs(a.obj.position.x - M.pos.x) ? b : a);
      const dentro = cerca === c && Math.abs(o.position.y - M.pos.y) < c.H / 2 + 1.5;
      c.velo.material.opacity = dentro ? 0.22 : 0.06; c.marco.color.set(dentro ? 0xffffff : 0x5ff4ff);
    }
    if (o.position.z > 30) { if (c.tipo === 'dron' || c.tipo === 'mini') M.combo = 0; quitar(c); }
  }
  if (M.pregunta && M.pregunta.puertas.length) { const rest = Math.max(0, (-M.pregunta.puertas[0].obj.position.z) / (VEL * Math.max(M.lentaObj, 0.02))); const r = $('p-reloj'); if (r) r.textContent = `Las puertas llegan en ${rest.toFixed(0)} s · la que se ilumina en blanco es la que vas a cruzar`; }

  // balas enemigas
  for (const b of balas.slice()) {
    b.obj.position.addScaledVector(b.vel, dt);
    if (b.obj.position.distanceTo(M.pos) < 1.6 && M.llegando == null) { escena.remove(b.obj); balas.splice(balas.indexOf(b), 1); if (!recibirDaño(6)) aviso('¡ESQUIVADO!', '#5ff4ff', 0.6); continue; }
    if (b.obj.position.z > 30) { escena.remove(b.obj); balas.splice(balas.indexOf(b), 1); }
  }

  $('h-saber').textContent = Math.round(M.saber); $('h-pericia').textContent = Math.round(M.pericia);
  $('combo').textContent = M.combo >= 3 ? `Combo ×${(1 + Math.min(M.combo, 20) * 0.1).toFixed(1)}` : '';
  $('esc-b').style.width = M.escudo + '%'; $('esc').classList.toggle('bajo', M.escudo < 30);
}
function golpear(c) {
  c.hp--; M.impactos++;
  if (c.hp > 0) { explotar(c.obj.position, 0xffe0a0, 6, 0.4); return; }
  M.derribos++; sumarPericia(c.pts); SON.boom();
  const color = c.tipo === 'dron' || c.tipo === 'mini' ? 0x9f6bff : c.tipo.startsWith('hielo') ? 0x9fe6ff : c.tipo === 'mina' ? 0xff4d2e : 0xffa24a;
  explotar(c.obj.position, color, c.grande ? 70 : 40, c.grande ? 1.6 : 1);
  if (c.grande) for (let i = 0; i < 2; i++) { const n = poner(c.tipo.replace('G', ''), c.obj.position.x + azar(-2, 2), c.obj.position.y + azar(-2, 2), c.obj.position.z); n.gira.multiplyScalar(2); }
  if (c.tipo === 'mina') { // la onda de la mina se lleva lo que tenga cerca: bonus por cadena
    const cerca = cosas.filter((x) => x !== c && !x.anillo && !x.puerta && x.obj.position.distanceTo(c.obj.position) < 9);
    if (cerca.length) aviso(`¡CADENA ×${cerca.length}!`, '#ff8a3c', 1);
    setTimeout(() => cerca.forEach((x) => { if (cosas.includes(x) && M) { x.hp = 1; golpear(x); } }), 120);
  }
  if (c.grupo && M.escuadrillas[c.grupo]) {
    const e = M.escuadrillas[c.grupo]; e.caidos++;
    if (e.caidos === e.total) { sumarPericia(300); SON.escuadrilla(); aviso('¡ESCUADRILLA COMPLETA! +300', '#5dffa0', 1.4); }
  }
  quitar(c);
}

// ───────────────────────────────────────── final de misión
function victoria() { if (M.fin) return; M.fin = true; fin(true); }
function derrota() {
  if (M.fin) return; M.fin = true; explotar(M.pos, 0x5ff4ff, 90, 2); SON.grande(); nave.visible = false; BATALLA.parar();
  fin(false, 'Tu nave ha caído. NEBULA te recoge en la cápsula.');
}
async function fin(llego, motivo = '') {
  if (!llego) BATALLA.parar(); // (con victoria, la fanfarria de BATALLA.victoria() acaba sola)
  for (const p of M.vaeon ? Object.values(M.vaeon.puntos) : []) p.div.classList.add('oculto');
  const prec = M.disparos ? M.impactos / M.disparos : 0;
  if (llego) M.pericia += Math.round(M.escudo * 10) + Math.round(prec * 1000);
  const m = M.m, datos = { llego, precision: prec, escudo: M.escudo, puntos: M.saber + M.pericia };
  if (ACADEMIA) { // la Academia: ni servidor, ni medalla; lo que falta y otra vuelta
    const X = M, quedan = ACA.pendientes.size;
    setTimeout(() => {
      $('hud').classList.add('oculto');
      pantalla(`<div class="kicker">Academia · rumbo a ${esc(NODOS[m.a].n)}</div>
      <h2>${llego ? `¡Has llegado a ${esc(NODOS[m.a].n)}!` : 'Vuelo sin terminar'}</h2>${motivo ? `<p>${esc(motivo)}</p>` : ''}
      <p>Aciertos en este vuelo: <b>${X.aciertos} de ${X.preguntas}</b>. ${quedan ? `Te ${quedan === 1 ? 'queda una pregunta' : 'quedan ' + quedan + ' preguntas'} por acertar: vuelve a volar y te esperarán en las puertas.` : 'Has acertado todas las preguntas de este planeta.'}</p>
      <div class="botones"><button id="b-otra">${quedan ? 'Volver a volar' : 'Volar otra vez'}</button>${quedan ? '' : '<button class="sec" id="b-sig">Pasar al siguiente módulo</button>'}</div>`);
      $('b-otra').onclick = () => { $('pantalla').classList.add('oculto'); briefing(m); };
      if ($('b-sig')) $('b-sig').onclick = () => { avisarAcademia({ siguiente: true }); if (window.parent === window) location.href = '../../academia.html?v=1d51f06d26'; };
    }, llego ? 1200 : 1500);
    return;
  }
  const r = M.partida ? await SERVIDOR.terminar(M.partida, datos) : { medalla: 'nada', premio: { xp: 0, cr: 0, escalones: [] } };
  try { window.parent !== window && window.parent.postMessage({ sgRuta: { mision: m.id, medalla: r.medalla, puntos: Math.round(datos.puntos) } }, '*'); } catch (e) { /* sin padre */ }
  const X = M;
  if (r.repaso) { // el Simulador de vuelo: la marca va a la sala de Joran (su ranking y sus hitos)
    try { const S = await import(SALA + 'comun.js?v=1d51f06d26'); S.registrarPartida('vuelo', r.total, { nivel: r.nivel, mision: m.id }); } catch (e) { console.warn('sin sala', e); }
    setTimeout(() => {
      $('hud').classList.add('oculto');
      pantalla(`<div class="kicker">Simulador de vuelo · nivel ${esc(NIVELES[r.nivel].n)} (×${String(NIVELES[r.nivel].mult).replace('.', ',')})</div>
      <h2>${llego ? esc(titMision(m)) + ': tramo completado' : 'Vuelo sin terminar'}</h2>${motivo ? `<p>${esc(motivo)}</p>` : ''}
      <div class="gran">${r.total.toLocaleString('es-ES')}<small>puntos${r.record ? ' · ¡récord!' : ` · tu mejor marca en este nivel: ${r.mejor.toLocaleString('es-ES')}`}</small></div>
      <div class="res">
        <div class="col saber"><h3>SABER · ${Math.round(X.saber)}</h3><div class="l"><span>Aciertos</span><b>${X.aciertos} / ${X.preguntas}</b></div><div class="l"><span>Mejor racha</span><b>${X.maxRacha ? '×' + X.maxRacha : '—'}</b></div></div>
        <div class="col pericia"><h3>PERICIA · ${Math.round(X.pericia)}</h3><div class="l"><span>Derribos</span><b>${X.derribos}</b></div><div class="l"><span>Puntería</span><b>${Math.round(prec * 100)} %</b></div><div class="l"><span>Escudo</span><b>${Math.round(X.escudo)} %</b></div></div>
      </div>
      <p style="font-size:14px;opacity:.85">${r.total ? 'Es repaso: no da xp ni créditos. Tu marca ya está en el ranking del Simulador de vuelo.' : 'Esta vez no hay marca: para puntuar hay que llegar al planeta.'}</p>
      <div class="botones"><button id="b-otra">Repetir</button><button class="sec" id="b-mapa">Otro tramo</button><a class="boton sec" href="${SALA}index.html">Volver a la sala</a></div>`);
      $('b-otra').onclick = () => { $('pantalla').classList.add('oculto'); briefing(m); };
      $('b-mapa').onclick = () => entrarMapa();
    }, llego ? 1200 : 1500);
    return;
  }
  setTimeout(() => {
    $('hud').classList.add('oculto');
    const premio = r.premio && r.premio.escalones.length
      ? `<div class="premio">Primera vez en ${r.premio.escalones.map((e) => `<span class="med ${e}">${NOMBRE_MED[e]}</span>`).join(' ')}: <b>+${r.premio.xp} xp</b> y <b>+${r.premio.cr} ◈</b> y el sello de la ruta en tu Nave.</div>`
      : r.medalla !== 'nada' ? `<div class="premio">Ya tenías esta medalla (o una mejor): esta vez no hay premio, pero cuenta para el ranking de la clase.</div>` : '';
    const sig = { oro: '', plata: 'Para el oro: acierta 2 de cada 3, puntería ≥ 35 % y llega con ≥ 40 % de escudo.', bronce: 'Para la plata: acierta la mitad y puntería ≥ 20 %.', nada: 'Llegar al planeta ya es bronce.' }[r.medalla];
    pantalla(`<div class="kicker">Misión ${m.n} · ${esc(m.titulo)}</div>
    <h2>${llego ? (m.final ? '¡Vaeon derrotado!' : `¡Has llegado a ${esc(NODOS[m.a].n)}!`) : 'Misión sin terminar'}</h2>
    ${motivo ? `<p>${esc(motivo)}</p>` : llego && r.medalla === 'nada' ? '<p>La misión ha sido demasiado corta para contar: vuela la ruta entera.</p>' : ''}
    ${enEnsayo() && new URLSearchParams(location.search).get('per') ? '<p class="pista" style="font-size:14px;opacity:.85">Vuelo de ensayo: el servidor de la Ruta aún no está en marcha, así que esta medalla solo se guarda en este navegador.</p>' : ''}
    <div class="medalla ${r.medalla}">${r.medalla === 'nada' ? 'Sin medalla' : 'Medalla de ' + NOMBRE_MED[r.medalla]}</div>
    ${premio}
    <div class="res">
      <div class="col saber"><h3>SABER · ${Math.round(X.saber)}</h3><div class="l"><span>Aciertos</span><b>${X.aciertos} / ${X.preguntas}</b></div><div class="l"><span>Mejor racha</span><b>${X.maxRacha ? '×' + X.maxRacha : '—'}</b></div></div>
      <div class="col pericia"><h3>PERICIA · ${Math.round(X.pericia)}</h3><div class="l"><span>Derribos</span><b>${X.derribos}</b></div><div class="l"><span>Puntería</span><b>${Math.round(prec * 100)} %</b></div><div class="l"><span>Anillos</span><b>${X.anillos}</b></div><div class="l"><span>Combo máximo</span><b>${X.maxCombo}</b></div><div class="l"><span>Escudo</span><b>${Math.round(X.escudo)} %</b></div></div>
    </div>
    ${sig ? `<p style="font-size:14px;opacity:.85">${sig}</p>` : ''}
    <div class="botones"><button id="b-otra">Repetir</button>${EMBED ? '' : '<button class="sec" id="b-mapa">Volver al mapa</button>'}</div>`);
    $('b-otra').onclick = () => { $('pantalla').classList.add('oculto'); empezar(m); };
    if ($('b-mapa')) $('b-mapa').onclick = () => entrarMapa();
  }, llego ? 1200 : 1500);
}
function pausar() {
  if (modo !== 'mision' || !M || M.fin) return;
  pausa = !pausa;
  try { if (actx) pausa ? actx.suspend() : actx.resume(); } catch (e) { /* sin audio */ } // la música se congela con el juego
  if (pausa) { pantalla(`<h2>Pausa</h2><div class="botones"><button id="b-seg">Seguir</button>${EMBED ? '' : '<button class="sec" id="b-mapa">Abandonar</button>'}</div>`); $('b-seg').onclick = pausar; if ($('b-mapa')) $('b-mapa').onclick = () => { pausa = false; entrarMapa(); }; }
  else $('pantalla').classList.add('oculto');
}
document.addEventListener('visibilitychange', () => { if (document.hidden && modo === 'mision' && M && !M.fin && !pausa && !window.__sinPausa) pausar(); });

// ───────────────────────────────────────── bucle
let antes = performance.now();
function bucle(ahora) {
  requestAnimationFrame(bucle);
  const dt = Math.min(0.05, (ahora - antes) / 1000); antes = ahora; reloj += dt;
  if (!pausa) {
    if (modo === 'mapa') tickMapa(dt);
    if (modo === 'mision' && M) tickMision(dt);
    for (const c of chispas.slice()) {
      c.vida -= dt;
      if (c.flash) { c.obj.scale.multiplyScalar(1 + dt * 6); c.obj.material.opacity = Math.max(0, c.vida * 4); }
      else { const p = c.obj.geometry.attributes.position; for (let i = 0; i < c.vel.length; i++) p.setXYZ(i, p.getX(i) + c.vel[i].x * dt, p.getY(i) + c.vel[i].y * dt, p.getZ(i) + c.vel[i].z * dt + (M ? VEL * M.lenta * dt : 0)); p.needsUpdate = true; c.obj.material.opacity = Math.max(0, c.vida); }
      if (c.vida <= 0) { escena.remove(c.obj); chispas.splice(chispas.indexOf(c), 1); }
    }
  }
  if (reloj > avisoHasta) $('aviso').classList.remove('ver');
  render.render(escena, camara);
  if (nebula && modo === 'mision') {
    if (reloj > comHasta) $('com').style.opacity = 0;
    comHablando = Math.max(0, comHablando - dt);
    nebula.rotation.y = Math.sin(reloj * 0.8) * 0.25; nebula.position.y = Math.sin(reloj * 2) * 0.004 + (comHablando > 0 ? Math.sin(reloj * 18) * 0.004 : 0);
    comRender.render(comEscena, comCam);
  }
}

// ───────────────────────────────────────── arranque
(async () => {
  let hechos = 0; const total = 5, paso = () => { hechos++; $('carga-b').style.width = Math.round(hechos / total * 100) + '%'; };
  const [vaeonG, nebG, forgeG, naveG] = await Promise.all(['vaeon', 'nebula', 'forge', 'nave'].map((k) => new Promise((ok, mal) => cargador.load(`modelos/${k}.glb`, (g) => { paso(); ok(g); }, undefined, mal))));
  modelos.nave = pivotar(naveG.scene, 5, 'z', Math.PI / 2);
  modelos.forge = pivotar(forgeG.scene, 1, 'y');
  // Vaeon lleva esqueleto: cada batalla usa una copia recién leída (para no arrastrar poses)
  modelos.vaeonFresco = (() => { let libre = vaeonG.scene; return () => { const s = libre; libre = null; if (!s) throw new Error('recarga'); cargador.load('modelos/vaeon.glb', (g) => { libre = g.scene; }); return s; }; })();
  nebula = pivotar(nebG.scene, 1, 'y', -Math.PI / 2); comEscena.add(nebula);
  nebula.traverse((o) => { if (o.material) { o.material.emissive = new THREE.Color(0x0a4a5a); o.material.emissiveIntensity = 0.6; } });
  comCam.position.set(0, 0.33, 0.7); comCam.lookAt(0, 0.33, 0);
  await cargarAsteroides(); paso();
  montarMapa();
  if (REPASO) { // la cabecera del Simulador de vuelo: el tramo de los ocho temas y la vuelta a la sala
    document.querySelector('#mapa-ui .cab').innerHTML = `<h1>SIMULADOR DE VUELO</h1><p>Repasa cualquier tramo de la Ruta en tres niveles · sin premio, con ranking</p><div class="cab-bot"><button id="b-viaje">Todo el viaje · los 8 temas</button><a class="boton sec" href="${SALA}index.html">Volver a la sala</a></div>`;
    $('b-viaje').onclick = () => { audio(); briefing(VIAJE); };
  }
  $('carga').remove();
  requestAnimationFrame(bucle);
  const pedida = [...MISIONES, VIAJE].find((m) => m.id === QS.get('mision'));
  if (pedida) { mapa.visible = false; modo = 'briefing'; camara.position.set(0, 3, 13); camara.lookAt(0, 0, -30); briefing(pedida); }
  else entrarMapa();
})().catch((e) => { $('carga').textContent = 'No se pudo cargar: ' + e.message; console.error(e); });

// para probarlo desde fuera
window.JUEGO = { get M() { return M; }, cosas, oleada, lanzar: (f) => lanzarPregunta(f), resolver: (i) => resolverPregunta(i), romper: (k) => cristalRoto(k), empezar, entrarMapa, MISIONES, get modo() { return modo; }, camara, escena, poner, SERVIDOR };
