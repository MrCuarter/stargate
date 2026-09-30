// EL DESCENSO · máquina 4 de la sala de Joran (borrador). Precisión.
// Joran entrenaba a los pilotos para posar las cápsulas del refugio en cualquier mundo: aquí se posa el Módulo Lunar del
// Apolo (modelo de la NASA, dominio público) en los ocho planetas de la ruta, cada uno con SU física: gravedad, viento
// solar (constante, a ráfagas o que cambia de sentido), atmósfera que frena, niebla, paredes junto a las plataformas o una
// plataforma que se mueve. Cuanto más estrecha la plataforma, más multiplica. Se puntúa la suavidad, el centrado y el
// combustible que sobra.
// Arcade o DESAFÍO (desafio.js, ?modo=desafio): en el desafío el oxígeno de la cabina se gasta y se recarga acertando.
// 27-sep (Norberto: «es imposible, necesitaría el triple de combustible»): el depósito dura 4,5 veces más (de 9 s de
// propulsor a 42 s). Lo comprobé con un piloto automático simulado (la misma física, 200 terrenos por planeta).
// 27-sep, más tarde (Norberto: «cada vez que aterriza en un planeta se guarda el progreso y se desbloquea el siguiente, un
// poco más difícil; no hay que hacer todos seguidos»): UNA PARTIDA = UN PLANETA. En la portada se elige el planeta (los
// superados se pueden rejugar, el siguiente está abierto y el resto con candado); al posarte se guarda el progreso y tu
// marca. Tres módulos por partida y 1-2 minutos. Los puntos del aterrizaje se multiplican por la DIFICULTAD del planeta
// (×1 en Fôrge … ×5,3 en Liminar): así la mejor partida, que es la marca del ranking, sale de llegar lejos, no de repetir
// Fôrge. La curva de los ocho, otra vez con el piloto automático simulado (300 terrenos por planeta, con 0,3 s de
// reacción): la ancha, siempre posable y con combustible de sobra (vuelos de 40-55 s); la estrecha de Liminar, un 65 %
// al piloto automático: exigente, pero posible.
import { THREE, $, azar, elegir, estado, SON, audio, holo, cargar, medir, texBrillo, pantalla, cerrarPantalla, aviso, finDePartida, JUEGOS, EMBED } from './comun.js?v=df75ade81b';
// 🔴 nivelDe (el nº del último planeta superado: 0-8; en el borrador, del navegador; en la web, del servidor) lo escribe
// comun.js. Se lee por el espacio de nombres y no con `import { nivelDe }` para que, mientras comun.js no lo tenga, la
// máquina no se quede en blanco (un import con nombre que no existe tumba el módulo entero): sin él, solo Fôrge.
import * as COMUN from './comun.js?v=df75ade81b';
import { crearDesafio, MODO, urlModo } from './desafio.js?v=df75ade81b';
const nivelDe = (id) => (typeof COMUN.nivelDe === 'function' ? COMUN.nivelDe(id) : 0);

const V3 = THREE.Vector3;
const JUEGO = JUEGOS.find((j) => j.id === 'descenso') || { id: 'descenso', n: 'El Descenso' };
// los ocho planetas, de menos a más difícil: g (m/s²), viento: base (m/s², + a la derecha), rafaga (amplitud), periodo (s),
// cambia (s: el viento da la vuelta), arrastre (atmósfera), niebla, muros (m: paredes a los lados de cada plataforma: hay
// que bajar en vertical), movil (la estrecha va y viene), pistas (anchos: ancha, media, estrecha) y dif (lo que multiplica
// los puntos del aterrizaje). Cada planeta conserva su truco, pero la curva sube sin saltos: más gravedad (más propulsor y
// menos margen), más viento en proporción a la gravedad (lo que de verdad empuja), plataformas más estrechas y, desde
// Sendara, paredes. Reliae bajó de 0,8 a 0,5 de viento: con g 1,4, ni el piloto automático tenía combustible para aguantarlo.
const PLANETAS = [
  { k: 'p1_forge', n: 'Fôrge', g: 1.6, viento: 0, rafaga: 0, rugoso: 0.7, pistas: [16, 11, 7], dif: 1, nota: 'Sin viento: aprende a posarte.' },
  { k: 'p2_ecos', n: 'Ecos', g: 1.3, viento: 0, rafaga: 0.5, periodo: 5, rugoso: 0.8, pistas: [14, 10, 6], dif: 1.4, nota: 'Poca gravedad y ráfagas que van y vienen, como un eco.' },
  { k: 'p3_sendara', n: 'Sendara', g: 2.0, viento: 0.15, rafaga: 0.3, periodo: 7, rugoso: 1.4, muros: 3, pistas: [13, 9, 5.5], dif: 1.8, nota: 'Terreno abrupto: las plataformas están encajadas entre paredes. Baja en vertical.' },
  { k: 'p4_reliae', n: 'Reliae', g: 1.8, viento: 0.5, rafaga: 0.2, periodo: 6, rugoso: 1.0, pistas: [12, 8.5, 5.5], dif: 2.3, nota: 'Viento solar constante: tendrás que ir inclinado contra él.' },
  { k: 'p5_umbral', n: 'Umbral', g: 2.4, viento: -0.35, rafaga: 0.35, periodo: 6, rugoso: 1.1, niebla: true, pistas: [12, 8, 5], dif: 2.9, nota: 'Niebla: el suelo aparece tarde. Mira la altura.' },
  { k: 'p6_ludo', n: 'Ludo', g: 2.2, viento: 0.35, rafaga: 0.35, periodo: 5, rugoso: 1.1, movil: true, muros: 3, pistas: [11, 8, 6], dif: 3.6, nota: 'La plataforma ×4 va y viene: es un juego. Espérala donde da la vuelta.' },
  { k: 'p7_vinculo', n: 'Vínculo', g: 3.4, viento: -0.45, rafaga: 0.45, periodo: 6, rugoso: 1.2, arrastre: 0.3, muros: 4, pistas: [11, 7.5, 4.8], dif: 4.4, nota: 'Gravedad fuerte, atmósfera espesa que frena y paredes altas.' },
  { k: 'p8_liminar', n: 'Liminar', g: 2.4, viento: 0.6, rafaga: 0.45, periodo: 4, cambia: 6, rugoso: 1.3, muros: 4, pistas: [10, 7, 4.5], dif: 5.3, nota: 'El viento cambia de sentido cada pocos segundos. Y hay paredes.' },
];
const MULT = [1, 2, 4];                       // la ancha, la media, la estrecha
const SEGURO = { vy: 2.4, vx: 1.6, ang: 0.2 };  // lo que aguantan las patas
const COMB_S = 2.4;                            // combustible por segundo de propulsor (el depósito es de 100: ~42 s)
const VIDAS = 3;                               // módulos por partida (por planeta)
const INTACTO = 250;                           // puntos por cada módulo que te sobra al posarte (antes de la dificultad)
const TOPE_S = 240;                            // tope de seguridad de una partida (un planeta), por si alguien se queda flotando
const MOVIL = { a: 10, w: 0.35 };              // Ludo: la estrecha va y viene ±10 m (3,5 m/s en el centro, quieta en los extremos)
const fmtDif = (d) => '×' + d.toLocaleString('es-ES', { minimumFractionDigits: d % 1 ? 1 : 0 });

// ───────────────────────────────── escena
const lienzo = $('lienzo');
const render = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true });
render.setPixelRatio(Math.min(devicePixelRatio, 2));
render.outputColorSpace = THREE.SRGBColorSpace;
render.toneMapping = THREE.ACESFilmicToneMapping;
const escena = new THREE.Scene();
escena.background = new THREE.Color(0x01030a);
const camara = new THREE.PerspectiveCamera(50, 1, 0.1, 2000);
const cielo = new THREE.HemisphereLight(0xcfe6ff, 0x1a1020, 1.1); escena.add(cielo);
const sol = new THREE.DirectionalLight(0xfff2d8, 2.6); sol.position.set(-40, 60, 40); escena.add(sol);
function ajustar() { render.setSize(innerWidth, innerHeight, false); camara.aspect = innerWidth / innerHeight; camara.updateProjectionMatrix(); }
addEventListener('resize', ajustar); ajustar();
if (matchMedia('(pointer: coarse)').matches) document.body.classList.add('tactil');

const NE = 900, estGeo = new THREE.BufferGeometry(), estPos = new Float32Array(NE * 3);
for (let i = 0; i < NE; i++) { estPos[i * 3] = azar(-600, 600); estPos[i * 3 + 1] = azar(-50, 500); estPos[i * 3 + 2] = azar(-500, -250); }
estGeo.setAttribute('position', new THREE.BufferAttribute(estPos, 3));
const estrellas = new THREE.Points(estGeo, new THREE.PointsMaterial({ color: 0xdff0ff, size: 2.2, map: texBrillo, transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending }));
escena.add(estrellas);
// el sol (de él sale el viento): un brillo grande en el cielo
const astro = new THREE.Sprite(new THREE.SpriteMaterial({ map: texBrillo, color: 0xfff1c4, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); astro.scale.setScalar(160); escena.add(astro);
const texturas = new THREE.TextureLoader();
const texRoca = texturas.load('tex/fobos.jpg'); texRoca.colorSpace = THREE.SRGBColorSpace; texRoca.wrapS = texRoca.wrapT = THREE.RepeatWrapping; texRoca.repeat.set(0.035, 0.035);
// el color medio de cada planeta, sacado de su propia imagen (sin inventar paletas)
const colorMedio = {};
function medirColores() {
  return Promise.all(PLANETAS.map((P) => new Promise((ok) => { const im = new Image(); im.onload = () => {
    const c = document.createElement('canvas'); c.width = c.height = 24; const x = c.getContext('2d'); x.drawImage(im, 0, 0, 24, 24);
    const d = x.getImageData(0, 0, 24, 24).data; let r = 0, g = 0, b = 0, n = 0;
    for (let i = 0; i < d.length; i += 4) { const l = d[i] + d[i + 1] + d[i + 2]; if (l > 40) { r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; } }
    const col = new THREE.Color(r / n / 255, g / n / 255, b / n / 255); const hsl = {}; col.getHSL(hsl); col.setHSL(hsl.h, Math.min(0.55, hsl.s), Math.max(0.45, hsl.l));
    colorMedio[P.k] = col; ok(); }; im.onerror = () => ok(); im.src = `tex/${P.k}.jpg`; })));
}
const brillo = (color, esc = 2) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: texBrillo, color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); s.scale.setScalar(esc); return s; };

// ───────────────────────────────── el terreno de cada planeta
const ANCHO = 360, PASO = 2;
let T = null;   // { perfil: [y...], pistas: [{x0,x1,y,mult,obj}], grupo }
function altura(x) {
  if (!T) return 0; const i = (x + ANCHO / 2) / PASO, a = Math.floor(i), b = a + 1, f = i - a;
  const p = T.perfil; if (a < 0) return p[0]; if (b >= p.length) return p[p.length - 1];
  return p[a] * (1 - f) + p[b] * f;
}
function texRotulo(txt, color) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128; const x = c.getContext('2d');
  x.font = '800 84px Orbitron, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.shadowColor = color; x.shadowBlur = 18; x.fillStyle = color; x.fillText(txt, 128, 68);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function montarTerreno(P) {
  if (T) escena.remove(T.grupo);
  const n = ANCHO / PASO + 1, perfil = [], fase = [azar(0, 6), azar(0, 6), azar(0, 6)];
  for (let i = 0; i < n; i++) { const x = -ANCHO / 2 + i * PASO; perfil.push((Math.sin(x * 0.021 + fase[0]) * 14 + Math.sin(x * 0.057 + fase[1]) * 7 + Math.sin(x * 0.13 + fase[2]) * 3 + azar(-1, 1)) * P.rugoso); }
  // las tres plataformas, en tres tercios distintos del mapa y en orden al azar
  const huecos = [[-150, -70], [-40, 40], [70, 150]].sort(() => Math.random() - 0.5);
  const pistas = P.pistas.map((w, i) => {
    // la que se mueve (Ludo) necesita su recorrido llano: un foso a la altura de la plataforma por el que se desliza (si
    // tocas el foso y no la plataforma, «fuera de las plataformas», como en cualquier otro suelo)
    const mueve = P.movil && i === 2, ext = mueve ? MOVIL.a : 0;
    const [a, b] = huecos[i], cx = azar(a + w + ext, b - w - ext), x0 = cx - w / 2, x1 = cx + w / 2;
    const i0 = Math.floor((x0 - ext + ANCHO / 2) / PASO) - 1, i1 = Math.ceil((x1 + ext + ANCHO / 2) / PASO) + 1;
    const y = Math.max(...perfil.slice(i0, i1 + 1)) + 1;
    for (let k = i0; k <= i1; k++) perfil[k] = y;
    // las paredes: dos columnas de roca a cada lado, por encima de la plataforma. Obligan a llegar parado y bajar en
    // vertical los últimos metros, que es justo cuando el viento empuja
    if (P.muros) for (const k of [i0 - 1, i0 - 2, i1 + 1, i1 + 2]) if (k >= 0 && k < perfil.length) perfil[k] = Math.max(perfil[k], y + P.muros);
    return { x0, x1, cx, base: cx, w, y, mult: MULT[i], mueve };
  });
  // el suelo: el perfil extruido hacia dentro (3D), con la piel del planeta
  const forma = new THREE.Shape(); forma.moveTo(-ANCHO / 2, -90);
  perfil.forEach((y, i) => forma.lineTo(-ANCHO / 2 + i * PASO, y)); forma.lineTo(ANCHO / 2, -90); forma.closePath();
  const geo = new THREE.ExtrudeGeometry(forma, { depth: 70, bevelEnabled: false, steps: 1 }); geo.translate(0, 0, -50);
  // la piel: roca de verdad (Fobos, NASA) teñida con el color medio del planeta
  const grupo = new THREE.Group();
  const suelo = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: texRoca, color: colorMedio[P.k] || 0x9a8f86, roughness: 0.95, emissive: colorMedio[P.k] || 0x333333, emissiveIntensity: 0.12 }));
  grupo.add(suelo);
  // y en el cielo, el planeta al que vas después (o la Estática, al final)
  const sig = PLANETAS[PLANETAS.indexOf(P) + 1], tcielo = texturas.load(`tex/${sig ? sig.k : 'estatica'}.jpg`); tcielo.colorSpace = THREE.SRGBColorSpace;
  const lejos = new THREE.Mesh(new THREE.SphereGeometry(70, 48, 32), new THREE.MeshBasicMaterial({ map: tcielo, fog: false }));
  lejos.position.set(azar(-120, 120), 190, -520); lejos.rotation.y = -Math.PI / 2; grupo.add(lejos);
  // el borde del perfil, en neón (el simulador sigue siendo un holograma)
  const pts = perfil.map((y, i) => new V3(-ANCHO / 2 + i * PASO, y + 0.05, 20.2));
  grupo.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x5ff4ff, transparent: true, opacity: 0.6 })));
  const colores = [0x5dffa0, 0xffc24a, 0xff4dd8];
  for (const p of pistas) {
    const g = new THREE.Group(); g.position.set(p.cx, p.y, 0);
    const losa = new THREE.Mesh(new THREE.BoxGeometry(p.w, 0.6, 24), new THREE.MeshStandardMaterial({ color: 0x1b2a38, emissive: colores[p.mult === 1 ? 0 : p.mult === 2 ? 1 : 2], emissiveIntensity: 0.35, metalness: 0.6, roughness: 0.4 }));
    losa.position.y = -0.3; g.add(losa);
    for (const s of [-1, 1]) { const l = brillo(colores[p.mult === 1 ? 0 : p.mult === 2 ? 1 : 2], 2.2); l.position.set(s * p.w / 2, 0.4, 12.5); g.add(l); p.luces = (p.luces || []).concat(l); }
    const rot = new THREE.Sprite(new THREE.SpriteMaterial({ map: texRotulo('×' + p.mult, ['#5dffa0', '#ffc24a', '#ff4dd8'][p.mult === 1 ? 0 : p.mult === 2 ? 1 : 2]), transparent: true, depthWrite: false }));
    rot.scale.set(8, 4, 1); rot.position.set(0, 5, 12); g.add(rot);
    grupo.add(g); p.obj = g;
  }
  escena.add(grupo);
  T = { perfil, pistas, grupo };
  // el cielo y la niebla de cada mundo
  const c = new THREE.Color().setHSL(azar(0.55, 0.7), 0.5, 0.04);
  const bruma = new THREE.Color(0x56606c);
  escena.background = P.niebla ? bruma : c; escena.fog = P.niebla ? new THREE.Fog(bruma, 18, 60) : new THREE.Fog(c, 200, 700);
}

// ───────────────────────────────── el módulo
let lem = null, llama = null, llamaLuz = null;
const polvo = [], vientoFx = [];
const MAXP = 500, pGeo = new THREE.BufferGeometry(), pPos = new Float32Array(MAXP * 3), pCol = new Float32Array(MAXP * 3);
pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3)); pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
const particulas = new THREE.Points(pGeo, new THREE.PointsMaterial({ size: 0.9, map: texBrillo, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
escena.add(particulas);
// el viento solar se ve: rayas de luz que cruzan en su sentido (más largas cuanto más sopla)
const NR = 140, rayas = [];
const vientoFxObj = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.16, 0.16), new THREE.MeshBasicMaterial({ color: 0xffe7a0, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false }), NR);
vientoFxObj.frustumCulled = false; escena.add(vientoFxObj);
for (let i = 0; i < NR; i++) rayas.push({ x: 0, y: 0, z: 0, vida: 0 });
const m4r = new THREE.Matrix4(), qr = new THREE.Quaternion(), cero = new V3(0, 0, 0);
function moverRayas(dt, v, cx, cy) {
  const k = Math.abs(v), dir = Math.sign(v) || 1;
  for (let i = 0; i < NR; i++) {
    const r = rayas[i];
    r.vida -= dt;
    if (r.vida <= 0 && k > 0.05 && Math.random() < 0.35) { r.x = cx - dir * azar(20, 80); r.y = cy + azar(-40, 30); r.z = azar(-25, 14); r.vida = azar(0.9, 1.8); }
    if (r.vida > 0) r.x += dir * (22 + k * 34) * dt;
    const largo = r.vida > 0 ? 3 + k * 9 : 0.0001;
    m4r.compose(new V3(r.x, r.y, r.z), qr, new V3(largo, r.vida > 0 ? 1 : 0.0001, 1)); vientoFxObj.setMatrixAt(i, m4r);
  }
  vientoFxObj.instanceMatrix.needsUpdate = true; vientoFxObj.material.opacity = Math.min(0.75, 0.25 + k * 0.5);
}
function chispa(x, y, z, vx, vy, vida, color) { if (polvo.length < MAXP) polvo.push({ x, y, z, vx, vy, vida, max: vida, c: new THREE.Color(color) }); }

// ───────────────────────────────── estado
let S = null;
// una partida = un planeta (nivel: 0-7). puntos = los del aterrizaje ya multiplicados (0 hasta posarse)
function nueva(nivel = 0) { return { nivel, vidas: VIDAS, puntos: 0, t0: performance.now(), fin: false }; }
function nuevoVuelo() {
  const P = PLANETAS[S.nivel];
  S.P = P; S.x = azar(-150, -110) * elegir([1, -1]); S.y = Math.max(...T.perfil) + 55; S.vx = -Math.sign(S.x) * azar(2, 3.5); S.vy = 0;
  S.ang = 0; S.comb = 100; S.prop = false; S.t = 0; S.estado = 'vuela'; S.cuenta = 1.2;
  lem.visible = true;
}

// ── controles: teclado y botones del dedo (varios a la vez)
const tecla = {};
addEventListener('keydown', (e) => { tecla[e.code] = true; if (e.code === 'Space') e.preventDefault(); if (e.code === 'KeyP' || e.code === 'Escape') pausar(); });
addEventListener('keyup', (e) => { tecla[e.code] = false; });
const toque = { izq: false, der: false, prop: false };
for (const [id, k] of [['m-izq', 'izq'], ['m-der', 'der'], ['m-prop', 'prop']]) {
  const b = $(id);
  b.addEventListener('pointerdown', (e) => { e.preventDefault(); audio(); toque[k] = true; b.setPointerCapture(e.pointerId); });
  b.addEventListener('pointerup', () => { toque[k] = false; }); b.addEventListener('pointercancel', () => { toque[k] = false; });
}

// el ruido del propulsor: un soplido continuo que se abre al acelerar
let soplido = null;

// el modo desafío: el oxígeno de la cabina (el combustible ya es otra cosa aquí: es el del propulsor). Se llama DESAFIO y no
// DES porque window.DES ya es el mando de consola de esta máquina. Solo se gasta en pleno vuelo (no en la cuenta atrás, ni
// posado, ni estrellado). Su barra va en #des-slot, abajo a la derecha y, en el móvil, por encima de los botones táctiles.
// Al abrir la pregunta se calla el propulsor; al cerrarla se sueltan teclas y botones (el panel se tragó el keyup/pointerup)
// y se corre el reloj de la partida lo que duró la pregunta: el tope de 4 minutos va por reloj de pared y pensar no cuenta
let abiertaDesde = 0;
const DESAFIO = crearDesafio({ nombre: 'Oxígeno', segundos: 40, recarga: 40, hud: $('des-slot'),
  alPausar: (si) => {
    if (si) { abiertaDesde = performance.now(); if (soplido) soplido.gain.value = 0; return; }
    for (const k in tecla) tecla[k] = false; for (const k in toque) toque[k] = false;
    if (S && abiertaDesde) S.t0 += performance.now() - abiertaDesde; abiertaDesde = 0;
  },
  enJuego: () => !!S && !S.fin && !pausa && S.estado === 'vuela' && !(S.cuenta > 0) });
if (DESAFIO.activo) DESAFIO.preparar(); // se piden las preguntas mientras lees la portada
function prepararSoplido() {
  const a = audio(); if (!a || soplido) return;
  const n = a.sampleRate * 2, b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  const s = a.createBufferSource(); s.buffer = b; s.loop = true; const f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 420; const g = a.createGain(); g.gain.value = 0;
  s.connect(f).connect(g).connect(a.destination); s.start(); soplido = g;
}

function vientoAhora(P, t) {
  let v = P.viento + (P.rafaga ? Math.sin(t * Math.PI * 2 / (P.periodo || 5)) * P.rafaga : 0);
  if (P.cambia) v *= Math.floor(t / P.cambia) % 2 ? -1 : 1;
  return v;
}

function tick(dt) {
  if (!S || S.fin) return;
  const P = S.P; if (!P) return;
  if (S.cuenta > 0) { S.cuenta -= dt; return; }
  const tot = (performance.now() - S.t0) / 1000;
  if (tot > TOPE_S && S.estado === 'vuela') { terminar('Se acabó el tiempo del simulador.'); return; }
  S.t += dt;
  // la plataforma que se mueve (Ludo)
  // (por posición y no sumando pasos: así no se desplaza con los tirones de fotogramas; y quieta una vez posado)
  if (P.movil && S.estado === 'vuela') { const p = T.pistas.find((x) => x.mueve); p.cx = p.base + Math.sin(S.t * MOVIL.w) * MOVIL.a; p.x0 = p.cx - p.w / 2; p.x1 = p.cx + p.w / 2; p.obj.position.x = p.cx; }
  if (S.estado === 'vuela') {
    const giro = (tecla.ArrowLeft || tecla.KeyA || toque.izq ? 1 : 0) - (tecla.ArrowRight || tecla.KeyD || toque.der ? 1 : 0);
    S.ang = THREE.MathUtils.clamp(S.ang + giro * 1.7 * dt, -1.3, 1.3);
    S.prop = (tecla.ArrowUp || tecla.KeyW || tecla.Space || toque.prop) && S.comb > 0;
    const empuje = Math.max(3.6, P.g * 2.3);
    let ax = vientoAhora(P, S.t) * (S.y - altura(S.x) > 3 ? 1 : 0.3), ay = -P.g;
    if (S.prop) { ax += -Math.sin(S.ang) * empuje; ay += Math.cos(S.ang) * empuje; S.comb = Math.max(0, S.comb - COMB_S * dt); }
    if (P.arrastre) { ax -= S.vx * P.arrastre; ay -= S.vy * P.arrastre * 0.6; }
    S.vx += ax * dt; S.vy += ay * dt; S.x += S.vx * dt; S.y += S.vy * dt;
    S.x = THREE.MathUtils.clamp(S.x, -ANCHO / 2 + 6, ANCHO / 2 - 6);
    if (soplido) soplido.gain.value += ((S.prop ? 0.22 : 0) - soplido.gain.value) * Math.min(1, dt * 12);
    // las patas tocan el suelo
    const pie = 1.9, patas = [S.x - pie * Math.cos(S.ang), S.x + pie * Math.cos(S.ang)];
    const alturaPies = S.y - 0.1 - Math.abs(Math.sin(S.ang)) * pie;
    if (patas.some((px) => alturaPies <= altura(px))) tocarSuelo(patas);
    // el llamear y el polvo
    if (S.prop) for (let i = 0; i < 3; i++) chispa(S.x + Math.sin(S.ang) * 2.2 + azar(-0.3, 0.3), S.y - Math.cos(S.ang) * 2.2, azar(-0.3, 0.3), Math.sin(S.ang) * 14 + azar(-2, 2) + S.vx, -Math.cos(S.ang) * 14 + azar(-2, 2) + S.vy, azar(0.25, 0.5), elegir([0xffb347, 0xff6a3d, 0xfff1c4]));
    const h = S.y - altura(S.x);
    if (S.prop && h < 12) for (let i = 0; i < 2; i++) chispa(S.x + azar(-3, 3), altura(S.x) + 0.3, azar(-2, 2), azar(-8, 8), azar(0.5, 3), azar(0.4, 0.8), 0xb9a58c);
  }
  // el viento solar se ve: rayas que cruzan
  const vv = vientoAhora(P, S.t);
  moverRayas(dt, vv, S.x, S.y);
  pintarHUD(vv);
}
function tocarSuelo(patas) {
  S._vyAntes = S.vy;   // (la velocidad con la que toca: la suavidad puntúa)
  const p = T.pistas.find((x) => patas.every((px) => px >= x.x0 && px <= x.x1));
  const suave = Math.abs(S.vy) <= SEGURO.vy && Math.abs(S.vx) <= SEGURO.vx && Math.abs(S.ang) <= SEGURO.ang;
  if (p && suave) posado(p);
  else estrellado(!p ? 'Fuera de las plataformas.' : Math.abs(S.ang) > SEGURO.ang ? 'Demasiado inclinado.' : Math.abs(S.vy) > SEGURO.vy ? 'Demasiado rápido: las patas no aguantan.' : 'Demasiada deriva lateral.');
}
function posado(p) {
  S.estado = 'posado'; S.prop = false; if (soplido) soplido.gain.value = 0;
  S.y = p.y + 0.02; S.vx = S.vy = 0; S.ang = 0;
  const vyToque = Math.abs(S._vyAntes || 0);
  const suavidad = (SEGURO.vy - Math.min(SEGURO.vy, vyToque)) / SEGURO.vy;
  const centrado = Math.max(0, 1 - Math.abs(S.x - p.cx) / (p.w / 2));
  // el aterrizaje, como siempre (plataforma × suavidad y centrado, + combustible) y + los módulos que te sobran; todo eso,
  // por la dificultad del planeta
  const aterrizaje = Math.round(p.mult * (300 + suavidad * 200 + centrado * 150) + S.comb * 6);
  const intactos = (S.vidas - 1) * INTACTO;
  S.detalle = { mult: p.mult, aterrizaje, intactos, suavidad, centrado, comb: S.comb };
  S.puntos = Math.round((aterrizaje + intactos) * S.P.dif);
  SON.bien(); aviso(`¡POSADO EN ${S.P.n.toUpperCase()}! ×${p.mult} · +${S.puntos.toLocaleString('es-ES')}`, '#5dffa0', 2);
  for (let i = 0; i < 40; i++) chispa(S.x + azar(-4, 4), p.y + 0.4, azar(-3, 3), azar(-6, 6), azar(1, 5), azar(0.6, 1.2), 0x5dffa0);
  setTimeout(() => terminar(null, true), 2200);
}
function estrellado(motivo) {
  S.estado = 'roto'; S.prop = false; if (soplido) soplido.gain.value = 0; S.vidas--;
  SON.caida(); lem.visible = false;
  for (let i = 0; i < 90; i++) chispa(S.x, S.y, azar(-2, 2), azar(-14, 14), azar(0, 16), azar(0.6, 1.4), elegir([0xffb347, 0xff6a3d, 0xfff1c4, 0x9aa6b2]));
  aviso(`¡ESTRELLADO! ${motivo}`, '#ff4d6d', 2.2);
  setTimeout(() => { if (!S || S.fin) return; if (S.vidas <= 0) terminar(`Te has quedado sin módulos en ${S.P.n}. Vuelve a intentarlo: el planeta sigue ahí.`); else { nuevoVuelo(); aviso(`Otra vez, en ${S.P.n}`, '#5ff4ff', 1.2); } }, 2200);
}
function pantallita(P) {
  aviso(`${S.nivel + 1}/8 · ${P.n.toUpperCase()}`, '#5ff4ff', 1.6);
  $('extra').textContent = `${P.nota} Dificultad ${fmtDif(P.dif)}.`;
}
// lo más alto que has abierto en esta visita: si el servidor tarda en apuntar el progreso, el botón «Siguiente planeta» y
// el selector no te cierran lo que acabas de ganar (lo que vale para siempre es nivelDe)
let superadoAqui = 0;
let elegido = null;   // el planeta marcado en el selector (se recuerda entre partidas de esta visita)
function terminar(motivo, posadoOk = false) {
  if (S.fin) return; S.fin = true; if (soplido) soplido.gain.value = 0; DESAFIO.parar();
  const N = S.nivel + 1, P = S.P, d = S.detalle;
  if (posadoOk) superadoAqui = Math.max(superadoAqui, N);
  if (posadoOk && N < PLANETAS.length) elegido = N;   // al volver al selector, marcado el que se acaba de abrir
  // «Ocho mundos, cero golpes»: posarte en Liminar, el 8.º (al que solo se llega habiendo superado los otros siete), sin
  // perder ningún módulo en esa partida. Se eligió esto y no «los ocho, cada uno a la primera» porque esa cuenta pediría
  // guardar una marca por planeta que el servidor no lleva: un dato, un sitio.
  const perfecto = posadoOk && N === PLANETAS.length && S.vidas === VIDAS;
  const bonus = DESAFIO.bonus(S.puntos); // el bonus de precisión del desafío (0 en arcade), sobre la marca ya completa
  setTimeout(() => {
    $('hud').classList.add('oculto');
    const seg = Math.round((performance.now() - S.t0) / 1000), NOM = ['la ancha', 'la media', '', 'la estrecha'];
    const filas = posadoOk
      ? [['Planeta', `${N}. ${P.n}`], ['Plataforma', `${NOM[d.mult - 1]} (×${d.mult})`], ['Aterrizaje', d.aterrizaje.toLocaleString('es-ES')],
        ['Módulos de sobra', `${S.vidas - 1} (+${d.intactos.toLocaleString('es-ES')})`], ['Dificultad', fmtDif(P.dif)], ['Tiempo', `${Math.floor(seg / 60)}:${String(seg % 60).padStart(2, '0')}`]]
      : [['Planeta', `${N}. ${P.n}`], ['Módulos que quedan', '0'], ['Tiempo', `${Math.floor(seg / 60)}:${String(seg % 60).padStart(2, '0')}`]];
    const sig = posadoOk && N < PLANETAS.length ? PLANETAS[N] : null;
    finDePartida({ juego: JUEGO.id, titulo: posadoOk ? `¡Posado en ${P.n}!` : 'Fin del descenso', puntos: S.puntos + bonus,
      texto: posadoOk ? (sig ? `Progreso guardado: se abre <b>${sig.n}</b>, un poco más difícil (${fmtDif(sig.dif)} a los puntos).` : 'Te has posado en los ocho mundos de la ruta.') : motivo,
      filas: [...filas, ...DESAFIO.filas(bonus)],
      alRepetir: () => empezar(S.nivel), extra: { ...DESAFIO.extra(), planeta: N, posado: posadoOk, perfecto } });
    // los botones del final: repetir este planeta, pasar al siguiente (si lo has abierto) o volver al selector
    const otra = $('b-otra'); otra.textContent = `Repetir ${P.n}`; otra.classList.toggle('sec', !!sig);
    const mapa = document.createElement('button'); mapa.className = 'sec'; mapa.textContent = 'Elegir planeta';
    mapa.onclick = () => { cerrarPantalla(); portada(); }; otra.after(mapa);
    if (sig) { const b = document.createElement('button'); b.textContent = `Siguiente: ${sig.n}`; b.onclick = () => { cerrarPantalla(); empezar(N); }; otra.before(b); }
  }, 900);
}

function pintarHUD(vv) {
  const h = Math.max(0, S.y - 2 - altura(S.x));
  const fmt = (v) => v.toFixed(1).replace('.', ',');
  $('h-pts').textContent = Math.round(S.puntos).toLocaleString('es-ES');
  $('h-pl').textContent = `${S.nivel + 1}/8`;
  $('h-vid').textContent = Math.max(0, S.vidas);
  $('h-alt').textContent = Math.round(h) + ' m';
  const vy = $('h-vy'); vy.textContent = fmt(-S.vy) + ' m/s'; vy.className = Math.abs(S.vy) <= SEGURO.vy ? 'ok' : 'mal';
  const vx = $('h-vx'); vx.textContent = fmt(S.vx) + ' m/s'; vx.className = Math.abs(S.vx) <= SEGURO.vx ? 'ok' : 'mal';
  const an = $('h-ang'); an.textContent = Math.round(-S.ang * 57.3) + '°'; an.className = Math.abs(S.ang) <= SEGURO.ang ? 'ok' : 'mal';
  $('h-g').textContent = fmt(S.P.g) + ' m/s²';
  const fl = $('h-vi'); fl.style.width = Math.round(12 + Math.min(1.5, Math.abs(vv)) * 30) + 'px'; fl.classList.toggle('izq', vv < 0); fl.style.opacity = Math.abs(vv) < 0.05 ? 0.3 : 1;
  $('h-vf').textContent = Math.abs(vv) < 0.05 ? 'calma' : fmt(Math.abs(vv));
  $('h-c').style.width = S.comb + '%'; $('h-cb').classList.toggle('peligro', S.comb < 20);
}

// ───────────────────────────────── bucle
let pausa = false;
function pausar() {
  if (!S || S.fin || S.estado === 'portada' || DESAFIO.abierto) return; pausa = !pausa; if (soplido) soplido.gain.value = 0; // con la pregunta abierta el juego ya está parado
  if (pausa) { pantalla(`<h2>Pausa</h2><div class="botones"><button id="b-seg">Seguir</button>${EMBED ? '' : '<a class="boton sec" href="index.html?v=df75ade81b">Volver a la sala</a>'}</div>`); $('b-seg').onclick = pausar; }
  else cerrarPantalla();
}
document.addEventListener('visibilitychange', () => { if (document.hidden && S && !S.fin && !pausa && !DESAFIO.abierto && !window.__sinPausa) pausar(); });
let antes = performance.now();
function bucle(ahora) {
  requestAnimationFrame(bucle);
  const dt = Math.min(0.04, (ahora - antes) / 1000); antes = ahora;
  if (!pausa && !DESAFIO.abierto) { tick(dt); DESAFIO.tick(dt); } // con la pregunta abierta, nada corre
  // el módulo, la llama y la cámara
  if (S && lem) {
    lem.position.set(S.x, S.y, 0); lem.rotation.z = S.ang;
    llama.visible = S.prop && S.estado === 'vuela'; llama.scale.setScalar(2.4 + Math.random() * 1.2); llamaLuz.intensity = llama.visible ? 40 : 0;
    const h = S.y - altura(S.x), zoom = THREE.MathUtils.clamp(h * 0.9 + 30, 32, 85);
    // de lado, como el Lunar Lander de siempre: el suelo se ve de perfil y cuanto más cerca, más zoom
    camara.position.lerp(new V3(S.x + S.vx * 0.6, S.y - h * 0.35 + zoom * 0.1, zoom + 20), Math.min(1, dt * 3));
    camara.lookAt(S.x + S.vx * 0.5, S.y - h * 0.4, 0);
    if (S.prop && h < 8) camara.position.x += azar(-0.12, 0.12);
    if (S.P && S.P.niebla && escena.fog) { const dcam = camara.position.distanceTo(lem.position); escena.fog.near = dcam * 0.7; escena.fog.far = dcam + 16; }
    astro.position.set(camara.position.x + (S.P && vientoAhora(S.P, S.t) < 0 ? 220 : -220), camara.position.y + 140, -420);
    estrellas.position.x = camara.position.x * 0.9; estrellas.position.y = camara.position.y * 0.9;
  }
  // partículas
  let n = 0;
  for (let i = polvo.length - 1; i >= 0; i--) {
    const q = polvo[i]; q.vida -= dt; if (q.vida <= 0) { polvo.splice(i, 1); continue; }
    q.x += q.vx * dt; q.y += q.vy * dt; q.vy -= (S && S.P ? S.P.g : 1.6) * 0.3 * dt;
    const f = q.vida / q.max; pPos.set([q.x, q.y, q.z], n * 3); pCol.set([q.c.r * f, q.c.g * f, q.c.b * f], n * 3); n++;
  }
  pGeo.setDrawRange(0, n); pGeo.attributes.position.needsUpdate = true; pGeo.attributes.color.needsUpdate = true;
  if (T) for (const p of T.pistas) (p.luces || []).forEach((l) => { l.material.opacity = 0.6 + Math.sin(ahora / 200 + p.cx) * 0.4; });
  render.render(escena, camara);
}
function empezar(nivel = 0) {
  elegido = nivel; S = nueva(nivel); window.__t0Partida = performance.now(); prepararSoplido();
  const P = PLANETAS[nivel]; montarTerreno(P); S.P = P; nuevoVuelo(); pantallita(P);
  $('hud').classList.remove('oculto'); cerrarPantalla(); pausa = false;
  DESAFIO.empezar();
}
// lo que se ve detrás de la portada: el planeta elegido y el módulo esperando arriba
function vistaPortada(i) {
  montarTerreno(PLANETAS[i]); S = nueva(i); S.P = PLANETAS[i]; S.x = -40; S.y = Math.max(...T.perfil) + 30; S.vx = 0; S.vy = 0; S.ang = 0.1; S.t = 0; S.estado = 'portada'; S.comb = 100;
  lem.visible = true; camara.position.set(-40, S.y + 10, 60); camara.lookAt(-40, S.y - 8, 0);
}
// los iconos del selector (SVG propio: nada de emojis)
const ICONO = {
  candado: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2" fill="currentColor"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke="currentColor" stroke-width="2.2"/></svg>',
  hecho: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};
async function portada() {
  const e = estado(), desafio = MODO === 'desafio';
  // hasta dónde has llegado: lo guardado (nivelDe) o, si el servidor aún no lo ha apuntado, lo que has ganado en esta visita
  let hecho = 0; try { hecho = Number(await nivelDe('descenso')) || 0; } catch (x) { /* sin progreso: solo Fôrge */ }
  hecho = Math.min(PLANETAS.length, Math.max(hecho, superadoAqui));
  const abierto = Math.min(PLANETAS.length, hecho + 1);   // 1-8: el último que se puede jugar
  if (elegido === null || elegido >= abierto) elegido = abierto - 1;
  const fichas = PLANETAS.map((P, i) => {
    const est = i < hecho ? 'hecho' : i < abierto ? 'nuevo' : 'cerrado';
    return `<button class="pl ${est}${i === elegido ? ' sel' : ''}" data-i="${i}" ${est === 'cerrado' ? 'disabled' : ''} aria-label="${i + 1}. ${P.n}${est === 'cerrado' ? ' (bloqueado)' : ''}">
      <span class="pl-bola" style="background-image:url(tex/${P.k}.jpg)">${est === 'cerrado' ? ICONO.candado : est === 'hecho' ? `<i class="pl-ok">${ICONO.hecho}</i>` : ''}</span>
      <span class="pl-txt"><b>${i + 1}. ${P.n}</b><small>${est === 'hecho' ? 'Superado' : est === 'nuevo' ? 'Disponible' : 'Bloqueado'} · ${fmtDif(P.dif)}</small></span></button>`;
  }).join('');
  pantalla(`<div class="kicker">El simulador de Joran · máquina 4${desafio ? ' · modo desafío' : ''}</div><h2>El Descenso</h2>
    <p>Posa el <b>Módulo Lunar</b> en los <b>ocho planetas de la ruta</b>, cada uno con su gravedad, su <b>viento solar</b> y su truco. Cada partida es <b>un planeta</b>: al posarte se guarda y se abre el siguiente, un poco más difícil. No hace falta hacerlos seguidos.</p>
    <div class="planetas" id="planetas">${fichas}</div>
    <p class="pl-nota" id="pl-nota"></p>
    <div class="teclas"><kbd>← →  /  A D</kbd><span>Girar el módulo</span><kbd>↑  /  W  /  Espacio</kbd><span>Propulsor (gasta combustible)</span></div>
    <p>Para posarte: caída de menos de <b>${SEGURO.vy.toLocaleString('es-ES')} m/s</b>, deriva de menos de <b>${SEGURO.vx.toLocaleString('es-ES')} m/s</b> y el módulo casi recto (lo verde del panel). Plataformas: <b style="color:#5dffa0">×1</b> la ancha, <b style="color:#ffc24a">×2</b> la media y <b style="color:#ff4dd8">×4</b> la estrecha. Suman la suavidad, el centrado, el combustible y los módulos que te sobren (tienes ${VIDAS}); y todo se multiplica por la <b>dificultad del planeta</b>.</p>
    ${DESAFIO.texto()}
    <p class="pista">Tu marca (tu mejor partida): <b>${(e.marcas.descenso || 0).toLocaleString('es-ES')}</b> · Módulo Lunar del Apolo: NASA (dominio público)</p>
    <div class="botones"><button id="b-ya"></button><a class="boton sec" href="${urlModo(desafio ? 'arcade' : 'desafio')}">${desafio ? 'Jugar en arcade' : 'Jugar en desafío'}</a>${EMBED ? '' : '<a class="boton sec" href="index.html?v=df75ade81b">Volver a la sala</a>'}</div>`);
  const marcar = (i) => {
    elegido = i; const P = PLANETAS[i];
    document.querySelectorAll('#planetas .pl').forEach((b) => b.classList.toggle('sel', +b.dataset.i === i));
    $('pl-nota').innerHTML = `<b>${P.n}</b> · ${P.nota} Gravedad ${P.g.toLocaleString('es-ES')} m/s² · puntos ${fmtDif(P.dif)}.`;
    $('b-ya').textContent = `Descender en ${P.n}`;
    vistaPortada(i);
  };
  document.querySelectorAll('#planetas .pl').forEach((b) => { b.onclick = () => marcar(+b.dataset.i); });
  marcar(elegido);
  $('b-ya').onclick = async () => {
    audio();
    if (desafio) { // las preguntas tienen que estar antes de despegar: sin ellas, el oxígeno no se podría recargar
      const b = $('b-ya'); b.disabled = true; b.textContent = 'Cargando preguntas…';
      if (!(await DESAFIO.preparar())) aviso('Sin preguntas: juegas en arcade', '#ffc24a', 2.2);
    }
    empezar(elegido);
  };
}
(async () => {
  const g = await cargar('modulo_lunar');
  const m = g.scene.clone(true);
  const t = medir(m).getSize(new V3()); m.scale.setScalar(4.2 / t.y);
  const c = medir(m); m.position.set(-(c.min.x + c.max.x) / 2, -c.min.y, -(c.min.z + c.max.z) / 2);
  lem = new THREE.Group(); lem.add(m); holo(lem, 0x5ff4ff, 0.35); escena.add(lem);
  llama = brillo(0xffa347, 3); llama.position.set(0, -0.6, 0); lem.add(llama);
  llamaLuz = new THREE.PointLight(0xffa347, 0, 30, 1.6); llamaLuz.position.set(0, -1.5, 0); lem.add(llamaLuz);
  await medirColores();
  vistaPortada(0);
  $('carga').remove(); requestAnimationFrame(bucle); portada();
})().catch((err) => { console.error(err); $('carga').textContent = 'No se pudo cargar: ' + err.message; });
window.DES = { get S() { return S; }, get T() { return T; }, PLANETAS, empezar, camara, desafio: DESAFIO, irA: (n) => empezar(n), portada };
