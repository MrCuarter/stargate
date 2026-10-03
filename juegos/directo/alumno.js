// EL MODO EN DIRECTO · el móvil del recluta. Toca lo que cae (+1) y, cada poco, contesta una pregunta. Lo que cambia con el
// modo es la META y lo que da acertar:
//   · Defensa (cooperativa): acertar REPARA el escudo común; y a veces te disparan: «¡ESQUIVA!» (toca o desliza a tiempo).
//   · Carrera y Caza (individuales): acertar da +8; en la Caza, los platillos dorados valen +5.
//   · Duelo (por equipos): acertar deja elegir: EMPUJAR la baliza o SABOTEAR a la otra escuadrilla (una tormenta de estática).
// ?sesion=1 → dentro de la sesión: entras solo, con tu alias y tu personaje (en la Nave salen de tu ficha), y la sala de espera
// trae el ticket de salida. Sin ?sesion, la pantalla de «Únete» (desde la Nave, con el código).
import { conectar, esperarMotor, conServidor, motor, PER, preguntasDelServidor, responderAlServidor, imagen, EN_WEB, AV, AVATARES, TEMAS, MODOS, EQUIPOS, VALOR, temasDe, kDe, ponerEquipos, emblema } from './canal.js?v=462150c228';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const azar = (a, b) => a + Math.random() * (b - a);
const QS = new URLSearchParams(location.search);
const EN_SESION = QS.get('sesion') === '1';
// ?solo=asedio → EL ASEDIO (el reto asíncrono entre escuadrones): la Defensa, sola, 2 minutos, contra la nave nodriza.
// No hay proyector: el escudo y el reloj los lleva este mismo móvil, y el daño se entrega a la página del reto.
const SOLO = QS.get('solo') === 'asedio';
const ALIAS_PRUEBA = ['Nova', 'Orion', 'Lyra', 'Vega', 'Atlas', 'Cygnus', 'Electra', 'Mira'];
let yo = { id: 'r' + Math.random().toString(36).slice(2, 8), alias: ALIAS_PRUEBA[Math.floor(Math.random() * ALIAS_PRUEBA.length)], avatar: AVATARES[Math.floor(Math.random() * AVATARES.length)] };
// ?nuevo=1 → otra persona en la misma pestaña (solo para probar: en la web, cada móvil es quien es)
try { const g = QS.get('nuevo') ? null : JSON.parse(sessionStorage.getItem('sgDirecto') || 'null'); if (g) yo = g; } catch (e) { /* nada */ }
if (QS.get('alias')) yo.alias = QS.get('alias').slice(0, 16);
// 🔴 EN LA WEB (con ?per=): eres tu ficha (alias y personaje de la Nave), la sala es la del grupo, las preguntas las da el
// servidor sin la respuesta (y corrige él) y el Asedio lo apunta él. Sin motor (el borrador), todo en local.
if (PER) await esperarMotor();
const WEB = conServidor();
if (WEB) { try { const y = await motor().directoYo(PER); if (y) yo = y; } catch (e) { /* sin ficha: mira, pero no juega */ } }
let canal = null, est = null, jugando = false, pregunta = null, banco = [], sigPreg = 10, sigEsq = 8, tormenta = 0, ultimoFin = null;
// 🔴 en la sesión, se entra en la partida al marcar «Ya he hecho mi ticket» (si ya había empezado, al momento). Fuera de la
// sesión (desde la Nave, con el código) no hay ticket: se entra directamente.
const TICKET = QS.get('ticket') || '', TK = QS.get('tk') || '';
const ticketYaEnviado = () => { try { return !!(TK && localStorage.getItem(TK)); } catch (e) { return false; } };
let listo = !EN_SESION || !TICKET || ticketYaEnviado();
let puntos = 0, stats = null, retoma = null, ultimoEstado = 0;
function aplicarRetoma() {
  if (!retoma) return;
  if (!retoma.nuevo && retoma.puntos > puntos) { puntos = retoma.puntos; for (const k of Object.keys(stats)) stats[k] = Math.max(stats[k], retoma.stats[k] || 0); aviso('¡DE VUELTA!', '#5ff4ff', 1); }
  retoma = null;
}
let miImg = imagen(AV(yo.avatar));
const nuevaStats = () => ({ derribos: 0, aciertos: 0, respondidas: 0, esquivas: 0, golpes: 0, reparado: 0, sabotajes: 0 });
let aviso0 = null;
function aviso(t, color = '#fff', seg = 1.2) { const a = $('aviso'); a.textContent = t; a.style.color = color; a.classList.add('ver'); clearTimeout(aviso0); aviso0 = setTimeout(() => a.classList.remove('ver'), seg * 1000); }
const cfg = () => (est ? est.cfg : {});
const miEquipo = () => (est && est.equipos ? est.equipos[yo.id] : null);

// ─────────────────────────────── ENTRAR (solo fuera de la sesión) y la SALA DE ESPERA
function pintarAvs() { $('avs').innerHTML = AVATARES.map((a, i) => `<button class="${a === yo.avatar ? 'si' : ''}" data-a="${a}" aria-label="Avatar ${i + 1}" aria-pressed="${a === yo.avatar}"><img src="${AV(a)}" alt=""></button>`).join(''); document.querySelectorAll('[data-a]').forEach((b) => { b.onclick = () => { yo.avatar = b.dataset.a; pintarAvs(); }; }); }
async function entrar(codigo) {
  if (!WEB) try { sessionStorage.setItem('sgDirecto', JSON.stringify(yo)); } catch (e) { /* nada */ }
  miImg = imagen(AV(yo.avatar));
  canal = conectar(codigo, alMensaje, { yo });
  if (WEB) { const antes = await canal.mio(); if (antes && antes.listo === true) listo = true; } // volver tras recargar: sin repetir el ticket
  canal.enviar({ t: 'hola', ...yo, listo });
  $('entrar').classList.add('oculto'); $('espera').classList.remove('oculto');
  $('yo').innerHTML = `<img class="av" onerror="if(!this.dataset.r){this.dataset.r=1;setTimeout(()=>{this.src+='?r=1'},400)}" src="${AV(yo.avatar)}" alt=""><b>${esc(yo.alias)}</b><span id="mi-eq"></span>`;
  if (EN_SESION && TICKET && !listo) { $('ticket').classList.remove('oculto'); $('fila-listo').classList.remove('oculto'); }
  // si la pantalla del docente aún no está (o se recarga), se vuelve a saludar
  setInterval(() => { if (!est || !(yo.id in (est.equipos || {}))) canal.enviar({ t: 'hola', ...yo, listo }); }, 1500);
}
if (SOLO) setTimeout(empezarSolo, 0); // tras cargar todo el módulo (el lienzo y las rocas se declaran más abajo)
else if (EN_SESION || WEB) entrar(QS.get('c') || 'NAVE'); // en la web, la sala es la del grupo: sin código
else {
  $('entrar').classList.remove('oculto');
  $('codigo').value = (QS.get('c') || '').toUpperCase(); $('alias').value = yo.alias; pintarAvs();
  $('b-entrar').onclick = () => {
    const c = $('codigo').value.trim().toUpperCase(), a = $('alias').value.trim();
    if (c.length !== 4 || !a) { aviso('Falta el código o tu alias', '#ff4d6d', 1.6); return; }
    yo.alias = a.slice(0, 16); entrar(c);
  };
}
// el ticket de salida: en la web abre el formulario de siempre (anónimo). Aquí se marca como hecho.
// 🔴 el ticket de salida, DENTRO de la sala de espera (nadie se pierde entre pestañas): a la derecha en el ordenador, debajo
// en el móvil. En la web es el formulario anónimo de siempre (SG_TICKET_URL con «&embedded=true»); se sabe que se ha enviado
// porque el marco carga una segunda vez (la página de «respuesta registrada»). Aquí, una copia de ensayo que no envía nada.
// Si el docente lanza con el ticket a medias, el marco se esconde (no se borra): al acabar la partida sigue donde estaba.
let cargasTicket = 0, ticketAbierto = false;
function abrirTicket(abrir = true) {
  $('panel-ticket').classList.toggle('oculto', !abrir); document.querySelector('main').classList.toggle('con-ticket', abrir);
  $('b-ticket').textContent = abrir ? 'Abierto' : $('ticket').classList.contains('hecho') ? 'Hecho' : 'Abrir';
  // (Google sirve sus formularios dentro de otra página con «embedded=true»: sin su cabecera ni su pie)
  if (abrir && !$('marco-t').getAttribute('src')) $('marco-t').src = TICKET + (GOOGLE && !/[?&]embedded=true/.test(TICKET) ? (TICKET.includes('?') ? '&' : '?') + 'embedded=true' : '');
}
const GOOGLE = /docs\.google\.com/.test(TICKET);
$('b-ticket').onclick = () => abrirTicket(true);
$('b-cerrar-t').onclick = () => abrirTicket(false);
// 🔴 27-sep · el ticket de verdad tiene VARIAS PÁGINAS (grupo, comandante y tema → las preguntas del tema → «sobre la clase
// en directo» si la siguió en directo → enviado), y cada página es otra carga del marco: contar cargas no dice si se ha
// enviado (con «> 1», se daba por hecho al pasar de la primera página). Desde fuera no se puede leer el formulario, así
// que: al pasar de página, el botón «Ya he hecho mi ticket» se ilumina y el recluta lo confirma. La copia de ensayo sí
// avisa al enviarse (postMessage), y entonces se marca sola.
$('marco-t').addEventListener('load', () => { if (++cargasTicket > 1 && !listo) { $('b-listo').classList.add('pulso'); $('b-listo').textContent = cargasTicket > 2 ? '2 · Ya lo he enviado: a jugar' : '2 · Ya he hecho mi ticket'; } });
addEventListener('message', (ev) => { if (ev.data && ev.data.sgTicket === 'hecho') ticketHecho(); });
function ticketHecho() { try { if (TK) localStorage.setItem(TK, '1'); } catch (e) { /* nada */ } $('ticket').classList.add('hecho'); $('b-ticket').textContent = 'Hecho'; setTimeout(() => abrirTicket(false), 1400); marcarListo(); }
function marcarListo() {
  if (listo) return;
  listo = true; $('b-listo').textContent = 'Ticket hecho'; $('b-listo').disabled = true;
  if (canal) canal.enviar({ t: 'hola', ...yo, listo: true });
  if (est && est.fase === 'juego' && !jugando) { abrirTicket(false); empezar(); } else pintarEspera();
}
// al confirmarlo tras haber pasado al menos dos páginas del formulario, la Nave de este navegador ya lo da por hecho
$('b-listo').onclick = () => { if (GOOGLE && cargasTicket > 2) try { if (TK) localStorage.setItem(TK, '1'); } catch (e) { /* nada */ } $('b-listo').classList.remove('pulso'); marcarListo(); };

function pintarEspera() {
  if (!est) return;
  const c = cfg(), m = MODOS[c.modo];
  const enJuego = est.fase === 'juego' || est.fase === 'acabando';
  $('espera-t').innerHTML = !listo && enJuego ? '<b style="color:var(--ambar)">¡La partida ya ha empezado!</b> Marca tu ticket y entras.'
    : !listo ? `${est.n} en la sala · haz tu ticket y márcalo`
    : est.fase === 'fin' ? 'Tu comandante prepara otra partida…' : `Ticket hecho · ${est.listos} listos · esperando la salida`;
  $('hoy').classList.remove('oculto');
  if ($('hoy').dataset.k !== c.modo) { $('hoy').dataset.k = c.modo; $('hoy').innerHTML = `<b>Hoy: ${esc(m.largo)}</b><span>${esc(m.breve)}</span><details><summary>Cómo se juega</summary><span>${esc(m.que)}</span></details>`; }
  const e = miEquipo();
  $('mi-eq').innerHTML = c.modo === 'duelo' && e ? `<span class="eqchip" style="background:${EQUIPOS[e].color}">${emblema(e, 24)}${esc(EQUIPOS[e].n)}</span>` : '';
}
function alMensaje(m) {
  if (!m) return;
  if (m.t === 'estado') {
    const antes = est; est = m; ultimoEstado = performance.now(); $('conexion').classList.add('oculto');
    ponerEquipos(m.eqs); // el Duelo: los dos escuadrones invitados que ha elegido la pantalla
    // lo que el Comandante toca en caliente se cuenta aquí también (la dificultad y el reloj llegan con el estado)
    if (jugando && antes && antes.fase === 'juego' && m.fase === 'juego' && !SOLO) {
      const d0 = Number(antes.cfg && antes.cfg.dificultad) || 1, d1 = Number(m.cfg && m.cfg.dificultad) || 1;
      if (d1 > d0 + 0.01) aviso('EL COMANDANTE SUBE LA DIFICULTAD', '#ff4d6d', 1.3); else if (d1 < d0 - 0.01) aviso('EL COMANDANTE BAJA LA DIFICULTAD', '#5dffa0', 1.3);
      if (Math.abs((m.fin || 0) - (antes.fin || 0)) > 10000) aviso(m.fin > antes.fin ? '+20 SEGUNDOS' : '−20 SEGUNDOS', '#ffc24a', 1);
    }
    if (m.fase === 'juego' && !jugando && listo && (!antes || antes.fase !== 'juego' || !ultimoFin)) empezar();
    if (!listo) pintarEspera();
    if (m.fase === 'preparar' && !jugando) { if (!$('fin').classList.contains('oculto') && antes && antes.fase === 'fin') { /* se queda el final hasta que lance */ } pintarEspera(); if (antes && antes.fase !== 'preparar') { $('fin').classList.add('oculto'); $('espera').classList.remove('oculto'); ultimoFin = null; if (ticketAbierto) abrirTicket(true); } }
  }
  if (m.t === 'fin') acabar(m);
  // al volver (o al llegar tarde), la pantalla del docente te devuelve lo que llevabas
  if (m.t === 'retoma' && m.id === yo.id) { retoma = m; if (jugando && stats) aplicarRetoma(); }
  // 🔴 27-sep · el MANDO DEL COMANDANTE: su cañón de plasma limpia la pantalla (sin puntos: no cambia el marcador) y su
  // reparación deja la nave como nueva
  if (m.t === 'bomba' && jugando && !SOLO) {
    for (const r of rocas.splice(0)) sumar(0, r.x, r.y); balas.length = 0; tormenta = 0; $('estatica').classList.add('oculto');
    const d = $('destello'); d.classList.remove('ya'); void d.offsetWidth; d.classList.add('ya');
    aviso('¡CAÑÓN DE PLASMA DEL COMANDANTE!', '#ff4dd8', 1.8); vibrar([40, 30, 120]);
  }
  if (m.t === 'curar' && jugando && !SOLO) {
    nave.vida = 100; nave.repara = 0; nave.flash = 0; pintarCarta();
    aviso(cfg().modo === 'defensa' ? 'EL COMANDANTE HA REPARADO TU NAVE Y EL ESCUDO' : 'EL COMANDANTE HA REPARADO TU NAVE', '#5dffa0', 1.8);
    for (let i = 0; i < 24; i++) { const a = azar(0, 6.3), v = azar(60, 200); chispas.push({ x: nave.x * W, y: H - 120, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vida: azar(0.4, 0.8) }); }
    vibrar(60);
  }
  if (m.t === 'sabotaje' && jugando && m.contra === miEquipo()) { tormenta = 5; $('estatica').classList.remove('oculto'); aviso(`¡SABOTAJE DE ${m.de.toUpperCase()}!`, '#ff4dd8', 1.4); try { navigator.vibrate && navigator.vibrate([60, 40, 60]); } catch (e) { /* nada */ } }
}

// ─────────────────────────────── LA PARTIDA
async function empezar() {
  jugando = true; puntos = 0; stats = nuevaStats(); pregunta = null; tormenta = 0; rocas.length = 0;
  const c = cfg(); sigPreg = c.frecuencia * 0.6; sigEsq = azar(5, 8);
  banco = [];
  const temas = temasDe(c, est.temaSemana); temasJuego = temas;
  if (WEB) banco = await pedirPreguntas(temas);
  if (WEB && SOLO && !ataque) setTimeout(finSolo, 50); // el Asedio no está abierto (o no hay sesión): se dice y ya
  else if (temas.length) try { const { PREGUNTAS } = await import(EN_WEB ? '../ruta/preguntas.js?v=462150c228' : '../ruta-estatica/preguntas.js?v=462150c228'); banco = temas.flatMap((t) => PREGUNTAS[t] || []).filter((q) => q.tipo === 'una' && !q.visual).sort(() => Math.random() - 0.5); } catch (e) { banco = []; }
  document.body.classList.add('juego');
  ticketAbierto = !$('panel-ticket').classList.contains('oculto');
  for (const id of ['espera', 'fin', 'entrar', 'panel-ticket']) $(id).classList.add('oculto'); document.querySelector('main').classList.remove('con-ticket');
  for (const id of ['lienzo', 'hud', 'abajo', 'carta']) $(id).classList.remove('oculto');
  nave.x = nave.obj = 0.5; nave.vida = 100; nave.repara = 0; laseres.length = 0; balas.length = 0;
  $('carta-img').src = AV(yo.avatar); $('carta-alias').textContent = yo.alias; pintarCarta();
  $('h-2t').textContent = { defensa: 'Escudo', carrera: 'Puesto', caza: 'Puesto', duelo: 'Escuadrilla' }[c.modo];
  $('abajo').className = c.modo === 'defensa' ? 'escudo' : '';
  aviso(retoma && retoma.nuevo ? '¡DENTRO! LA PARTIDA YA HABÍA EMPEZADO' : '¡YA!', '#5dffa0', 1.4);
  aplicarRetoma();
}
setInterval(() => { if (jugando && canal) canal.enviar({ t: 'pts', id: yo.id, puntos, stats }); }, 500);
function sumar(n, x, y, color = '93,255,160') { puntos += n; for (let i = 0; i < 10; i++) { const a = azar(0, 6.3), v = azar(80, 240); chispas.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vida: azar(0.3, 0.6) }); } if (n) flotan.push({ x, y, t: '+' + n, vida: 0.8, color }); }

// en la web: una tanda de preguntas del servidor (cada una se contesta una vez; al acabarse, se pide otra tanda)
let temasJuego = [], pidiendo = false;
async function pedirPreguntas(temas) {
  if (!temas.length && !SOLO) return [];
  if (SOLO) { // el Asedio: el ataque lo abre el servidor (y con él, sus preguntas)
    try { const r = await motor().llamar('stargateAsedio', { accion: 'empezar', projectId: PER }); ataque = r.ataque; return (r.preguntas || []).map((q) => ({ ...q, srv: 'asedio' })); }
    catch (e) { ataque = null; asedioError = (e && e.message) || 'El Asedio no está abierto.'; return []; }
  }
  const r = await preguntasDelServidor(temas, 20);
  return r ? r.preguntas.map((q) => ({ ...q, srv: 'ruta', partida: r.partida })) : [];
}
let ataque = null, asedioError = '';
function lanzarPregunta() {
  const q = banco.shift();
  if (!q) { if (WEB && !SOLO && !pidiendo && jugando) { pidiendo = true; pedirPreguntas(temasJuego).then((l) => { banco = l; pidiendo = false; }); } return; }
  if (!WEB) banco.push(q);
  // cuatro opciones como mucho, con la buena. En la web vienen ya barajadas (y sin decir cuál es): comprueba el servidor.
  let ops = q.opciones.map((_, i) => i);
  if (!WEB) {
    ops = ops.sort(() => Math.random() - 0.5).slice(0, 4);
    if (!ops.includes(q.correctas[0])) ops[0] = q.correctas[0];
    ops = ops.sort(() => Math.random() - 0.5);
  }
  pregunta = q;
  const c = cfg(), premio = { defensa: `reparas el escudo de la Cero`, duelo: c.potenciadores ? 'empujas la baliza o saboteas' : `empujas la baliza (+${VALOR.empuje})`, carrera: `+${VALOR.acierto}`, caza: `+${VALOR.acierto}` }[c.modo];
  $('preg-c').innerHTML = `<div class="kicker">Pregunta · si aciertas, ${premio}</div><div class="enun">${esc(q.enunciado)}</div><div class="ops">${ops.map((i) => `<button data-i="${i}">${esc(q.opciones[i])}</button>`).join('')}</div><div class="res" id="preg-r"></div>`;
  $('preg').classList.remove('oculto');
  document.querySelectorAll('#preg [data-i]').forEach((b) => { b.onclick = async () => {
    if (pregunta !== q) return;
    pregunta = 'respondida';
    let ok, correccion = q.correccion;
    if (WEB) {
      b.classList.add('pensando');
      const i = Number(b.dataset.i);
      const r = q.srv === 'asedio'
        ? await motor().llamar('stargateAsedio', { accion: 'responder', ataque, qid: q.id, pos: i }).catch(() => ({ ok: false }))
        : await responderAlServidor(q.partida, q.id, i);
      b.classList.remove('pensando');
      ok = !!(r && r.ok); correccion = r && r.correccion;
      if (!jugando) return;
    } else ok = Number(b.dataset.i) === q.correctas[0];
    stats.respondidas++; if (ok) stats.aciertos++;
    b.classList.add(ok ? 'bien' : 'mal');
    if (!ok && !WEB) document.querySelector(`#preg [data-i="${q.correctas[0]}"]`).classList.add('bien');
    $('preg-r').textContent = ok ? '¡Correcto!' : (correccion || 'No era esa.');
    setTimeout(() => {
      if (!ok) { $('preg').classList.add('oculto'); pregunta = null; return; }
      if (c.modo === 'duelo' && c.potenciadores) return elegir();
      $('preg').classList.add('oculto'); pregunta = null;
      if (c.modo === 'defensa') { stats.reparado += VALOR.reparacion; if (SOLO) est.escudo = Math.min(100, est.escudo + VALOR.reparacion / 2); aviso('¡ESCUDO REPARADO!', '#5ff4ff', 1); sumar(0, W / 2, H / 2); }
      else { const v = c.modo === 'duelo' ? VALOR.empuje : VALOR.acierto; for (const r of rocas.splice(0)) sumar(0, r.x, r.y); sumar(v, W / 2, H / 2); aviso(`¡PULSO! +${v}`, '#5dffa0', 1); }
    }, ok ? 650 : 1800);
  }; });
}
// el duelo: tras acertar, tú decides
function elegir() {
  $('preg-c').innerHTML = `<div class="kicker">¡Correcto! ¿Qué hace tu escuadrilla?</div><div class="eleccion"><button id="e-emp">EMPUJAR<small>+${VALOR.empuje} a la baliza</small></button><button id="e-sab" class="sab">SABOTEAR<small>tormenta a la otra escuadrilla</small></button></div>`;
  $('e-emp').onclick = () => { $('preg').classList.add('oculto'); pregunta = null; sumar(VALOR.empuje, W / 2, H / 2); aviso(`¡EMPUJÓN! +${VALOR.empuje}`, EQUIPOS[miEquipo() || 'A'].color, 1); };
  $('e-sab').onclick = () => { $('preg').classList.add('oculto'); pregunta = null; stats.sabotajes++; canal.enviar({ t: 'sabotaje', id: yo.id }); aviso('¡SABOTAJE ENVIADO!', '#ff4dd8', 1); };
}
// ── LA NAVE (la de la Ruta, vista desde atrás) abajo: sigue tu dedo, el ratón o las flechas, y dispara sola.
// Tu personaje va en una esquina, con su barra de vida. La Estática dispara a tu nave: se esquiva moviéndose.
const naveImg = imagen('img/nave.png');
const nave = { x: 0.5, obj: 0.5, vida: 100, repara: 0, flash: 0, cad: 0 };
const laseres = [], balas = [];
// el daño de lo que te da, con la dificultad que haya puesto el Comandante (la intensidad ya cuenta en la velocidad)
const dano = () => Number(cfg().dificultad) || 1;
function vibrar(p) { try { navigator.vibrate && navigator.vibrate(p); } catch (e) { /* nada */ } }
function pintarCarta() {
  $('carta-vida').style.width = Math.max(0, nave.vida) + '%';
  $('carta').classList.toggle('baja', nave.vida < 35); $('carta').classList.toggle('repara', nave.repara > 0);
  $('carta-est').textContent = nave.repara > 0 ? 'Reparando…' : Math.round(nave.vida) + ' %';
}
function golpe(n, motivo) {
  if (nave.repara > 0 || !jugando) return;
  nave.vida -= n; nave.flash = 0.3; stats.golpes++; if (SOLO) golpeSolo(n / 2.5); vibrar(120);
  if (nave.vida <= 0) { nave.vida = 0; nave.repara = 3; aviso('¡NAVE DAÑADA! REPARANDO…', '#ff4d6d', 1.6); }
  else aviso(motivo, '#ff4d6d', 0.8);
  pintarCarta();
}
// un disparo de la Estática, apuntado a donde está tu nave ahora (si te mueves, lo esquivas)
function dispararEstatica() {
  const desde = rocas.filter((r) => r.tipo !== 'roca' && r.y > 20 && r.y < H * 0.5);
  const o = desde.length ? desde[Math.floor(Math.random() * desde.length)] : { x: azar(40, W - 40), y: 10 };
  const tx = nave.x * W, ty = H - 120, d = Math.hypot(tx - o.x, ty - o.y) || 1, v = 250 * kDe(cfg());
  balas.push({ x: o.x, y: o.y, vx: (tx - o.x) / d * v, vy: (ty - o.y) / d * v });
}

function acabar(m) {
  jugando = false; ultimoFin = m; document.body.classList.remove('juego');
  for (const id of ['preg', 'lienzo', 'hud', 'abajo', 'carta', 'estatica']) $(id).classList.add('oculto');
  const pos = (m.orden || []).indexOf(yo.id) + 1, e = miEquipo();
  let tit, sub = '';
  if (m.modo === 'defensa') {
    tit = m.gana ? '¡La Cero resiste!' : 'Esta vez ganó la Estática';
    const h = (m.heroes || []).filter((x) => x.id === yo.id).map((x) => x.t);
    sub = h.length ? `<p style="text-align:center;font-size:18px;color:var(--ambar)">Eres ${h.join(' y ')} de la defensa</p>` : '';
    sub += `<p style="text-align:center">Has derribado <b>${stats.derribos}</b>, esquivado <b>${stats.esquivas}</b> y acertado <b>${stats.aciertos}</b> de ${stats.respondidas}.</p>`;
  } else if (m.modo === 'duelo') {
    tit = !m.equipo ? '¡Empate!' : m.equipo === e ? `¡Gana tu escuadrón, ${esc(EQUIPOS[e].n)}!` : `Victoria de ${esc(EQUIPOS[m.equipo].n)}`;
    sub = `<p style="text-align:center">${e ? emblema(e, 56) + '<br>' : ''}Has aportado <b>${puntos}</b> puntos a ${e ? esc(EQUIPOS[e].n) : 'tu escuadrón'}${stats.sabotajes ? ` y ${stats.sabotajes} sabotaje${stats.sabotajes > 1 ? 's' : ''}` : ''}.</p>`;
  } else {
    tit = pos && pos <= 3 ? `¡Podio! Puesto ${pos}` : `Puesto ${pos}`;
    sub = `<p style="text-align:center;font-size:17px">Has sumado <b style="color:var(--ambar)">${puntos}</b> puntos.</p>`;
  }
  $('fin').innerHTML = `<div class="yo"><img class="av" onerror="if(!this.dataset.r){this.dataset.r=1;setTimeout(()=>{this.src+='?r=1'},400)}" src="${AV(yo.avatar)}" alt=""><b>${esc(yo.alias)}</b></div><h1 style="text-align:center">${tit}</h1>${sub}<p class="nota" style="text-align:center">Mira la pantalla de tu comandante.</p>${!EN_SESION || !TICKET || $('ticket').classList.contains('hecho') ? '' : '<div class="botones" style="justify-content:center"><button class="sec" id="b-ticket2">Tu ticket de salida</button></div>'}`;
  $('fin').classList.remove('oculto');
  if ($('b-ticket2')) $('b-ticket2').onclick = () => abrirTicket(true);
}

// ─────────────────────────────── el dibujo y el toque
const lienzo = $('lienzo'), cx = lienzo.getContext('2d');
let W = 0, H = 0;
function ajustar() { const r = Math.min(devicePixelRatio, 2); W = innerWidth; H = innerHeight; lienzo.width = W * r; lienzo.height = H * r; cx.setTransform(r, 0, 0, r, 0, 0); }
addEventListener('resize', ajustar); ajustar();
const rocas = [], chispas = [], flotan = [], disparos = [];
const estrellas = Array.from({ length: 90 }, () => ({ x: Math.random(), y: Math.random(), v: azar(0.05, 0.25) }));
// 🔴 27-sep · LOS ASTEROIDES DE LA NASA (Norberto: «los asteroides son muy cutres, ¿no teníamos cuerpos de la NASA?»). Los
// mismos seis de la Defensa 3D y de la Ruta (Golevka, Toutatis, Kleopatra, Geographos, Mithra y 1998 HW1; NASA 3D
// Resources, dominio público), renderizados a una lámina de 12 sprites de 128 px con su luz y el borde magenta de la
// Estática: img/asteroides.png. Así el móvil no carga three.js ni los modelos. Si la lámina no llega, la roca dibujada.
const LAMINA = imagen('img/asteroides.png'), MARCOS = 12;
// qué cae, según el modo: en la defensa, lo que manda la Estática; en la caza, alguno dorado
// (la velocidad se guarda SIN la dificultad: se aplica al moverse, así lo que ya cae también nota el cambio del Comandante)
function nuevaRoca() {
  const c = cfg();
  let tipo = 'roca';
  if (c.modo === 'defensa') { const ini = est.inicio || (est.fin - c.dur * 1000), f = (Date.now() - ini) / Math.max(1, est.fin - ini); tipo = f < 0.28 ? 'roca' : f < 0.5 ? (Math.random() < 0.6 ? 'dron' : 'roca') : (Math.random() < 0.6 ? 'platillo' : 'dron'); }
  if (c.modo === 'caza' && Math.random() < 0.07) tipo = 'dorado';
  return { tipo, x: azar(30, W - 30), y: -30, vy: azar(70, 150) * (tipo === 'dorado' ? 1.7 : 1), marco: Math.floor(Math.random() * MARCOS), vx: azar(-25, 25) * (tipo === 'dron' ? 3 : 1), r: tipo === 'roca' ? azar(20, 34) : 24, rot: azar(0, 6), vr: azar(-1.2, 1.2), forma: Array.from({ length: 9 }, () => azar(0.72, 1.12)), color: `hsl(${azar(18, 38)},${azar(20, 40)}%,${azar(35, 52)}%)` };
}
function dibujar(r) {
  cx.save(); cx.translate(r.x, r.y);
  if (r.tipo === 'roca' && LAMINA.complete && LAMINA.naturalWidth) {
    // el sprite ocupa ≈ el 94 % de su casilla: un poco más grande que el radio de choque, que se vea entero
    const t = LAMINA.naturalHeight, lado = r.r * 2.35; cx.rotate(r.rot); cx.drawImage(LAMINA, r.marco * t, 0, t, t, -lado / 2, -lado / 2, lado, lado);
  } else if (r.tipo === 'roca') {
    cx.rotate(r.rot); cx.beginPath(); r.forma.forEach((k, i) => { const a = i / r.forma.length * Math.PI * 2; cx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r.r * k, Math.sin(a) * r.r * k); }); cx.closePath();
    const g = cx.createRadialGradient(-r.r * 0.3, -r.r * 0.3, 1, 0, 0, r.r * 1.2); g.addColorStop(0, '#d9c3a8'); g.addColorStop(0.5, r.color); g.addColorStop(1, '#241a14');
    cx.fillStyle = g; cx.fill(); cx.strokeStyle = 'rgba(255,77,216,.4)'; cx.lineWidth = 1.5; cx.stroke();
  } else if (r.tipo === 'dron') {
    cx.rotate(Math.sin(r.rot) * 0.4); cx.shadowColor = '#ff4dd8'; cx.shadowBlur = 16; cx.fillStyle = '#3a0f3a'; cx.strokeStyle = '#ff4dd8'; cx.lineWidth = 3;
    cx.beginPath(); cx.moveTo(0, -22); cx.lineTo(20, 0); cx.lineTo(0, 22); cx.lineTo(-20, 0); cx.closePath(); cx.fill(); cx.stroke();
    cx.fillStyle = '#ff4dd8'; cx.beginPath(); cx.arc(0, 0, 6, 0, Math.PI * 2); cx.fill();
  } else { // platillo (y el dorado de la caza)
    const oro = r.tipo === 'dorado', c1 = oro ? '#ffd35c' : '#b04dff';
    cx.shadowColor = c1; cx.shadowBlur = oro ? 24 : 14;
    cx.fillStyle = oro ? '#7a5a10' : '#2a1040'; cx.beginPath(); cx.ellipse(0, 4, 28, 10, 0, 0, Math.PI * 2); cx.fill(); cx.strokeStyle = c1; cx.lineWidth = 3; cx.stroke();
    cx.fillStyle = oro ? 'rgba(255,211,92,.7)' : 'rgba(95,244,255,.55)'; cx.beginPath(); cx.ellipse(0, -2, 13, 11, 0, Math.PI, 0); cx.fill();
    for (let i = -2; i <= 2; i++) { cx.fillStyle = Math.sin(r.rot * 6 + i) > 0 ? c1 : '#fff'; cx.fillRect(i * 10 - 2, 6, 4, 3); }
  }
  cx.restore();
}
let sigRoca = 0, tocando = false;
// 🔴 27-sep · Norberto: «no se mueve la nave con el ratón». El lienzo está DEBAJO de <main> (fijo y a pantalla completa,
// aunque sus cajas estén ocultas), así que el ratón y el dedo nunca le llegaban: solo iban las flechas. Se escucha en la
// ventana entera: el ratón (o el lápiz) mueve la nave con solo pasar; el dedo, al tocar y arrastrar. Con una pregunta en
// pantalla no se mueve (los toques son para las respuestas).
const moverA = (ev) => { if (jugando && !pregunta) nave.obj = Math.min(0.95, Math.max(0.05, ev.clientX / W)); };
addEventListener('pointerdown', (ev) => { if (!jugando || pregunta) return; tocando = true; moverA(ev); });
addEventListener('pointermove', (ev) => { if (tocando || ev.pointerType !== 'touch') moverA(ev); });
addEventListener('pointerup', () => { tocando = false; }); addEventListener('pointercancel', () => { tocando = false; });
const teclas = {};
addEventListener('keydown', (ev) => { teclas[ev.key] = true; }); addEventListener('keyup', (ev) => { teclas[ev.key] = false; });

let antes = performance.now();
function bucle(ahora) {
  requestAnimationFrame(bucle);
  const dt = Math.min(0.05, (ahora - antes) / 1000); antes = ahora;
  if (!jugando) return;
  const c = cfg();
  tormenta = Math.max(0, tormenta - dt);
  if (ultimoEstado && ahora - ultimoEstado > 3000) $('conexion').classList.remove('oculto'); if (!tormenta) $('estatica').classList.add('oculto');
  if (banco.length && !pregunta && (sigPreg -= dt) <= 0) { sigPreg = c.frecuencia; lanzarPregunta(); }
  const kI = kDe(c);
  if (!pregunta && (sigEsq -= dt) <= 0) { sigEsq = (c.modo === 'defensa' ? azar(2.2, 4) : azar(5, 8)) / kI; dispararEstatica(); }
  if (!pregunta && (sigRoca -= dt) <= 0) { rocas.push(nuevaRoca()); sigRoca = azar(0.35, 0.8) / (tormenta ? 1.6 : 1); }
  cx.fillStyle = '#01040c'; cx.fillRect(0, 0, W, H);
  for (const s of estrellas) { s.y += s.v * dt; if (s.y > 1) s.y -= 1; cx.fillStyle = 'rgba(207,233,255,.7)'; cx.fillRect(s.x * W, s.y * H, 1.5, 1.5); }
  for (const r of rocas.slice()) {
    if (!pregunta) { const t = (tormenta ? 1.8 : 1) * kI; r.y += r.vy * dt * t; r.x += r.vx * dt * t + (tormenta ? azar(-3, 3) : 0); r.rot += r.vr * dt; if (r.x < 20 || r.x > W - 20) r.vx *= -1; }
    if (r.y > H + 40) { rocas.splice(rocas.indexOf(r), 1); if (SOLO && r.tipo !== 'roca') golpeSolo(3); continue; }
    dibujar(r);
  }
  // LA NAVE: se mueve hacia donde apuntas y dispara sola (salvo si está reparándose o hay una pregunta en pantalla)
  if (teclas.ArrowLeft) nave.obj = Math.max(0.05, nave.obj - dt * 0.9); if (teclas.ArrowRight) nave.obj = Math.min(0.95, nave.obj + dt * 0.9);
  if (!pregunta) nave.x += (nave.obj - nave.x) * Math.min(1, dt * 9);
  const NW = Math.min(118, W * 0.3), NH = NW * 230 / 504, nx = nave.x * W, ny = H - 120;
  nave.repara = Math.max(0, nave.repara - dt); if (nave.repara === 0 && nave.vida === 0) { nave.vida = 100; aviso('¡REPARADA!', '#5dffa0', 0.8); } pintarCarta();
  nave.flash = Math.max(0, nave.flash - dt); nave.cad -= dt;
  if (!pregunta && nave.repara === 0 && nave.cad <= 0) { nave.cad = 0.17; laseres.push({ x: nx - NW * 0.12, y: ny - NH * 0.3 }, { x: nx + NW * 0.12, y: ny - NH * 0.3 }); }
  const e = miEquipo();
  for (const l of laseres.slice()) {
    l.y -= 900 * dt; let dio = null;
    for (const r of rocas) if (Math.abs(r.x - l.x) < r.r + 4 && Math.abs(r.y - l.y) < r.r + 8) { dio = r; break; }
    if (dio) { rocas.splice(rocas.indexOf(dio), 1); laseres.splice(laseres.indexOf(l), 1); stats.derribos++; sumar(dio.tipo === 'dorado' ? VALOR.dorado : VALOR.asteroide, dio.x, dio.y, dio.tipo === 'dorado' ? '255,211,92' : '93,255,160'); vibrar(8); continue; }
    if (l.y < -20) { laseres.splice(laseres.indexOf(l), 1); continue; }
    cx.strokeStyle = c.modo === 'duelo' && e ? EQUIPOS[e].color : '#7dffb0'; cx.lineWidth = 3; cx.shadowColor = cx.strokeStyle; cx.shadowBlur = 8; cx.beginPath(); cx.moveTo(l.x, l.y); cx.lineTo(l.x, l.y + 16); cx.stroke(); cx.shadowBlur = 0;
  }
  // los disparos de la Estática: si pasan de largo, esquivado; si te dan, pierdes vida
  for (const b of balas.slice()) {
    if (!pregunta) { b.x += b.vx * dt; b.y += b.vy * dt; }
    if (Math.abs(b.x - nx) < NW * 0.38 && Math.abs(b.y - ny) < NH * 0.45) { balas.splice(balas.indexOf(b), 1); golpe(20 * dano(), '¡IMPACTO!'); continue; }
    if (b.y > ny + NH) { balas.splice(balas.indexOf(b), 1); if (nave.repara === 0) { stats.esquivas++; flotan.push({ x: b.x, y: ny - 40, t: 'esquivado', vida: 0.8, color: '95,244,255' }); } continue; }
    cx.fillStyle = '#ff3d6b'; cx.shadowColor = '#ff3d6b'; cx.shadowBlur = 14; cx.beginPath(); cx.arc(b.x, b.y, 7, 0, Math.PI * 2); cx.fill(); cx.shadowBlur = 0;
  }
  // chocar con lo que cae también hace daño (y lo rompe, sin puntos)
  for (const r of rocas.slice()) if (Math.abs(r.x - nx) < r.r * 0.8 + NW * 0.35 && Math.abs(r.y - ny) < r.r * 0.8 + NH * 0.4) { rocas.splice(rocas.indexOf(r), 1); sumar(0, r.x, r.y); golpe(12 * dano(), '¡CHOQUE!'); }
  cx.save(); cx.globalAlpha = nave.repara > 0 ? 0.35 + 0.25 * Math.sin(ahora / 80) : 1;
  if (naveImg.complete && naveImg.naturalWidth) cx.drawImage(naveImg, nx - NW / 2, ny - NH / 2, NW, NH);
  if (nave.flash > 0) { cx.globalCompositeOperation = 'lighter'; cx.fillStyle = `rgba(255,61,107,${nave.flash})`; cx.beginPath(); cx.ellipse(nx, ny, NW * 0.5, NH * 0.6, 0, 0, Math.PI * 2); cx.fill(); }
  cx.restore();
  // la llama de los motores
  if (nave.repara === 0) { cx.fillStyle = `rgba(95,244,255,${0.5 + Math.random() * 0.4})`; for (const dx of [-0.2, 0.2]) { cx.beginPath(); cx.arc(nx + dx * NW, ny + NH * 0.45, 5 + Math.random() * 3, 0, Math.PI * 2); cx.fill(); } }
  for (const s of chispas.slice()) { s.vida -= dt; s.x += s.vx * dt; s.y += s.vy * dt; cx.fillStyle = `rgba(255,179,71,${Math.max(0, s.vida * 2)})`; cx.fillRect(s.x, s.y, 3, 3); if (s.vida <= 0) chispas.splice(chispas.indexOf(s), 1); }
  for (const f of flotan.slice()) { f.vida -= dt; f.y -= 50 * dt; cx.fillStyle = `rgba(${f.color},${Math.max(0, f.vida)})`; cx.font = '800 20px Orbitron'; cx.textAlign = 'center'; cx.fillText(f.t, f.x, f.y); if (f.vida <= 0) flotan.splice(flotan.indexOf(f), 1); }
  // el marcador, según el modo (y nada de puestos si el docente lo ha ocultado)
  $('h-pts').textContent = puntos;
  const rest = Math.max(0, est.fin - Date.now());
  if (SOLO && (rest <= 0 || est.escudo <= 0)) { finSolo(); return; }
  $('h-t').textContent = `${Math.floor(rest / 60000)}:${String(Math.floor(rest / 1000) % 60).padStart(2, '0')}`;
  const pos = est.orden.indexOf(yo.id) + 1;
  if (c.modo === 'defensa') {
    $('h-2').textContent = est.escudo + ' %';
    $('abajo-t').textContent = est.jefe ? `El destructor: ${Math.round(est.jefe.hp / Math.max(1, est.jefe.total) * 100)} % · el escudo, de todos` : `Escudo de la Cero · ${est.escudo} % · lo defendéis entre todos`;
    $('abajo-b').style.width = est.escudo + '%';
  } else if (c.modo === 'duelo') {
    $('h-2').textContent = e ? EQUIPOS[e].corto : '–'; $('h-2').style.color = e ? EQUIPOS[e].color : '';
    $('abajo-t').textContent = c.oculto ? 'La baliza: mira la pantalla' : `La baliza: ${est.baliza > 0.05 ? 'va ganando ' + EQUIPOS.A.n : est.baliza < -0.05 ? 'va ganando ' + EQUIPOS.B.n : 'en el centro'}`;
    $('abajo-b').style.width = (50 + est.baliza * 50) + '%';
  } else {
    $('h-2').textContent = c.oculto ? '?' : pos ? pos + '.º' : '–';
    if (c.modo === 'carrera') { $('abajo-t').textContent = `Tu viaje a ${TEMAS[Math.min(8, est.temaSemana + 1)]}: ${Math.min(puntos, est.meta)} de ${est.meta}`; $('abajo-b').style.width = Math.min(100, puntos / est.meta * 100) + '%'; }
    else { $('abajo-t').textContent = 'Los platillos dorados valen +5'; $('abajo-b').style.width = Math.min(100, (1 - rest / (c.dur * 1000)) * 100) + '%'; }
  }
}
requestAnimationFrame(bucle);

// ─────────────────────────────── EL ASEDIO en solitario
// El daño a la nodriza: cada derribo 1, cada acierto 8 (saber cuenta), cada esquiva 2; y el escudo que te queda, de propina.
export const danoDe = (st, escudo) => st.derribos + st.aciertos * 8 + st.esquivas * 2 + Math.round(Math.max(0, escudo) / 10);
function empezarSolo() {
  listo = true;
  est = { fase: 'juego', cfg: { modo: 'defensa', dur: 120, preguntas: 'vistos', frecuencia: 12, intensidad: 'normal', potenciadores: true, oculto: false },
    temaSemana: Number(QS.get('tema')) || 6, fin: Date.now() + 120000, escudo: 100, orden: [yo.id], equipos: {}, jefe: null, n: 1 };
  empezar();
}
function golpeSolo(n) { est.escudo = Math.max(0, est.escudo - n); }
async function finSolo() {
  if (!jugando) return;
  let dano = danoDe(stats, est.escudo), extra = '';
  if (WEB) { // lo apunta el servidor (y lo recalcula él con los aciertos que ha visto)
    jugando = false;
    try { const r = await motor().llamar('stargateAsedio', { accion: 'terminar', ataque, derribos: stats.derribos, esquivas: stats.esquivas, escudo: Math.round(est.escudo) });
      dano = r.dano; if (r.mejorHoy > dano) extra = `<p style="text-align:center">Hoy cuenta tu mejor ataque: <b>${r.mejorHoy}</b></p>`; }
    catch (e) { extra = `<p style="text-align:center;color:#ff4d6d">${esc(ataque ? 'No se ha podido apuntar el ataque. Prueba otra vez.' : asedioError || 'El Asedio no está abierto.')}</p>`; }
  }
  jugando = false; document.body.classList.remove('juego');
  for (const id of ['preg', 'lienzo', 'hud', 'abajo', 'carta', 'estatica']) $(id).classList.add('oculto');
  $('fin').innerHTML = `<div class="kicker" style="text-align:center">El Asedio · tu ataque</div><h1 style="text-align:center">${est.escudo > 0 ? 'Ataque completado' : 'Tu escudo ha caído'}</h1>
    <div style="font-family:Orbitron;font-size:44px;color:var(--ambar);text-align:center">${dano}<small style="display:block;font-family:'Exo 2';font-size:15px;color:#e8f6ff">de daño a la nodriza</small></div>
    ${extra}<p style="text-align:center">${stats.derribos} derribos · ${stats.aciertos} de ${stats.respondidas} aciertos · ${stats.esquivas} esquivas · escudo ${Math.round(est.escudo)} %</p>`;
  $('fin').classList.remove('oculto');
  try { parent.postMessage({ sgAsedio: { dano, stats } }, '*'); } catch (e) { /* nada */ }
}
window.ALUMNO = { get puntos() { return puntos; }, get stats() { return stats; }, sumar: (n) => { puntos += n; if (stats) stats.derribos += n; }, get est() { return est; }, nave };
