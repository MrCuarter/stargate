// EL SIMULACRO DE DEFENSA en 3D (solo el proyector). La Cero abajo, con su escudo; los reclutas, en un arco delante de ella
// (su avatar, como torretas); y la Estática, que llega en oleadas: asteroides de la NASA, drones, platillos y, al final, un
// DESTRUCTOR con tres puntos débiles. Vaeon no sale: es un simulacro.
// Aquí solo se PINTA: quién dispara, cuántos enemigos salen y cuánta vida tiene cada cosa lo decide proyector.js.
// Modelos libres: la nave (Magnific, la de la Ruta), asteroides de la NASA (dominio público), el dron de Quaternius (CC0) y
// los platillos de Poly by Google (CC-BY 3.0: se citan en la pantalla del final).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { imagen } from './canal.js?v=3c17edc530';

const azar = (a, b) => a + Math.random() * (b - a);
const V3 = THREE.Vector3;

export async function montarDefensa(lienzo, { ruta, sala }) {
  const render = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true, alpha: true });
  render.setPixelRatio(Math.min(devicePixelRatio, 2));
  render.outputColorSpace = THREE.SRGBColorSpace;
  render.toneMapping = THREE.ACESFilmicToneMapping;
  const escena = new THREE.Scene();
  escena.fog = new THREE.Fog(0x060414, 220, 520);
  const camara = new THREE.PerspectiveCamera(55, 1, 0.5, 2000);
  camara.position.set(0, 30, 64); camara.lookAt(0, 4, -60);
  function ajustar() { const w = lienzo.clientWidth, h = lienzo.clientHeight; render.setSize(w, h, false); camara.aspect = w / h; camara.updateProjectionMatrix(); }
  addEventListener('resize', ajustar); ajustar();
  escena.add(new THREE.HemisphereLight(0x9fd8ff, 0x2a0b30, 1.1));
  const sol = new THREE.DirectionalLight(0xfff0d8, 2.2); sol.position.set(10, 20, 14); escena.add(sol);
  const contra = new THREE.DirectionalLight(0xff4dd8, 1.4); contra.position.set(-10, 6, -30); escena.add(contra);

  // estrellas
  const est = new THREE.BufferGeometry(), N = 1800, p = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { p[i * 3] = azar(-500, 500); p[i * 3 + 1] = azar(-120, 320); p[i * 3 + 2] = azar(-700, -60); }
  est.setAttribute('position', new THREE.BufferAttribute(p, 3));
  escena.add(new THREE.Points(est, new THREE.PointsMaterial({ color: 0xcfe9ff, size: 1.6, fog: false })));

  // ── los modelos
  const gltf = new GLTFLoader(), stl = new STLLoader();
  const cargar = (url) => new Promise((ok, mal) => gltf.load(url, ok, undefined, mal));
  const [naveG, dronG, ovni1G, ovni2G, ovni3G, ...rocasG] = await Promise.all([
    cargar(ruta + 'modelos/nave.glb'), cargar(sala + 'modelos/dron.glb'), cargar(sala + 'modelos/ovni1.glb'), cargar(sala + 'modelos/ovni2.glb'), cargar(sala + 'modelos/ovni3.glb'),
    // las rocas, con red de seguridad: si alguna no llega, se usa una roca hecha a mano (la partida no se para por eso)
    ...['golevka', 'toutatis', 'kleopatra'].map((k) => new Promise((ok) => stl.load(ruta + 'modelos/asteroides/' + k + '.stl', ok, undefined, () => ok(null)))),
  ]);
  // un modelo a su medida (la mayor de sus dimensiones), centrado
  // 🔴 los modelos con esqueleto (el dron de Quaternius) se miden con los huesos: su malla quieta engaña (como en la sala)
  function caja(obj) {
    obj.updateMatrixWorld(true); const b = new THREE.Box3();
    obj.traverse((o) => { if (o.isSkinnedMesh) { o.computeBoundingBox(); b.union(o.boundingBox.clone().applyMatrix4(o.matrixWorld)); } else if (o.isMesh) b.expandByObject(o); });
    return b;
  }
  function medida(obj, m) {
    const cj = caja(obj), t = cj.getSize(new V3()), c = cj.getCenter(new V3());
    const k = m / Math.max(t.x, t.y, t.z); obj.scale.multiplyScalar(k); obj.position.sub(c.multiplyScalar(k));
    const g = new THREE.Group(); g.add(obj); return g;
  }
  // el tinte de la Estática: un contorno magenta (Fresnel) sobre su color
  function estatica(obj, color = 0xff4dd8, fuerza = 1.1) {
    const c = new THREE.Color(color);
    obj.traverse((o) => {
      if (!o.isMesh) return;
      const m = o.material.clone();
      m.onBeforeCompile = (sh) => { sh.uniforms.uRim = { value: c }; sh.fragmentShader = 'uniform vec3 uRim;\n' + sh.fragmentShader.replace('#include <dithering_fragment>', `float rim = 1.0 - max(dot(normalize(normal), normalize(vViewPosition)), 0.0);\n gl_FragColor.rgb += uRim * pow(rim, 2.0) * ${fuerza.toFixed(2)};\n#include <dithering_fragment>`); };
      m.customProgramCacheKey = () => 'est' + color; o.material = m;
    });
    return obj;
  }
  // la Cero: la nave de la Ruta, grande, de espaldas (mira hacia la tormenta)
  naveG.scene.rotation.y = Math.PI / 2; // los modelos de Magnific miran a +x
  const ceroG = medida(new THREE.Group().add(naveG.scene), 26);
  ceroG.position.set(0, 0, 4); escena.add(ceroG);
  const escudoM = new THREE.MeshBasicMaterial({ color: 0x5ff4ff, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const escudo = new THREE.Mesh(new THREE.SphereGeometry(24, 48, 32, 0, Math.PI * 2, 0, Math.PI / 2), escudoM); escudo.position.set(0, -3, 4); escena.add(escudo);
  const escudoW = new THREE.Mesh(escudo.geometry, new THREE.MeshBasicMaterial({ color: 0x5ff4ff, wireframe: true, transparent: true, opacity: 0.035 })); escudo.add(escudoW);
  // las rocas de la NASA: el mismo arreglo que en la Ruta (vértices soldados para que no se vean facetas)
  const aMano = () => { const g = new THREE.IcosahedronGeometry(1, 2), q = g.attributes.position; for (let i = 0; i < q.count; i++) q.setXYZ(i, q.getX(i) * azar(0.8, 1.15), q.getY(i) * azar(0.8, 1.15), q.getZ(i) * azar(0.8, 1.15)); return g; };
  const geoRocas = rocasG.map((g) => g || aMano()).map((g) => { const m = mergeVertices(g.index ? g : g.toNonIndexed(), 1e-3); m.computeVertexNormals(); m.center(); m.computeBoundingSphere(); m.scale(1 / m.boundingSphere.radius, 1 / m.boundingSphere.radius, 1 / m.boundingSphere.radius); return m; });
  const matRoca = new THREE.MeshStandardMaterial({ color: 0x8a7766, roughness: 0.95, metalness: 0.05 });
  const plantillas = {
    roca: () => { const r = azar(4, 6.5), m = new THREE.Mesh(geoRocas[Math.floor(Math.random() * geoRocas.length)], matRoca); m.scale.setScalar(r); return estatica(new THREE.Group().add(m), 0xff4dd8, 0.5); },
    dron: () => { const s = SkeletonUtils.clone(dronG.scene); s.traverse((o) => { if (o.isMesh) o.frustumCulled = false; }); const g = medida(s, 13); g.userData.mezcla = new THREE.AnimationMixer(s); if (dronG.animations[0]) g.userData.mezcla.clipAction(dronG.animations[0]).play(); return estatica(g); },
    platillo: () => estatica(medida(ovni1G.scene.clone(true), 10)),
    crucero: () => estatica(medida(ovni2G.scene.clone(true), 12)),
  };

  // ── los reclutas: su avatar en un disco que flota delante de la Cero (las torretas de la clase)
  const jugadores = new Map();
  function disco(img, alias, color = '#5ff4ff') {
    const c = document.createElement('canvas'); c.width = 256; c.height = 300; const x = c.getContext('2d');
    x.save(); x.beginPath(); x.arc(128, 118, 104, 0, Math.PI * 2); x.closePath(); x.fillStyle = '#0d2236'; x.fill(); x.clip();
    if (img && img.naturalWidth) x.drawImage(img, 24, 14, 208, 208); x.restore();
    x.lineWidth = 12; x.strokeStyle = color; x.beginPath(); x.arc(128, 118, 104, 0, Math.PI * 2); x.stroke();
    x.font = '700 40px "Exo 2", sans-serif'; x.textAlign = 'center'; x.fillStyle = '#e8f6ff'; x.shadowColor = '#000'; x.shadowBlur = 8; x.fillText(alias.slice(0, 11), 128, 284);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  function jugador(id, alias, url) {
    if (jugadores.has(id)) return;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: disco(null, alias), depthWrite: false }));
    imagen(url, (img) => { sp.material.map = disco(img, alias); sp.material.needsUpdate = true; });
    sp.scale.set(4.8, 5.66, 1); escena.add(sp);
    jugadores.set(id, { sp, alias, flash: 0 }); colocar();
  }
  function colocar() {
    const l = [...jugadores.values()], n = l.length;
    l.forEach((j, i) => { const a = n === 1 ? 0 : -1 + 2 * i / (n - 1), fila = n > 14 ? i % 2 : 0, ang = a * 1.05; const rad = 40 + fila * 6; j.base = new V3(Math.sin(ang) * rad, 5 + fila * 4.5, 4 - Math.cos(ang) * rad * 0.45); j.sp.position.copy(j.base); });
  }

  // ── los enemigos, los disparos y las explosiones
  const enemigos = [], rayos = [], chispas = [];
  const matRayo = new THREE.LineBasicMaterial({ color: 0x7dffb0, transparent: true, blending: THREE.AdditiveBlending });
  let vel = 1, llegados = 0;
  function enemigo(tipo) {
    if (enemigos.length > 70) return false;
    const obj = plantillas[tipo](); obj.position.set(azar(-60, 60), azar(4, 36), azar(-230, -190)); escena.add(obj);
    enemigos.push({ tipo, obj, v: (tipo === 'roca' ? azar(16, 24) : azar(20, 30)) * vel, fase: azar(0, 6), gira: new V3(azar(-1, 1), azar(-1, 1), azar(-1, 1)) });
    return true;
  }
  function explotar(pos, color = 0xffa24a, n = 36, tam = 1) {
    const g = new THREE.BufferGeometry(), q = new Float32Array(n * 3), v = [];
    for (let i = 0; i < n; i++) { q.set([pos.x, pos.y, pos.z], i * 3); v.push(new V3(azar(-1, 1), azar(-1, 1), azar(-1, 1)).normalize().multiplyScalar(azar(8, 26) * tam)); }
    g.setAttribute('position', new THREE.BufferAttribute(q, 3));
    const pts = new THREE.Points(g, new THREE.PointsMaterial({ color, size: 1.3 * tam, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    escena.add(pts); chispas.push({ pts, v, vida: 0.9 });
  }
  function rayo(desde, hasta, color = 0x7dffb0) {
    const g = new THREE.BufferGeometry().setFromPoints([desde.clone(), hasta.clone()]);
    const l = new THREE.Line(g, color === 0x7dffb0 ? matRayo : new THREE.LineBasicMaterial({ color, transparent: true, blending: THREE.AdditiveBlending }));
    escena.add(l); rayos.push({ l, vida: 0.22 });
  }
  // un derribo de un recluta: su disco dispara al enemigo más cercano a la Cero (o a un punto débil del destructor)
  function disparo(id) {
    const j = jugadores.get(id); if (!j) return null;
    j.flash = 0.25;
    if (jefe && jefe.hp > 0 && (!enemigos.length || Math.random() < 0.6)) {
      const vivos = jefe.puntos.filter((pt) => pt.hp > 0), pt = vivos[Math.floor(Math.random() * vivos.length)];
      if (pt) { const w = pt.m.getWorldPosition(new V3()); rayo(j.sp.position, w, 0xff9ee0); pt.hp--; jefe.hp--; explotar(w, 0xff9ee0, 6, 0.5); if (pt.hp <= 0) { pt.m.visible = false; explotar(w, 0xff2ea6, 80, 2.2); } return 'jefe'; }
    }
    // solo se dispara a lo que ya está a tiro (así se ve llegar a la Estática antes de caer)
    let mejor = null;
    for (const e of enemigos) if (e.obj.position.z > -150 && (!mejor || e.obj.position.z > mejor.obj.position.z)) mejor = e;
    if (!mejor) { j.flash = 0; return null; }
    rayo(j.sp.position, mejor.obj.position); explotar(mejor.obj.position, mejor.tipo === 'roca' ? 0xffa24a : 0xff4dd8, 30);
    escena.remove(mejor.obj); enemigos.splice(enemigos.indexOf(mejor), 1);
    return 'enemigo';
  }
  // el destructor: el platillo grande de Poly, con tres cristales que hay que romper (la vida, repartida entre los tres)
  let jefe = null;
  function activarJefe(hp) {
    const obj = estatica(medida(ovni3G.scene.clone(true), 58), 0xff2ea6, 1.4);
    obj.position.set(0, 60, -330); escena.add(obj);
    const cristal = new THREE.MeshStandardMaterial({ color: 0xff4dd8, emissive: 0xff2ea6, emissiveIntensity: 1.6, roughness: 0.2 });
    const puntos = [[-20, 0, 14], [20, 0, 14], [0, -6, 22]].map(([x, y, z], i) => {
      const m = new THREE.Mesh(new THREE.IcosahedronGeometry(4.2, 0), cristal); m.position.set(x, y, z); obj.add(m);
      return { m, hp: Math.ceil(hp / 3) + (i === 2 ? hp % 3 : 0) };
    });
    const anillo = new THREE.Mesh(new THREE.TorusGeometry(40, 1.2, 12, 96), new THREE.MeshBasicMaterial({ color: 0xff2ea6, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending }));
    anillo.rotation.x = Math.PI / 2.3; obj.add(anillo); obj.userData.anillo = anillo;
    const halo = new THREE.Mesh(new THREE.SphereGeometry(34, 32, 24), new THREE.MeshBasicMaterial({ color: 0xff2ea6, transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, depthWrite: false })); obj.add(halo);
    jefe = { obj, puntos, hp: puntos.reduce((a, b) => a + b.hp, 0), total: puntos.reduce((a, b) => a + b.hp, 0), cae: -1 };
    return jefe.total;
  }
  let golpeEsc = 0, fraccion = 1;
  function ponerEscudo(f, golpe = false) { fraccion = f; if (golpe) golpeEsc = 0.4; }
  let reloj = 0;
  function tick(dt) {
    reloj += dt; llegados = 0;
    for (const e of enemigos.slice()) {
      const o = e.obj; e.fase += dt;
      o.position.z += e.v * dt; o.position.x += Math.sin(e.fase * 1.3) * dt * (e.tipo === 'roca' ? 1 : 8);
      o.position.y += (8 - o.position.y) * dt * 0.08;
      o.rotation.x += e.gira.x * dt * (e.tipo === 'roca' ? 1 : 0.2); o.rotation.y += e.gira.y * dt;
      if (o.userData.mezcla) o.userData.mezcla.update(dt);
      if (o.position.z > -16) { explotar(new V3(o.position.x * 0.4, 6, 4), 0x5ff4ff, 40, 1.2); escena.remove(o); enemigos.splice(enemigos.indexOf(e), 1); llegados++; }
    }
    for (const r of rayos.slice()) { r.vida -= dt; r.l.material.opacity = Math.max(0, r.vida * 5); if (r.vida <= 0) { escena.remove(r.l); rayos.splice(rayos.indexOf(r), 1); } }
    for (const c of chispas.slice()) { c.vida -= dt; const q = c.pts.geometry.attributes.position; for (let i = 0; i < c.v.length; i++) q.setXYZ(i, q.getX(i) + c.v[i].x * dt, q.getY(i) + c.v[i].y * dt, q.getZ(i) + c.v[i].z * dt); q.needsUpdate = true; c.pts.material.opacity = Math.max(0, c.vida); if (c.vida <= 0) { escena.remove(c.pts); chispas.splice(chispas.indexOf(c), 1); } }
    for (const j of jugadores.values()) { j.flash = Math.max(0, j.flash - dt); const s = 1 + j.flash * 0.8; j.sp.scale.set(4.8 * s, 5.66 * s, 1); j.sp.position.y = j.base.y + Math.sin(reloj * 1.4 + j.base.x) * 0.5; }
    if (jefe) {
      const o = jefe.obj;
      if (jefe.cae < 0) { o.position.z += (-150 - o.position.z) * dt * 0.25; o.position.y += (30 - o.position.y) * dt * 0.25; o.rotation.y += dt * 0.15; }
      else { jefe.cae += dt; o.position.y -= dt * 14; o.rotation.z += dt * 0.6; if (Math.random() < 0.5) explotar(o.position.clone().add(new V3(azar(-25, 25), azar(-8, 8), azar(-10, 10))), 0xff2ea6, 20, 1.6); if (jefe.cae > 3) { escena.remove(o); jefe = null; } }
      for (const pt of jefe ? jefe.puntos : []) pt.m.rotation.y += dt * 2;
      if (jefe && jefe.obj.userData.anillo) jefe.obj.userData.anillo.rotation.z += dt * 0.8;
    }
    golpeEsc = Math.max(0, golpeEsc - dt);
    escudoM.color.set(golpeEsc > 0 ? 0xff4d6d : fraccion < 0.3 ? 0xff9f3d : 0x5ff4ff);
    escudoM.opacity = 0.03 + fraccion * 0.06 + golpeEsc * 0.5;
    escudo.visible = fraccion > 0;
    ceroG.position.y = -4 + Math.sin(reloj * 0.8) * 0.4;
    camara.position.x = Math.sin(reloj * 0.12) * 3;
    camara.lookAt(0, 6, -70);
    render.render(escena, camara);
    return llegados;
  }
  // 🔴 27-sep · EL CAÑÓN DE PLASMA DEL COMANDANTE (una de sus tres bombas): revienta todo lo que viene y le quita al
  // destructor una parte de su vida (fr), repartida entre los cristales que le quedan. No lo mata: eso es de la clase.
  function bomba(fr = 0.15) {
    let n = 0;
    for (const e of enemigos.splice(0)) { explotar(e.obj.position, e.tipo === 'roca' ? 0xffa24a : 0x5ff4ff, 34, 1.3); escena.remove(e.obj); n++; }
    if (jefe && jefe.hp > 1 && jefe.cae < 0) {
      const vivos = jefe.puntos.filter((pt) => pt.hp > 0), quita = Math.min(jefe.hp - 1, Math.max(1, Math.round(jefe.total * fr)));
      for (let i = 0; i < quita; i++) { const pt = vivos.filter((x) => x.hp > 1)[0] || vivos.filter((x) => x.hp > 0)[0]; if (!pt) break; pt.hp--; jefe.hp--; }
      for (const pt of vivos) { const w = pt.m.getWorldPosition(new V3()); explotar(w, 0x5ff4ff, 40, 1.8); if (pt.hp <= 0) pt.m.visible = false; }
    }
    return n;
  }
  function jefeCae() { if (jefe) { jefe.cae = 0; explotar(jefe.obj.position, 0xff2ea6, 200, 4); } }
  function limpiar() { for (const e of enemigos.splice(0)) escena.remove(e.obj); if (jefe) { escena.remove(jefe.obj); jefe = null; } }
  function caeLaCero() { explotar(ceroG.position.clone().add(new V3(0, 6, 0)), 0x5ff4ff, 220, 4); escudo.visible = false; }
  return {
    jugador, colocar, enemigo, disparo, activarJefe, jefeCae, bomba, ponerEscudo, tick, limpiar, caeLaCero, ajustar,
    get vivos() { return enemigos.length; }, get jefeHp() { return jefe ? jefe.hp : 0; }, get jefeTotal() { return jefe ? jefe.total : 0; },
    set velocidad(k) { vel = k; },
  };
}
