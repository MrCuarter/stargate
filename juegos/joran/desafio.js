// EL MODO DESAFÍO de la sala de Joran (borrador) · reutilizable por cualquier máquina.
// Como en Gimkit: el juego es el mismo, pero lo que te deja seguir jugando es un DEPÓSITO (energía, combustible,
// refrigeración…) que se gasta con el tiempo y solo se rellena ACERTANDO preguntas del curso. Mientras contestas, el juego
// está en pausa: pensar no cuesta tiempo de partida.
// 🔴 Las preguntas NO dan puntos directos ni créditos (la sala no premia repetir preguntas: ver JUEGOS en comun.js). Lo que
// sí hay es un bonus al final (hasta +25 % de la marca, según la precisión), para que el desafío compense y adivinar no.
//
// Uso en una máquina (el patrón completo está en conquista.js):
//   import { crearDesafio } from './desafio.js?v=462150c228';
//   const DES = crearDesafio({ nombre: 'Combustible', alPausar: (si) => { if (!si) soltarTeclas(); } });
//   al empezar: await DES.preparar(); DES.empezar();   ·   en el bucle: if (!DES.abierto) tick(dt) … y dentro, DES.tick(dt)
//   al terminar: DES.parar(); puntos += DES.bonus(puntos); filas: [...filas, ...DES.filas(bonus)], extra: DES.extra()
// En modo arcade (sin ?modo=desafio) crearDesafio devuelve un objeto inerte: las mismas llamadas no hacen nada.
import { $, QS, WEB, motor, esc, SON, tono, audio, aviso } from './comun.js?v=462150c228';

// 30-sep · EL MODO ACADEMIA (?banco=academia): las preguntas son las de un planeta de la Academia de la Cero, y las pasa la
// página que abre el juego (academia.js → window.SG_BANCO_JUEGO). Norberto: «¡usa los minijuegos para preguntar! Las preguntas que
// fallen se vuelven a lanzar; cuando acierten todas… una ventana: Enhorabuena, has acertado todas, puedes seguir jugando o pasar
// al siguiente módulo». Siempre en desafío, sin el botón para cambiar a arcade.
export const ACADEMIA = QS.get('banco') === 'academia';
export const MODO = QS.get('modo') === 'desafio' || ACADEMIA ? 'desafio' : 'arcade';
if (ACADEMIA) { const st = document.createElement('style'); st.textContent = 'a[href="#sin-modo"]{display:none!important}'; document.head.appendChild(st); }
// 🔴 3-oct · EN LA ACADEMIA NO SE MUERE. Norberto, jugando a La Evacuación en la Academia: «estaría bien que los docentes de esta
// academia tuvieran más vidas; el juego como tal ahora mismo nos da igual, solo queremos que lo vean, pero un docente "torpe" puede
// quedarse atascado y tirar la toalla. Haz que no se pueda morir». Cada máquina lo mira en su golpe: el golpe se nota (sonido,
// aviso, empujón), pero no quita vidas ni acaba la partida, y el reloj no la cierra. En la sala de Joran del alumnado, igual que siempre.
export const SIN_MORIR = ACADEMIA;
const AVISO_SIN_MORIR = '¡AUCH! EN LA ACADEMIA NO SE PIERDE';
export function avisoSinMorir(color = '#ff4dd8') { aviso(AVISO_SIN_MORIR, color, 1.3); }
const PER = QS.get('per') || '';
const LETRAS = ['A', 'B', 'C', 'D'];
// los temas del curso (el 0, el de la asignatura, se queda fuera: son normas, no contenidos)
const TEMAS = [1, 2, 3, 4, 5, 6, 7, 8];

// la URL de esta máquina en el otro modo (conserva ?per=, ?embed=…): para el botón de la portada de cada juego
export function urlModo(modo) {
  if (ACADEMIA) return '#sin-modo';
  const q = new URLSearchParams(location.search);
  if (modo === 'desafio') q.set('modo', 'desafio'); else q.delete('modo');
  const s = q.toString(); return location.pathname.split('/').pop() + (s ? '?' + s : '');
}

const barajar = (xs) => { for (let i = xs.length - 1; i > 0; i--) { const k = Math.floor(Math.random() * (i + 1)); [xs[i], xs[k]] = [xs[k], xs[i]]; } return xs; };

// ── DE DÓNDE SALEN LAS PREGUNTAS
// En la web, el servidor (stargateRuta, misión «libre»): llegan SIN la respuesta y cada una la corrige él. Así nadie
// puede sacar las soluciones del código de la página.
async function fuenteServidor() {
  const m = motor(); let cola = [];
  async function tanda() {
    const r = await m.llamar('stargateRuta', { accion: 'empezar', projectId: PER, mision: 'libre', temas: TEMAS, n: 20 });
    if (!r || !r.preguntas || !r.preguntas.length) throw new Error('El servidor no ha dado preguntas');
    cola = r.preguntas.map((q) => ({ id: q.id, enunciado: q.enunciado, opciones: q.opciones, partida: r.partida }));
  }
  await tanda();
  return {
    async siguiente() { if (!cola.length) await tanda(); return cola.shift(); },
    async responder(q, pos) {
      try { const r = await m.llamar('stargateRuta', { accion: 'responder', partida: q.partida, qid: q.id, pos }); return { ok: !!(r && r.ok), correccion: (r && r.correccion) || '' }; }
      catch (e) { return { ok: false, correccion: '', error: true }; }
    },
  };
}
// En el borrador, el banco local de la Ruta (solo existe en local: está en .gitignore). Aquí sí se sabe la buena, así que se
// barajan las opciones y se marca la correcta al fallar.
async function fuenteLocal() {
  const ruta = location.pathname.includes('/juegos/') ? '../ruta/preguntas.js?v=462150c228' : '../ruta-estatica/preguntas.js?v=462150c228';
  const { PREGUNTAS } = await import(ruta);
  const todas = TEMAS.flatMap((t) => PREGUNTAS[t] || [])
    .filter((q) => q.tipo === 'una' && !q.visual && Array.isArray(q.correctas) && q.correctas.length === 1 && q.opciones && q.opciones.length >= 2);
  if (!todas.length) throw new Error('Banco vacío');
  let cola = [];
  return {
    async siguiente() {
      if (!cola.length) cola = barajar(todas.slice());
      const q = cola.pop(), orden = barajar(q.opciones.map((_, i) => i));
      return { id: q.id, enunciado: q.enunciado, opciones: orden.map((i) => q.opciones[i]), buena: orden.indexOf(q.correctas[0]), correccion: q.correccion || '' };
    },
    async responder(q, pos) { return { ok: pos === q.buena, correccion: q.correccion, buena: q.buena }; },
  };
}

// En la Academia: las preguntas de su planeta (públicas: van en la página, con la buena marcada). La que se falla vuelve a la
// cola, detrás de las demás; cuando no queda ninguna pendiente, «todas» (y se avisa a la Academia).
function bancoAcademia() {
  let lista = null;
  try { lista = window.parent && window.parent !== window && window.parent.SG_BANCO_JUEGO; } catch (e) { lista = null; }
  if (!lista) try { lista = JSON.parse(sessionStorage.getItem('sgBancoJuego') || 'null'); } catch (e) { lista = null; }
  return Array.isArray(lista) ? lista.filter((x) => x && x.p && Array.isArray(x.o) && x.o.length >= 2) : [];
}
async function fuenteAcademia() {
  const todas = bancoAcademia().map((x, i) => ({ id: 'a' + i, p: x.p, o: x.o, ok: Number(x.ok) || 0, porque: x.porque || '' }));
  if (!todas.length) throw new Error('La Academia no ha pasado preguntas');
  const cola = barajar(todas.slice()), pendientes = new Set(todas.map((x) => x.id));
  return {
    total: todas.length,
    pendientes: () => pendientes.size,
    async siguiente() {
      const x = cola.shift(); cola.push(x);   // (la que se acierta sale de la cola al responder; la que se falla, vuelve detrás)
      const orden = barajar(x.o.map((_, i) => i));
      return { id: x.id, enunciado: x.p, opciones: orden.map((i) => x.o[i]), buena: orden.indexOf(x.ok), correccion: x.porque };
    },
    async responder(q, pos) {
      const ok = pos === q.buena;
      if (ok) { pendientes.delete(q.id); const k = cola.findIndex((x) => x.id === q.id); if (k >= 0) cola.splice(k, 1); }
      return { ok, correccion: q.correccion, buena: q.buena, vuelve: !ok };
    },
  };
}
function avisarAcademia(que) {
  const m = Object.assign({ tanda: QS.get('tanda') || '' }, que);
  try { if (window.parent && window.parent !== window) window.parent.postMessage({ sgAcademia: m }, location.origin); } catch (e) { /* sin marco */ }
}

const INERTE = {
  activo: false, disponible: false, abierto: false, nivel: 100,
  preparar: async () => false, empezar() {}, tick() {}, pedir() {}, parar() {},
  bonus: () => 0, filas: () => [], extra: () => ({}), texto: () => '',
};

// op: nombre (lo que se gasta), segundos (lo que dura el depósito lleno), recarga (lo que da cada acierto, sobre 100),
// hud (dónde va la barra; por defecto, dentro de #hud), alPausar(si) (el juego se para o sigue: al seguir, soltar teclas),
// enJuego() (false si el juego está en su propia pausa: entonces ni se gasta ni se abre la pregunta con Q)
export function crearDesafio(op = {}) {
  if (MODO !== 'desafio') return INERTE;
  const cfg = Object.assign({ nombre: 'Energía', segundos: 40, recarga: 40, hud: null, alPausar: () => {}, enJuego: () => true }, op);
  if (ACADEMIA) cfg.segundos = Math.min(cfg.segundos, 25);   // (en la Academia, las preguntas llegan antes)
  let fuente = null, cargando = null, q = null, forzada = false, avisado = false, todasDichas = false;
  const D = { activo: true, disponible: false, abierto: false, corriendo: false, nivel: 100, aciertos: 0, fallos: 0, racha: 0 };

  // la barra del depósito y el botón para recargar cuando quieras (Q), sin esperar a quedarte a cero
  const hud = document.createElement('div'); hud.className = 'des-hud oculto';
  hud.innerHTML = `<div class="des-cab"><small>${esc(cfg.nombre)}</small><button type="button" class="des-recargar">Recargar <kbd>Q</kbd></button></div><div class="barra des-barra"><i></i></div>`;
  (cfg.hud || $('hud') || document.body).appendChild(hud);
  const barra = hud.querySelector('.des-barra'), relleno = barra.querySelector('i');
  hud.querySelector('.des-recargar').addEventListener('click', () => D.pedir());
  // el panel de la pregunta: propio (no el #pantalla del juego), para que la pausa del juego no lo pise
  const panel = document.createElement('div'); panel.className = 'des-panel oculto';
  panel.innerHTML = '<div class="caja des-caja" role="dialog" aria-modal="true" aria-live="polite"></div>';
  document.body.appendChild(panel);
  const caja = panel.firstElementChild;

  function pintarBarra() {
    relleno.style.width = Math.max(0, D.nivel) + '%';
    barra.classList.toggle('peligro', D.nivel < 25);
  }
  async function cargar() {
    if (fuente) return true;
    if (!cargando) cargando = (async () => {
      if (ACADEMIA) { try { return await fuenteAcademia(); } catch (e) { console.warn('Desafío sin las preguntas de la Academia:', e && e.message); return null; } }
      if (WEB) { try { return await fuenteServidor(); } catch (e) { console.warn('Desafío sin servidor:', e && e.message); } }
      try { return await fuenteLocal(); } catch (e) { console.warn('Desafío sin banco local:', e && e.message); return null; }
    })();
    fuente = await cargando; D.disponible = !!fuente; return D.disponible;
  }
  function pintarPregunta() {
    const cab = ACADEMIA ? `Academia · ${fuente.total - fuente.pendientes()} de ${fuente.total} acertadas${forzada ? ` · ¡${esc(cfg.nombre)} a cero!` : ''}`
      : `Desafío · ${forzada ? `¡${esc(cfg.nombre)} a cero!` : 'recarga'} · acierta para seguir`;
    caja.innerHTML = `<div class="kicker">${cab}</div>
      <div class="des-enun">${esc(q.enunciado)}</div>
      <div class="des-ops">${q.opciones.map((o, i) => `<button type="button" data-op="${i}"><b>${LETRAS[i] || i + 1}</b><span>${esc(o)}</span></button>`).join('')}</div>
      <div class="des-pie"><span>Aciertos: <b>${D.aciertos}</b> · Fallos: <b>${D.fallos}</b></span><span class="des-tecla">Teclas 1-4 o A-D</span></div>`;
    caja.querySelectorAll('[data-op]').forEach((b) => { b.onclick = () => responder(Number(b.dataset.op)); });
  }
  async function nueva() {
    q = null;
    caja.innerHTML = '<div class="kicker">Desafío</div><p>Buscando una pregunta…</p>';
    try { q = await fuente.siguiente(); }
    catch (e) { // sin preguntas a mitad de partida: no se castiga a nadie, se sigue en arcade
      D.disponible = false; D.nivel = 100; pintarBarra(); hud.classList.add('oculto'); cerrar();
      aviso('Sin preguntas: sigues en arcade', '#ffc24a', 2); return;
    }
    pintarPregunta();
  }
  let contestando = false;
  async function responder(pos) {
    if (!q || contestando || q.hecha) return; contestando = true;
    caja.querySelectorAll('[data-op]').forEach((b) => { b.disabled = true; });
    const r = await fuente.responder(q, pos); q.hecha = true; contestando = false;
    const bs = caja.querySelectorAll('[data-op]');
    let msg;
    if (r.error) { D.nivel = Math.min(100, D.nivel + cfg.recarga); msg = 'Sin conexión con el servidor: esta no cuenta, pero te recargo para que sigas.'; }
    else if (r.ok) {
      D.aciertos++; D.racha++;
      // la racha de tres: un empujón extra (lo que en Gimkit sería el multiplicador)
      const extra = D.racha % 3 === 0 ? 20 : 0;
      D.nivel = Math.min(100, D.nivel + cfg.recarga + extra); bs[pos].classList.add('bien'); SON.bien();
      msg = `<b class="des-ok">¡Correcto!</b> +${cfg.recarga + extra} % de ${esc(cfg.nombre.toLowerCase())}${extra ? ' (racha de tres)' : ''}.`;
    } else {
      D.fallos++; D.racha = 0; bs[pos].classList.add('mal'); if (r.buena != null && bs[r.buena]) bs[r.buena].classList.add('bien');
      tono(220, 110, 0.25, 'sawtooth', 0.05);
      msg = `<b class="des-mal">No es esa.</b> El depósito no se recarga.${r.vuelve ? ' Esta pregunta volverá a salir.' : ''}`;
    }
    // 🔴 la Academia: acertadas todas, la enhorabuena (y el aviso a la página, que ya da la sesión por superada)
    if (ACADEMIA && r.ok && !todasDichas && fuente.pendientes() === 0) {
      todasDichas = true; pintarBarra();
      avisarAcademia({ todas: true, aciertos: D.aciertos, fallos: D.fallos });
      caja.innerHTML = `<div class="kicker">Academia · ${fuente.total} de ${fuente.total}</div>
        <div class="des-enun des-enhora">Enhorabuena, has acertado todas</div>
        <p>Puedes seguir jugando o pasar al siguiente módulo.</p>
        <div class="botones"><button type="button" class="sec" id="des-seguir">Seguir jugando</button><button type="button" id="des-sig">Pasar al siguiente módulo</button></div>`;
      $('des-sig').focus({ preventScroll: true });
      $('des-seguir').onclick = () => { D.disponible = false; D.nivel = 100; hud.classList.add('oculto'); cerrar(); };
      $('des-sig').onclick = () => { avisarAcademia({ siguiente: true }); if (window.parent === window) location.href = '../../academia.html?v=462150c228'; };
      return;
    }
    avisado = D.nivel >= 25 ? false : avisado; pintarBarra();
    const otra = D.nivel <= 0;
    caja.insertAdjacentHTML('beforeend', `<div class="des-corr">${msg}${r.correccion ? `<p>${esc(r.correccion)}</p>` : ''}</div>
      <div class="botones"><button type="button" id="des-seguir">${otra ? 'Otra pregunta' : 'Seguir jugando'}</button></div>`);
    const b = $('des-seguir'); b.focus({ preventScroll: true });
    b.onclick = () => { if (D.nivel <= 0) nueva(); else cerrar(); };
  }
  function abrir(porCero) {
    if (D.abierto || !D.disponible) return;
    forzada = porCero; D.abierto = true; cfg.alPausar(true); panel.classList.remove('oculto'); nueva();
  }
  function cerrar() { if (!D.abierto) return; D.abierto = false; panel.classList.add('oculto'); q = null; cfg.alPausar(false); }
  addEventListener('keydown', (ev) => {
    if (!D.corriendo) return;
    if (D.abierto) {
      const k = ev.code, n = /^Digit[1-4]$/.test(k) ? Number(k[5]) - 1 : /^Numpad[1-4]$/.test(k) ? Number(k[6]) - 1 : ['KeyA', 'KeyB', 'KeyC', 'KeyD'].indexOf(k);
      if (q && !q.hecha && n >= 0 && n < q.opciones.length) { ev.preventDefault(); responder(n); }
      else if (q && q.hecha && (k === 'Enter' || k === 'Space')) { ev.preventDefault(); $('des-seguir') && $('des-seguir').click(); }
      ev.stopImmediatePropagation(); // con la pregunta abierta, el juego no oye el teclado
    } else if (ev.code === 'KeyQ') D.pedir();
  }, true);

  return Object.assign(D, {
    preparar: cargar,
    empezar() { D.nivel = 100; D.aciertos = 0; D.fallos = 0; D.racha = 0; avisado = false; D.corriendo = true; hud.classList.toggle('oculto', !D.disponible); pintarBarra(); },
    // devuelve nada: si el depósito llega a cero, abre la pregunta y avisa al juego (alPausar) para que se pare
    tick(dt) {
      if (!D.corriendo || !D.disponible || D.abierto || !cfg.enJuego()) return;
      D.nivel -= (100 / cfg.segundos) * dt;
      if (D.nivel < 25 && !avisado) { avisado = true; audio(); SON.alarma(); aviso(`¡${cfg.nombre.toUpperCase()} BAJO! Pulsa Q`, '#ffc24a', 1.4); }
      if (D.nivel <= 0) { D.nivel = 0; pintarBarra(); abrir(true); return; }
      pintarBarra();
    },
    pedir() {
      if (!D.corriendo || !D.disponible || D.abierto || !cfg.enJuego()) return;
      if (D.nivel >= 99 && !ACADEMIA) { aviso('El depósito ya está lleno', '#5ff4ff', 1); return; }
      abrir(false);
    },
    parar() { D.corriendo = false; if (D.abierto) { D.abierto = false; panel.classList.add('oculto'); q = null; } hud.classList.add('oculto'); },
    // el bonus del final: hasta +25 % de la marca, en proporción a la precisión (adivinar a ciegas da ~6 %)
    bonus(puntos) { const t = D.aciertos + D.fallos; return t ? Math.round(puntos * 0.25 * D.aciertos / t) : 0; },
    filas(bonus = 0) { const t = D.aciertos + D.fallos; return D.disponible ? [['Preguntas acertadas', `${D.aciertos}/${t}`], ['Bonus de desafío', `+${Math.round(bonus).toLocaleString('es-ES')}`]] : []; },
    extra() { return { modo: 'desafio', aciertos: D.aciertos, fallos: D.fallos }; },
    // el párrafo de la portada del juego
    texto() {
      if (ACADEMIA) return `<p class="des-intro"><b>Las preguntas de este planeta van dentro del juego.</b> Tu ${esc(cfg.nombre.toLowerCase())} se gasta y se recarga acertando. La que falles <b>vuelve a salir</b> más tarde. Cuando las aciertes todas, sesión superada: puedes seguir jugando o pasar al siguiente módulo. Si no quieres esperar, pulsa <kbd>Q</kbd> y te pregunta ya.</p><p class="des-intro"><b>Aquí no puedes perder:</b> en la Academia tienes vidas ilimitadas, para que nadie se quede atascado. Tu alumnado, en la sala de Joran, sí las tendrá limitadas.</p>`;
      return `<p class="des-intro"><b>Modo desafío.</b> Tu ${esc(cfg.nombre.toLowerCase())} se gasta con el tiempo (dura unos ${cfg.segundos} s). Si llega a cero, el juego se para y solo sigues <b>acertando una pregunta del curso</b> (+${cfg.recarga} %; cada tres seguidas, +20 % más). Puedes recargar antes cuando quieras con <kbd>Q</kbd> o el botón. Mientras contestas, el reloj no corre. Al final, <b>hasta +25 %</b> de puntos según tu precisión.</p>`;
    },
  });
}
