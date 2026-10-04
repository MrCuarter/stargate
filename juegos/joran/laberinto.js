// EL LABERINTO DE LA CERO · máquina 2 de la sala de Joran (borrador).
// La nave se ha apagado y la Estática ha soltado sus drones. A la luz de tu linterna: tres llaves por nivel, la
// cápsula que se abre con ellas y un pulso que aturde a los drones. Tres niveles, cada uno más grande.
// Arcade o DESAFÍO (desafio.js, ?modo=desafio): en el desafío la batería de la linterna se gasta y se recarga acertando.
// 27-sep, MODO COMECOCOS (Norberto: «si no me muevo no pasa nada; los puedo sobrepasar por el borde»): los drones ya no
// se paran en el centro de la casilla, se echan encima; el choque se mide en el plano y es más ancho que lo que te deja
// apartarte un pasillo, así que un dron no se esquiva de frente. Se turnan entre dispersarse (cada uno a su esquina) y
// cazar, cada uno a su manera, como los fantasmas. Y las CÉLULAS DE ENERGÍA dan unos segundos de sobrecarga: los
// drones se vuelven azules, huyen, y si los tocas los desactivas (200, 400, 800, 1.600). El pulso sigue: aturde a los
// cercanos, pero se recarga más despacio (es el salvavidas, no el arma).
import { THREE, $, azar, elegir, QS, estado, SON, audio, holo, personaje, objeto, cargar, medir, texBrillo, pantalla, cerrarPantalla, aviso, finDePartida, JUEGOS, EMBED } from './comun.js?v=79ed3709f1';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import { crearDesafio, MODO, urlModo, SIN_MORIR, avisoSinMorir } from './desafio.js?v=79ed3709f1';

const V3 = THREE.Vector3;
const JUEGO = JUEGOS[1];
const C = 4, ALTO = 2.4;                    // tamaño de la celda y alto de las paredes
const NIVELES = [
  { n: 7, drones: 2, tiempo: 60, vel: 2.6, celulas: 2, sobre: 7 },
  { n: 9, drones: 3, tiempo: 70, vel: 3.0, celulas: 2, sobre: 6.5 },
  { n: 11, drones: 5, tiempo: 80, vel: 3.3, celulas: 3, sobre: 6 },
];
const VEL_JUGADOR = 5.2, RADIO = 0.45;
// el choque, en el plano: más que lo que te puedes apartar del centro de un pasillo (C/2 − media pared − RADIO = 1,4),
// así que no hay hueco para colarse junto a un dron
const GOLPE = 1.5;
const PULSO_RECARGA = 12, PULSO_RADIO = 7, ATURDE = 2.5;
// los turnos de los drones (s): dispersión, caza, dispersión, caza, dispersión… y a partir de ahí, caza hasta el final
const CICLO = [5, 15, 5, 15, 4];
const VALOR_DRON = [200, 400, 800, 1600];   // los desactivados seguidos en la misma sobrecarga
const dist2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
const hacia = (ops, t) => ops.reduce((a, b) => (dist2(b, t) < dist2(a, t) ? b : a)).slice();

// ───────────────────────────────── escena
const lienzo = $('lienzo');
const render = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true });
render.setPixelRatio(Math.min(devicePixelRatio, 2));
render.outputColorSpace = THREE.SRGBColorSpace;
render.toneMapping = THREE.ACESFilmicToneMapping;
const escena = new THREE.Scene();
escena.background = new THREE.Color(0x000205);
escena.fog = new THREE.Fog(0x000205, 13, 27);
const camara = new THREE.PerspectiveCamera(55, 1, 0.1, 200);
escena.add(new THREE.HemisphereLight(0x3a6a8a, 0x000000, 0.35));
const linterna = new THREE.PointLight(0x9ff6ff, 60, 13, 1.6); escena.add(linterna);
function ajustar() { render.setSize(innerWidth, innerHeight, false); camara.aspect = innerWidth / innerHeight; camara.updateProjectionMatrix(); }
addEventListener('resize', ajustar); ajustar();

function lienzoTex(w, h, pintar) { const c = document.createElement('canvas'); c.width = w; c.height = h; pintar(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const texPared = lienzoTex(128, 128, (x, w, h) => { x.fillStyle = '#041626'; x.fillRect(0, 0, w, h); x.strokeStyle = '#5ff4ff'; x.lineWidth = 6; x.strokeRect(3, 3, w - 6, h - 6); x.fillStyle = 'rgba(95,244,255,.18)'; x.fillRect(20, 30, 88, 8); x.fillRect(20, 60, 60, 8); x.fillRect(20, 90, 76, 8); });
const texSuelo = lienzoTex(128, 128, (x, w, h) => { x.fillStyle = '#01070f'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(95,244,255,.28)'; x.lineWidth = 2; x.strokeRect(1, 1, w - 2, h - 2); x.beginPath(); x.moveTo(w / 2, 0); x.lineTo(w / 2, h); x.moveTo(0, h / 2); x.lineTo(w, h / 2); x.stroke(); });
texSuelo.wrapS = texSuelo.wrapT = THREE.RepeatWrapping;
const matPared = new THREE.MeshStandardMaterial({ map: texPared, emissive: 0xffffff, emissiveMap: texPared, emissiveIntensity: 0.55, roughness: 0.6, metalness: 0.3 });
const matSuelo = new THREE.MeshStandardMaterial({ map: texSuelo, emissive: 0xffffff, emissiveMap: texSuelo, emissiveIntensity: 0.35, roughness: 0.8 });
function brillo(color, esc = 2, niebla = true) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: texBrillo, color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: niebla })); s.scale.setScalar(esc); return s; }

// ───────────────────────────────── el laberinto
let L = null; // el nivel: { n, paredes (aabb), muros (malla), celdas, llaves, salida, drones }
function generar(n) {
  // derecha[i][j] / abajo[i][j]: hay pared a la derecha / debajo de la celda (i, j)
  const derecha = Array.from({ length: n }, () => Array(n).fill(true)), abajo = Array.from({ length: n }, () => Array(n).fill(true));
  const visto = Array.from({ length: n }, () => Array(n).fill(false));
  const pila = [[0, 0]]; visto[0][0] = true;
  while (pila.length) {
    const [i, j] = pila[pila.length - 1];
    const vec = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([a, b]) => [i + a, j + b]).filter(([a, b]) => a >= 0 && b >= 0 && a < n && b < n && !visto[a][b]);
    if (!vec.length) { pila.pop(); continue; }
    const [a, b] = elegir(vec);
    if (a > i) derecha[i][j] = false; else if (a < i) derecha[a][b] = false; else if (b > j) abajo[i][j] = false; else abajo[a][b] = false;
    visto[a][b] = true; pila.push([a, b]);
  }
  // algunos atajos: un laberinto con bucles deja escapar de los drones
  for (let k = 0; k < n * n * 0.12; k++) { const i = Math.floor(Math.random() * (n - 1)), j = Math.floor(Math.random() * (n - 1)); if (Math.random() < 0.5) derecha[i][j] = false; else abajo[i][j] = false; }
  return { derecha, abajo };
}
const centro = (n, i, j) => new V3((i - (n - 1) / 2) * C, 0, (j - (n - 1) / 2) * C);
function celdaDe(n, p) { return [Math.round(p.x / C + (n - 1) / 2), Math.round(p.z / C + (n - 1) / 2)].map((v) => Math.max(0, Math.min(n - 1, v))); }
function abiertoEntre(M, a, b) { // ¿se pasa de la celda a a la celda b (vecinas)?
  const [i, j] = a, [x, y] = b;
  if (x === i + 1) return !M.derecha[i][j]; if (x === i - 1) return !M.derecha[x][y];
  if (y === j + 1) return !M.abajo[i][j]; if (y === j - 1) return !M.abajo[x][y]; return false;
}
function vecinos(M, n, c) { return [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([a, b]) => [c[0] + a, c[1] + b]).filter((v) => v[0] >= 0 && v[1] >= 0 && v[0] < n && v[1] < n && abiertoEntre(M, c, v)); }
function bfs(M, n, desde) {
  const d = Array.from({ length: n }, () => Array(n).fill(Infinity)), padre = {}; d[desde[0]][desde[1]] = 0; const cola = [desde];
  while (cola.length) { const c = cola.shift(); for (const v of vecinos(M, n, c)) if (d[v[0]][v[1]] === Infinity) { d[v[0]][v[1]] = d[c[0]][c[1]] + 1; padre[v] = c; cola.push(v); } }
  return { d, padre };
}

function montarNivel(k) {
  if (L) { escena.remove(L.grupo); for (const dr of L.drones) dr.mezcla.stopAllAction(); }
  const cfg = NIVELES[k], n = cfg.n, M = generar(n), grupo = new THREE.Group(); escena.add(grupo);
  const paredes = [], trozos = [];
  const pared = (x, z, w, d) => { paredes.push({ x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2 }); trozos.push([x, z, w, d]); };
  const off = (n - 1) / 2 * C, g = 0.3;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const c = centro(n, i, j);
    if (i < n - 1 && M.derecha[i][j]) pared(c.x + C / 2, c.z, g, C + g);
    if (j < n - 1 && M.abajo[i][j]) pared(c.x, c.z + C / 2, C + g, g);
  }
  const L2 = n * C;
  pared(0, -off - C / 2, L2 + g, g); pared(0, off + C / 2, L2 + g, g); pared(-off - C / 2, 0, g, L2 + g); pared(off + C / 2, 0, g, L2 + g);
  const muros = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), matPared, trozos.length);
  const m4 = new THREE.Matrix4();
  trozos.forEach(([x, z, w, d], i) => { m4.compose(new V3(x, ALTO / 2, z), new THREE.Quaternion(), new V3(w, ALTO, d)); muros.setMatrixAt(i, m4); });
  grupo.add(muros);
  const suelo = new THREE.Mesh(new THREE.PlaneGeometry(L2 + 2, L2 + 2), matSuelo); suelo.rotation.x = -Math.PI / 2; suelo.material.map.repeat.set(n, n); grupo.add(suelo);
  // llaves lejos de la salida y entre sí; la cápsula, lo más lejos posible
  const inicio = [0, 0], { d } = bfs(M, n, inicio);
  const celdas = []; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) celdas.push([i, j]);
  const lejos = (c) => d[c[0]][c[1]] + 2 * (c[0] + c[1]); // lejos por el camino Y en el mapa
  celdas.sort((a, b) => lejos(b) - lejos(a));
  const salida = celdas[0], elegidas = [];
  for (const c of celdas.slice(1)) { if (elegidas.length >= 3) break; if (d[c[0]][c[1]] < n * 0.6) continue; if (elegidas.every((e) => Math.abs(e[0] - c[0]) + Math.abs(e[1] - c[1]) > n * 0.5) && Math.abs(salida[0] - c[0]) + Math.abs(salida[1] - c[1]) > 2) elegidas.push(c); }
  while (elegidas.length < 3) { const c = elegir(celdas.slice(1, Math.floor(celdas.length / 2))); if (!elegidas.includes(c)) elegidas.push(c); }
  // las células de energía: a media distancia, separadas entre sí y fuera de las llaves y de la cápsula
  const celCeldas = [];
  for (const c of celdas.slice().sort(() => Math.random() - 0.5)) {
    if (celCeldas.length >= cfg.celulas) break;
    if (c === salida || elegidas.includes(c) || d[c[0]][c[1]] < 3) continue;
    if (celCeldas.every((e) => Math.abs(e[0] - c[0]) + Math.abs(e[1] - c[1]) > n * 0.6)) celCeldas.push(c);
  }
  const celulas = celCeldas.map((c) => {
    const o = new THREE.Group(); o.position.copy(centro(n, ...c)).setY(1.0);
    o.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 0), new THREE.MeshBasicMaterial({ color: 0xc8ffe0 })), brillo(0x5dffa0, 2.8, false));
    grupo.add(o); return { c, o, cogida: false };
  });
  const llaves = elegidas.map((c) => { const o = modelos.llave.clone(); o.position.copy(centro(n, ...c)).setY(1.1); o.add(brillo(0xffc24a, 3.2, false)); grupo.add(o); return { c, o, cogida: false }; });
  // la cápsula de salida (apagada hasta tener las tres llaves)
  const cap = new THREE.Group(); cap.position.copy(centro(n, ...salida));
  const cuerpo = new THREE.Mesh(new THREE.CapsuleGeometry(0.9, 1.2, 8, 16), new THREE.MeshStandardMaterial({ color: 0x223040, emissive: 0xff2e55, emissiveIntensity: 0.4, metalness: 0.6, roughness: 0.3 })); cuerpo.position.y = 1.3; cap.add(cuerpo);
  const haz = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 1.1, 30, 20, 1, true), new THREE.MeshBasicMaterial({ color: 0x5dffa0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false })); haz.position.y = 15; cap.add(haz);
  const halo = brillo(0xff2e55, 4, false); halo.position.y = 1.4; cap.add(halo);
  grupo.add(cap);
  // los drones, lejos de ti. Cada uno caza a su manera (tipo): 0 cazador (el camino más corto hasta ti), 1 emboscada
  // (apunta por delante de ti), 2 tímido (te caza de lejos y de cerca se va a su esquina), 3 errante (a por ti, pero tuerce)
  const casas = [[n - 1, 0], [0, n - 1], [n - 1, n - 1], [Math.floor(n / 2), Math.floor(n / 2)]];
  const drones = [];
  for (let k2 = 0; k2 < cfg.drones; k2++) {
    const c = elegir(celdas.slice(0, Math.floor(celdas.length * 0.6)));
    const dr = modelos.dronFab(); dr.obj.position.copy(centro(n, ...c)).setY(1.2); grupo.add(dr.obj);
    drones.push({ ...dr, tipo: k2 % 4, casa: casas[k2 % 4], c: c.slice(), prev: null, obj: dr.obj, meta: c.slice(), persigue: 0, aturdido: 0, fuera: 0, inmune: false });
  }
  L = { k, cfg, n, M, grupo, paredes, llaves, celulas, salida, cap, cuerpo, haz, halo, drones, visto: Array.from({ length: n }, () => Array(n).fill(false)), cogidas: 0, t: cfg.tiempo,
    fase: 0, modo: 'dispersion', tModo: CICLO[0], tregua: 0 };
  P.sobre = 0; P.cadena = 0;
  P.pos.copy(centro(n, 0, 0)); P.inv = 1.5;
  aviso(`NIVEL ${k + 1}`, '#5ff4ff', 1.2);
}

// ───────────────────────────────── estado
let P = null, jugador = null;
const modelos = {};
const efectos = [];
function nuevaPartida() { return { pos: new V3(), dir: new V3(0, 0, -1), vidas: 3, puntos: 0, pulso: 0, inv: 0, fin: false, cuenta: 2.2, aturdidos: 0, desactivados: 0, sobre: 0, cadena: 0, llavesTot: 0, t0: performance.now() }; }

// ── controles: teclado y joystick del dedo
const tecla = {};
addEventListener('keydown', (e) => { tecla[e.code] = true; if (e.code === 'Space') { pulso(); e.preventDefault(); } if (e.code === 'KeyP' || e.code === 'Escape') pausar(); });
addEventListener('keyup', (e) => { tecla[e.code] = false; });
let stick = null;
// el modo desafío: la batería de la linterna. Solo se gasta con el nivel en marcha (no en la cuenta atrás ni en la pausa).
// Va en su hueco (#des-slot), encima del minimapa, para no tapar el minimapa ni el botón del pulso. Al volver de la pregunta
// se sueltan las teclas y el joystick: el panel se tragó el keyup/pointerup y el piloto seguiría andando solo
const DES = crearDesafio({ nombre: 'Batería de la linterna', segundos: 40, recarga: 40, hud: $('des-slot'),
  alPausar: (si) => { if (!si) { for (const k in tecla) tecla[k] = false; stick = null; $('stick').classList.add('oculto'); $('stick').firstElementChild.style.transform = ''; } },
  enJuego: () => !!P && !P.fin && P.cuenta <= 0 && !pausa });
if (DES.activo) DES.preparar(); // se piden las preguntas mientras lees la portada
lienzo.addEventListener('pointerdown', (e) => { audio(); stick = { x0: e.clientX, y0: e.clientY, dx: 0, dy: 0, id: e.pointerId }; const s = $('stick'); s.style.left = e.clientX + 'px'; s.style.top = e.clientY + 'px'; s.classList.remove('oculto'); });
addEventListener('pointermove', (e) => { if (!stick || e.pointerId !== stick.id) return; let dx = e.clientX - stick.x0, dy = e.clientY - stick.y0; const d = Math.hypot(dx, dy), m = 50; if (d > m) { dx *= m / d; dy *= m / d; } stick.dx = dx / m; stick.dy = dy / m; $('stick').firstElementChild.style.transform = `translate(${dx}px,${dy}px)`; });
addEventListener('pointerup', (e) => { if (stick && e.pointerId === stick.id) { stick = null; $('stick').classList.add('oculto'); $('stick').firstElementChild.style.transform = ''; } });
$('b-pulso').addEventListener('pointerdown', (e) => { e.stopPropagation(); pulso(); });

function pulso() {
  if (!P || P.fin || P.cuenta > 0 || P.pulso > 0) return;
  P.pulso = PULSO_RECARGA; SON.pulso();
  const aro = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.9, 48), new THREE.MeshBasicMaterial({ color: 0x5ff4ff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false }));
  aro.rotation.x = -Math.PI / 2; aro.position.copy(P.pos).setY(0.3); escena.add(aro); efectos.push({ o: aro, vida: 0.6, crece: 14 });
  let n = 0;
  for (const d of L.drones) if (!d.fuera && d.obj.position.distanceTo(P.pos) < PULSO_RADIO) { d.aturdido = ATURDE; d.persigue = 0; n++; }
  if (n) { P.aturdidos += n; P.puntos += 50 * n; aviso(`¡${n} ATURDIDO${n > 1 ? 'S' : ''}!`, '#5ff4ff', 0.9); }
}
function chocaPared(x, z) { for (const w of L.paredes) if (x + RADIO > w.x0 && x - RADIO < w.x1 && z + RADIO > w.z0 && z - RADIO < w.z1) return true; return false; }
// ¿se ven? (misma fila o columna, sin paredes entre medias)
function seVen(a, b) {
  if (a[0] !== b[0] && a[1] !== b[1]) return false;
  const paso = a[0] === b[0] ? [0, Math.sign(b[1] - a[1])] : [Math.sign(b[0] - a[0]), 0];
  let c = a.slice(); while (c[0] !== b[0] || c[1] !== b[1]) { const s = [c[0] + paso[0], c[1] + paso[1]]; if (!abiertoEntre(L.M, c, s)) return false; c = s; } return true;
}

// al llegar al centro de una casilla, el dron elige la siguiente (como los fantasmas: sin dar media vuelta si puede)
function decidir(d, yo, asustado, cazan) {
  const vs = vecinos(L.M, L.n, d.c);
  const sinVuelta = vs.filter((v) => !d.prev || v[0] !== d.prev[0] || v[1] !== d.prev[1]);
  const ops = sinVuelta.length ? sinVuelta : vs;
  if (!ops.length) return d.c.slice();
  if (asustado) return Math.random() < 0.3 ? elegir(ops).slice() : ops.reduce((a, b) => (dist2(b, yo) > dist2(a, yo) ? b : a)).slice();
  if (d.persigue > 0 || (cazan && d.tipo === 0)) { const { padre } = bfs(L.M, L.n, yo); const p = padre[d.c]; return p ? p.slice() : hacia(ops, yo); }
  if (!cazan) return hacia(ops, d.casa);
  if (d.tipo === 1) return hacia(ops, [yo[0] + Math.round(P.dir.x) * 3, yo[1] + Math.round(P.dir.z) * 3]);
  if (d.tipo === 2) return hacia(ops, dist2(d.c, yo) > 16 ? yo : d.casa);
  return Math.random() < 0.3 ? elegir(ops).slice() : hacia(ops, yo);
}

function tick(dt) {
  if (!P || !L) return;
  if (P.cuenta > 0) { P.cuenta -= dt; if (P.cuenta <= 0) { aviso('¡BUSCA LAS LLAVES!', '#ffc24a', 1.2); jugador.poner('Run'); } }
  const jugando = P.cuenta <= 0 && !P.fin;
  // mover al jugador
  let mx = 0, mz = 0;
  if (jugando) {
    if (tecla.ArrowLeft || tecla.KeyA) mx -= 1; if (tecla.ArrowRight || tecla.KeyD) mx += 1;
    if (tecla.ArrowUp || tecla.KeyW) mz -= 1; if (tecla.ArrowDown || tecla.KeyS) mz += 1;
    if (stick) { mx = stick.dx; mz = stick.dy; }
  }
  const mag = Math.hypot(mx, mz);
  if (mag > 0.15) {
    const v = VEL_JUGADOR * Math.min(1, mag) * dt / Math.max(1, mag);
    const nx = P.pos.x + mx * v, nz = P.pos.z + mz * v;
    if (!chocaPared(nx, P.pos.z)) P.pos.x = nx;
    if (!chocaPared(P.pos.x, nz)) P.pos.z = nz;
    P.dir.set(mx, 0, mz).normalize();   // (hacia dónde vas: el dron de la emboscada apunta por delante)
    const ang = Math.atan2(mx, mz); jugador.obj.rotation.y += ((ang - jugador.obj.rotation.y + Math.PI * 3) % (Math.PI * 2) - Math.PI) * Math.min(1, dt * 12);
    if (jugando) jugador.poner('Run', { fundido: 0.12 });
  } else if (jugando) jugador.poner('Idle', { fundido: 0.2 });
  jugador.obj.position.copy(P.pos);
  jugador.obj.visible = P.inv > 0 ? Math.floor(performance.now() / 100) % 2 === 0 : true;
  jugador.mezcla.update(dt);
  linterna.position.copy(P.pos).setY(2.6);
  const alto = camara.aspect < 0.8 ? 19 : 13;
  camara.position.lerp(new V3(P.pos.x, alto, P.pos.z + alto * 0.55), Math.min(1, dt * 5)); camara.lookAt(P.pos.x, 0, P.pos.z - 0.5);

  // lo que se ha explorado (para el minimapa)
  const yo = celdaDe(L.n, P.pos);
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const a = yo[0] + i, b = yo[1] + j; if (a >= 0 && b >= 0 && a < L.n && b < L.n) L.visto[a][b] = true; }

  if (jugando) {
    L.t -= dt; P.pulso = Math.max(0, P.pulso - dt); P.inv = Math.max(0, P.inv - dt);
    if (L.t <= 0) {
      if (!SIN_MORIR) { acabar(false, 'La Estática ha inundado el nivel: se acabó el tiempo.'); return; }
      L.t = L.cfg.tiempo; aviso('EN LA ACADEMIA, EL RELOJ VUELVE A EMPEZAR', '#5ff4ff', 1.6);
    }
    if (L.t < 10 && Math.floor(L.t) !== Math.floor(L.t + dt)) SON.alarma();
  }
  // llaves
  for (const k of L.llaves) {
    if (k.cogida) continue; k.o.rotation.y += dt * 2; k.o.position.y = 1.1 + Math.sin(performance.now() / 300) * 0.15;
    if (jugando && k.o.position.distanceTo(P.pos.clone().setY(1.1)) < 1.2) {
      k.cogida = true; L.grupo.remove(k.o); L.cogidas++; P.llavesTot++; P.puntos += 200; SON.llave();
      if (L.cogidas === 3) { aviso('¡LA CÁPSULA SE HA ABIERTO!', '#5dffa0', 1.6); L.cuerpo.material.emissive.set(0x5dffa0); L.halo.material.color.set(0x5dffa0); L.haz.material.opacity = 0.35; SON.bien(); }
      else aviso(`LLAVE ${L.cogidas}/3`, '#ffc24a', 1);
    }
  }
  // las células de energía: sobrecarga
  for (const cel of L.celulas) {
    if (cel.cogida) continue; cel.o.rotation.y += dt * 2.5; cel.o.scale.setScalar(1 + Math.sin(performance.now() / 180) * 0.15);
    if (jugando && cel.o.position.distanceTo(P.pos.clone().setY(1.0)) < 1.2) {
      cel.cogida = true; L.grupo.remove(cel.o); P.puntos += 50; P.sobre = L.cfg.sobre; P.cadena = 0; SON.turbo();
      aviso('¡SOBRECARGA! DESACTIVA LOS DRONES', '#5dffa0', 1.4);
      // como los fantasmas: todos dan media vuelta y huyen (también los que ya estaban en su casa)
      for (const d of L.drones) { d.inmune = false; if (!d.fuera && d.meta) { const t = d.meta; d.meta = d.c; d.c = t; d.prev = null; } }
    }
  }
  if (jugando) P.sobre = Math.max(0, P.sobre - dt);
  // los turnos de los drones (el reloj se para durante la sobrecarga, como en el comecocos)
  if (jugando && P.sobre <= 0) {
    if (L.tregua > 0) L.tregua -= dt;
    L.tModo -= dt;
    if (L.tModo <= 0) { L.fase++; L.modo = L.fase % 2 ? 'caza' : 'dispersion'; L.tModo = CICLO[L.fase] ?? Infinity; if (L.modo === 'caza' && L.tregua <= 0) SON.alarma(); }
  }
  // la cápsula
  L.halo.scale.setScalar(4 + Math.sin(performance.now() / 250) * 0.4);
  if (jugando && L.cogidas === 3 && L.cap.position.distanceTo(P.pos) < 1.4) {
    const bonus = 1000 * (L.k + 1) + Math.round(L.t) * 15; P.puntos += bonus; SON.bien();
    if (L.k + 1 < NIVELES.length) { aviso(`¡NIVEL SUPERADO! +${bonus}`, '#5dffa0', 1.6); P.cuenta = 1.6; montarNivel(L.k + 1); }
    else { P.puntos += P.vidas * 500; acabar(true, `Has salido de la Cero con ${P.vidas} vida${P.vidas === 1 ? '' : 's'} (+${P.vidas * 500}).`); }
  }
  // drones de la Estática
  const cazan = L.modo === 'caza' && L.tregua <= 0;
  for (const d of L.drones) {
    d.mezcla.update(dt);
    const o = d.obj; o.position.y = 1.2 + Math.sin(performance.now() / 200 + o.id) * 0.12;
    // desactivado: vuelve a su esquina al rato, ya inmune a la sobrecarga que lo tumbó
    if (d.fuera > 0) {
      o.visible = false; if (!jugando) continue;
      d.fuera -= dt;
      if (d.fuera <= 0) { d.fuera = 0; d.c = d.casa.slice(); d.meta = d.casa.slice(); d.prev = null; d.inmune = P.sobre > 0; o.position.copy(centro(L.n, ...d.casa)).setY(1.2); o.visible = true; }
      continue;
    }
    const asustado = P.sobre > 0 && !d.inmune;
    d.halo.material.color.set(asustado ? (P.sobre < 2 && Math.floor(performance.now() / 150) % 2 ? 0xffffff : 0x3d6bff) : 0xff2ea6);
    d.halo.scale.setScalar(asustado ? 3.2 : 2.4);
    if (d.aturdido > 0) { d.aturdido -= dt; o.rotation.z = Math.sin(performance.now() / 60) * 0.4; o.visible = Math.random() > 0.2; continue; }
    o.rotation.z = 0; o.visible = true;
    if (!jugando) continue;
    const dc = celdaDe(L.n, o.position), lejosDeTi = Math.abs(dc[0] - yo[0]) + Math.abs(dc[1] - yo[1]);
    if (!asustado && (seVen(dc, yo) && lejosDeTi <= 5 || o.position.distanceTo(P.pos) < C * 1.2)) { if (d.persigue <= 0) SON.alarma(); d.persigue = 3.5; }
    d.persigue -= dt;
    // en tu casilla o en la de al lado (sin pared entre medias) ya no sigue la rejilla: se te echa encima.
    // Por eso quedarse quieto ya no sirve, ni apartarse al borde del pasillo.
    const encima = !asustado && P.inv <= 0 && (lejosDeTi === 0 || (lejosDeTi === 1 && abiertoEntre(L.M, dc, yo)));
    let destino;
    if (encima) { destino = P.pos.clone(); d.c = dc; d.meta = dc.slice(); d.prev = null; }
    else {
      if (o.position.distanceTo(centro(L.n, ...d.meta).setY(o.position.y)) < 0.15) { d.prev = d.c; d.c = d.meta.slice(); d.meta = decidir(d, yo, asustado, cazan); }
      destino = centro(L.n, ...d.meta);
    }
    const base = L.cfg.vel * (asustado ? 0.55 : d.persigue > 0 || cazan ? 1.35 : 1);
    const vel = base * dt, dir = destino.setY(o.position.y).sub(o.position);
    if (dir.length() > vel) dir.setLength(vel); o.position.add(dir);
    if (dir.lengthSq() > 1e-6) o.rotation.y = Math.atan2(dir.x, dir.z);
    // el choque, en el plano (la altura del dron no cuenta)
    if (Math.hypot(o.position.x - P.pos.x, o.position.z - P.pos.z) < GOLPE) {
      if (asustado) {
        const pts = VALOR_DRON[Math.min(P.cadena, VALOR_DRON.length - 1)]; P.cadena++; P.puntos += pts; P.desactivados++;
        d.fuera = 4; d.persigue = 0; o.visible = false; SON.llave();
        const aro = new THREE.Mesh(new THREE.RingGeometry(0.4, 0.7, 40), new THREE.MeshBasicMaterial({ color: 0x3d6bff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false }));
        aro.rotation.x = -Math.PI / 2; aro.position.copy(o.position).setY(0.4); escena.add(aro); efectos.push({ o: aro, vida: 0.6, crece: 10 });
        aviso(`DRON DESACTIVADO +${pts}`, '#8fb0ff', 0.9);
      } else if (P.inv <= 0) {
        if (!SIN_MORIR) P.vidas--;
        SON.golpe(); jugador.poner('HitReact', { una: true });
        if (P.vidas <= 0) { acabar(false, 'Los drones de la Estática te han atrapado.'); return; }
        if (SIN_MORIR) avisoSinMorir(); else aviso(`¡TE HA ATRAPADO! QUEDAN ${P.vidas}`, '#ff4dd8', 1.4);
        P.pos.copy(centro(L.n, 0, 0)); P.inv = 2.5;
        // como al perder una vida en el comecocos: un respiro, todos a su esquina unos segundos
        for (const x of L.drones) x.persigue = 0;
        L.tregua = 4;
      }
    }
  }
  for (const f of efectos.slice()) { f.vida -= dt; f.o.scale.multiplyScalar(1 + dt * f.crece * 0.3); f.o.material.opacity = Math.max(0, f.vida / 0.6); if (f.vida <= 0) { escena.remove(f.o); efectos.splice(efectos.indexOf(f), 1); } }
  // HUD
  $('h-pts').textContent = Math.round(P.puntos).toLocaleString('es-ES');
  $('h-niv').textContent = `${L.k + 1}/${NIVELES.length}`;
  $('h-lla').textContent = `${L.cogidas}/3`;
  $('h-vid').innerHTML = [0, 1, 2].map((i) => `<i class="${i < P.vidas ? '' : 'no'}"></i>`).join('');
  $('h-t').style.width = Math.max(0, L.t / L.cfg.tiempo * 100) + '%'; $('h-t').parentElement.classList.toggle('peligro', L.t < 15);
  $('extra').textContent = (P.sobre > 0 ? `SOBRECARGA · ${Math.ceil(P.sobre)} s: ¡tócalos! · ` : '') + (P.pulso > 0 ? `Pulso recargando · ${Math.ceil(P.pulso)} s` : 'Pulso listo (Espacio)');
  $('b-pulso').disabled = P.pulso > 0;
  document.body.style.setProperty('--peligro', P.sobre <= 0 && L.drones.some((d) => !d.fuera && d.persigue > 0 && d.aturdido <= 0) ? 0.6 : 0);
  pintarMini(yo);
}

// ── el minimapa: solo lo explorado
const mini = $('mini').getContext('2d');
function pintarMini(yo) {
  const n = L.n, W = 340, s = W / n; mini.clearRect(0, 0, W, W);
  mini.strokeStyle = 'rgba(95,244,255,.9)'; mini.lineWidth = 3; mini.fillStyle = 'rgba(95,244,255,.1)';
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    if (!L.visto[i][j]) continue;
    mini.fillRect(i * s, j * s, s, s);
    mini.beginPath();
    if (i === n - 1 || L.M.derecha[i][j]) { mini.moveTo((i + 1) * s, j * s); mini.lineTo((i + 1) * s, (j + 1) * s); }
    if (j === n - 1 || L.M.abajo[i][j]) { mini.moveTo(i * s, (j + 1) * s); mini.lineTo((i + 1) * s, (j + 1) * s); }
    if (i === 0) { mini.moveTo(0, j * s); mini.lineTo(0, (j + 1) * s); } else if (L.M.derecha[i - 1][j]) { mini.moveTo(i * s, j * s); mini.lineTo(i * s, (j + 1) * s); }
    if (j === 0) { mini.moveTo(i * s, 0); mini.lineTo((i + 1) * s, 0); } else if (L.M.abajo[i][j - 1]) { mini.moveTo(i * s, j * s); mini.lineTo((i + 1) * s, j * s); }
    mini.stroke();
  }
  const punto = (c, color, r) => { mini.fillStyle = color; mini.beginPath(); mini.arc((c[0] + 0.5) * s, (c[1] + 0.5) * s, r, 0, 7); mini.fill(); };
  for (const k of L.llaves) if (!k.cogida && L.visto[k.c[0]][k.c[1]]) punto(k.c, '#ffc24a', s * 0.25);
  if (L.cogidas === 3 || L.visto[L.salida[0]][L.salida[1]]) punto(L.salida, L.cogidas === 3 ? '#5dffa0' : '#ff2e55', s * 0.3);
  for (const cel of L.celulas) if (!cel.cogida && L.visto[cel.c[0]][cel.c[1]]) punto(cel.c, '#5dffa0', s * 0.18);
  for (const d of L.drones) { if (d.fuera) continue; const c = celdaDe(n, d.obj.position); if (L.visto[c[0]][c[1]] && Math.abs(c[0] - yo[0]) + Math.abs(c[1] - yo[1]) < 4) punto(c, P.sobre > 0 && !d.inmune ? '#3d6bff' : '#ff4dd8', s * 0.2); }
  punto(yo, '#e8f6ff', s * 0.28);
}

function acabar(salvado, motivo) {
  if (P.fin) return; P.fin = true; DES.parar();
  if (!salvado) { SON.caida(); jugador.poner('Death', { una: true }); } else { SON.bien(); }
  setTimeout(() => {
    $('hud').classList.add('oculto');
    const seg = Math.round((performance.now() - P.t0) / 1000);
    const bonus = DES.bonus(P.puntos); // el bonus de precisión del desafío (0 en arcade)
    finDePartida({ juego: JUEGO.id, titulo: salvado ? '¡Has salido de la Cero!' : 'Se acabó', puntos: P.puntos + bonus, texto: motivo,
      filas: [['Nivel', `${L.k + 1}/${NIVELES.length}`], ['Llaves', P.llavesTot], ['Drones desactivados', P.desactivados], ['Drones aturdidos', P.aturdidos], ['Vidas', P.vidas], ['Tiempo', `${Math.floor(seg / 60)}:${String(seg % 60).padStart(2, '0')}`], ...DES.filas(bonus)],
      alRepetir: empezar, extra: DES.extra() });
  }, 1200);
}
let pausa = false;
function pausar() {
  if (!P || P.fin || DES.abierto) return; pausa = !pausa; // con la pregunta abierta el juego ya está parado
  if (pausa) { pantalla(`<h2>Pausa</h2><div class="botones"><button id="b-seg">Seguir</button>${EMBED ? '' : '<a class="boton sec" href="index.html?v=79ed3709f1">Volver a la sala</a>'}</div>`); $('b-seg').onclick = pausar; }
  else cerrarPantalla();
}
document.addEventListener('visibilitychange', () => { if (document.hidden && P && !P.fin && !pausa && !DES.abierto && !window.__sinPausa) pausar(); });
function empezar() {
  P = nuevaPartida(); pausa = false; window.__t0Partida = performance.now(); montarNivel(0);
  DES.empezar();
  $('hud').classList.remove('oculto'); cerrarPantalla(); jugador.poner('Idle');
  $('b-pulso').classList.toggle('oculto', !matchMedia('(pointer: coarse)').matches);
}
function portada() {
  const e = estado(), desafio = MODO === 'desafio';
  pantalla(`<div class="kicker">El simulador de Joran · máquina 2${desafio ? ' · modo desafío' : ''}</div><h2>El Laberinto de La Constancia</h2>
    <p>La nave se ha quedado a oscuras y la Estática ha soltado sus drones por los pasillos. Solo tienes tu linterna.</p>
    <p>Encuentra las <b>tres llaves</b> de cada nivel y corre a la <b>cápsula</b>, que se enciende en verde cuando las tienes. Los drones patrullan y, a ratos, salen a cazarte: <b>si te tocan, pierdes una vida</b>, y de frente no se esquivan. Coge una <b>célula de energía</b> (verde) y durante unos segundos se vuelven azules y huyen: tócalos y los desactivas. El <b>pulso</b> aturde a los que tengas cerca (se recarga en ${PULSO_RECARGA} s). Tres niveles, cada uno más grande. El minimapa solo enseña lo que ya has explorado.</p>
    <div class="teclas"><kbd>Flechas / WASD</kbd><span>Moverte (en el móvil, arrastra el dedo: es un joystick)</span><kbd>Espacio</kbd><span>El pulso que aturde (en el móvil, el botón)</span><kbd>Célula verde</kbd><span>Sobrecarga: los drones huyen y se desactivan al tocarlos</span></div>
    ${DES.texto()}
    <p class="pista">Tu récord: <b>${(e.marcas.laberinto || 0).toLocaleString('es-ES')}</b></p>
    <div class="botones"><button id="b-ya">¡Adentro!</button><a class="boton sec" href="${urlModo(desafio ? 'arcade' : 'desafio')}">${desafio ? 'Jugar en arcade' : 'Jugar en desafío'}</a>${EMBED ? '' : '<a class="boton sec" href="index.html?v=79ed3709f1">Volver a la sala</a>'}</div>`);
  $('b-ya').onclick = async () => {
    audio();
    if (desafio) { // las preguntas tienen que estar antes de entrar: sin ellas, la batería no se podría recargar
      const b = $('b-ya'); b.disabled = true; b.textContent = 'Cargando preguntas…';
      if (!(await DES.preparar())) aviso('Sin preguntas: juegas en arcade', '#ffc24a', 2.2);
    }
    empezar();
  };
}
let antes = performance.now();
function bucle(ahora) { requestAnimationFrame(bucle); const dt = Math.min(0.05, (ahora - antes) / 1000); antes = ahora; if (!pausa && !DES.abierto) { tick(dt); DES.tick(dt); } render.render(escena, camara); } // con la pregunta abierta, nada corre
(async () => {
  const e = estado();
  const av = ['finn', 'barbara', 'fernando'].includes(QS.get('avatar')) ? QS.get('avatar') : e.avatar;
  jugador = await personaje(av, 1.9, 0);
  jugador.escena.traverse((o) => { if (/Pistol/i.test(o.name)) o.visible = false; });
  holo(jugador.obj, 0x5ff4ff, 0.8); escena.add(jugador.obj); jugador.poner('Idle');
  modelos.llave = holo(await objeto('llave', 1.0), 0xffc24a, 0.9);
  const gd = await cargar('dron_mini');
  modelos.dronFab = () => {
    const s = clone(gd.scene); s.traverse((o) => { if (o.isMesh) o.frustumCulled = false; });
    const t = medir(s).getSize(new V3()); s.scale.setScalar(1.2 / t.y); holo(s, 0xff2ea6, 1.4);
    const m = new THREE.AnimationMixer(s); const clip = gd.animations.find((a) => /Fast_Flying/.test(a.name)) || gd.animations[0]; if (clip) m.clipAction(clip).play();
    // (cada dron, su propio halo: se vuelve azul en la sobrecarga)
    const g = new THREE.Group(); g.add(s); const h = brillo(0xff2ea6, 2.4); h.position.y = 0.4; g.add(h); return { obj: g, mezcla: m, halo: h };
  };
  $('carga').remove();
  // un laberinto de fondo detrás de la portada
  P = nuevaPartida(); P.fin = true; montarNivel(0); camara.position.set(0, 15, 9); camara.lookAt(0, 0, 0); P = null;
  requestAnimationFrame(bucle);
  portada();
})().catch((err) => { $('carga').textContent = 'No se pudo cargar: ' + err.message; console.error(err); });

window.LAB = { get P() { return P; }, get L() { return L; }, empezar, pulso, camara, THREE, DES };
