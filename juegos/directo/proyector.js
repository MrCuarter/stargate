// EL MODO EN DIRECTO · la pantalla del docente (la que se proyecta). La sala está abierta desde que se entra: la clase va
// llegando mientras el docente elige el modo y los ajustes (o un atajo) y pulsa Lanzar. Cuatro modos, la misma mecánica:
// Defensa (cooperativa, en 3D), Carrera y Caza (individuales) y Duelo (dos escuadrillas al azar).
// El proyector es quien manda: decide cuándo empieza y acaba, suma, ordena y reparte. Los móviles solo mandan lo suyo.
// ?sesion=1&c=XXXX&tema=6 → dentro de la sesión (la sala es la de la clase y el tema de la semana viene dado).
import { conectar, nuevoCodigo, imagen, AV, AVATARES, TEMAS, MODOS, DURACIONES, PREGUNTAS, FRECUENCIAS, INTENSIDAD, CFG_INICIAL, ATAJOS, EQUIPOS, VALOR, metaCarrera, BALIZA, PREMIO, EN_WEB } from './canal.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const azar = (a, b) => a + Math.random() * (b - a);
const QS = new URLSearchParams(location.search);
const EN_SESION = QS.get('sesion') === '1';
const TEMA_SEMANA = Math.min(8, Math.max(1, Number(QS.get('tema')) || 6));
const PLANETAS = ['p1_forge', 'p2_ecos', 'p3_sendara', 'p4_reliae', 'p5_umbral', 'p6_ludo', 'p7_vinculo', 'p8_liminar'];
const NOMBRES_BOT = ['Rigel', 'Altair', 'Sirio', 'Antares', 'Deneb', 'Mizar', 'Alcor', 'Capella', 'Bellatrix', 'Procyon', 'Canopus', 'Spica', 'Pollux',
  'Castor', 'Regulus', 'Hadar', 'Nyra', 'Lumen', 'Iskra', 'Elyra', 'Kestra', 'Tavek', 'Sable', 'Vexa'];
const n1 = (x) => Math.round(x).toLocaleString('es-ES');

const cfg = { ...CFG_INICIAL };
let fase = 'preparar', finEn = 0, inicio = 0, meta = 0, llegadas = [], escudo = 100, baliza = 0, fraseOleada = '', jefeActivo = false, D = null, cargandoD = null;
const codigo = (QS.get('c') || nuevoCodigo()).toUpperCase();
const jugadores = new Map(); // id → { alias, avatar, bot, img, puntos, stats, equipo, llega, pendientes }
const nuevaStats = () => ({ derribos: 0, aciertos: 0, respondidas: 0, esquivas: 0, golpes: 0, reparado: 0, sabotajes: 0 });
let aviso0 = null;
function aviso(t, color = '#fff', seg = 1.4) { const a = $('aviso'); a.textContent = t; a.style.color = color; a.classList.add('ver'); clearTimeout(aviso0); aviso0 = setTimeout(() => a.classList.remove('ver'), seg * 1000); }

// ─────────────────────────────── PREPARAR: la configuración y la sala de espera, a la vez
const canal = conectar(codigo, alMensaje);
$('codigo').textContent = codigo;
$('b-movil').href = `alumno.html?c=${codigo}` + (EN_SESION ? `&sesion=1&tema=${TEMA_SEMANA}` : '');
if (EN_SESION) $('kicker').textContent = `Final de la clase · en directo · semana de ${TEMAS[TEMA_SEMANA]}`;
$('a-dur').innerHTML = DURACIONES.map((d) => `<option value="${d}">${d / 60} minutos</option>`).join('');
$('a-preg').innerHTML = Object.entries(PREGUNTAS).map(([k, t]) => `<option value="${k}">${esc(t)}${k === 'semana' ? ` (tema ${TEMA_SEMANA})` : k === 'vistos' ? ` (1 a ${TEMA_SEMANA})` : ''}</option>`).join('');
$('a-frec').innerHTML = FRECUENCIAS.map((f) => `<option value="${f}">Cada ${f} s</option>`).join('');
$('a-int').innerHTML = Object.entries(INTENSIDAD).map(([k, v]) => `<option value="${k}">${v.n}</option>`).join('');
$('atajos').innerHTML = ATAJOS.map((a) => `<button data-atajo="${a.k}">${esc(a.n)}<small>${esc(a.que)}</small></button>`).join('');
function pintarCfg() {
  $('modos').innerHTML = Object.entries(MODOS).map(([k, m]) => `<button class="modo${k === cfg.modo ? ' si' : ''}" data-modo="${k}"><i>${m.estructura}</i><b>${esc(m.largo)}</b><span>${esc(m.breve)}</span></button>`).join('');
  $('como-t').textContent = 'Cómo se juega: ' + MODOS[cfg.modo].largo.toLowerCase(); $('como-p').textContent = MODOS[cfg.modo].que;
  $('a-dur').value = cfg.dur; $('a-preg').value = cfg.preguntas; $('a-frec').value = cfg.frecuencia; $('a-int').value = cfg.intensidad;
  $('a-pot').checked = cfg.potenciadores; $('a-oculto').checked = cfg.oculto; $('a-premio').checked = cfg.premio;
  $('teoria').innerHTML = `La mecánica no cambia (tocar lo que cae y contestar); cambia la <b>estructura de la meta</b>: cooperativa, individual o por equipos. Hoy, <b>${MODOS[cfg.modo].estructura.toLowerCase()}</b>. Jugad dos modos seguidos y comparad cómo se comporta la clase.`;
  document.querySelectorAll('[data-modo]').forEach((b) => { b.onclick = () => { cfg.modo = b.dataset.modo; pintarCfg(); pintarSala(); if (cfg.modo === 'defensa') precargarDefensa(); emitir(); }; });
  $('b-barajar').classList.toggle('oculto', cfg.modo !== 'duelo');
}
document.querySelectorAll('[data-atajo]').forEach((b) => { b.onclick = () => { Object.assign(cfg, ATAJOS.find((a) => a.k === b.dataset.atajo).cfg); pintarCfg(); pintarSala(); if (cfg.modo === 'defensa') precargarDefensa(); aviso(b.firstChild.textContent, '#ffc24a', 0.9); emitir(); }; });
$('a-dur').onchange = () => { cfg.dur = Number($('a-dur').value); };
$('a-preg').onchange = () => { cfg.preguntas = $('a-preg').value; emitir(); };
$('a-frec').onchange = () => { cfg.frecuencia = Number($('a-frec').value); };
$('a-int').onchange = () => { cfg.intensidad = $('a-int').value; };
$('a-pot').onchange = () => { cfg.potenciadores = $('a-pot').checked; };
$('a-oculto').onchange = () => { cfg.oculto = $('a-oculto').checked; };
$('a-premio').onchange = () => { cfg.premio = $('a-premio').checked; };
pintarCfg();

function alta(id, alias, avatar, bot = false, listo = true) {
  if (jugadores.has(id)) { const j = jugadores.get(id); if (j.avatar !== avatar) j.img = imagen(AV(avatar)); j.alias = alias; j.avatar = avatar; if (listo && !j.listo) { j.listo = true; if (D) D.jugador(id, alias, AV(avatar)); } pintarSala(); return; }
  const img = imagen(AV(avatar));
  const j = { id, alias, avatar, listo, puntos: 0, bot, img, llega: 0, stats: nuevaStats(), pendientes: 0, x: 0, y: 0, ritmo: azar(0.6, 1.4), sigPreg: azar(3, cfg.frecuencia), sigEsq: azar(4, 9) };
  j.equipo = equipoConMenos(); jugadores.set(id, j);
  if (D && listo) D.jugador(id, alias, AV(avatar));
  pintarSala();
}
// en juego solo están los que ya han marcado su ticket (en la sesión); los de ejemplo, siempre
const dentro = () => [...jugadores.values()].filter((j) => j.listo);
function recolocar() { const l = dentro(); l.forEach((j, i) => { j.carril = (i + 0.5) / l.length; }); }
function equipoConMenos() { let a = 0, b = 0; for (const j of jugadores.values()) j.equipo === 'A' ? a++ : j.equipo === 'B' && b++; return a <= b ? 'A' : 'B'; }
function barajar() { const l = [...jugadores.values()].sort(() => Math.random() - 0.5); l.forEach((j, i) => { j.equipo = i % 2 ? 'B' : 'A'; }); pintarSala(); emitir(); }
$('b-barajar').onclick = barajar;
const fichaJ = (j) => `<div class="j${j.listo ? '' : ' espera'}" title="${j.listo ? 'Ticket hecho' : 'Con su ticket'}"><img class="av" onerror="if(!this.dataset.r){this.dataset.r=1;setTimeout(()=>{this.src+='?r=1'},400)}" src="${AV(j.avatar)}" alt="" style="border-color:${cfg.modo === 'duelo' ? EQUIPOS[j.equipo].color : ''}"><span>${j.listo ? '' : '<i>ticket</i> '}${esc(j.alias)}</span></div>`;
function pintarSala() {
  const l = [...jugadores.values()], duelo = cfg.modo === 'duelo';
  $('jugadores').classList.toggle('oculto', duelo); $('eqs').classList.toggle('oculto', !duelo);
  if (duelo) $('eqs').innerHTML = ['A', 'B'].map((k) => `<div class="eq" style="border-color:${EQUIPOS[k].color}"><h3 style="color:${EQUIPOS[k].color}">${EQUIPOS[k].n} · ${l.filter((j) => j.equipo === k).length}</h3><div class="lista">${l.filter((j) => j.equipo === k).map(fichaJ).join('')}</div></div>`).join('');
  else $('jugadores').innerHTML = l.length ? l.map(fichaJ).join('') : '<p style="opacity:.7">Esperando a la tripulación…</p>';
  const listos = l.filter((j) => j.listo).length;
  $('b-lanzar').disabled = !listos;
  $('b-lanzar').textContent = listos ? `Lanzar (${listos})` : 'Esperando reclutas…';
  $('listos').textContent = l.length ? `${listos} de ${l.length} con el ticket hecho` : '';
}
pintarSala();
let tandaBots = 0;
function ponerBots() {
  const tanda = ++tandaBots; // si se cambia el número a medias, las llegadas pendientes de la tanda anterior se anulan
  const quiero = Number($('a-bots').value), hay = [...jugadores.values()].filter((j) => j.bot);
  hay.slice(quiero).forEach((j) => jugadores.delete(j.id));
  NOMBRES_BOT.slice(hay.length, quiero).forEach((alias, i) => setTimeout(() => { if (fase === 'preparar' && tanda === tandaBots) alta('bot' + alias, alias, AVATARES[Math.floor(Math.random() * AVATARES.length)], true); }, 300 + i * azar(120, 320)));
  pintarSala();
}
$('a-bots').onchange = ponerBots; ponerBots();

function alMensaje(m) {
  if (!m || !m.t) return;
  if (m.t === 'hola') {
    // entrar tarde, volver tras perder la conexión o llegar tras el ticket: quien ya jugaba recupera lo suyo; quien entra nuevo, con 0
    const antes = jugadores.get(m.id), estabaDentro = !!(antes && antes.listo), listo = m.listo !== false;
    alta(m.id, String(m.alias || 'Recluta').slice(0, 16), AVATARES.includes(m.avatar) ? m.avatar : AVATARES[0], false, listo);
    const j = jugadores.get(m.id);
    if (fase === 'juego' && j.listo) { canal.enviar({ t: 'retoma', id: m.id, puntos: j.puntos, stats: j.stats, nuevo: !estabaDentro }); if (!estabaDentro) { recolocar(); if (!cfg.oculto) aviso(`${j.alias} se une`, '#5ff4ff', 1); } }
    emitir();
  }
  const j = m.id && jugadores.get(m.id);
  if (!j || fase !== 'juego') return;
  if (m.t === 'pts') {
    // nunca baja y nadie sube de golpe más de lo posible en medio segundo (así un móvil trucado no gana solo)
    const s = m.stats || {};
    for (const k of Object.keys(j.stats)) { const v = Math.max(j.stats[k], Math.min(Number(s[k]) || 0, j.stats[k] + (k === 'reparado' ? 24 : 6))); if (k === 'derribos') j.pendientes += v - j.stats[k]; j.stats[k] = v; }
    j.puntos = Math.max(j.puntos, Math.min(Number(m.puntos) || 0, j.puntos + 40));
    comprobarLlegada(j);
  }
  if (m.t === 'sabotaje' && cfg.modo === 'duelo' && cfg.potenciadores) sabotaje(j);
}
function emitir() {
  const o = orden();
  canal.enviar({ t: 'estado', fase, cfg, temaSemana: TEMA_SEMANA, fin: finEn, meta, escudo: Math.round(escudo), baliza, n: jugadores.size, listos: dentro().length,
    orden: o.map((j) => j.id), equipos: Object.fromEntries([...jugadores.values()].map((j) => [j.id, j.equipo])),
    medias: mediasEquipos(), jefe: D && jefeActivo ? { hp: D.jefeHp, total: D.jefeTotal } : null });
}
setInterval(emitir, 500);

// ─────────────────────────────── LA DEFENSA EN 3D (se carga en cuanto se elige, para que Lanzar sea inmediato)
function precargarDefensa() {
  if (cargandoD) return cargandoD;
  const ruta = EN_WEB ? '../ruta/' : '../ruta-estatica/', sala = EN_WEB ? '../joran/' : '../sala-joran/';
  cargandoD = import('./defensa3d.js').then((M) => M.montarDefensa($('lienzo3d'), { ruta, sala })).then((d) => { D = d; for (const j of dentro()) D.jugador(j.id, j.alias, AV(j.avatar)); return d; })
    .catch((e) => { console.error(e); aviso('No se pudo cargar la escena 3D', '#ff4d6d', 3); });
  return cargandoD;
}
if (cfg.modo === 'defensa') precargarDefensa();

// ─────────────────────────────── LANZAR
$('b-lanzar').onclick = async () => {
  if (cfg.modo === 'defensa') { $('b-lanzar').textContent = 'Cargando la escena…'; await precargarDefensa(); if (!D) return; }
  for (const j of jugadores.values()) { j.puntos = 0; j.stats = nuevaStats(); j.llega = 0; j.pendientes = 0; j.x = 0; j.sigPreg = azar(3, cfg.frecuencia); }
  llegadas = []; escudo = 100; baliza = 0; jefeActivo = false; fraseOleada = '';
  fase = 'juego'; inicio = Date.now(); finEn = inicio + cfg.dur * 1000;
  meta = cfg.modo === 'carrera' ? metaCarrera(cfg.dur) : 0;
  $('preparar').classList.add('oculto'); $('hud').classList.remove('oculto');
  const tres = cfg.modo === 'defensa';
  $('lienzo3d').classList.toggle('oculto', !tres); $('lienzo').classList.toggle('oculto', tres);
  if (tres) { D.limpiar(); D.velocidad = INTENSIDAD[cfg.intensidad].k; D.ponerEscudo(1); D.ajustar(); }
  $('h-modo').textContent = `${MODOS[cfg.modo].estructura} · ${cfg.preguntas === 'no' ? 'sin preguntas' : PREGUNTAS[cfg.preguntas].toLowerCase()}`;
  $('h-tit').textContent = cfg.modo === 'carrera' ? `La carrera a ${TEMAS[Math.min(8, TEMA_SEMANA + 1)]}` : MODOS[cfg.modo].largo;
  $('top').classList.toggle('oculto', cfg.oculto || cfg.modo === 'duelo');
  $('top').classList.toggle('abajo', cfg.modo === 'carrera');
  $('top-t').textContent = cfg.modo === 'defensa' ? 'LOS QUE MÁS DERRIBAN' : 'EN CABEZA';
  $('meta').className = cfg.modo === 'defensa' ? 'escudo' : ''; $('meta-b').style.background = ''; $('meta-b').parentElement.style.background = '';
  $('jefe').classList.add('oculto');
  destino.src = 'img/' + PLANETAS[Math.min(7, TEMA_SEMANA)] + '.png';
  recolocar();
  aviso('¡YA!', '#5dffa0', 1.2);
  emitir();
};
function orden() {
  return dentro().sort((a, b) => (a.llega && b.llega ? a.llega - b.llega : a.llega ? -1 : b.llega ? 1 : b.puntos - a.puntos));
}
function mediasEquipos() {
  const r = { A: 0, B: 0 }, n = { A: 0, B: 0 };
  for (const j of dentro()) { r[j.equipo] += j.puntos; n[j.equipo]++; }
  return { A: n.A ? r.A / n.A : 0, B: n.B ? r.B / n.B : 0, nA: n.A, nB: n.B };
}
function comprobarLlegada(j) {
  if (cfg.modo !== 'carrera' || j.llega || j.puntos < meta) return;
  j.llega = Date.now(); llegadas.push(j);
  aviso(`¡${j.alias.toUpperCase()} LLEGA ${llegadas.length}.º!`, llegadas.length === 1 ? '#ffd35c' : '#5dffa0', 1.8);
  if (llegadas.length >= Math.min(3, jugadores.size)) terminar(true, 1500);
}
const sabotajes = [];
function sabotaje(j) {
  const contra = j.equipo === 'A' ? 'B' : 'A';
  j.stats.sabotajes++;
  canal.enviar({ t: 'sabotaje', contra, de: j.alias });
  sabotajes.push({ de: j.equipo, vida: 1.2 });
  if (!cfg.oculto) aviso(`¡${j.alias} sabotea a ${EQUIPOS[contra].corto}!`, EQUIPOS[j.equipo].color, 1.2);
}
let terminando = false;
function terminar(gana, espera = 0) {
  if (fase !== 'juego' || terminando) return;
  terminando = true; fase = 'acabando';
  setTimeout(() => { terminando = false; acabar(gana); }, espera);
}

// ─────────────────────────────── EL FINAL: los héroes, el podio o la escuadrilla ganadora
function mejor(l, f, min = () => true) { const c = l.filter(min); return c.length ? c.reduce((a, b) => (f(b) > f(a) ? b : a)) : null; }
function acabar(gana) {
  fase = 'fin'; emitir();
  const l = dentro(), o = orden(), podio = o.slice(0, 3), m = mediasEquipos();
  let html = `<div class="kicker">${esc(MODOS[cfg.modo].estructura)} · ${esc(MODOS[cfg.modo].largo)}</div>`, fin = { t: 'fin', modo: cfg.modo, gana };
  const pd = (j, k) => j ? `<div class="pd p${k}"><img class="av" onerror="if(!this.dataset.r){this.dataset.r=1;setTimeout(()=>{this.src+='?r=1'},400)}" src="${AV(j.avatar)}" alt=""><b>${esc(j.alias)}</b><span>${cfg.modo === 'carrera' ? (j.llega ? 'llega ' + k + '.º' : n1(j.puntos) + ' / ' + meta) : n1(j.puntos) + ' puntos'}</span><div class="caj">${k}</div></div>` : '';
  if (cfg.modo === 'defensa') {
    const H = [
      ['El Muro', 'más enemigos derribados', mejor(l, (j) => j.stats.derribos), (j) => j.stats.derribos + ' derribos'],
      ['Ojo de halcón', 'el más certero respondiendo', mejor(l, (j) => j.stats.aciertos / j.stats.respondidas + j.stats.aciertos * 1e-3, (j) => j.stats.respondidas >= 3), (j) => `${j.stats.aciertos} de ${j.stats.respondidas}`],
      ['El Fantasma', 'más disparos esquivados', mejor(l, (j) => j.stats.esquivas), (j) => j.stats.esquivas + ' esquivas'],
      ['El Ingeniero', 'más escudo reparado', mejor(l, (j) => j.stats.reparado), (j) => '+' + Math.round(j.stats.reparado / 2) + ' de escudo'],
    ];
    html += `<h1>${gana ? '¡La Cero resiste! El destructor ha caído' : escudo <= 0 ? 'El escudo ha caído' : 'El destructor ha escapado'}</h1>
      <p style="font-size:18px">${gana ? 'Ganáis todos.' : 'Perdéis todos. Se puede repetir.'} Escudo: <b style="color:var(--cian)">${Math.round(escudo)} %</b></p>
      <div class="kicker" style="margin-top:12px">Los héroes de la defensa</div>
      <div class="heroes">${H.map(([t, q, j, v]) => j ? `<div class="heroe"><div class="t">${t}</div><img class="av" onerror="if(!this.dataset.r){this.dataset.r=1;setTimeout(()=>{this.src+='?r=1'},400)}" src="${AV(j.avatar)}" alt=""><b>${esc(j.alias)}</b><span>${q}: ${v(j)}</span></div>` : `<div class="heroe"><div class="t">${t}</div><span>${q}: nadie aún</span></div>`).join('')}</div>`;
    fin.heroes = H.filter((h) => h[2]).map(([t, , j]) => ({ t, id: j.id }));
    if (cfg.premio) html += `<div class="premio">${gana ? `<b>+${PREMIO.jugar + PREMIO.ganarClase} ◈</b> para toda la tripulación que ha jugado.` : `<b>+${PREMIO.jugar} ◈</b> por jugar, a todo el mundo.`}</div>`;
    html += '<div class="credito">Platillos y destructor: «Flying saucer», Poly by Google (CC-BY 3.0). Asteroides: NASA. Dron: Quaternius (CC0).</div>';
  } else if (cfg.modo === 'duelo') {
    const g = m.A === m.B ? null : m.A > m.B ? 'A' : 'B';
    fin.equipo = g;
    html += `<h1 style="color:${g ? EQUIPOS[g].color : ''}">${g ? `¡Gana la ${EQUIPOS[g].n}!` : '¡Empate!'}</h1>
      <div class="eqfin">${['A', 'B'].map((k) => { const mi = l.filter((j) => j.equipo === k), b = mejor(mi, (j) => j.puntos); return `<div style="border-color:${EQUIPOS[k].color}"><div class="kicker" style="color:${EQUIPOS[k].color}">${EQUIPOS[k].n}</div><div style="font-family:Orbitron;font-size:26px">${m[k].toFixed(1).replace('.', ',')}</div><small>de media por miembro · ${mi.length} reclutas</small><div class="miembros">${mi.map((j) => `<img class="av" onerror="if(!this.dataset.r){this.dataset.r=1;setTimeout(()=>{this.src+='?r=1'},400)}" src="${AV(j.avatar)}" alt="" title="${esc(j.alias)}">`).join('')}</div>${b ? `<div>Lo mejor de la escuadrilla: <b>${esc(b.alias)}</b> (${n1(b.puntos)})</div>` : ''}</div>`; }).join('')}</div>`;
    if (cfg.premio) html += `<div class="premio"><b>+${PREMIO.jugar} ◈</b> por jugar · <b>+${PREMIO.equipo} ◈</b> más para la escuadrilla ganadora.</div>`;
  } else {
    html += `<h1>${cfg.modo === 'carrera' ? (podio[0] && podio[0].llega ? `¡${esc(podio[0].alias)} llega primero!` : `Tiempo: ${esc(podio[0].alias)} se queda a un paso`) : `¡${esc(podio[0].alias)} gana la caza!`}</h1>
      <div class="podio">${pd(podio[1], 2)}${pd(podio[0], 1)}${pd(podio[2], 3)}</div>`;
    if (cfg.premio) html += `<div class="premio"><b>+${PREMIO.jugar} ◈</b> por jugar · <b>+${PREMIO.podio} ◈</b> más para el podio.</div>`;
  }
  html += `<details class="mas" style="margin-top:10px"><summary>Clasificación completa</summary><div class="todos">${o.map((j, i) => `<span>${i + 1}. ${esc(j.alias)} · ${n1(j.puntos)}</span>`).join('')}</div></details>
    <div class="botones" style="justify-content:center"><button id="b-otra">Otra partida</button></div>`;
  fin.podio = podio.map((j) => j.id); fin.orden = o.map((j) => j.id);
  canal.enviar(fin);
  $('hud').classList.add('oculto');
  $('fin').innerHTML = html; $('fin').classList.remove('oculto');
  $('b-otra').onclick = () => { $('fin').classList.add('oculto'); $('lienzo').classList.add('oculto'); $('lienzo3d').classList.add('oculto'); fase = 'preparar'; $('preparar').classList.remove('oculto'); pintarSala(); emitir(); };
}

// ─────────────────────────────── EL DIBUJO (2D: carrera, caza y duelo)
const lienzo = $('lienzo'), cx = lienzo.getContext('2d');
let W = 0, H = 0;
function ajustar() { const r = Math.min(devicePixelRatio, 2); W = innerWidth; H = innerHeight; lienzo.width = W * r; lienzo.height = H * r; cx.setTransform(r, 0, 0, r, 0, 0); }
addEventListener('resize', ajustar); ajustar();
const fondo = new Image(); fondo.src = 'img/fondo.jpg';
const destino = new Image(); destino.src = 'img/p8_liminar.png';
const estrellas = Array.from({ length: 160 }, () => ({ x: Math.random(), y: Math.random(), v: azar(0.02, 0.1), r: azar(0.5, 1.8) }));
function avatar(j, x, y, R, borde = '#5ff4ff') {
  cx.save(); cx.beginPath(); cx.arc(x, y, R, 0, Math.PI * 2); cx.closePath(); cx.fillStyle = '#0d2236'; cx.fill();
  cx.clip(); if (j.img.complete && j.img.naturalWidth) cx.drawImage(j.img, x - R, y - R, R * 2, R * 2); cx.restore();
  cx.beginPath(); cx.arc(x, y, R, 0, Math.PI * 2); cx.strokeStyle = borde; cx.lineWidth = 3; cx.shadowColor = borde; cx.shadowBlur = 12; cx.stroke(); cx.shadowBlur = 0;
}
function pintarFondo(dt, vel) {
  cx.fillStyle = '#01040c'; cx.fillRect(0, 0, W, H);
  if (fondo.complete) { cx.globalAlpha = 0.45; const k = Math.max(W / fondo.width, H / fondo.height); cx.drawImage(fondo, (W - fondo.width * k) / 2, (H - fondo.height * k) / 2, fondo.width * k, fondo.height * k); cx.globalAlpha = 1; }
  for (const s of estrellas) { s.x -= s.v * dt * vel; if (s.x < 0) s.x += 1; cx.fillStyle = 'rgba(207,233,255,.8)'; cx.fillRect(s.x * W, s.y * H, s.r, s.r); }
}
function pintarCarrera(dt, l, o) {
  pintarFondo(dt, 3);
  const x0 = W * 0.08, x1 = W * 0.8, Dm = Math.min(H * 0.36, W * 0.17);
  if (destino.complete) { cx.save(); cx.shadowColor = '#5ff4ff'; cx.shadowBlur = 40; cx.drawImage(destino, x1 + 10, H / 2 - Dm / 2, Dm, Dm); cx.restore(); }
  cx.strokeStyle = 'rgba(93,255,160,.6)'; cx.setLineDash([8, 8]); cx.lineWidth = 2; cx.beginPath(); cx.moveTo(x1, H * 0.12); cx.lineTo(x1, H * 0.92); cx.stroke(); cx.setLineDash([]);
  const R = Math.max(14, Math.min(26, (H * 0.78) / (l.length * 2.3)));
  for (const j of l) {
    const p = Math.min(1, j.puntos / meta), tx = x0 + p * (x1 - x0), ty = H * 0.14 + j.carril * H * 0.76;
    j.x = j.x ? j.x + (tx - j.x) * Math.min(1, dt * 4) : tx; j.y = ty;
    const g = cx.createLinearGradient(x0, 0, j.x, 0); g.addColorStop(0, 'rgba(95,244,255,0)'); g.addColorStop(1, j.llega ? 'rgba(93,255,160,.8)' : 'rgba(95,244,255,.55)');
    cx.strokeStyle = g; cx.lineWidth = 3; cx.beginPath(); cx.moveTo(x0, j.y); cx.lineTo(j.x - R, j.y); cx.stroke();
    avatar(j, j.x, j.y, R, j.llega ? '#5dffa0' : !cfg.oculto && o.indexOf(j) === 0 ? '#ffd35c' : '#5ff4ff');
    cx.fillStyle = '#e8f6ff'; cx.font = '600 13px "Exo 2"'; cx.textAlign = 'right'; cx.fillText(j.alias, j.x - R - 6, j.y + 4);
  }
  $('meta-t').textContent = llegadas.length ? `Han llegado ${llegadas.length} · meta: ${n1(meta)} puntos` : `Meta: ${n1(meta)} puntos (asteroide +${VALOR.asteroide} · acierto +${VALOR.acierto})`;
  $('meta-b').style.width = Math.min(100, (o[0] ? o[0].puntos : 0) / meta * 100) + '%';
}
// la caza: una carrera de barras (los doce primeros), que se reordenan solas
function pintarCaza(dt, l, o) {
  pintarFondo(dt, 0.6);
  const top = o.slice(0, 12), max = Math.max(20, ...top.map((j) => j.puntos)), x0 = W * 0.2, ancho = W * 0.52, alto = Math.min(46, (H * 0.68) / 12), y0 = H * 0.17;
  top.forEach((j, i) => {
    const ty = y0 + i * alto; j.y = j.y ? j.y + (ty - j.y) * Math.min(1, dt * 6) : ty;
    const w = cfg.oculto ? ancho * 0.5 : Math.max(8, j.puntos / max * ancho);
    const g = cx.createLinearGradient(x0, 0, x0 + w, 0); g.addColorStop(0, 'rgba(26,123,214,.7)'); g.addColorStop(1, i === 0 && !cfg.oculto ? 'rgba(255,211,92,.95)' : 'rgba(95,244,255,.9)');
    cx.fillStyle = g; cx.fillRect(x0, j.y + 6, w, alto - 12);
    avatar(j, x0 - alto * 0.55, j.y + alto / 2, alto * 0.42, i === 0 && !cfg.oculto ? '#ffd35c' : '#5ff4ff');
    cx.fillStyle = '#e8f6ff'; cx.font = `700 ${Math.round(alto * 0.36)}px "Exo 2"`; cx.textAlign = 'right'; cx.fillText(j.alias, x0 - alto * 1.1, j.y + alto * 0.62);
    cx.textAlign = 'left'; cx.font = `800 ${Math.round(alto * 0.36)}px Orbitron`; cx.fillText(cfg.oculto ? '?' : n1(j.puntos), x0 + w + 10, j.y + alto * 0.62);
  });
  const total = l.reduce((a, j) => a + j.puntos, 0);
  $('meta-t').textContent = cfg.oculto ? `Marcador oculto · ${n1(total)} puntos entre todos` : `Platillo dorado +${VALOR.dorado} · acierto +${VALOR.acierto}`;
  $('meta-b').style.width = Math.min(100, (Date.now() - inicio) / (cfg.dur * 10)) + '%';
}
// el duelo: las dos bases y la baliza en medio; los reclutas de cada escuadrilla, junto a su base
function pintarDuelo(dt, l) {
  pintarFondo(dt, 0.4);
  const m = mediasEquipos(), cy = H * 0.52, xa = W * 0.1, xb = W * 0.9;
  baliza = Math.max(-1, Math.min(1, (m.A - m.B) / BALIZA));
  for (const [k, x] of [['A', xa], ['B', xb]]) {
    const c = EQUIPOS[k].color; cx.save(); cx.shadowColor = c; cx.shadowBlur = 30; cx.strokeStyle = c; cx.lineWidth = 6; cx.beginPath(); cx.arc(x, cy, 60, 0, Math.PI * 2); cx.stroke(); cx.restore();
    cx.fillStyle = c; cx.font = '800 20px Orbitron'; cx.textAlign = 'center'; cx.fillText(EQUIPOS[k].corto.toUpperCase(), x, cy + 7);
    cx.font = '700 16px "Exo 2"'; cx.fillText(cfg.oculto ? '? de media' : `${m[k].toFixed(1).replace('.', ',')} de media`, x, cy + 92);
    // la escuadrilla, en rejilla sobre su base (que se vea a cada uno)
    const mi = l.filter((j) => j.equipo === k), col = Math.max(2, Math.ceil(Math.sqrt(mi.length * 1.4))), R = Math.max(14, Math.min(26, (W * 0.3) / (col * 2.6)));
    mi.forEach((j, i) => { const f = Math.floor(i / col), cI = i % col, gx = x + (k === 'A' ? 1 : -1) * (W * 0.1) + (cI - (col - 1) / 2) * R * 2.6, gy = cy - 120 - f * R * 2.7; avatar(j, gx, gy, R, c); cx.fillStyle = '#e8f6ff'; cx.font = '600 12px "Exo 2"'; cx.textAlign = 'center'; cx.fillText(j.alias, gx, gy + R + 13); });
  }
  // el carril y la baliza (va hacia la base rival del equipo que gana: la de Cian empuja hacia la derecha)
  cx.strokeStyle = 'rgba(232,246,255,.25)'; cx.lineWidth = 4; cx.setLineDash([14, 10]); cx.beginPath(); cx.moveTo(xa + 70, cy); cx.lineTo(xb - 70, cy); cx.stroke(); cx.setLineDash([]);
  const bx = W / 2 + baliza * (xb - xa - 140) / 2, t = Date.now() / 300;
  const grad = cx.createRadialGradient(bx, cy, 2, bx, cy, 46); grad.addColorStop(0, '#ffffff'); grad.addColorStop(0.35, baliza >= 0 ? '#5ff4ff' : '#ffc24a'); grad.addColorStop(1, 'rgba(255,77,216,0)');
  cx.fillStyle = grad; cx.beginPath(); cx.arc(bx, cy, 40 + Math.sin(t) * 4, 0, Math.PI * 2); cx.fill();
  for (const s of sabotajes.slice()) { s.vida -= dt; const desde = s.de === 'A' ? xa : xb, hasta = s.de === 'A' ? xb : xa; cx.strokeStyle = `rgba(255,77,216,${s.vida})`; cx.lineWidth = 3; cx.beginPath(); cx.moveTo(desde, cy - 20); for (let i = 1; i <= 8; i++) cx.lineTo(desde + (hasta - desde) * i / 8, cy - 20 + azar(-30, 30)); cx.stroke(); if (s.vida <= 0) sabotajes.splice(sabotajes.indexOf(s), 1); }
  $('meta-t').textContent = cfg.oculto ? 'La baliza lo dice todo' : `Cian ${m.A.toFixed(1).replace('.', ',')} · Ámbar ${m.B.toFixed(1).replace('.', ',')} (media por miembro)`;
  $('meta-b').style.width = (50 + baliza * 50) + '%'; $('meta-b').style.background = EQUIPOS.A.color; $('meta-b').parentElement.style.background = EQUIPOS.B.color;
  if (Math.abs(baliza) >= 1 && fase === 'juego') { aviso(`¡${EQUIPOS[baliza > 0 ? 'A' : 'B'].n.toUpperCase()} METE LA BALIZA!`, EQUIPOS[baliza > 0 ? 'A' : 'B'].color, 2); terminar(true, 1600); }
}

// ─────────────────────────────── LA DEFENSA: oleadas, escudo y destructor
let acumulaEnemigos = 0;
const OLEADAS = [[0, 'roca', 'Oleada 1 · asteroides'], [0.28, 'dron', 'Oleada 2 · drones de la Estática'], [0.5, 'platillo', 'Oleada 3 · escuadrillas'], [0.72, 'jefe', '¡El destructor!']];
function tickDefensa(dt, l) {
  const f = (Date.now() - inicio) / (cfg.dur * 1000), k = INTENSIDAD[cfg.intensidad].k, n = Math.max(1, l.length);
  const ol = OLEADAS.filter((x) => f >= x[0]).pop();
  if (ol[2] !== fraseOleada) { fraseOleada = ol[2]; aviso(ol[2].toUpperCase(), ol[1] === 'jefe' ? '#ff4dd8' : '#ffc24a', 2); }
  if (ol[1] === 'jefe' && !jefeActivo) { jefeActivo = true; D.activarJefe(Math.round(Math.max(40, n * 18 * k))); $('jefe').classList.remove('oculto'); }
  // los enemigos salen al ritmo de la clase: ≈ 0,85 por recluta y segundo (×intensidad); con el destructor, su escolta
  acumulaEnemigos += dt * n * 0.85 * k * (jefeActivo ? 0.4 : 1);
  while (acumulaEnemigos >= 1) { acumulaEnemigos--; const tipo = ol[1] === 'jefe' ? (Math.random() < 0.5 ? 'platillo' : 'dron') : ol[1] === 'platillo' ? (Math.random() < 0.3 ? 'crucero' : 'platillo') : ol[1]; D.enemigo(tipo); }
  // cada derribo de un recluta es un disparo desde su disco (tres por fotograma como mucho, para que se vean)
  for (const j of l) { let k2 = 0; while (j.pendientes > 0 && k2++ < 3) { if (!D.disparo(j.id)) break; j.pendientes--; } j.pendientes = Math.min(j.pendientes, 5); }
  const llegan = D.tick(dt);
  if (llegan) { escudo -= llegan * 2.2 * k; D.ponerEscudo(Math.max(0, escudo) / 100, true); }
  D.ponerEscudo(Math.max(0, escudo) / 100);
  if (jefeActivo) $('jefe-b').style.width = (D.jefeTotal ? D.jefeHp / D.jefeTotal * 100 : 0) + '%';
  $('meta-t').textContent = `Escudo de la Cero · ${Math.max(0, Math.round(escudo))} %  ·  ${fraseOleada}`;
  $('meta-b').style.width = Math.max(0, escudo) + '%'; $('meta').classList.toggle('bajo', escudo < 30);
  if (fase === 'juego' && jefeActivo && D.jefeHp <= 0) { D.jefeCae(); aviso('¡EL DESTRUCTOR CAE!', '#5dffa0', 2.5); terminar(true, 3200); }
  if (fase === 'juego' && escudo <= 0) { D.caeLaCero(); aviso('EL ESCUDO HA CAÍDO', '#ff4d6d', 2.5); terminar(false, 2600); }
}
// lo que el móvil resta o suma al escudo: los golpes que no se esquivan y lo que se repara acertando
const escudoVisto = new Map();
function escudoDeLosMoviles(l) {
  for (const j of l) {
    const v = escudoVisto.get(j.id) || { golpes: 0, reparado: 0 };
    const dg = j.stats.golpes - v.golpes, dr = j.stats.reparado - v.reparado;
    if (dg > 0) { escudo -= dg * 1.5; if (D) D.ponerEscudo(Math.max(0, escudo) / 100, true); }
    if (dr > 0) escudo = Math.min(100, escudo + dr / 2);
    escudoVisto.set(j.id, { golpes: j.stats.golpes, reparado: j.stats.reparado });
  }
}

// ─────────────────────────────── los reclutas de ejemplo juegan solos (como jugaría una clase de verdad)
function tickBots(dt, l) {
  const k = INTENSIDAD[cfg.intensidad].k;
  for (const j of l) {
    if (!j.bot || j.llega) continue;
    if (Math.random() < j.ritmo * dt * k) { j.stats.derribos++; j.pendientes++; j.puntos += VALOR.asteroide; }
    if (cfg.modo === 'caza' && Math.random() < 0.04 * dt * 3) j.puntos += VALOR.dorado;
    if (cfg.preguntas !== 'no' && (j.sigPreg -= dt) <= 0) {
      j.sigPreg = cfg.frecuencia + azar(2, 5); j.stats.respondidas++;
      if (Math.random() < 0.7) {
        j.stats.aciertos++;
        if (cfg.modo === 'defensa') j.stats.reparado += VALOR.reparacion;
        else if (cfg.modo === 'duelo' && cfg.potenciadores && Math.random() < 0.3) sabotaje(j);
        else j.puntos += cfg.modo === 'duelo' ? VALOR.empuje : VALOR.acierto;
      }
    }
    if (cfg.modo === 'defensa' && (j.sigEsq -= dt) <= 0) { j.sigEsq = azar(6, 10) / k; Math.random() < 0.72 ? j.stats.esquivas++ : j.stats.golpes++; }
    comprobarLlegada(j);
  }
}

let antes = performance.now(), ultTop = 0;
function bucle(ahora) {
  requestAnimationFrame(bucle);
  const dt = Math.min(0.05, (ahora - antes) / 1000); antes = ahora;
  if (fase !== 'juego' && fase !== 'acabando') { if (fase === 'fin' && cfg.modo === 'defensa' && D) D.tick(dt); return; }
  const l = dentro(), o = orden();
  if (fase === 'juego') { tickBots(dt, l); if (cfg.modo === 'defensa') escudoDeLosMoviles(l); }
  const rest = Math.max(0, finEn - Date.now());
  $('h-reloj').textContent = `${Math.floor(rest / 60000)}:${String(Math.floor(rest / 1000) % 60).padStart(2, '0')}`;
  $('h-reloj').classList.toggle('poco', rest < 20000);
  if (fase === 'juego' && rest <= 0) terminar(cfg.modo !== 'defensa');
  if (cfg.modo === 'defensa') tickDefensa(dt, l);
  else if (cfg.modo === 'carrera') pintarCarrera(dt, l, o);
  else if (cfg.modo === 'caza') pintarCaza(dt, l, o);
  else pintarDuelo(dt, l);
  if (ahora - ultTop > 400 && !cfg.oculto && cfg.modo !== 'duelo') {
    ultTop = ahora;
    const clave = cfg.modo === 'defensa' ? (j) => j.stats.derribos : (j) => j.puntos;
    const ol = cfg.modo === 'defensa' ? l.slice().sort((a, b) => clave(b) - clave(a)) : o;
    $('top-l').innerHTML = ol.slice(0, 5).map((j, i) => `<li class="${j.llega ? 'llega' : ''}"><span>${i + 1}</span><img class="av" onerror="if(!this.dataset.r){this.dataset.r=1;setTimeout(()=>{this.src+='?r=1'},400)}" src="${AV(j.avatar)}" alt=""><span>${esc(j.alias)}</span><span class="p">${cfg.modo === 'carrera' && j.llega ? 'META' : n1(clave(j))}</span></li>`).join('');
  }
}
requestAnimationFrame(bucle);
// para probar: adelantar el reloj de la partida (como si hubieran pasado «seg» segundos)
window.DIRECTO = { adelantar: (seg) => { inicio -= seg * 1000; finEn -= seg * 1000; }, jugadores, cfg, get fase() { return fase; }, terminar, get escudo() { return escudo; }, set escudo(v) { escudo = v; }, get D() { return D; } };
