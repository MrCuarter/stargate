// EL LABERINTO DE LA CERO · máquina 2 de la sala de Joran (borrador).
// La nave se ha apagado y la Estática ha soltado sus drones. A la luz de tu linterna: tres llaves por nivel, la
// cápsula que se abre con ellas y un pulso que aturde a los drones. Tres niveles, cada uno más grande. Arcade: sin preguntas.
import { THREE, $, azar, elegir, QS, estado, SON, audio, holo, personaje, objeto, cargar, medir, texBrillo, pantalla, cerrarPantalla, aviso, finDePartida, JUEGOS, EMBED } from './comun.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';

const V3 = THREE.Vector3;
const JUEGO = JUEGOS[1];
const C = 4, ALTO = 2.4;                    // tamaño de la celda y alto de las paredes
const NIVELES = [
  { n: 7, drones: 2, tiempo: 60, vel: 2.4 },
  { n: 9, drones: 3, tiempo: 70, vel: 2.8 },
  { n: 11, drones: 5, tiempo: 80, vel: 3.1 },
];
const VEL_JUGADOR = 5.2, RADIO = 0.45;

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
  const llaves = elegidas.map((c) => { const o = modelos.llave.clone(); o.position.copy(centro(n, ...c)).setY(1.1); o.add(brillo(0xffc24a, 3.2, false)); grupo.add(o); return { c, o, cogida: false }; });
  // la cápsula de salida (apagada hasta tener las tres llaves)
  const cap = new THREE.Group(); cap.position.copy(centro(n, ...salida));
  const cuerpo = new THREE.Mesh(new THREE.CapsuleGeometry(0.9, 1.2, 8, 16), new THREE.MeshStandardMaterial({ color: 0x223040, emissive: 0xff2e55, emissiveIntensity: 0.4, metalness: 0.6, roughness: 0.3 })); cuerpo.position.y = 1.3; cap.add(cuerpo);
  const haz = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 1.1, 30, 20, 1, true), new THREE.MeshBasicMaterial({ color: 0x5dffa0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false })); haz.position.y = 15; cap.add(haz);
  const halo = brillo(0xff2e55, 4, false); halo.position.y = 1.4; cap.add(halo);
  grupo.add(cap);
  // los drones, lejos de ti
  const drones = [];
  for (let k2 = 0; k2 < cfg.drones; k2++) {
    const c = elegir(celdas.slice(0, Math.floor(celdas.length * 0.6)));
    const dr = modelos.dronFab(); dr.obj.position.copy(centro(n, ...c)).setY(1.2); grupo.add(dr.obj);
    drones.push({ ...dr, c: c.slice(), prev: null, obj: dr.obj, meta: c.slice(), persigue: 0, aturdido: 0 });
  }
  L = { k, cfg, n, M, grupo, paredes, llaves, salida, cap, cuerpo, haz, halo, drones, visto: Array.from({ length: n }, () => Array(n).fill(false)), cogidas: 0, t: cfg.tiempo };
  P.pos.copy(centro(n, 0, 0)); P.inv = 1.5;
  aviso(`NIVEL ${k + 1}`, '#5ff4ff', 1.2);
}

// ───────────────────────────────── estado
let P = null, jugador = null;
const modelos = {};
const efectos = [];
function nuevaPartida() { return { pos: new V3(), dir: new V3(), vidas: 3, puntos: 0, pulso: 0, inv: 0, fin: false, cuenta: 2.2, aturdidos: 0, llavesTot: 0, t0: performance.now() }; }

// ── controles: teclado y joystick del dedo
const tecla = {};
addEventListener('keydown', (e) => { tecla[e.code] = true; if (e.code === 'Space') { pulso(); e.preventDefault(); } if (e.code === 'KeyP' || e.code === 'Escape') pausar(); });
addEventListener('keyup', (e) => { tecla[e.code] = false; });
let stick = null;
lienzo.addEventListener('pointerdown', (e) => { audio(); stick = { x0: e.clientX, y0: e.clientY, dx: 0, dy: 0, id: e.pointerId }; const s = $('stick'); s.style.left = e.clientX + 'px'; s.style.top = e.clientY + 'px'; s.classList.remove('oculto'); });
addEventListener('pointermove', (e) => { if (!stick || e.pointerId !== stick.id) return; let dx = e.clientX - stick.x0, dy = e.clientY - stick.y0; const d = Math.hypot(dx, dy), m = 50; if (d > m) { dx *= m / d; dy *= m / d; } stick.dx = dx / m; stick.dy = dy / m; $('stick').firstElementChild.style.transform = `translate(${dx}px,${dy}px)`; });
addEventListener('pointerup', (e) => { if (stick && e.pointerId === stick.id) { stick = null; $('stick').classList.add('oculto'); $('stick').firstElementChild.style.transform = ''; } });
$('b-pulso').addEventListener('pointerdown', (e) => { e.stopPropagation(); pulso(); });

function pulso() {
  if (!P || P.fin || P.cuenta > 0 || P.pulso > 0) return;
  P.pulso = 8; SON.pulso();
  const aro = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.9, 48), new THREE.MeshBasicMaterial({ color: 0x5ff4ff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false }));
  aro.rotation.x = -Math.PI / 2; aro.position.copy(P.pos).setY(0.3); escena.add(aro); efectos.push({ o: aro, vida: 0.6, crece: 14 });
  let n = 0;
  for (const d of L.drones) if (d.obj.position.distanceTo(P.pos) < 8.5) { d.aturdido = 3.2; d.persigue = 0; n++; }
  if (n) { P.aturdidos += n; P.puntos += 50 * n; aviso(`¡${n} ATURDIDO${n > 1 ? 'S' : ''}!`, '#5ff4ff', 0.9); }
}
function chocaPared(x, z) { for (const w of L.paredes) if (x + RADIO > w.x0 && x - RADIO < w.x1 && z + RADIO > w.z0 && z - RADIO < w.z1) return true; return false; }
// ¿se ven? (misma fila o columna, sin paredes entre medias)
function seVen(a, b) {
  if (a[0] !== b[0] && a[1] !== b[1]) return false;
  const paso = a[0] === b[0] ? [0, Math.sign(b[1] - a[1])] : [Math.sign(b[0] - a[0]), 0];
  let c = a.slice(); while (c[0] !== b[0] || c[1] !== b[1]) { const s = [c[0] + paso[0], c[1] + paso[1]]; if (!abiertoEntre(L.M, c, s)) return false; c = s; } return true;
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
    if (L.t <= 0) { acabar(false, 'La Estática ha inundado el nivel: se acabó el tiempo.'); return; }
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
  // la cápsula
  L.halo.scale.setScalar(4 + Math.sin(performance.now() / 250) * 0.4);
  if (jugando && L.cogidas === 3 && L.cap.position.distanceTo(P.pos) < 1.4) {
    const bonus = 1000 * (L.k + 1) + Math.round(L.t) * 15; P.puntos += bonus; SON.bien();
    if (L.k + 1 < NIVELES.length) { aviso(`¡NIVEL SUPERADO! +${bonus}`, '#5dffa0', 1.6); P.cuenta = 1.6; montarNivel(L.k + 1); }
    else { P.puntos += P.vidas * 500; acabar(true, `Has salido de la Cero con ${P.vidas} vida${P.vidas === 1 ? '' : 's'} (+${P.vidas * 500}).`); }
  }
  // drones de la Estática
  for (const d of L.drones) {
    d.mezcla.update(dt);
    const o = d.obj; o.position.y = 1.2 + Math.sin(performance.now() / 200 + o.id) * 0.12;
    if (d.aturdido > 0) { d.aturdido -= dt; o.rotation.z = Math.sin(performance.now() / 60) * 0.4; o.visible = Math.random() > 0.2; continue; }
    o.rotation.z = 0; o.visible = true;
    if (!jugando) continue;
    const dc = celdaDe(L.n, o.position);
    if (seVen(dc, yo) && Math.abs(dc[0] - yo[0]) + Math.abs(dc[1] - yo[1]) <= 4 || o.position.distanceTo(P.pos) < C * 1.2) { if (d.persigue <= 0) SON.alarma(); d.persigue = 3.5; }
    d.persigue -= dt;
    const meta = centro(L.n, ...d.meta);
    if (o.position.distanceTo(meta.clone().setY(o.position.y)) < 0.15) {
      d.prev = d.c; d.c = d.meta.slice();
      if (d.persigue > 0) { const { padre } = bfs(L.M, L.n, yo); d.meta = padre[d.c] ? padre[d.c].slice() : d.c.slice(); }
      else { const vs = vecinos(L.M, L.n, d.c).filter((v) => !d.prev || v[0] !== d.prev[0] || v[1] !== d.prev[1]); d.meta = (vs.length ? elegir(vs) : d.prev || d.c).slice(); }
    }
    const vel = (d.persigue > 0 ? L.cfg.vel * 1.35 : L.cfg.vel) * dt, dir = meta.clone().setY(o.position.y).sub(o.position);
    if (dir.length() > vel) dir.setLength(vel); o.position.add(dir);
    if (dir.lengthSq() > 1e-6) o.rotation.y = Math.atan2(dir.x, dir.z);
    if (P.inv <= 0 && o.position.distanceTo(P.pos.clone().setY(1.2)) < 1.0) {
      P.vidas--; SON.golpe(); jugador.poner('HitReact', { una: true });
      if (P.vidas <= 0) { acabar(false, 'Los drones de la Estática te han atrapado.'); return; }
      aviso(`¡TE HA ATRAPADO! QUEDAN ${P.vidas}`, '#ff4dd8', 1.4); P.pos.copy(centro(L.n, 0, 0)); P.inv = 2.2;
    }
  }
  for (const f of efectos.slice()) { f.vida -= dt; f.o.scale.multiplyScalar(1 + dt * f.crece * 0.3); f.o.material.opacity = Math.max(0, f.vida / 0.6); if (f.vida <= 0) { escena.remove(f.o); efectos.splice(efectos.indexOf(f), 1); } }
  // HUD
  $('h-pts').textContent = Math.round(P.puntos).toLocaleString('es-ES');
  $('h-niv').textContent = `${L.k + 1}/${NIVELES.length}`;
  $('h-lla').textContent = `${L.cogidas}/3`;
  $('h-vid').innerHTML = [0, 1, 2].map((i) => `<i class="${i < P.vidas ? '' : 'no'}"></i>`).join('');
  $('h-t').style.width = Math.max(0, L.t / L.cfg.tiempo * 100) + '%'; $('h-t').parentElement.classList.toggle('peligro', L.t < 15);
  $('extra').textContent = P.pulso > 0 ? `Pulso recargando · ${Math.ceil(P.pulso)} s` : 'Pulso listo (Espacio)';
  $('b-pulso').disabled = P.pulso > 0;
  document.body.style.setProperty('--peligro', L.drones.some((d) => d.persigue > 0 && d.aturdido <= 0) ? 0.6 : 0);
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
  for (const d of L.drones) { const c = celdaDe(n, d.obj.position); if (L.visto[c[0]][c[1]] && Math.abs(c[0] - yo[0]) + Math.abs(c[1] - yo[1]) < 4) punto(c, '#ff4dd8', s * 0.2); }
  punto(yo, '#e8f6ff', s * 0.28);
}

function acabar(salvado, motivo) {
  if (P.fin) return; P.fin = true;
  if (!salvado) { SON.caida(); jugador.poner('Death', { una: true }); } else { SON.bien(); }
  setTimeout(() => {
    $('hud').classList.add('oculto');
    const seg = Math.round((performance.now() - P.t0) / 1000);
    finDePartida({ juego: JUEGO.id, titulo: salvado ? '¡Has salido de la Cero!' : 'Se acabó', puntos: P.puntos, texto: motivo,
      filas: [['Nivel', `${L.k + 1}/${NIVELES.length}`], ['Llaves', P.llavesTot], ['Drones aturdidos', P.aturdidos], ['Vidas', P.vidas], ['Tiempo', `${Math.floor(seg / 60)}:${String(seg % 60).padStart(2, '0')}`]],
      alRepetir: empezar });
  }, 1200);
}
let pausa = false;
function pausar() {
  if (!P || P.fin) return; pausa = !pausa;
  if (pausa) { pantalla(`<h2>Pausa</h2><div class="botones"><button id="b-seg">Seguir</button>${EMBED ? '' : '<a class="boton sec" href="index.html">Volver a la sala</a>'}</div>`); $('b-seg').onclick = pausar; }
  else cerrarPantalla();
}
document.addEventListener('visibilitychange', () => { if (document.hidden && P && !P.fin && !pausa && !window.__sinPausa) pausar(); });
function empezar() {
  P = nuevaPartida(); pausa = false; window.__t0Partida = performance.now(); montarNivel(0);
  $('hud').classList.remove('oculto'); cerrarPantalla(); jugador.poner('Idle');
  $('b-pulso').classList.toggle('oculto', !matchMedia('(pointer: coarse)').matches);
}
function portada() {
  const e = estado();
  pantalla(`<div class="kicker">El simulador de Joran · máquina 2</div><h2>El Laberinto de la Cero</h2>
    <p>La nave se ha quedado a oscuras y la Estática ha soltado sus drones por los pasillos. Solo tienes tu linterna.</p>
    <p>Encuentra las <b>tres llaves</b> de cada nivel y corre a la <b>cápsula</b>, que se enciende en verde cuando las tienes. Si un dron te ve en línea recta, te persigue: aturde a los que tengas cerca con el <b>pulso</b> (se recarga en 8 s). Tres niveles, cada uno más grande. El minimapa solo enseña lo que ya has explorado.</p>
    <div class="teclas"><kbd>Flechas / WASD</kbd><span>Moverte (en el móvil, arrastra el dedo: es un joystick)</span><kbd>Espacio</kbd><span>El pulso que aturde (en el móvil, el botón)</span></div>
    <p class="pista">Tu récord: <b>${(e.marcas.laberinto || 0).toLocaleString('es-ES')}</b></p>
    <div class="botones"><button id="b-ya">¡Adentro!</button>${EMBED ? '' : '<a class="boton sec" href="index.html">Volver a la sala</a>'}</div>`);
  $('b-ya').onclick = () => { audio(); empezar(); };
}
let antes = performance.now();
function bucle(ahora) { requestAnimationFrame(bucle); const dt = Math.min(0.05, (ahora - antes) / 1000); antes = ahora; if (!pausa) tick(dt); render.render(escena, camara); }
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
    const g = new THREE.Group(); g.add(s); const h = brillo(0xff2ea6, 2.4); h.position.y = 0.4; g.add(h); return { obj: g, mezcla: m };
  };
  $('carga').remove();
  // un laberinto de fondo detrás de la portada
  P = nuevaPartida(); P.fin = true; montarNivel(0); camara.position.set(0, 15, 9); camara.lookAt(0, 0, 0); P = null;
  requestAnimationFrame(bucle);
  portada();
})().catch((err) => { $('carga').textContent = 'No se pudo cargar: ' + err.message; console.error(err); });

window.LAB = { get P() { return P; }, get L() { return L; }, empezar, pulso, camara, THREE };
