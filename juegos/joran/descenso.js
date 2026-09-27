// EL DESCENSO · máquina 4 de la sala de Joran (borrador). Precisión.
// Joran entrenaba a los pilotos para posar las cápsulas del refugio en cualquier mundo: aquí se posa el Módulo Lunar del
// Apolo (modelo de la NASA, dominio público) en los ocho planetas de la ruta, cada uno con SU física: gravedad, viento
// solar (constante, a ráfagas o que cambia de sentido), atmósfera que frena, niebla o una plataforma que se mueve.
// Cuanto más estrecha la plataforma, más multiplica. Se puntúa la suavidad, el centrado y el combustible que sobra.
// Tres vidas; como mucho, unos 3-4 minutos. Arcade: sin preguntas.
import { THREE, $, azar, elegir, estado, SON, audio, holo, cargar, medir, texBrillo, pantalla, cerrarPantalla, aviso, finDePartida, JUEGOS, EMBED } from './comun.js';

const V3 = THREE.Vector3;
const JUEGO = JUEGOS.find((j) => j.id === 'descenso') || { id: 'descenso', n: 'El Descenso' };
// los ocho planetas: g (m/s²), viento: base (m/s², + a la derecha), rafaga (amplitud), periodo (s), cambia (s: el viento
// da la vuelta), arrastre (atmósfera), niebla, pistas (anchos de las plataformas) y lo que hace distinto a cada uno
const PLANETAS = [
  { k: 'p1_forge', n: 'Fôrge', g: 1.6, viento: 0, rafaga: 0, rugoso: 0.7, pistas: [14, 10, 6], nota: 'Sin viento: aprende a posarte.' },
  { k: 'p2_ecos', n: 'Ecos', g: 1.1, viento: 0, rafaga: 0.9, periodo: 5, rugoso: 0.8, pistas: [12, 8, 5], nota: 'Poca gravedad y ráfagas que van y vienen, como un eco.' },
  { k: 'p3_sendara', n: 'Sendara', g: 2.2, viento: 0.2, rafaga: 0.3, periodo: 7, rugoso: 1.5, pistas: [10, 7, 4.5], nota: 'Terreno abrupto y plataformas estrechas entre las montañas.' },
  { k: 'p4_reliae', n: 'Reliae', g: 1.4, viento: 1.1, rafaga: 0.2, periodo: 6, rugoso: 0.9, pistas: [12, 8, 5], nota: 'Viento solar constante: tendrás que ir inclinado contra él.' },
  { k: 'p5_umbral', n: 'Umbral', g: 2.6, viento: -0.3, rafaga: 0.4, periodo: 6, rugoso: 1.0, niebla: true, pistas: [12, 8, 5], nota: 'Niebla: el suelo aparece tarde. Mira la altura.' },
  { k: 'p6_ludo', n: 'Ludo', g: 1.8, viento: 0.3, rafaga: 0.3, periodo: 5, rugoso: 0.8, movil: true, pistas: [12, 8, 5], nota: 'La plataforma buena se mueve: es un juego.' },
  { k: 'p7_vinculo', n: 'Vínculo', g: 3.4, viento: -0.2, rafaga: 0.4, periodo: 6, rugoso: 1.1, arrastre: 0.35, pistas: [12, 8, 5], nota: 'Gravedad fuerte y atmósfera espesa que frena.' },
  { k: 'p8_liminar', n: 'Liminar', g: 2.0, viento: 0.9, rafaga: 0.6, periodo: 4, cambia: 6, rugoso: 1.2, pistas: [11, 7, 4.5], nota: 'El viento cambia de sentido cada pocos segundos.' },
];
const MULT = [1, 2, 4];                       // la ancha, la media, la estrecha
const SEGURO = { vy: 2.4, vx: 1.6, ang: 0.2 };  // lo que aguantan las patas
const COMB_S = 11;                             // combustible por segundo de propulsor (el depósito es de 100)
const TOPE_S = 240;

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
    const [a, b] = huecos[i], cx = azar(a + w, b - w), x0 = cx - w / 2, x1 = cx + w / 2;
    const i0 = Math.floor((x0 + ANCHO / 2) / PASO) - 1, i1 = Math.ceil((x1 + ANCHO / 2) / PASO) + 1;
    const y = Math.max(...perfil.slice(i0, i1 + 1)) + 1;
    for (let k = i0; k <= i1; k++) perfil[k] = y;
    return { x0, x1, cx, w, y, mult: MULT[i] };
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
function nueva() { return { nivel: 0, vidas: 3, puntos: 0, t0: performance.now(), aterrizajes: [], fin: false }; }
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
  if (P.movil) { const p = T.pistas.find((x) => x.mult === 4); const dx = Math.sin(S.t * 0.6) * 18 * dt * 0.6; p.x0 += dx; p.x1 += dx; p.cx += dx; p.obj.position.x = p.cx; }
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
  const centrado = Math.max(0, 1 - Math.abs(S.x - p.cx) / (p.w / 2));
  const puntos = Math.round(p.mult * (300 + (SEGURO.vy - Math.min(SEGURO.vy, vyToque)) / SEGURO.vy * 200 + centrado * 150) + S.comb * 6);
  S.puntos += puntos; S.aterrizajes.push({ planeta: S.P.n, mult: p.mult, puntos });
  SON.bien(); aviso(`¡POSADO EN ${S.P.n.toUpperCase()}! ×${p.mult} · +${puntos}`, '#5dffa0', 2);
  for (let i = 0; i < 40; i++) chispa(S.x + azar(-4, 4), p.y + 0.4, azar(-3, 3), azar(-6, 6), azar(1, 5), azar(0.6, 1.2), 0x5dffa0);
  setTimeout(() => { if (!S || S.fin) return; S.nivel++; if (S.nivel >= PLANETAS.length) terminar(null, true); else siguientePlaneta(); }, 2200);
}
function estrellado(motivo) {
  S.estado = 'roto'; S.prop = false; if (soplido) soplido.gain.value = 0; S.vidas--;
  SON.caida(); lem.visible = false;
  for (let i = 0; i < 90; i++) chispa(S.x, S.y, azar(-2, 2), azar(-14, 14), azar(0, 16), azar(0.6, 1.4), elegir([0xffb347, 0xff6a3d, 0xfff1c4, 0x9aa6b2]));
  aviso(`¡ESTRELLADO! ${motivo}`, '#ff4d6d', 2.2);
  setTimeout(() => { if (!S || S.fin) return; if (S.vidas <= 0) terminar('Te has quedado sin módulos.'); else { nuevoVuelo(); aviso(`Otra vez, en ${S.P.n}`, '#5ff4ff', 1.2); } }, 2200);
}
function siguientePlaneta() {
  const P = PLANETAS[S.nivel]; montarTerreno(P); S.P = P; nuevoVuelo();
  pantallita(P);
}
function pantallita(P) {
  aviso(`${S.nivel + 1}/8 · ${P.n.toUpperCase()}`, '#5ff4ff', 1.6);
  $('extra').textContent = P.nota;
}
function terminar(motivo, completo = false) {
  if (S.fin) return; S.fin = true; if (soplido) soplido.gain.value = 0;
  if (completo) { S.puntos += S.vidas * 1000; }
  setTimeout(() => {
    $('hud').classList.add('oculto');
    const seg = Math.round((performance.now() - S.t0) / 1000);
    finDePartida({ juego: JUEGO.id, titulo: completo ? '¡Los ocho planetas!' : 'Fin del descenso', puntos: S.puntos,
      texto: completo ? `Te has posado en los ocho mundos de la ruta. <b>+${(S.vidas * 1000).toLocaleString('es-ES')}</b> por los módulos que te quedan.` : motivo,
      filas: [['Aterrizajes', `${S.aterrizajes.length}/8`], ['En la estrecha (×4)', S.aterrizajes.filter((a) => a.mult === 4).length], ['Vidas', Math.max(0, S.vidas)], ['Tiempo', `${Math.floor(seg / 60)}:${String(seg % 60).padStart(2, '0')}`]],
      alRepetir: empezar, extra: { perfecto: completo && S.vidas >= 3 } });
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
  if (!S || S.fin) return; pausa = !pausa; if (soplido) soplido.gain.value = 0;
  if (pausa) { pantalla(`<h2>Pausa</h2><div class="botones"><button id="b-seg">Seguir</button>${EMBED ? '' : '<a class="boton sec" href="index.html">Volver a la sala</a>'}</div>`); $('b-seg').onclick = pausar; }
  else cerrarPantalla();
}
document.addEventListener('visibilitychange', () => { if (document.hidden && S && !S.fin && !pausa && !window.__sinPausa) pausar(); });
let antes = performance.now();
function bucle(ahora) {
  requestAnimationFrame(bucle);
  const dt = Math.min(0.04, (ahora - antes) / 1000); antes = ahora;
  if (!pausa) tick(dt);
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
function empezar() {
  S = nueva(); window.__t0Partida = performance.now(); prepararSoplido();
  montarTerreno(PLANETAS[0]); nuevoVuelo(); pantallita(PLANETAS[0]);
  $('hud').classList.remove('oculto'); cerrarPantalla(); pausa = false;
}
function portada() {
  const e = estado();
  pantalla(`<div class="kicker">El simulador de Joran · máquina 4</div><h2>El Descenso</h2>
    <p>Joran entrenaba a los pilotos para posar las cápsulas del refugio en cualquier mundo. Aquí se posa el <b>Módulo Lunar</b> en los <b>ocho planetas de la ruta</b>, y cada uno tiene su física: gravedad, <b>viento solar</b> (constante, a ráfagas o que cambia de sentido), atmósfera que frena, niebla o una plataforma que se mueve.</p>
    <div class="teclas"><kbd>← →  /  A D</kbd><span>Girar el módulo</span><kbd>↑  /  W  /  Espacio</kbd><span>Propulsor (gasta combustible)</span></div>
    <p>Para posarte: caída de menos de <b>${SEGURO.vy.toLocaleString('es-ES')} m/s</b>, deriva de menos de <b>${SEGURO.vx.toLocaleString('es-ES')} m/s</b> y el módulo casi recto (lo verde del panel). Las plataformas multiplican: <b style="color:#5dffa0">×1</b> la ancha, <b style="color:#ffc24a">×2</b> la media y <b style="color:#ff4dd8">×4</b> la estrecha. Suman la suavidad, el centrado y el combustible que te sobre. Tienes tres módulos.</p>
    <p class="pista">Tu récord: <b>${(e.marcas.descenso || 0).toLocaleString('es-ES')}</b> · Módulo Lunar del Apolo: NASA (dominio público)</p>
    <div class="botones"><button id="b-ya">¡Iniciar el descenso!</button>${EMBED ? '' : '<a class="boton sec" href="index.html">Volver a la sala</a>'}</div>`);
  $('b-ya').onclick = () => { audio(); empezar(); };
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
  // lo que se ve detrás de la portada: Fôrge y el módulo esperando arriba
  montarTerreno(PLANETAS[0]); S = nueva(); S.P = PLANETAS[0]; S.x = -40; S.y = Math.max(...T.perfil) + 30; S.vx = 0; S.vy = 0; S.ang = 0.1; S.t = 0; S.estado = 'portada'; S.comb = 100;
  camara.position.set(-40, S.y + 10, 60); camara.lookAt(-40, S.y - 8, 0);
  $('carga').remove(); requestAnimationFrame(bucle); portada();
})().catch((err) => { console.error(err); $('carga').textContent = 'No se pudo cargar: ' + err.message; });
window.DES = { get S() { return S; }, get T() { return T; }, PLANETAS, empezar, camara, irA: (n) => { S.nivel = n; siguientePlaneta(); } };
