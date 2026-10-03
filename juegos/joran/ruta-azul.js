// RUTA AZUL · máquina 3 de la sala de Joran (borrador), AHORA EN 3D.
// El arcade con el que Joran entrenaba a los pilotos del refugio: pilotas la nave de tu mascota contra cuatro oleadas
// de la Estática —platillos, alienígenas que se lanzan en picado y asteroides reales de la NASA— y, al final, RUTA AZUL,
// el simulador que cobró vida: un holograma gigante con tres nodos de escudo en órbita. Dispara solo; tú esquivas.
// Arcade o DESAFÍO (desafio.js, ?modo=desafio): en el desafío la energía del escudo se gasta y se recarga acertando.
// Unos 3 minutos. La lógica vive en coordenadas 0..1 (x a lo ancho, y de arriba abajo) y la escena 3D la copia.
// Recursos libres: naves y alienígenas de Quaternius (CC0), platillos de Poly by Google (CC-BY 3.0), asteroides de la NASA.
import { THREE, $, azar, elegir, QS, estado, audio, holo, cargar, medir, objeto, texBrillo, pantalla, cerrarPantalla, aviso, finDePartida, JUEGOS, EMBED } from './comun.js?v=462150c228';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { crearDesafio, MODO, urlModo, SIN_MORIR, avisoSinMorir } from './desafio.js?v=462150c228';

const V3 = THREE.Vector3;
const JUEGO = JUEGOS[2];
// la arena en el mundo: 40 de ancho y lo que toque de fondo (la proporción del arcade de siempre)
const AW = 40, AD = AW / 0.72;
const aMundo = (x, y) => new V3((x - 0.5) * AW, 0, (y - 0.5) * AD);

// ───────────────────────────────── el sonido de RUTA AZUL (27-sep: «los sonidos son muy malos»)
// Todo sintetizado con WebAudio, sin ficheros ni generadores: cada efecto son varias capas (un golpe de ruido filtrado
// para el ataque, un grave que cae para el cuerpo, un poco de saturación para el crujido) con envolventes cortas, y
// todo pasa por un bus con compresor y una cola de eco breve para que suene a sala de recreativas y no sature cuando
// estallan diez platillos a la vez. Los disparos van muy bajos y variados: suenan ocho veces por segundo.
const SR = (() => {
  let bus = null, ruidoB = null, crujido = null;
  const ultimo = {};
  function preparar() {
    const a = audio(); if (!a) return null;
    if (bus) return a;
    const comp = a.createDynamicsCompressor(); comp.threshold.value = -16; comp.knee.value = 12; comp.ratio.value = 5; comp.attack.value = 0.003; comp.release.value = 0.18;
    const master = a.createGain(); master.gain.value = 0.9; comp.connect(master).connect(a.destination);
    // la sala: una respuesta al impulso de ruido que se apaga en 1,2 s (reverberación barata, sin ficheros)
    const n = Math.floor(a.sampleRate * 1.2), ir = a.createBuffer(2, n, a.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3); }
    const rev = a.createConvolver(); rev.buffer = ir; const envio = a.createGain(); envio.gain.value = 0.22; envio.connect(rev).connect(comp);
    const seco = a.createGain(); seco.connect(comp);
    // 2 s de ruido blanco, reutilizado por todos los efectos
    ruidoB = a.createBuffer(1, a.sampleRate * 2, a.sampleRate); const d = ruidoB.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    // la saturación (curva suave): da el crujido de las explosiones
    crujido = new Float32Array(1024); for (let i = 0; i < 1024; i++) { const x = i / 511.5 - 1; crujido[i] = Math.tanh(x * 3.2); }
    bus = { seco, envio };
    return a;
  }
  // una capa conectada al bus (con algo de envío a la sala)
  function salida(a, nodo, sala = 0.3) { nodo.connect(bus.seco); if (sala) { const g = a.createGain(); g.gain.value = sala; nodo.connect(g).connect(bus.envio); } }
  function env(a, g, t, vol, ataque, dur) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + ataque); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); }
  function osc(tipo, f0, f1, dur, vol, { retraso = 0, ataque = 0.004, sala = 0.3, saturar = false, detune = 0 } = {}) {
    const a = preparar(); if (!a) return; const t = a.currentTime + retraso;
    const o = a.createOscillator(), g = a.createGain(); o.type = tipo; o.detune.value = detune;
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
    env(a, g, t, vol, ataque, dur);
    let fin = g; if (saturar) { const w = a.createWaveShaper(); w.curve = crujido; g.connect(w); fin = w; }
    o.connect(g); salida(a, fin, sala); o.start(t); o.stop(t + dur + 0.05);
  }
  function ruido(dur, vol, { tipo = 'lowpass', f0 = 2000, f1 = 200, q = 0.8, retraso = 0, ataque = 0.002, sala = 0.35, saturar = false } = {}) {
    const a = preparar(); if (!a) return; const t = a.currentTime + retraso;
    const s = a.createBufferSource(); s.buffer = ruidoB; s.loop = true; s.playbackRate.value = azar(0.9, 1.1);
    const f = a.createBiquadFilter(); f.type = tipo; f.Q.value = q; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    const g = a.createGain(); env(a, g, t, vol, ataque, dur);
    s.connect(f).connect(g); let fin = g; if (saturar) { const w = a.createWaveShaper(); w.curve = crujido; g.connect(w); fin = w; }
    salida(a, fin, sala); s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.05);
  }
  // que no se amontonen: el mismo efecto, como mucho cada «ms» milisegundos
  const hueco = (k, ms) => { const a = audio(); const ahora = a ? a.currentTime * 1000 : performance.now(); if (ultimo[k] && ahora - ultimo[k] < ms) return false; ultimo[k] = ahora; return true; };
  return {
    // el láser propio: un «pew» corto de onda cuadrada filtrada + un clic de ruido; tono al azar para que no canse
    disparo(nivel = 1) {
      const f = azar(880, 1040) * (nivel === 3 ? 0.85 : 1);
      osc('square', f, f * 0.32, 0.09, 0.022, { sala: 0.1 });
      osc('sine', f * 0.5, f * 0.2, 0.07, 0.03, { sala: 0 });
      ruido(0.03, 0.025, { tipo: 'highpass', f0: 5000, f1: 3000, sala: 0 });
    },
    // una bala que da y no mata: un «tic» metálico brillante
    impacto() {
      if (!hueco('impacto', 45)) return;
      osc('triangle', azar(1900, 2300), 1300, 0.05, 0.05, { sala: 0.15 });
      ruido(0.05, 0.08, { tipo: 'bandpass', f0: 3500, f1: 2000, q: 3, sala: 0.1 });
    },
    // un enemigo que estalla: chasquido + ruido que se cierra + grave que cae + crujido
    explosion(tam = 1) {
      if (!hueco('explosion', 35)) return;
      ruido(0.02, 0.35 * tam, { tipo: 'highpass', f0: 3000, f1: 2500, sala: 0.1 });
      ruido(0.45 * tam + 0.1, 0.55 * tam, { f0: 5000, f1: 120, q: 1.2, saturar: true });
      osc('sine', 150, 38, 0.35 * tam + 0.1, 0.5 * Math.min(1.2, tam), { ataque: 0.002, sala: 0.2 });
      osc('sawtooth', 90, 30, 0.2 * tam + 0.08, 0.08 * tam, { saturar: true, sala: 0.2 });
    },
    // un asteroide: más sordo y pedregoso (ruido grave a trozos)
    roca() {
      if (!hueco('roca', 40)) return;
      ruido(0.35, 0.5, { f0: 1400, f1: 90, q: 2, saturar: true });
      [0, 0.04, 0.09].forEach((r) => ruido(0.06, 0.25, { tipo: 'bandpass', f0: azar(400, 900), f1: 200, q: 4, retraso: r, sala: 0.1 }));
      osc('sine', 90, 35, 0.3, 0.45, { sala: 0.15 });
    },
    // la bomba: un «whump» enorme que chupa el aire antes (subida) y luego la onda (grave largo + ruido que barre)
    bomba() {
      ruido(0.25, 0.25, { tipo: 'bandpass', f0: 300, f1: 4000, q: 1.5, ataque: 0.2, sala: 0.2 });
      osc('sine', 120, 28, 1.3, 0.8, { retraso: 0.22, ataque: 0.004, sala: 0.4 });
      osc('sawtooth', 70, 25, 0.9, 0.12, { retraso: 0.22, saturar: true, sala: 0.4 });
      ruido(1.4, 0.7, { f0: 6000, f1: 60, q: 0.9, retraso: 0.22, saturar: true, sala: 0.6 });
      osc('sine', 1800, 90, 0.8, 0.06, { retraso: 0.22, sala: 0.5 });
    },
    // un golpe a tu nave con escudo: un zumbido eléctrico que se corta
    escudo() {
      osc('sawtooth', 220, 110, 0.3, 0.12, { detune: 12, sala: 0.3 }); osc('sawtooth', 223, 108, 0.3, 0.12, { detune: -12, sala: 0.3 });
      ruido(0.25, 0.3, { tipo: 'bandpass', f0: 2500, f1: 600, q: 2 });
    },
    // pierdes una vida: explosión grande + caída tonal triste
    derribado() {
      this.explosion(1.8);
      [0, 0.18, 0.36].forEach((r, i) => osc('square', [392, 330, 262][i], [380, 320, 180][i], 0.22, 0.05, { retraso: 0.25 + r, sala: 0.4 }));
    },
    // un alienígena se lanza en picado: el silbido que baja (como las bombas de las películas)
    picado() { if (!hueco('picado', 250)) return; osc('sine', 1500, 500, 0.6, 0.035, { ataque: 0.05, sala: 0.3 }); },
    // premio: arpegio brillante con dos osciladores desafinados
    premio() { [659, 880, 1109, 1319].forEach((f, i) => { osc('triangle', f, f, 0.14, 0.07, { retraso: i * 0.055, sala: 0.4 }); osc('square', f * 2, f * 2, 0.08, 0.012, { retraso: i * 0.055, sala: 0.3 }); }); },
    // llega el jefe: sirena grave con dos sierras desafinadas y un golpe de sub
    jefe() {
      osc('sine', 60, 30, 1.8, 0.7, { ataque: 0.01, sala: 0.5 });
      ruido(1.6, 0.35, { f0: 200, f1: 3000, q: 4, ataque: 0.3, sala: 0.6 });
      for (let k = 0; k < 3; k++) { osc('sawtooth', 180, 120, 0.55, 0.07, { retraso: k * 0.6, detune: 15, saturar: true, sala: 0.5 }); osc('sawtooth', 182, 118, 0.55, 0.07, { retraso: k * 0.6, detune: -15, saturar: true, sala: 0.5 }); }
    },
    // el jefe dispara: un zumbido grave de carga
    jefeAtaque() { if (!hueco('jefeAtaque', 300)) return; osc('sawtooth', 110, 330, 0.25, 0.05, { saturar: true, sala: 0.3 }); ruido(0.2, 0.08, { tipo: 'bandpass', f0: 800, f1: 2400, q: 3 }); },
    // un nodo de escudo que revienta: explosión con un «cristal» agudo encima
    nodo() { this.explosion(1.4); [2637, 3136, 3951].forEach((f, i) => osc('sine', f, f * 0.7, 0.4, 0.05, { retraso: i * 0.03, sala: 0.6 })); },
    // bala en el núcleo del jefe (ya sin escudo): golpe sordo y corto
    nucleo() { if (!hueco('nucleo', 60)) return; osc('sine', 180, 70, 0.08, 0.25, { sala: 0.1 }); ruido(0.06, 0.12, { f0: 1500, f1: 400 }); },
    // el jefe cae: una ristra de explosiones durante dos segundos y un gran grave final
    jefeCae() {
      for (let k = 0; k < 8; k++) setTimeout(() => { ultimo.explosion = 0; this.explosion(azar(1, 1.8)); }, k * 280);
      osc('sine', 80, 20, 3, 0.9, { retraso: 2.2, ataque: 0.01, sala: 0.7 });
      ruido(2.5, 0.6, { f0: 3000, f1: 50, retraso: 2.2, saturar: true, sala: 0.8 });
    },
    victoria() { [523, 659, 784, 1047, 1319].forEach((f, i) => { osc('triangle', f, f, 0.3, 0.08, { retraso: i * 0.1, sala: 0.5 }); osc('sawtooth', f / 2, f / 2, 0.25, 0.02, { retraso: i * 0.1, sala: 0.4 }); }); },
  };
})();

// ───────────────────────────────── escena
const lienzo = $('lienzo');
const render = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true });
render.setPixelRatio(Math.min(devicePixelRatio, 2));
render.outputColorSpace = THREE.SRGBColorSpace;
render.toneMapping = THREE.ACESFilmicToneMapping;
const escena = new THREE.Scene();
escena.background = new THREE.Color(0x01040c);
const camara = new THREE.PerspectiveCamera(48, 1, 0.1, 800);
escena.add(new THREE.HemisphereLight(0xbfe8ff, 0x1a0820, 1.2));
const sol = new THREE.DirectionalLight(0xffffff, 2); sol.position.set(10, 30, 20); escena.add(sol);
const contra = new THREE.DirectionalLight(0xff4dd8, 0.8); contra.position.set(-10, 10, -30); escena.add(contra);
function ajustar() {
  render.setSize(innerWidth, innerHeight, false); camara.aspect = innerWidth / innerHeight;
  // que quepa la arena entera, sea cual sea la pantalla (en vertical manda el ancho)
  const t = Math.tan(THREE.MathUtils.degToRad(camara.fov / 2)), R = Math.max((AD + 8) / (2 * t) * 0.84, (AW + 6) / (2 * t * camara.aspect));
  const ang = THREE.MathUtils.degToRad(62);
  camara.position.set(0, R * Math.sin(ang), R * Math.cos(ang) + 2); camara.lookAt(0, 0, 3);
  camara.updateProjectionMatrix();
}
addEventListener('resize', ajustar); ajustar();

// el suelo del simulador: una rejilla de neón que avanza, los bordes de la arena y un planeta lejano
const rejilla = new THREE.GridHelper(AD * 3, 60, 0x1a6f86, 0x0b3444); rejilla.position.y = -6; rejilla.material.transparent = true; rejilla.material.opacity = 0.45; escena.add(rejilla);
for (const s of [-1, 1]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, AD + 6), new THREE.MeshBasicMaterial({ color: 0x5ff4ff, transparent: true, opacity: 0.55 })); b.position.set(s * (AW / 2 + 1), 0, 0); escena.add(b); }
const texPl = new THREE.TextureLoader().load('tex/estatica.jpg'); texPl.colorSpace = THREE.SRGBColorSpace;
const planeta = new THREE.Mesh(new THREE.SphereGeometry(40, 48, 32), new THREE.MeshStandardMaterial({ map: texPl, emissive: 0xffffff, emissiveMap: texPl, emissiveIntensity: 0.25 }));
planeta.position.set(75, -60, -150); escena.add(planeta);
const NE = 700, estGeo = new THREE.BufferGeometry(), estPos = new Float32Array(NE * 3);
for (let i = 0; i < NE; i++) { estPos[i * 3] = azar(-90, 90); estPos[i * 3 + 1] = azar(-40, -8); estPos[i * 3 + 2] = azar(-120, 60); }
estGeo.setAttribute('position', new THREE.BufferAttribute(estPos, 3));
escena.add(new THREE.Points(estGeo, new THREE.PointsMaterial({ color: 0xcfe9ff, size: 0.9, map: texBrillo, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })));

// ── piezas reutilizables
const brillo = (color, esc = 2) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: texBrillo, color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); s.scale.setScalar(esc); return s; };
const geoBala = new THREE.CapsuleGeometry(0.18, 1.4, 4, 8); geoBala.rotateX(Math.PI / 2);
const matBala = new THREE.MeshBasicMaterial({ color: 0x7dffb0 });
const geoBalaE = new THREE.SphereGeometry(0.45, 12, 8), matBalaE = new THREE.MeshBasicMaterial({ color: 0xff2e55 });
const M = {};  // modelos cargados
let FORMAS_ROCA = [];
const matRoca = new THREE.MeshStandardMaterial({ color: 0xd8cabc, roughness: 1, emissive: 0x2a1a10, emissiveIntensity: 0.6 });

// ───────────────────────────────── estado (la lógica, en 0..1)
let S = null;
function nueva() {
  return { t: 0, puntos: 0, vidas: 3, bombas: 3, nivel: 1, x: 0.5, y: 0.86, inv: 2, escudo: false, cad: 0, balas: [], enemigas: [], enemigos: [], premios: [], chispas: [], rocas: [],
    ola: 0, entreOlas: 2.5, jefe: null, fin: false, cadena: 0, ultimaMuerte: -9, derribos: 0, sigRoca: 3, t0: performance.now() };
}
// oleadas: cuántos de cada tipo (platillo: cae de un golpe · crucero: dispara · alien: se lanza en picado)
const OLAS = [{ cubo: 10 }, { cubo: 7, ojo: 5 }, { cubo: 6, ojo: 4, rayo: 4 }, { cubo: 6, ojo: 6, rayo: 6 }];
const PUNTOS = { cubo: 100, ojo: 150, rayo: 200, roca: 60 };

// ───────────────────────────────── controles
const tecla = {}; let puntero = null;
// el modo desafío: la energía del escudo de la nave. Solo se gasta con la partida en marcha (no en la pausa). Va en su hueco
// (#des-slot), que en pantallas táctiles sube por encima del botón de la bomba. Al volver de la pregunta se sueltan las
// teclas y el dedo: el panel se tragó el keyup/pointerup y la nave seguiría desplazándose sola
const DES = crearDesafio({ nombre: 'Energía del escudo', segundos: 40, recarga: 40, hud: $('des-slot'),
  alPausar: (si) => { if (!si) { for (const k in tecla) tecla[k] = false; puntero = null; } }, enJuego: () => !!S && !S.fin && !pausa });
if (DES.activo) DES.preparar(); // se piden las preguntas mientras lees la portada
addEventListener('keydown', (e) => { tecla[e.code] = true; if (e.code === 'Space') { bomba(); e.preventDefault(); } if (e.code === 'KeyP' || e.code === 'Escape') pausar(); });
addEventListener('keyup', (e) => { tecla[e.code] = false; });
const rayo = new THREE.Raycaster(), plano = new THREE.Plane(new V3(0, 1, 0), 0);
function aNormal(cx, cy) {
  rayo.setFromCamera(new THREE.Vector2(cx / innerWidth * 2 - 1, -(cy / innerHeight * 2 - 1)), camara);
  const p = new V3(); if (!rayo.ray.intersectPlane(plano, p)) return null;
  return { x: p.x / AW + 0.5, y: p.z / AD + 0.5 };
}
lienzo.addEventListener('pointerdown', (e) => { audio(); puntero = aNormal(e.clientX, e.clientY); });
lienzo.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' || puntero) puntero = aNormal(e.clientX, e.clientY); });
addEventListener('pointerup', (e) => { if (e.pointerType !== 'mouse') puntero = null; });
$('b-bomba').addEventListener('pointerdown', (e) => { e.stopPropagation(); bomba(); });

// ───────────────────────────────── la lógica (la de siempre, con asteroides)
function lanzarOla() {
  const o = OLAS[S.ola], tipos = []; for (const [k, n] of Object.entries(o)) for (let i = 0; i < n; i++) tipos.push(k);
  const cols = 6;
  tipos.sort(() => Math.random() - 0.5).forEach((tipo, i) => {
    const c = i % cols, f = Math.floor(i / cols), slot = { x: 0.14 + c * (0.72 / (cols - 1)), y: 0.12 + f * 0.08 }, lado = i % 2 ? 1 : -1;
    S.enemigos.push({ tipo, hp: tipo === 'ojo' ? 2 : 1, x: lado > 0 ? 1.1 : -0.1, y: 0.35 + Math.random() * 0.1, slot, fase: 'entra', t: -i * 0.18, curva: [lado > 0 ? 1.1 : -0.1, 0.35, 0.5 + lado * 0.4, -0.05], disparo: azar(1.5, 4), osc: Math.random() * 6 });
  });
  aviso(`OLEADA ${S.ola + 1}`, '#5ff4ff', 1.2);
}
function lanzarJefe() {
  S.jefe = { x: 0.5, y: -0.25, hp: 70, max: 70, nodos: [0, 1, 2].map((i) => ({ a: i * 2.094, hp: 14, vivo: true })), t: 0, ataque: 0, patron: 0, golpe: 0, muriendo: null };
  $('jefe').classList.remove('oculto'); SR.jefe(); aviso('¡RUTA AZUL!', '#5ff4ff', 1.8);
}
function bomba() {
  if (!S || S.fin || S.bombas <= 0) return; S.bombas--; SR.bomba();
  S.enemigas = []; S.chispas.push({ aro: true, x: S.x, y: S.y, r: 0, vida: 0.7 });
  for (const e of S.enemigos.slice()) { e.hp -= 3; if (e.hp <= 0) matar(e); }
  for (const r of S.rocas.slice()) romperRoca(r);
  if (S.jefe && !S.jefe.muriendo) for (const n of S.jefe.nodos) if (n.vivo) { n.hp -= 4; if (n.hp <= 0) romperNodo(n); }
  lienzo.style.filter = 'brightness(2)'; setTimeout(() => (lienzo.style.filter = ''), 120);
}
function estallar(x, y, color, n = 16, v = 0.5) { for (let i = 0; i < n; i++) { const a = Math.random() * 7, s = azar(0.1, 1) * v; S.chispas.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, vida: azar(0.4, 0.8), color }); } }
function matar(e) {
  const i = S.enemigos.indexOf(e); if (i < 0) return; S.enemigos.splice(i, 1);
  S.cadena = S.t - S.ultimaMuerte < 1 ? S.cadena + 1 : 1; S.ultimaMuerte = S.t;
  S.puntos += PUNTOS[e.tipo] * (e.fase === 'picado' ? 2 : 1) * Math.min(4, S.cadena); S.derribos++;
  estallar(e.x, e.y, e.tipo === 'rayo' ? '#ffe14a' : e.tipo === 'ojo' ? '#5ff4ff' : '#ff4dd8', 22); SR.explosion(e.tipo === 'ojo' ? 1.2 : 1);
  if (S.cadena >= 3) aviso(`CADENA ×${Math.min(4, S.cadena)}`, '#5dffa0', 0.6);
  if (Math.random() < 0.12) S.premios.push({ x: e.x, y: e.y, tipo: elegir(['P', 'P', 'S', 'B']) });
}
function romperRoca(r) { const i = S.rocas.indexOf(r); if (i < 0) return; S.rocas.splice(i, 1); S.puntos += PUNTOS.roca; S.derribos++; estallar(r.x, r.y, '#ffb36b', 18, 0.4); SR.roca(); }
function romperNodo(n) { n.vivo = false; estallar(S.jefe.x + Math.cos(n.a) * 0.2, S.jefe.y + Math.sin(n.a) * 0.12, '#5ff4ff', 30, 0.7); SR.nodo(); S.puntos += 500; aviso('¡NODO ROTO!', '#5ff4ff', 0.8); }
function perderVida() {
  if (S.inv > 0) return;
  if (S.escudo) { S.escudo = false; S.inv = 1; SR.escudo(); aviso('ESCUDO ROTO', '#5ff4ff', 0.8); return; }
  if (!SIN_MORIR) S.vidas--;
  S.nivel = Math.max(1, S.nivel - 1); SR.derribado(); estallar(S.x, S.y, '#5ff4ff', 40, 0.8);
  if (S.vidas <= 0) { acabar(false, 'La Estática te ha derribado.'); return; }
  S.inv = 2.5; S.enemigas = []; if (SIN_MORIR) avisoSinMorir(); else aviso(`QUEDAN ${S.vidas}`, '#ff4dd8', 1);
}

function tick(dt) {
  if (!S) return;
  S.t += dt;
  if (S.fin) { for (const c of S.chispas) { c.x += (c.vx || 0) * dt; c.y += (c.vy || 0) * dt; c.vida -= dt; } S.chispas = S.chispas.filter((c) => c.vida > 0); return; }
  if (S.t > 210 && !SIN_MORIR) { acabar(false, 'RUTA AZUL se ha replegado: se acabó el tiempo.'); return; }
  let dx = 0, dy = 0;
  if (tecla.ArrowLeft || tecla.KeyA) dx -= 1; if (tecla.ArrowRight || tecla.KeyD) dx += 1; if (tecla.ArrowUp || tecla.KeyW) dy -= 1; if (tecla.ArrowDown || tecla.KeyS) dy += 1;
  const antesX = S.x;
  if (dx || dy) { S.x += dx * 0.9 * dt; S.y += dy * 0.6 * dt; puntero = null; }
  else if (puntero) { S.x += (puntero.x - S.x) * Math.min(1, dt * 12); S.y += (puntero.y - 0.05 - S.y) * Math.min(1, dt * 12); }
  S.x = Math.max(0.04, Math.min(0.96, S.x)); S.y = Math.max(0.5, Math.min(0.94, S.y));
  S.vx = (S.x - antesX) / Math.max(dt, 1e-4);
  S.inv = Math.max(0, S.inv - dt);
  S.cad -= dt;
  if (S.cad <= 0) {
    S.cad = 0.13; SR.disparo(S.nivel);
    const disp = S.nivel === 1 ? [0] : S.nivel === 2 ? [-0.018, 0.018] : [-0.03, 0, 0.03];
    for (const o of disp) S.balas.push({ x: S.x + o, y: S.y - 0.03, vx: S.nivel === 3 ? o * 3 : 0 });
  }
  for (const b of S.balas) { b.y -= 1.5 * dt; b.x += b.vx * dt; }
  S.balas = S.balas.filter((b) => b.y > -0.05);
  if (!S.enemigos.length && !S.jefe) {
    S.entreOlas -= dt;
    if (S.entreOlas <= 0) { if (S.ola < OLAS.length) { lanzarOla(); S.ola++; S.entreOlas = 2.2; } else lanzarJefe(); }
  }
  // los asteroides de la NASA caen entre las oleadas (se rompen de dos disparos; si te dan, quitan una vida)
  if (!S.jefe) { S.sigRoca -= dt; if (S.sigRoca <= 0) { S.rocas.push({ x: azar(0.08, 0.92), y: -0.08, v: azar(0.12, 0.22), hp: 2, giro: new V3(azar(-2, 2), azar(-2, 2), azar(-2, 2)), r: azar(2.4, 3.8) }); S.sigRoca = azar(2.2, 4) / (1 + S.ola * 0.25); } }
  for (const r of S.rocas.slice()) {
    r.y += r.v * dt;
    for (const b of S.balas) if (Math.abs(b.x - r.x) < 0.06 && Math.abs(b.y - r.y) < 0.045) { b.y = -1; r.hp--; estallar(r.x, r.y, '#ffd9a8', 4, 0.2); if (r.hp > 0) SR.impacto(); if (r.hp <= 0) { romperRoca(r); break; } }
    if (S.rocas.includes(r) && Math.abs(S.x - r.x) < 0.06 && Math.abs(S.y - r.y) < 0.045) { perderVida(); romperRoca(r); }
    if (r.y > 1.1) S.rocas.splice(S.rocas.indexOf(r), 1);
  }
  for (const e of S.enemigos.slice()) {
    e.t += dt; e.osc += dt;
    if (e.fase === 'entra') {
      if (e.t < 0) continue;
      const u = Math.min(1, e.t / 1.6), [x0, y0, cx, cy] = e.curva, x1 = e.slot.x, y1 = e.slot.y;
      e.x = (1 - u) ** 2 * x0 + 2 * (1 - u) * u * cx + u * u * x1; e.y = (1 - u) ** 2 * y0 + 2 * (1 - u) * u * cy + u * u * y1;
      if (u >= 1) e.fase = 'forma';
    } else if (e.fase === 'forma') {
      e.x = e.slot.x + Math.sin(S.t * 1.2) * 0.04; e.y = e.slot.y + Math.sin(e.osc * 2) * 0.008;
      if ((e.tipo === 'rayo' && Math.random() < dt * 0.35) || Math.random() < dt * 0.04 * S.ola) { e.fase = 'picado'; e.vx = (S.x - e.x) * 0.7; e.vy = 0.55; SR.picado(); }
    } else if (e.fase === 'picado') {
      e.x += e.vx * dt + Math.sin(e.t * 8) * (e.tipo === 'rayo' ? 0.6 : 0.1) * dt; e.y += e.vy * dt; e.vy += 0.2 * dt;
      if (e.y > 1.05) { e.fase = 'entra'; e.t = 0; e.curva = [e.x, -0.1, e.slot.x, -0.05]; }
    }
    if (e.tipo === 'ojo' && e.fase !== 'entra') { e.disparo -= dt; if (e.disparo <= 0) { e.disparo = azar(2, 3.6); const a = Math.atan2(S.y - e.y, S.x - e.x); S.enemigas.push({ x: e.x, y: e.y, vx: Math.cos(a) * 0.32, vy: Math.sin(a) * 0.45 }); } }
    for (const b of S.balas) if (Math.abs(b.x - e.x) < 0.035 && Math.abs(b.y - e.y) < 0.025) { b.y = -1; e.hp--; if (e.hp <= 0) { matar(e); break; } else { estallar(e.x, e.y, '#fff', 4, 0.2); e.golpe = 0.12; SR.impacto(); } }
    if (S.enemigos.includes(e) && Math.abs(S.x - e.x) < 0.04 && Math.abs(S.y - e.y) < 0.03) { perderVida(); matar(e); }
  }
  const J = S.jefe;
  if (J) {
    J.t += dt; J.golpe = Math.max(0, J.golpe - dt);
    if (J.muriendo != null) {
      J.muriendo += dt; if (Math.random() < 0.4) estallar(J.x + azar(-0.15, 0.15), J.y + azar(-0.1, 0.1), elegir(['#5ff4ff', '#ff4dd8', '#fff']), 14, 0.6);
      if (J.muriendo > 2.6) { S.puntos += 5000 + S.vidas * 1000; acabar(true, `RUTA AZUL vuelve a ser solo un simulador. <b>+5.000</b> y <b>+${(S.vidas * 1000).toLocaleString('es-ES')}</b> por las vidas.`); }
    } else {
      J.y += (0.27 - J.y) * Math.min(1, dt * 1.5); J.x = 0.5 + Math.sin(J.t * 0.6) * 0.25;
      for (const n of J.nodos) n.a += dt * 1.4;
      J.ataque -= dt;
      if (J.ataque <= 0 && J.y > 0.15) {
        const fase2 = J.nodos.every((n) => !n.vivo);
        J.patron = (J.patron + 1) % 3;
        if (J.patron === 0) { for (let i = 0; i < 14; i++) { const a = i / 14 * 6.283 + J.t; S.enemigas.push({ x: J.x, y: J.y, vx: Math.cos(a) * 0.22, vy: Math.sin(a) * 0.3 + 0.12 }); } J.ataque = fase2 ? 1.0 : 1.5; }
        else if (J.patron === 1) { for (let i = -3; i <= 3; i++) { const a = Math.atan2(S.y - J.y, S.x - J.x) + i * 0.16; S.enemigas.push({ x: J.x, y: J.y + 0.05, vx: Math.cos(a) * 0.38, vy: Math.sin(a) * 0.5 }); } J.ataque = fase2 ? 0.9 : 1.3; }
        else { let k = 0; const r = () => { if (!S.jefe || S.fin || k++ > 5) return; const a = Math.atan2(S.y - J.y, S.x - J.x); S.enemigas.push({ x: J.x, y: J.y + 0.05, vx: Math.cos(a) * 0.5, vy: Math.sin(a) * 0.7 }); setTimeout(r, 110); }; r(); J.ataque = fase2 ? 1.1 : 1.6; }
        SR.jefeAtaque();
      }
      for (const b of S.balas) {
        for (const n of J.nodos) { if (!n.vivo) continue; const nx = J.x + Math.cos(n.a) * 0.2, ny = J.y + Math.sin(n.a) * 0.12; if (Math.abs(b.x - nx) < 0.035 && Math.abs(b.y - ny) < 0.03) { b.y = -1; n.hp--; estallar(nx, ny, '#5ff4ff', 3, 0.2); SR.impacto(); if (n.hp <= 0) romperNodo(n); } }
        if (b.y > 0 && Math.abs(b.x - J.x) < 0.1 && Math.abs(b.y - J.y) < 0.08) {
          b.y = -1;
          if (J.nodos.some((n) => n.vivo)) estallar(b.x, J.y + 0.08, '#5ff4ff', 2, 0.15);
          else { J.hp--; J.golpe = 0.12; S.puntos += 20; SR.nucleo(); if (J.hp <= 0) { J.muriendo = 0; S.enemigas = []; SR.jefeCae(); aviso('¡RUTA AZUL CAE!', '#5dffa0', 2); } }
        }
      }
      $('h-jefe').style.width = (J.nodos.filter((n) => n.vivo).length ? 100 : J.hp / J.max * 100) + '%';
    }
  }
  for (const b of S.enemigas) { b.x += b.vx * dt; b.y += b.vy * dt; if (Math.abs(b.x - S.x) < 0.018 && Math.abs(b.y - S.y) < 0.018) { b.y = 9; perderVida(); } }
  S.enemigas = S.enemigas.filter((b) => b.y < 1.05 && b.y > -0.1 && b.x > -0.1 && b.x < 1.1);
  for (const p of S.premios) { p.y += 0.25 * dt; if (Math.abs(p.x - S.x) < 0.05 && Math.abs(p.y - S.y) < 0.04) { p.y = 9; SR.premio();
    if (p.tipo === 'P') { S.nivel = Math.min(3, S.nivel + 1); aviso('¡MÁS POTENCIA!', '#ffe14a', 0.8); } else if (p.tipo === 'S') { S.escudo = true; aviso('¡ESCUDO!', '#5ff4ff', 0.8); } else { S.bombas++; aviso('+1 BOMBA', '#ff4dd8', 0.8); } } }
  S.premios = S.premios.filter((p) => p.y < 1.05);
  for (const c of S.chispas) { if (c.aro) c.r += dt * 1.6; else { c.x += c.vx * dt; c.y += c.vy * dt; } c.vida -= dt; }
  S.chispas = S.chispas.filter((c) => c.vida > 0);
  $('h-pts').textContent = Math.round(S.puntos).toLocaleString('es-ES');
  $('h-ola').textContent = S.jefe ? 'JEFE' : `${Math.max(1, S.ola)}/${OLAS.length}`;
  $('h-vid').innerHTML = [0, 1, 2].map((i) => `<i class="${i < S.vidas ? '' : 'no'}"></i>`).join('');
  $('h-bom').textContent = S.bombas;
  $('extra').textContent = `Potencia ${S.nivel}/3${S.escudo ? ' · escudo' : ''}`;
}

// ───────────────────────────────── la escena copia a la lógica
const vivos = new Map();   // entidad de la lógica → su objeto 3D
function objetoDe(ent, crear) { let o = vivos.get(ent); if (!o) { o = crear(); escena.add(o); vivos.set(ent, o); } o.userData.visto = true; return o; }
function enemigo3D(e) {
  let o;
  if (e.tipo === 'cubo') { o = M.ovni1.clone(); o.add(brillo(0xff4dd8, 3)); }
  else if (e.tipo === 'ojo') { o = M.ovni2.clone(); const h = brillo(0x5ff4ff, 3.4); o.add(h); }
  else { const a = M.alienFab(); o = a.obj; o.userData.mezcla = a.mezcla; }
  return o;
}
let nave = null, escudo3d = null, jefe3d = null, aro3d = null;
const chispasGeo = new THREE.BufferGeometry(), MAXCH = 900, chPos = new Float32Array(MAXCH * 3), chCol = new Float32Array(MAXCH * 3);
chispasGeo.setAttribute('position', new THREE.BufferAttribute(chPos, 3)); chispasGeo.setAttribute('color', new THREE.BufferAttribute(chCol, 3));
const chispas3d = new THREE.Points(chispasGeo, new THREE.PointsMaterial({ size: 0.9, map: texBrillo, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
escena.add(chispas3d);
const colorDe = {}; const col = (c) => colorDe[c] || (colorDe[c] = new THREE.Color(c));

function sincronizar(dt) {
  for (const o of vivos.values()) o.userData.visto = false;
  const tt = performance.now() / 1000;
  if (S) {
    // la nave
    if (nave) {
      nave.position.copy(aMundo(S.x, S.y)); nave.position.y = 1;
      nave.rotation.z = THREE.MathUtils.clamp(-(S.vx || 0) * 0.35, -0.7, 0.7);
      nave.visible = !(S.fin && S.vidas <= 0) && (S.inv <= 0 || Math.floor(S.t * 12) % 2 === 0);
      escudo3d.visible = S.escudo && nave.visible; escudo3d.position.copy(nave.position);
    }
    for (const b of S.balas) objetoDe(b, () => new THREE.Mesh(geoBala, matBala)).position.copy(aMundo(b.x, b.y)).setY(1);
    for (const b of S.enemigas) objetoDe(b, () => { const g = new THREE.Group(); g.add(new THREE.Mesh(geoBalaE, matBalaE), brillo(0xff2e55, 2.2)); return g; }).position.copy(aMundo(b.x, b.y)).setY(1);
    for (const e of S.enemigos) {
      const o = objetoDe(e, () => enemigo3D(e)); o.position.copy(aMundo(e.x, e.y)).setY(1.2);
      if (e.tipo === 'rayo') { o.rotation.y = e.fase === 'picado' ? Math.PI : Math.PI + Math.sin(tt * 3) * 0.3; if (o.userData.mezcla) o.userData.mezcla.update(dt); }
      else { o.rotation.y += dt * (e.tipo === 'ojo' ? 1.5 : 3); o.rotation.x = e.fase === 'picado' ? 0.5 : Math.sin(e.osc * 2) * 0.12; }
    }
    for (const r of S.rocas) { const o = objetoDe(r, () => { const m = new THREE.Mesh(elegir(FORMAS_ROCA), matRoca); m.scale.setScalar(r.r); return m; }); o.position.copy(aMundo(r.x, r.y)).setY(1); o.rotation.x += r.giro.x * dt; o.rotation.y += r.giro.y * dt; }
    for (const p of S.premios) {
      const o = objetoDe(p, () => { const m = (p.tipo === 'P' ? M.rayo : p.tipo === 'S' ? M.esfera : M.caja).clone(); m.scale.setScalar(2.2); m.add(brillo(p.tipo === 'P' ? 0xffe14a : p.tipo === 'S' ? 0x5ff4ff : 0xff4dd8, 3)); return m; });
      o.position.copy(aMundo(p.x, p.y)).setY(1.2); o.rotation.y += dt * 2;
    }
    // el jefe: holograma + nodos
    const J = S.jefe;
    jefe3d.visible = !!J;
    if (J) {
      jefe3d.position.copy(aMundo(J.x, J.y)).setY(6);
      const img = J.muriendo != null ? 'derrotado' : J.golpe > 0 ? 'danado' : J.ataque < 0.3 ? 'ataque' : 'rival';
      if (jefe3d.userData.img !== img && M.holo[img]) { jefe3d.userData.cara.material.map = M.holo[img]; jefe3d.userData.cara.material.needsUpdate = true; jefe3d.userData.img = img; }
      jefe3d.userData.cara.material.opacity = J.muriendo != null ? Math.max(0, 1 - J.muriendo / 2.6) : 0.95 + Math.sin(tt * 20) * 0.05;
      jefe3d.userData.cara.position.x = Math.random() < 0.05 ? azar(-1, 1) : 0;
      jefe3d.userData.cara.quaternion.copy(camara.quaternion);
      jefe3d.userData.escudo.visible = J.nodos.some((n) => n.vivo) && J.muriendo == null;
      jefe3d.userData.nodos.forEach((m, i) => { const n = J.nodos[i]; m.visible = n.vivo; m.position.copy(aMundo(J.x + Math.cos(n.a) * 0.2, J.y + Math.sin(n.a) * 0.12)).sub(jefe3d.position).setY(-4.5); m.scale.setScalar(0.7 + n.hp / 14 * 0.5); });
    }
    // el aro de la bomba
    const aro = S.chispas.find((c) => c.aro); aro3d.visible = !!aro;
    if (aro) { aro3d.position.copy(aMundo(aro.x, aro.y)).setY(1); aro3d.scale.setScalar(aro.r * AD * 1.2 + 0.1); aro3d.material.opacity = aro.vida / 0.7; }
    // las chispas
    let n = 0;
    for (const c of S.chispas) { if (c.aro || n >= MAXCH) continue; const p = aMundo(c.x, c.y); chPos.set([p.x, 1.2 + (1 - c.vida) * 2, p.z], n * 3); const k = col(c.color); const f = Math.max(0, c.vida / 0.8); chCol.set([k.r * f, k.g * f, k.b * f], n * 3); n++; }
    chispasGeo.setDrawRange(0, n); chispasGeo.attributes.position.needsUpdate = true; chispasGeo.attributes.color.needsUpdate = true;
  }
  for (const [ent, o] of vivos) if (!o.userData.visto) { escena.remove(o); if (o.userData.mezcla) o.userData.mezcla.stopAllAction(); vivos.delete(ent); }
  // el fondo avanza
  rejilla.position.z = ((tt * (S && S.jefe ? 14 : 8)) % (AD * 3 / 60)) ;
  const p = estGeo.attributes.position; for (let i = 0; i < NE; i++) { let z = p.getZ(i) + dt * 18; if (z > 60) z -= 180; p.setZ(i, z); } p.needsUpdate = true;
  planeta.rotation.y += dt * 0.02;
}

function acabar(gana, motivo) {
  if (S.fin) return; S.fin = true; DES.parar();
  if (gana) setTimeout(() => SR.victoria(), 400);
  setTimeout(() => {
    $('hud').classList.add('oculto');
    const seg = Math.round((performance.now() - S.t0) / 1000);
    const bonus = DES.bonus(S.puntos); // el bonus de precisión del desafío (0 en arcade)
    finDePartida({ juego: JUEGO.id, titulo: gana ? '¡Has vencido a RUTA AZUL!' : 'Fin de la partida', puntos: S.puntos + bonus, texto: motivo,
      filas: [['Oleada', S.jefe ? 'Jefe' : `${S.ola}/${OLAS.length}`], ['Derribos', S.derribos], ['Vidas', S.vidas], ['Tiempo', `${Math.floor(seg / 60)}:${String(seg % 60).padStart(2, '0')}`], ...DES.filas(bonus)],
      alRepetir: empezar, extra: { ...DES.extra(), intocable: gana && S.vidas >= 3 } });
  }, gana ? 800 : 1300);
}
let pausa = false;
function pausar() {
  if (!S || S.fin || DES.abierto) return; pausa = !pausa; // con la pregunta abierta el juego ya está parado
  if (pausa) { pantalla(`<h2>Pausa</h2><div class="botones"><button id="b-seg">Seguir</button>${EMBED ? '' : '<a class="boton sec" href="index.html?v=462150c228">Volver a la sala</a>'}</div>`); $('b-seg').onclick = pausar; }
  else cerrarPantalla();
}
document.addEventListener('visibilitychange', () => { if (document.hidden && S && !S.fin && !pausa && !DES.abierto && !window.__sinPausa) pausar(); });
function empezar() { S = nueva(); pausa = false; window.__t0Partida = performance.now(); DES.empezar(); $('hud').classList.remove('oculto'); $('jefe').classList.add('oculto'); cerrarPantalla(); $('b-bomba').classList.toggle('oculto', !matchMedia('(pointer: coarse)').matches); }
function portada() {
  const e = estado(), desafio = MODO === 'desafio';
  pantalla(`<div class="kicker">El simulador de Joran · máquina 3${desafio ? ' · modo desafío' : ''}</div><h2>RUTA AZUL</h2>
    <p>El arcade con el que Joran entrenaba a los pilotos del refugio. Pilotas la nave de tu mascota contra cuatro oleadas de la Estática —platillos, cruceros que disparan, alienígenas que se lanzan en picado y asteroides— y al final, <b>RUTA AZUL</b>: rompe sus <b>tres nodos de escudo</b> y después dale en el núcleo.</p>
    <div class="teclas"><kbd>Ratón / dedo / flechas</kbd><span>Mover la nave (dispara sola)</span><kbd>Espacio</kbd><span>Bomba: borra las balas y daña a todos (tienes 3)</span></div>
    <p>Premios: <b style="color:#ffe14a">rayo</b> más potencia · <b style="color:#5ff4ff">esfera</b> escudo · <b style="color:#ff4dd8">caja</b> bomba. Derribar seguidos multiplica; los que vienen en picado valen el doble.</p>
    ${DES.texto()}
    <p class="pista">Tu récord: <b>${(e.marcas['ruta-azul'] || 0).toLocaleString('es-ES')}</b> · Platillos: «Flying saucer» de Poly by Google (CC-BY 3.0)</p>
    <div class="botones"><button id="b-ya">¡Insertar ficha!</button><a class="boton sec" href="${urlModo(desafio ? 'arcade' : 'desafio')}">${desafio ? 'Jugar en arcade' : 'Jugar en desafío'}</a>${EMBED ? '' : '<a class="boton sec" href="index.html?v=462150c228">Volver a la sala</a>'}</div>`);
  $('b-ya').onclick = async () => {
    audio();
    if (desafio) { // las preguntas tienen que estar antes de despegar: sin ellas, el escudo no se podría recargar
      const b = $('b-ya'); b.disabled = true; b.textContent = 'Cargando preguntas…';
      if (!(await DES.preparar())) aviso('Sin preguntas: juegas en arcade', '#ffc24a', 2.2);
    }
    empezar();
  };
}

// ── las imágenes del holograma, con un fundido ovalado (el fondo de la foto no se ve como un rectángulo)
function texHolo(src) {
  return new Promise((ok) => { const i = new Image(); i.onload = () => {
    const c = document.createElement('canvas'); c.width = i.naturalWidth; c.height = i.naturalHeight; const x = c.getContext('2d'); x.drawImage(i, 0, 0);
    const gr = x.createRadialGradient(c.width / 2, c.height * 0.45, 0, c.width / 2, c.height * 0.45, Math.max(c.width, c.height) * 0.5);
    gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.62, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    x.globalCompositeOperation = 'destination-in'; x.fillStyle = gr; x.fillRect(0, 0, c.width, c.height);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; ok(t); }; i.onerror = () => ok(null); i.src = src; });
}
function geoRoca(g0) {
  let g = new THREE.BufferGeometry(); g.setAttribute('position', g0.attributes.position.clone()); if (g0.index) g.setIndex(g0.index.clone());
  g.computeBoundingSphere(); const c = g.boundingSphere.center.clone(), r = g.boundingSphere.radius; g.translate(-c.x, -c.y, -c.z); g.scale(1 / r, 1 / r, 1 / r);
  g = mergeVertices(g, 1e-4); g.computeVertexNormals(); return g;
}

let antes = performance.now();
function bucle(ahora) { requestAnimationFrame(bucle); const dt = Math.min(0.05, (ahora - antes) / 1000); antes = ahora; const quieto = pausa || DES.abierto; if (!quieto) { tick(dt); DES.tick(dt); } sincronizar(quieto ? 0 : dt); render.render(escena, camara); } // con la pregunta abierta, nada corre
(async () => {
  const e = estado(); const av = ['finn', 'barbara', 'fernando'].includes(QS.get('avatar')) ? QS.get('avatar') : e.avatar;
  // la nave de tu mascota (mira hacia arriba de la pantalla)
  const gn = await cargar('nave_' + av); const sn = gn.scene.clone(true);
  const tn = medir(sn).getSize(new V3()); sn.scale.setScalar(6 / Math.max(tn.x, tn.z));
  const cn = medir(sn).getCenter(new V3()); sn.position.sub(cn);
  nave = new THREE.Group(); const dentro = new THREE.Group(); dentro.add(sn); dentro.rotation.y = Math.PI; nave.add(dentro);
  holo(nave, 0x5ff4ff, 0.6);
  const motor = brillo(0x6fe8ff, 1.8); motor.position.set(0, 0, 2.2); nave.add(motor);
  escena.add(nave);
  escudo3d = new THREE.Mesh(new THREE.SphereGeometry(3.2, 24, 16), new THREE.MeshBasicMaterial({ color: 0x5ff4ff, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false })); escena.add(escudo3d);
  aro3d = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 64), new THREE.MeshBasicMaterial({ color: 0xff4dd8, transparent: true, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false })); aro3d.rotation.x = -Math.PI / 2; escena.add(aro3d);
  // los enemigos: platillos (Poly by Google) y el alienígena volador animado (Quaternius)
  const [o1, o2] = await Promise.all([objeto('ovni1', 4.6), objeto('ovni2', 5)]);
  M.ovni1 = holo(o1, 0xff4dd8, 1.0); M.ovni2 = holo(o2, 0x5ff4ff, 1.0);
  const ga = await cargar('dron');
  M.alienFab = () => {
    const s = clone(ga.scene); s.traverse((o) => { if (o.isMesh) o.frustumCulled = false; });
    const t = medir(s).getSize(new V3()); s.scale.setScalar(4.4 / Math.max(t.x, t.y)); holo(s, 0xffe14a, 1.1);
    const m = new THREE.AnimationMixer(s); const clip = ga.animations.find((a) => /Fast_Flying/.test(a.name)) || ga.animations[0]; if (clip) m.clipAction(clip).play();
    const g = new THREE.Group(); g.add(s); g.add(brillo(0xffe14a, 2.6)); return { obj: g, mezcla: m };
  };
  M.rayo = holo(await objeto('rayo', 1), 0xffe14a, 0.8); M.esfera = holo(await objeto('esfera', 1), 0x5ff4ff, 0.8); M.caja = holo(await objeto('caja', 1), 0xff4dd8, 0.8);
  // asteroides reales de la NASA (dominio público)
  const stl = new STLLoader(), tfob = new THREE.TextureLoader().load('tex/fobos.jpg'); tfob.colorSpace = THREE.SRGBColorSpace; matRoca.map = tfob; matRoca.needsUpdate = true;
  const geos = await Promise.all(['geographos', 'kleopatra', 'toutatis', 'mithra', 'golevka', 'hw1'].map((k) => new Promise((ok) => stl.load(`modelos/asteroides/${k}.stl`, ok, undefined, () => ok(null)))));
  FORMAS_ROCA = geos.filter(Boolean).map(geoRoca); if (!FORMAS_ROCA.length) FORMAS_ROCA = [new THREE.IcosahedronGeometry(1, 2)];
  // RUTA AZUL: un holograma gigante (sus imágenes) con un escudo y tres nodos en órbita
  M.holo = {}; for (const k of ['rival', 'ataque', 'danado', 'derrotado']) M.holo[k] = await texHolo(`img/${k === 'rival' ? 'rival' : 'rival_' + k}.jpg`);
  jefe3d = new THREE.Group();
  const cara = new THREE.Mesh(new THREE.PlaneGeometry(22, 25), new THREE.MeshBasicMaterial({ map: M.holo.rival, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  const esc = new THREE.Mesh(new THREE.SphereGeometry(10, 32, 20), new THREE.MeshBasicMaterial({ color: 0x5ff4ff, wireframe: true, transparent: true, opacity: 0.18 }));
  esc.position.y = -3;
  const nodos = [0, 1, 2].map(() => { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(1.4, 1), new THREE.MeshStandardMaterial({ color: 0x063040, emissive: 0x5ff4ff, emissiveIntensity: 2, flatShading: true })); m.add(brillo(0x5ff4ff, 5)); return m; });
  jefe3d.add(cara, esc, ...nodos); jefe3d.userData = { cara, escudo: esc, nodos, img: 'rival' }; jefe3d.visible = false; escena.add(jefe3d);
  requestAnimationFrame(bucle); portada();
})().catch((err) => { console.error(err); pantalla(`<h2>No se pudo cargar</h2><p>${err.message}</p>`); });
window.RA = { get S() { return S; }, empezar, lanzarJefe, camara, DES };
