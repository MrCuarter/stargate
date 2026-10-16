/**
 * GAMIFICAPRO · LA PÁGINA «ESTADÍSTICAS» (13-oct-2026) — pieza del motor para cualquier mod.
 *
 * Norberto: «Quiero poder acceder a este panel dentro de la web. Yo, desde mi cuenta, debo tener un botón de Estadísticas y desde
 * allí poder ver la info total de todo STARGATE, filtrar por grupos, escuadrones, rango de fechas, retos…». Era el panel de
 * actividad (un artefacto de claude.ai que regeneraba la guardia del buzón); ahora vive en cada web, con filtros y a cualquier
 * hora. Las cifras las da el servidor (`modEstadisticas`, functions/modEstadisticas.js): el navegador no lee fichas de nadie.
 * Y (13-oct) «las horas pico coinciden con una clase en directo: comprueba si son de un escuadrón concreto, para llevar un track
 * de cuándo tienen clase los profesores; siempre tienen 2 horarios que se alternan cada semana» → la pestaña «Horarios».
 *
 * Cada web la copia en su build (assets/js/estadisticas.js, con `guardas.copiar_pieza`) y NO se edita allí: aquí. Necesita
 * también sdk/tarjetas.js en la página (las tarjetas iguales y el «Leer más…» en ventana). Sin textos ni colores de ningún mod:
 * la piel, en variables `--gpe-*` (abajo, en CSS); el nombre del mod y de sus equipos los da el servidor.
 *
 *   GP.estadisticas.puedo(llamar, mod)              → Promise<boolean>: ¿enseño el botón «Estadísticas»? (lo decide el servidor)
 *   var E = GP.estadisticas.crear({ raiz, llamar, mod, enlaceVolver })
 *   E.cargar()                                      → pide las cifras con los filtros de ahora y pinta
 *   E.estado                                        → { pestana, grupo, equipo, reto, desde, hasta }
 *
 *   Puras (para las pruebas): csvDe(pestana, datos), textoFranja(f, husos), semanaTipo(horarios), opcionesDeFiltro(datos, estado),
 *   peticionDe(estado, mod), aCSV(filas).
 *
 * Solo cifras: lo que llega del servidor no lleva correos, ni nombres del alumnado, ni uids (del buzón, el alias).
 */
(function (raiz, fabrica) {
  var hecho = fabrica();
  if (typeof module === "object" && module.exports) module.exports = hecho;
  if (raiz) { raiz.GP = raiz.GP || {}; if (!raiz.GP.estadisticas) raiz.GP.estadisticas = hecho; }
})(typeof window !== "undefined" ? window : null, function () {
  var DIAS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
  var PESTANAS = [["resumen", "Resumen"], ["curso", "Curso"], ["equipos", "Equipos"], ["retos", "Retos"], ["horas", "Horas"], ["horarios", "Horarios"], ["buzon", "Buzón"], ["origen", "Origen"]];
  var PATRON = { A: "semanas impares (A)", B: "semanas pares (B)", todas: "todas las semanas", una: "vista 1 vez" };
  var NIVEL = { bien: "Va bien", ojo: "Ojo", mal: "Falla" };
  var COLORES = ["var(--gpe-barra)", "var(--gpe-barra2)", "var(--gpe-barra3)", "var(--gpe-barra4)", "var(--gpe-barra5)"];
  // iconos propios (trazo, del color del texto): nada de emojis
  var ICONO = {
    descargar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11m0 0-4-4m4 4 4-4M5 19h14"/></svg>',
    actualizar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v5h-5"/></svg>',
    volver: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
  };

  // ───────────────────────────── utilidades ─────────────────────────────
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function n(x) { return x == null ? "—" : Number(x).toLocaleString("es-ES"); }
  function hh(h) { return (h < 10 ? "0" : "") + (h % 24) + ":00"; }
  function hora(t) { return t ? new Date(t).toLocaleString("es-ES", { timeZone: "Europe/Madrid", weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"; }
  function fechaCorta(d) { var p = String(d).split("-"); return Number(p[2]) + "/" + Number(p[1]); }
  function fechaLarga(d) { return new Date(d + "T12:00:00Z").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }); }
  function suma(a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i] || 0; return s; }
  function hoyMadrid() { return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(new Date()); }
  function masDias(d, k) { var t = Date.parse(d + "T12:00:00Z") + k * 864e5; return new Date(t).toISOString().slice(0, 10); }

  /** Una franja en palabras: «martes 19:00–21:00 · semanas impares (A) · 12:00 en Colombia…». */
  function textoFranja(f, husos) {
    var s = DIAS[f.dow] + " " + hh(f.desde) + "–" + hh(f.hasta);
    if (f.local) s += " (" + (f.local.dow !== f.dow ? DIAS[f.local.dow] + " " : "") + hh(f.local.desde) + "–" + hh(f.local.hasta) + " en " + ((husos && husos[f.local.huso]) || f.local.huso) + ")";
    return s;
  }
  /** La semana tipo: por día, las franjas de todos los equipos, por hora. → [[{ desde, hasta, nombre, patron, i }] × 7] */
  function semanaTipo(horarios) {
    var dias = [[], [], [], [], [], [], []];
    (horarios || []).forEach(function (h, i) {
      (h.franjas || []).forEach(function (f) { dias[f.dow].push({ desde: f.desde, hasta: f.hasta, nombre: h.nombre, grupo: h.grupoNombre, patron: f.patron, i: i }); });
    });
    dias.forEach(function (d) { d.sort(function (a, b) { return a.desde - b.desde || a.nombre.localeCompare(b.nombre); }); });
    return dias;
  }
  /** Las opciones de los filtros: los equipos y retos de los grupos elegidos (sin repetir). */
  function opcionesDeFiltro(datos, estado) {
    var gs = ((datos && datos.opciones && datos.opciones.grupos) || []).filter(function (g) { return estado.grupo === "*" || g.id === estado.grupo; });
    var varios = gs.length > 1, eq = {}, equipos = [], retos = [];
    gs.forEach(function (g) {
      g.equipos.forEach(function (e) { if (!eq[e.id]) { eq[e.id] = 1; equipos.push({ id: e.id, nombre: e.nombre + (varios ? " · " + g.nombre : "") }); } });
      g.retos.forEach(function (r) { retos.push({ id: r.id, nombre: (r.codigo ? r.codigo + " · " : "") + r.titulo + (varios ? " · " + g.nombre : "") }); });
    });
    equipos.sort(function (a, b) { return a.nombre.localeCompare(b.nombre); });
    return { grupos: (datos && datos.opciones && datos.opciones.grupos) || [], equipos: equipos, retos: retos };
  }
  /** Lo que se pide al servidor con el estado de los filtros. */
  function peticionDe(estado, mod) {
    var p = { mod: mod };
    if (estado.grupo && estado.grupo !== "*") p.grupos = [estado.grupo];
    if (estado.equipo && estado.equipo !== "*") p.equipos = [estado.equipo];
    if (estado.reto && estado.reto !== "*") p.retos = [estado.reto];
    if (estado.desde) p.desde = estado.desde;
    if (estado.hasta) p.hasta = estado.hasta;
    return p;
  }
  /** Una tabla → CSV con `;` (lo que abre bien una hoja de cálculo en español) y comillas si hace falta. */
  function aCSV(filas) {
    return filas.map(function (f) {
      return f.map(function (x) { var s = x == null ? "" : String(x); return /[;"\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(";");
    }).join("\r\n");
  }
  /** El CSV de lo que se ve en una pestaña (con los filtros puestos): solo cifras y nombres de grupos, equipos y docentes. */
  function csvDe(pestana, D) {
    var s = D.serie, eq = D.equipo || "Equipo", filas;
    if (pestana === "resumen" || pestana === "curso") {
      filas = [["Día", "Alistados (acumulado)", "Alistados", "Con actividad", "Conectados", "Retos registrados", "XP", "Llamadas a filas"]];
      s.dias.forEach(function (d, i) { filas.push([d, s.alistados[i], s.nuevos[i], s.activos[i], s.conectados[i], s.retos[i], s.xp[i], s.llamadas[i]]); });
    } else if (pestana === "equipos") {
      filas = [["Grupo", eq, "Docente", "Alumnado", "Con actividad", "% con actividad", "Retos", "XP", "Conectados"]];
      D.grupos.forEach(function (g) { g.equipos.forEach(function (e) { filas.push([g.nombre, e.nombre, e.docente, e.alumnos, e.activos, e.pctActivos, e.retos, e.xp, e.conectados]); }); });
    } else if (pestana === "retos") {
      filas = [["Grupo", "Código", "Reto", "Semana", "Obligatorio", "Abierto", "Lo han registrado", "%"]];
      D.grupos.forEach(function (g) { g.retos.forEach(function (r) { filas.push([g.nombre, r.codigo, r.titulo, r.semana, r.obligatorio ? "sí" : "no", r.abierto ? "sí" : "no", r.hechos, r.pct]); }); });
    } else if (pestana === "horas") {
      filas = [["Día"].concat(Array.from({ length: 24 }, function (_, h) { return hh(h); }))];
      D.horas.forEach(function (f, d) { filas.push([DIAS[d]].concat(f)); });
    } else if (pestana === "horarios") {
      filas = [["Día", "Grupo", eq, "Docente", "Desde", "Hasta", "Semana del curso", "Acciones", "% del grupo", "Llamada a filas"]];
      D.clases.forEach(function (c) { filas.push([c.dia, c.grupoNombre, c.equipoNombre, c.docente, hh(c.desde), hh(c.hasta), c.semana, c.acciones, c.cuota, c.llamada ? "sí" : "no"]); });
    } else if (pestana === "origen") {
      // 16-oct · solo cifras (pieza `origen`): por rango de edad y por país, nunca por persona
      var O = D.origen || { edades: {}, paises: {}, etiquetas: [] }, tot = O.total || 0, por = function (v) { return tot ? Math.round(v / tot * 100) : 0; };
      filas = [["Rango de edad", "Personas", "%"]];
      (O.etiquetas || []).forEach(function (e) { filas.push([e[1], O.edades[e[0]] || 0, por(O.edades[e[0]] || 0)]); });
      filas.push([], ["País", "Personas", "%"]);
      paisesDe(O).forEach(function (x) { filas.push([x.nombre, x.n, por(x.n)]); });
      filas.push([], ["Sin decirlo todavía", O.sinDatos == null ? "" : O.sinDatos, ""]);
    } else {
      filas = [["Semana del", "Recibidos", "Resueltos", "Abiertos", "Al coordinador", "1.ª respuesta (mediana, h)"]];
      D.buzon.semanas.forEach(function (w) { filas.push([w.lunes, w.recibidos, w.resueltos, w.abiertos, w.paraCoordinador, w.primeraRespuestaH]); });
    }
    return aCSV(filas);
  }

  // ───────────────────────────── el estilo (piel: --gpe-*) ─────────────────────────────
  var CSS = [
    ".gpe{--gpe-panel:var(--gpe-p,#fff);display:grid;gap:16px;min-width:0;color:var(--gpe-tinta,#15191f);font-variant-numeric:tabular-nums;",
    "--gpe-barra:var(--gpe-b1,#2a78d6);--gpe-barra2:var(--gpe-b2,#eb6834);--gpe-barra3:var(--gpe-b3,#1baf7a);--gpe-barra4:var(--gpe-b4,#9b59d0);--gpe-barra5:var(--gpe-b5,#d6a72a)}",
    ".gpe *{box-sizing:border-box}",
    ".gpe h1{font:700 clamp(22px,4.4vw,30px)/1.15 var(--gpe-titulo,system-ui,sans-serif);margin:0;overflow-wrap:anywhere}",
    ".gpe h2{font:650 17px/1.25 var(--gpe-titulo,system-ui,sans-serif);margin:0 0 10px;overflow-wrap:anywhere}",
    ".gpe .gpe-sub{color:var(--gpe-tinta3,#6b7482);font-size:13px;margin:0}",
    ".gpe-cab{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px 16px;align-items:end}",
    "@media (max-width:560px){.gpe-cab{grid-template-columns:minmax(0,1fr)}}",
    ".gpe-acciones{display:grid;grid-template-columns:repeat(2,minmax(0,auto));gap:8px}",
    ".gpe-b{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:40px;padding:8px 14px;border-radius:9px;font-weight:600;font-size:14px;line-height:1.2;cursor:pointer;",
    "border:1px solid var(--gpe-borde,#e1e5ea);background:var(--gpe-panel);color:inherit;text-decoration:none;min-width:0;white-space:nowrap}",
    ".gpe-b svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;flex:none}",
    ".gpe-b[disabled]{opacity:.55;cursor:default}",
    ".gpe-b.gpe-on{background:var(--gpe-acento-suave,#e6edfc);color:var(--gpe-acento,#2a5bd7);border-color:var(--gpe-acento,#2a5bd7)}",
    ".gpe-filtros{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,170px),1fr));gap:10px;background:var(--gpe-panel);border:1px solid var(--gpe-borde,#e1e5ea);border-radius:12px;padding:12px}",
    ".gpe-filtros label{display:grid;gap:4px;font-size:12.5px;color:var(--gpe-tinta3,#6b7482);min-width:0}",
    ".gpe select,.gpe input{font:inherit;font-size:14px;color:var(--gpe-tinta,#15191f);background:var(--gpe-fondo-campo,var(--gpe-panel));border:1px solid var(--gpe-borde,#e1e5ea);",
    "border-radius:8px;min-height:40px;padding:6px 8px;width:100%;min-width:0;max-width:100%}",
    "@media (max-width:560px){.gpe-filtros{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;padding:10px}.gpe-filtros label:first-child{grid-column:1/-1}}",
    ".gpe-rapidos{grid-column:1/-1;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}",
    ".gpe-rapidos .gpe-b{padding:6px 4px;font-size:13px;white-space:normal}",
    ".gpe-pestanas{display:grid;grid-template-columns:repeat(var(--gpe-np,7),minmax(0,1fr));gap:4px;background:var(--gpe-panel);border:1px solid var(--gpe-borde,#e1e5ea);border-radius:12px;padding:4px}",
    "@media (max-width:640px){.gpe-pestanas{grid-template-columns:repeat(4,minmax(0,1fr))}}",
    ".gpe-pestanas button{font-family:inherit;font-weight:600;font-size:clamp(12px,3.3vw,14px);line-height:1.15;min-height:40px;padding:4px 2px;border:0;border-radius:8px;background:transparent;color:var(--gpe-tinta2,#4a5361);cursor:pointer;min-width:0;overflow-wrap:anywhere}",
    ".gpe-pestanas button[aria-selected=true]{background:var(--gpe-acento-suave,#e6edfc);color:var(--gpe-acento,#2a5bd7)}",
    ".gpe button:focus-visible,.gpe select:focus-visible,.gpe input:focus-visible,.gpe summary:focus-visible{outline:2px solid var(--gpe-acento,#2a5bd7);outline-offset:2px}",
    ".gpe-cuerpo{display:grid;gap:16px;min-width:0;position:relative}",
    ".gpe-cuerpo.gpe-cargando{opacity:.5;pointer-events:none}",
    ".gpe-aviso{padding:12px 14px;border-radius:10px;background:var(--gpe-ojo-fondo,#fbf0dc);color:var(--gpe-ojo,#a86400);font-size:14px}",
    ".gpe-bloque{background:var(--gpe-panel);border:1px solid var(--gpe-borde,#e1e5ea);border-radius:12px;padding:16px;min-width:0}",
    ".gpe-cifras{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));grid-auto-rows:1fr;gap:12px}",
    "@media (max-width:640px){.gpe-cifras{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.gpe-cifra{padding:12px}.gpe-cifra .gpe-n{font-size:24px}}",
    ".gpe-cifra{background:var(--gpe-panel);border:1px solid var(--gpe-borde,#e1e5ea);border-radius:12px;padding:14px 16px;display:grid;align-content:start;gap:2px;min-width:0}",
    ".gpe-cifra .gpe-n{font:700 28px/1.1 var(--gpe-titulo,system-ui,sans-serif)}",
    ".gpe-cifra .gpe-n small{font-size:14px;font-weight:500;color:var(--gpe-tinta3,#6b7482)}",
    ".gpe-cifra .gpe-l{font-size:13px;color:var(--gpe-tinta2,#4a5361)}",
    ".gpe-cifra .gpe-d{font-size:12px;color:var(--gpe-tinta3,#6b7482);overflow-wrap:anywhere}",
    ".gpe-dos{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,440px),1fr));gap:16px}",
    ".gpe-tabla{overflow-x:auto}",
    ".gpe table{width:100%;border-collapse:collapse;font-size:14px}",
    ".gpe th{text-align:left;font-weight:600;font-size:12px;line-height:1.3;color:var(--gpe-tinta3,#6b7482);text-transform:uppercase;letter-spacing:.05em;padding:6px 8px;border-bottom:1px solid var(--gpe-borde,#e1e5ea);vertical-align:bottom}",
    ".gpe td{padding:7px 8px;border-bottom:1px solid var(--gpe-rejilla,#edf0f3);vertical-align:top;overflow-wrap:anywhere}",
    ".gpe td.gpe-num,.gpe th.gpe-num{text-align:right;white-space:nowrap}",
    "@media (max-width:820px){.gpe-tabla table,.gpe-tabla tbody,.gpe-tabla tr,.gpe-tabla td{display:block;width:100%}.gpe-tabla thead{display:none}",
    ".gpe-tabla tr{padding:10px 0;border-bottom:1px solid var(--gpe-borde,#e1e5ea)}",
    ".gpe-tabla td{border:0;padding:2px 0;display:grid;grid-template-columns:minmax(0,9.5em) minmax(0,1fr);gap:10px;text-align:left!important;white-space:normal!important}",
    ".gpe-tabla td::before{content:attr(data-l);color:var(--gpe-tinta3,#6b7482);font-size:12.5px}",
    ".gpe-tabla td:first-child{display:block;font-weight:700;padding-bottom:4px}.gpe-tabla td:first-child::before{content:none}}",
    "@media (max-width:380px){.gpe-tabla td{grid-template-columns:minmax(0,7.5em) minmax(0,1fr)}}",
    ".gpe-barrita{position:relative;height:8px;background:var(--gpe-rejilla,#edf0f3);border-radius:4px;min-width:40px;overflow:hidden}",
    ".gpe-barrita i{position:absolute;inset:0 auto 0 0;background:var(--gpe-barra);border-radius:4px}",
    ".gpe-pct{display:grid;grid-template-columns:minmax(40px,1fr) 3.2em;gap:8px;align-items:center}",
    ".gpe-chip{display:inline-block;font-weight:600;font-size:12px;line-height:1.4;padding:2px 8px;border-radius:999px;white-space:nowrap}",
    ".gpe-chip.bien{background:var(--gpe-bien-fondo,#e5f4ec);color:var(--gpe-bien,#1a7f4b)}.gpe-chip.ojo{background:var(--gpe-ojo-fondo,#fbf0dc);color:var(--gpe-ojo,#a86400)}",
    ".gpe-chip.mal{background:var(--gpe-mal-fondo,#fbe6e6);color:var(--gpe-mal,#c02d2d)}.gpe-chip.gris{background:var(--gpe-rejilla,#edf0f3);color:var(--gpe-tinta2,#4a5361)}",
    ".gpe-senales{list-style:none;margin:0;padding:0;display:grid;gap:8px}.gpe-senales li{display:grid;grid-template-columns:auto minmax(0,1fr);gap:10px;align-items:start}",
    ".gpe-graficas{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,460px),1fr));gap:16px}",
    ".gpe-grafica svg{width:100%;height:auto;display:block;overflow:visible}",
    ".gpe-nota{font-size:12px;color:var(--gpe-tinta3,#6b7482);margin:6px 0 0}",
    ".gpe-eje{font:11px var(--gpe-mono,ui-monospace,Menlo,monospace);fill:var(--gpe-tinta3,#6b7482)}",
    ".gpe-rej{stroke:var(--gpe-rejilla,#edf0f3);stroke-width:1}.gpe-base{stroke:var(--gpe-borde,#e1e5ea);stroke-width:1}",
    ".gpe-tip{position:fixed;pointer-events:none;background:var(--gpe-tinta,#15191f);color:var(--gpe-panel);font-size:12px;line-height:1.35;padding:6px 8px;border-radius:6px;z-index:90;max-width:240px}",
    ".gpe-vacio{color:var(--gpe-tinta3,#6b7482);font-size:14px;margin:0}",
    ".gpe-msg{display:grid;gap:4px;padding:10px 0;border-bottom:1px solid var(--gpe-rejilla,#edf0f3)}.gpe-msg:last-child{border:0}",
    ".gpe-msg .gpe-mcab{display:flex;flex-wrap:wrap;gap:8px;align-items:center;font-size:13px;color:var(--gpe-tinta2,#4a5361)}.gpe-msg p{margin:0;font-size:14px;overflow-wrap:anywhere}",
    ".gpe-calor{display:grid;grid-template-columns:2.6em repeat(24,minmax(0,1fr));gap:2px;font:11px var(--gpe-mono,ui-monospace,monospace);color:var(--gpe-tinta3,#6b7482);min-width:0}",
    "@media (max-width:480px){.gpe-calor{gap:1px;font-size:9.5px}}",
    ".gpe-calor b{font-weight:400;text-align:center;align-self:end}",
    ".gpe-calor span{aspect-ratio:1;border-radius:3px;background:color-mix(in srgb,var(--gpe-barra) var(--p),var(--gpe-rejilla,#edf0f3))}",
    ".gpe-escala{display:flex;flex-wrap:wrap;align-items:center;gap:6px;font-size:12px;color:var(--gpe-tinta3,#6b7482);margin-top:8px}",
    ".gpe-escala i{width:18px;height:12px;border-radius:3px;background:color-mix(in srgb,var(--gpe-barra) var(--p),var(--gpe-rejilla,#edf0f3))}",
    ".gpe-mono{font-family:var(--gpe-mono,ui-monospace,monospace);font-size:12.5px}",
    // las tarjetas iguales (equipos y horarios): sdk/tarjetas.js pone la ventana; aquí, lo de dentro
    ".gpe .gpt-rejilla{--gpt-min:260px}",
    ".gpe-tarjeta{background:var(--gpe-panel);border:1px solid var(--gpe-borde,#e1e5ea);border-radius:12px;padding:14px 16px;color:inherit}",
    ".gpe-tarjeta>summary{display:grid;align-content:start;gap:8px;cursor:pointer;list-style:none;height:100%}",
    ".gpe-tarjeta>summary::-webkit-details-marker{display:none}",
    ".gpe-tt{font:650 16px/1.25 var(--gpe-titulo,system-ui,sans-serif);display:flex;gap:8px;align-items:center;min-width:0}",
    ".gpe-tt i{width:12px;height:12px;border-radius:3px;flex:none;background:var(--c)}",
    ".gpe-ts{font-size:13px;color:var(--gpe-tinta3,#6b7482)}",
    ".gpe-mini{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}",
    ".gpe-mini span{display:grid;font-size:12px;color:var(--gpe-tinta3,#6b7482);min-width:0}.gpe-mini b{font:700 18px/1.2 var(--gpe-titulo,system-ui,sans-serif);color:var(--gpe-tinta,#15191f)}",
    ".gpe-franjas{margin:0;padding:0;list-style:none;display:grid;gap:4px;font-size:13.5px}",
    ".gpe-franjas li{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px;align-items:baseline}",
    ".gpe .gpt-mas{color:var(--gpe-acento,#2a5bd7);font-weight:600;font-size:13.5px}",
    ".gpe-tarjeta[open] .gpe-detalle{display:grid}.gpe-detalle{display:none;gap:12px;margin-top:12px}",
    ".gpe-semana{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:6px}",
    "@media (max-width:1000px){.gpe-semana{grid-template-columns:repeat(4,minmax(0,1fr))}}",
    "@media (max-width:520px){.gpe-semana{grid-template-columns:repeat(2,minmax(0,1fr))}}",
    ".gpe-semana>div{display:grid;align-content:start;gap:4px;min-width:0}",
    ".gpe .gpe-semana h3{font-family:inherit;font-weight:600;font-size:12px;line-height:1.3;margin:0;color:var(--gpe-tinta2,#4a5361);text-transform:uppercase;letter-spacing:.06em}",
    ".gpe-bloquito{border-left:4px solid var(--c);background:var(--gpe-rejilla,#edf0f3);border-radius:6px;padding:5px 7px;font-size:12.5px;line-height:1.3;overflow-wrap:anywhere}",
    ".gpe-bloquito b{display:block;font-size:13px}",
    ".gpe-leyenda{display:flex;flex-wrap:wrap;gap:12px;font-size:13px;color:var(--gpe-tinta2,#4a5361);margin-bottom:6px}",
    ".gpe-leyenda span::before{content:'';display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:6px;background:var(--c);vertical-align:-1px}",
  ].join("");
  function ponerEstilo() {
    if (typeof document === "undefined" || document.getElementById("gpe-estilo")) return;
    var s = document.createElement("style"); s.id = "gpe-estilo"; s.textContent = CSS; document.head.appendChild(s);
  }

  // ───────────────────────────── gráficas (SVG): una medida por gráfica; null = sin dato (no es cero) ─────────────────────────────
  function techo(m) { if (m <= 0) return 4; var p = Math.pow(10, Math.floor(Math.log10(m))), ks = [1, 2, 2.5, 5, 10]; for (var i = 0; i < ks.length; i++) if (ks[i] * p >= m) return ks[i] * p; return 10 * p; }
  function ejes(s, m, y, L, W, R) {
    for (var k = 0; k <= 4; k++) { var v = m * k / 4, yy = y(v); s += '<line class="' + (k ? "gpe-rej" : "gpe-base") + '" x1="' + L + '" x2="' + (W - R) + '" y1="' + yy + '" y2="' + yy + '"/><text class="gpe-eje" x="' + (L - 6) + '" y="' + (yy + 4) + '" text-anchor="end">' + (Number.isInteger(v) ? v : v.toFixed(1)).toLocaleString("es-ES") + "</text>"; }
    return s;
  }
  function barras(o) {
    var dias = o.dias, valores = o.valores, color = o.color || "var(--gpe-barra)", unidad = o.unidad || "";
    var W = 640, H = 190, L = 44, R = 8, T = 10, B = 26, iw = W - L - R, ih = H - T - B;
    var m = techo(Math.max.apply(null, [0].concat(valores.filter(function (v) { return v != null; })))), y = function (v) { return T + ih - (v / m) * ih; };
    var paso = iw / Math.max(1, dias.length), ancho = Math.max(2, Math.min(22, paso - 2));
    var s = ejes('<svg viewBox="0 0 ' + W + " " + H + '" role="img">', m, y, L, W, R), cada = Math.ceil(dias.length / 8);
    dias.forEach(function (d, i) { var dia = new Date(d + "T12:00:00Z").getUTCDay(); if ((dias.length <= 21 ? dia === 1 : i % cada === 0) || i === dias.length - 1) s += '<text class="gpe-eje" x="' + (L + paso * i + paso / 2) + '" y="' + (H - 8) + '" text-anchor="middle">' + fechaCorta(d) + "</text>"; });
    if (o.linea) {
      var pts = []; dias.forEach(function (d, i) { if (valores[i] != null) pts.push([L + paso * i + paso / 2, y(valores[i])]); });
      if (pts.length) {
        s += '<path d="M' + pts[0][0] + " " + (T + ih) + " L" + pts.map(function (p) { return p.join(" "); }).join(" L") + " L" + pts[pts.length - 1][0] + " " + (T + ih) + ' Z" fill="' + color + '" opacity=".12"/>';
        s += '<polyline points="' + pts.map(function (p) { return p.join(","); }).join(" ") + '" fill="none" stroke="' + color + '" stroke-width="2"/>';
      }
    }
    dias.forEach(function (d, i) {
      var v = valores[i], x = L + paso * i + (paso - ancho) / 2, t = esc(fechaLarga(d)) + "<br><b>" + (v == null ? "sin dato" : n(v) + unidad) + "</b>";
      if (!o.linea && v != null && v > 0) { var h = Math.max(2, T + ih - y(v)); s += '<path d="M' + x + " " + (T + ih) + " V" + (T + ih - h + 3) + " q0 -3 3 -3 h" + (ancho - 6) + " q3 0 3 3 V" + (T + ih) + ' Z" fill="' + color + '"/>'; }
      s += '<rect x="' + (L + paso * i) + '" y="' + T + '" width="' + paso + '" height="' + ih + '" fill="transparent" data-tip="' + esc(t) + '"/>';
    });
    return s + "</svg>";
  }
  function barrasHora(v) {
    var W = 640, H = 170, L = 44, T = 10, B = 24, R = 8, iw = W - L - R, ih = H - T - B, m = techo(Math.max.apply(null, v)), y = function (x) { return T + ih - x / m * ih; }, paso = iw / 24, an = paso - 4;
    var s = ejes('<svg viewBox="0 0 ' + W + " " + H + '" role="img">', m, y, L, W, R);
    v.forEach(function (x, h) {
      var cx = L + paso * h + 2;
      if (x) s += '<path d="M' + cx + " " + (T + ih) + " V" + (y(x) + 3) + " q0 -3 3 -3 h" + (an - 6) + " q3 0 3 3 V" + (T + ih) + ' Z" fill="var(--gpe-barra)"/>';
      if (h % 3 === 0) s += '<text class="gpe-eje" x="' + (cx + an / 2) + '" y="' + (H - 6) + '" text-anchor="middle">' + h + "</text>";
      s += '<rect x="' + (L + paso * h) + '" y="' + T + '" width="' + paso + '" height="' + ih + '" fill="transparent" data-tip="' + esc(hh(h) + "–" + hh(h + 1) + "<br><b>" + n(x) + " acciones</b>") + '"/>';
    });
    return s + "</svg>";
  }
  function grafica(titulo, o, nota) { return '<div class="gpe-bloque gpe-grafica"><h2>' + esc(titulo) + "</h2>" + barras(o) + (nota ? '<p class="gpe-nota">' + nota + "</p>" : "") + "</div>"; }

  // ───────────────────────────── piezas de la página ─────────────────────────────
  function cifra(num, de, l, d) { return '<div class="gpe-cifra"><span class="gpe-n">' + n(num) + (de != null ? " <small>de " + n(de) + "</small>" : "") + '</span><span class="gpe-l">' + esc(l) + "</span>" + (d ? '<span class="gpe-d">' + d + "</span>" : "") + "</div>"; }
  function pct(p) { return '<div class="gpe-pct"><div class="gpe-barrita"><i style="width:' + Math.min(100, p) + '%"></i></div><span class="gpe-num">' + p + "%</span></div>"; }
  function chip(nivel, t) { return '<span class="gpe-chip ' + nivel + '">' + esc(t) + "</span>"; }
  function tabla(cab, filas, vacio) {
    if (!filas.length) return '<p class="gpe-vacio">' + esc(vacio || "Nada en este rango.") + "</p>";
    return '<div class="gpe-tabla"><table><thead><tr>' + cab.map(function (c) { var num = c.charAt(0) === "#"; return "<th" + (num ? ' class="gpe-num"' : "") + ">" + esc(num ? c.slice(1) : c) + "</th>"; }).join("") +
      "</tr></thead><tbody>" + filas.map(function (f) { return "<tr>" + f.map(function (x, i) { var num = cab[i] && cab[i].charAt(0) === "#"; return "<td" + (num ? ' class="gpe-num"' : "") + ' data-l="' + esc(cab[i] && (num ? cab[i].slice(1) : cab[i])) + '">' + x + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table></div>";
  }
  function celda(html) { var T = typeof window !== "undefined" && window.GP && window.GP.tarjetas; return T ? T.celda(html) : '<div class="gpt-celda">' + html + "</div>"; }
  function tarjeta(color, titulo, sub, cuerpo, detalle) {
    return celda('<details class="gpt-tarjeta gpe-tarjeta"><summary><span class="gpe-tt" style="--c:' + color + '"><i></i><span class="gpt-l2">' + esc(titulo) + "</span></span>" +
      '<span class="gpe-ts gpt-l1">' + esc(sub) + "</span>" + cuerpo + '<span class="gpt-pie"><span class="gpt-mas">Leer más…</span></span></summary>' +
      '<button type="button" class="gpt-cerrar" data-gpt-cerrar aria-label="Cerrar">×</button><div class="gpe-detalle">' + detalle + "</div></details>");
  }

  function vResumen(D) {
    var R = D.resumen, desdeC = R.primerDiaConectados;
    var sen = [], doc = [];
    D.grupos.forEach(function (g) {
      g.senales.forEach(function (x) { sen.push("<li>" + chip(x.nivel, NIVEL[x.nivel]) + "<span>" + (D.grupos.length > 1 ? esc(g.nombre) + " · " : "") + esc(x.texto) + "</span></li>"); });
      g.docentes.forEach(function (d) { doc.push([esc(d.nombre) + (d.hoy ? " " + chip("bien", "hoy") : ""), esc(g.nombre), esc(d.rol) + (d.daClase ? "" : ' <span class="gpe-sub">(no da clase)</span>'), d.ultima ? hora(d.ultima) : '<span class="gpe-sub">sin dato</span>', n(d.llamadas7)]); });
    });
    var llam = [];
    D.grupos.forEach(function (g) {
      g.llamadas.forEach(function (l) { llam.push({ t: l.t, h: [hora(l.t), "Llamada a filas", esc(l.por), esc(g.nombre), esc(l.equipo), n(l.fichados)] }); });
      g.directo.forEach(function (l) { llam.push({ t: l.t, h: [hora(l.t), "Clase en directo", esc(l.por), esc(g.nombre), l.semana ? "Semana " + l.semana : "", "—"] }); });
    });
    llam.sort(function (a, b) { return b.t - a.t; });
    return '<div class="gpe-cifras">' +
      cifra(R.alumnos, null, "Alumnado", R.grupos + (R.grupos === 1 ? " grupo" : " grupos")) +
      cifra(R.nuevos, null, "Alistados en estas fechas") +
      cifra(R.activos, R.alumnos, "Con actividad", "Registran un reto, ganan XP o fichan") +
      cifra(R.conectados, R.alumnos, "Han entrado en la web", R.conectados == null ? "Se apunta cada hora desde que se publicó esta página" : (desdeC ? "Se apunta desde el " + fechaCorta(desdeC) : "")) +
      cifra(R.retos, null, "Retos registrados") + cifra(R.xp, null, "XP ganada") + cifra(R.llamadas, null, "Llamadas a filas") +
      cifra(R.clases, null, "Clases detectadas", "Ver «Horarios»") + "</div>" +
      '<div class="gpe-bloque"><h2>Qué funciona y qué no (hoy)</h2>' + (sen.length ? '<ul class="gpe-senales">' + sen.join("") + "</ul>" : '<p class="gpe-vacio">Nada que señalar.</p>') + "</div>" +
      '<div class="gpe-bloque"><h2>Equipo docente</h2>' + tabla(["Docente", "Grupo", "Papel", "Última conexión", "#Llamadas 7 días"], doc, "Sin equipo docente.") + "</div>" +
      '<div class="gpe-bloque"><h2>Clases lanzadas en estas fechas</h2>' + tabla(["Cuándo", "Qué", "Quién", "Grupo", "Para", "#Fichan"], llam.slice(0, 80).map(function (x) { return x.h; }), "Ninguna clase lanzada en estas fechas.") + "</div>";
  }
  function vCurso(D) {
    var s = D.serie, sem = {}, orden = [];
    s.dias.forEach(function (d, i) {
      var f = new Date(d + "T12:00:00Z"), l = new Date(f - ((f.getUTCDay() + 6) % 7) * 864e5).toISOString().slice(0, 10);
      if (!sem[l]) { sem[l] = { l: l, retos: 0, xp: 0, nuevos: 0, llamadas: 0, act: 0, dias: 0 }; orden.push(l); }
      var w = sem[l]; w.retos += s.retos[i] || 0; w.xp += s.xp[i] || 0; w.nuevos += s.nuevos[i] || 0; w.llamadas += s.llamadas[i] || 0; w.act += s.activos[i] || 0; w.dias++;
    });
    var filas = orden.reverse().map(function (l) { var w = sem[l]; return [fechaCorta(w.l) + (w.dias < 7 ? ' <span class="gpe-sub">(' + w.dias + " días)</span>" : ""), n(w.nuevos), n(w.retos), n(w.xp), n(w.llamadas), n(Math.round(w.act / w.dias))]; });
    return '<div class="gpe-graficas">' +
      grafica("Estudiantes con actividad por día", { dias: s.dias, valores: s.activos }, "Registran un reto, ganan XP o fichan en una llamada.") +
      grafica("Estudiantes que han entrado, por día", { dias: s.dias, valores: s.conectados, color: "var(--gpe-barra3)" }, "Sin dato los días de antes de apuntarse (no es cero).") +
      grafica("Retos registrados por día", { dias: s.dias, valores: s.retos, color: "var(--gpe-barra2)" }) +
      grafica("XP ganada por día", { dias: s.dias, valores: s.xp, unidad: " XP" }) +
      grafica("Alistados (acumulado)", { dias: s.dias, valores: s.alistados, linea: true }) +
      grafica("Llamadas a filas por día", { dias: s.dias, valores: s.llamadas, color: "var(--gpe-barra3)" }) + "</div>" +
      '<div class="gpe-bloque"><h2>Semana a semana</h2>' + tabla(["Semana del", "#Alistados", "#Retos", "#XP", "#Llamadas", "#Actividad media al día"], filas) + "</div>";
  }
  function horarioDe(D, grupo, equipo) { for (var i = 0; i < D.horarios.length; i++) if (D.horarios[i].grupo === grupo && D.horarios[i].equipo === equipo) return D.horarios[i]; return null; }
  function selectorHuso(D, grupo, equipo, actual) {
    return '<label class="gpe-sub" style="display:grid;gap:4px">Dónde vive su alumnado (para ver su hora)<select data-gpe-huso data-grupo="' + esc(grupo) + '" data-equipo="' + esc(equipo) + '">' +
      Object.keys(D.husos).map(function (k) { return '<option value="' + esc(k) + '"' + ((actual || "Europe/Madrid") === k ? " selected" : "") + ">" + esc(D.husos[k]) + "</option>"; }).join("") + "</select></label>";
  }
  function franjasHTML(h, D) {
    if (!h || !h.franjas.length) return '<p class="gpe-vacio">Aún no se ha visto ninguna clase suya.</p>';
    return '<ul class="gpe-franjas">' + h.franjas.map(function (f) { return "<li><span>" + esc(textoFranja(f, D.husos)) + "</span>" + chip(f.patron === "una" ? "gris" : f.patron === "todas" ? "bien" : "ojo", PATRON[f.patron]) + "</li>"; }).join("") + "</ul>";
  }
  function clasesDe(D, grupo, equipo) {
    return tabla(["Día", "Horas", "#Semana", "#Acciones", "#% del grupo", "Llamada"], D.clases.filter(function (c) { return c.grupo === grupo && c.equipo === equipo; }).map(function (c) {
      return [esc(DIAS[c.dow] + " " + fechaCorta(c.dia)), hh(c.desde) + "–" + hh(c.hasta), n(c.semana), n(c.acciones), c.cuota + "%", c.llamada ? "sí" + (c.por ? ", " + esc(c.por) : "") : "no"];
    }), "Ninguna clase detectada en estas fechas.");
  }
  function vEquipos(D) {
    var t = [], i = 0;
    D.grupos.forEach(function (g) {
      g.equipos.forEach(function (e) {
        var h = horarioDe(D, g.id, e.id), color = COLORES[i++ % COLORES.length];
        var cuerpo = '<span class="gpe-mini"><span><b>' + n(e.alumnos) + "</b>alumnado</span><span><b>" + e.pctActivos + "%</b>con actividad</span><span><b>" + n(e.retos) + "</b>retos</span></span>" + pct(e.pctActivos);
        var detalle = '<p class="gpe-sub">' + n(e.activos) + " de " + n(e.alumnos) + " con actividad · " + n(e.xp) + " XP ganada · " +
          (e.conectados == null ? "aún sin dato de quién entra" : n(e.conectados) + " han entrado en la web") + "</p><h2>Su horario de clase</h2>" + franjasHTML(h, D) +
          "<h2>Sus clases detectadas</h2>" + clasesDe(D, g.id, e.id) + selectorHuso(D, g.id, e.id, e.huso);
        t.push(tarjeta(color, e.nombre, (e.docente || "Sin docente") + (D.grupos.length > 1 ? " · " + g.nombre : ""), cuerpo, detalle));
      });
    });
    return t.length ? '<div class="gpt-rejilla">' + t.join("") + "</div>" : '<div class="gpe-bloque"><p class="gpe-vacio">Sin equipos.</p></div>';
  }
  function vRetos(D) {
    var filas = [];
    D.grupos.forEach(function (g) {
      g.retos.forEach(function (r) {
        filas.push([(r.codigo ? '<span class="gpe-mono">' + esc(r.codigo) + "</span> " : "") + esc(r.titulo) + (r.obligatorio ? " " + chip("gris", "obligatorio") : "") + (r.abierto ? "" : " " + chip("gris", "aún cerrado")),
          esc(g.nombre), n(r.semana || null), pct(r.pct), n(r.hechos)]);
      });
    });
    return '<div class="gpe-bloque"><h2>Cuántos han registrado cada reto</h2><p class="gpe-sub" style="margin-bottom:10px">Del alumnado de los ' + esc(String(D.equipo).toLowerCase()) +
      "s elegidos, hasta hoy (no depende de las fechas).</p>" + tabla(["Reto", "Grupo", "#Semana", "Lo han registrado", "#Personas"], filas, "Sin retos.") + "</div>";
  }
  function vHoras(D) {
    var m = D.horas, plano = [].concat.apply([], m), max = Math.max.apply(null, [1].concat(plano)), total = suma(plano);
    var calor = '<div class="gpe-calor"><b></b>' + Array.from({ length: 24 }, function (_, h) { return "<b>" + (h % 3 ? "" : h) + "</b>"; }).join("");
    m.forEach(function (fila, d) { calor += '<b style="text-align:left">' + DIAS[d].slice(0, 3) + "</b>" + fila.map(function (v, h) { return '<span style="--p:' + (v ? Math.round(12 + 88 * v / max) : 0) + '%" data-tip="' + esc(DIAS[d] + " de " + hh(h) + " a " + hh(h + 1) + "<br><b>" + n(v) + " acciones</b>") + '"></span>'; }).join(""); });
    calor += '</div><div class="gpe-escala">Menos <i style="--p:0%"></i><i style="--p:30%"></i><i style="--p:65%"></i><i style="--p:100%"></i> Más (máximo: ' + n(max) + " en una hora)</div>";
    var porHora = Array.from({ length: 24 }, function (_, h) { return m.reduce(function (s, f) { return s + f[h]; }, 0); });
    return '<div class="gpe-bloque"><h2>Cuándo hay actividad</h2><p class="gpe-sub" style="margin-bottom:10px">Cada acción del alumnado en estas fechas (un reto registrado, XP ganada o un fichaje), por día de la semana y hora de Madrid. ' + n(total) + " acciones.</p>" + calor + "</div>" +
      '<div class="gpe-dos"><div class="gpe-bloque"><h2>Horas punta</h2>' + tabla(["Día", "Hora", "#Acciones"], D.punta.map(function (x) { return [DIAS[x.dia], hh(x.hora) + "–" + hh(x.hora + 1), n(x.acciones)]; })) +
      '<p class="gpe-nota">Casi siempre son la clase de un ' + esc(String(D.equipo).toLowerCase()) + ": míralo en «Horarios».</p></div>" +
      '<div class="gpe-bloque"><h2>Las 2 horas más tranquilas (de 8 a 23 h)</h2>' + tabla(["Día", "Horas", "#Acciones"], D.tranquilas.map(function (x) { return [DIAS[x.dia], hh(x.desde) + "–" + hh(x.hasta), n(x.acciones)]; })) + "</div></div>" +
      '<div class="gpe-bloque gpe-grafica"><h2>Acciones por hora del día</h2>' + barrasHora(porHora) + "</div>";
  }
  function vHorarios(D) {
    var semana = semanaTipo(D.horarios), i0 = {};
    D.horarios.forEach(function (h, i) { i0[i] = COLORES[i % COLORES.length]; });
    var rejilla = '<div class="gpe-semana">' + semana.map(function (dia, d) {
      return "<div><h3>" + DIAS[d] + "</h3>" + (dia.length ? dia.map(function (b) {
        return '<div class="gpe-bloquito" style="--c:' + i0[b.i] + '"><b>' + hh(b.desde) + "–" + hh(b.hasta) + "</b>" + esc(b.nombre) + (D.horarios.length && D.opciones.grupos.length > 1 ? " · " + esc(b.grupo) : "") + "<br>" + esc(PATRON[b.patron]) + "</div>";
      }).join("") : '<span class="gpe-sub">—</span>') + "</div>";
    }).join("") + "</div>";
    var t = D.horarios.map(function (h, i) {
      var cuerpo = franjasHTML(h, D) + (h.alterna ? " " + chip("ojo", "dos horarios que se alternan") : "");
      var detalle = "<h2>Sus clases detectadas</h2>" + clasesDe(D, h.grupo, h.equipo) + selectorHuso(D, h.grupo, h.equipo, h.huso);
      return tarjeta(i0[i], h.nombre, (h.docente || "Sin docente") + (D.opciones.grupos.length > 1 ? " · " + h.grupoNombre : ""), cuerpo, detalle);
    });
    return '<div class="gpe-bloque"><h2>La semana tipo</h2><p class="gpe-sub" style="margin-bottom:10px">Cuándo da clase cada ' + esc(String(D.equipo).toLowerCase()) +
      ", sacado solo de los datos: una hora es clase cuando un solo " + esc(String(D.equipo).toLowerCase()) + " hace casi todo lo del grupo (al menos el 85 % de 15 acciones o más), o hay una llamada a filas suya con gente. Con dos horarios que se alternan, una franja sale solo en las semanas impares (A) o solo en las pares (B); hacen falta dos semanas para verlo.</p>" + rejilla + "</div>" +
      (t.length ? '<div class="gpt-rejilla">' + t.join("") + "</div>" : '<div class="gpe-bloque"><p class="gpe-vacio">Aún no se ha detectado ninguna clase en estas fechas.</p></div>');
  }
  function vBuzon(D) {
    var B = D.buzon, w = B.semanas, u = w[w.length - 1] || {};
    var ESTADO = { resuelto: ["bien", "resuelto"], anotado: ["bien", "anotado"], en_marcha: ["ojo", "en marcha"], nuevo: ["mal", "sin contestar"], para_norberto: ["ojo", "para el coordinador"] };
    var svg = "";
    if (w.length) {
      var W = 640, H = 190, L = 44, R = 8, T = 10, B2 = 26, iw = W - L - R, ih = H - T - B2, m = techo(Math.max.apply(null, w.map(function (x) { return x.recibidos; }))), y = function (v) { return T + ih - v / m * ih; }, paso = iw / w.length, an = Math.min(48, paso - 8);
      svg = ejes('<svg viewBox="0 0 ' + W + " " + H + '" role="img">', m, y, L, W, R);
      w.forEach(function (x, i) {
        var cx = L + paso * i + (paso - an) / 2, r = x.resueltos, a = x.recibidos - x.resueltos;
        if (r) svg += '<rect x="' + cx + '" y="' + y(r) + '" width="' + an + '" height="' + (T + ih - y(r)) + '" fill="var(--gpe-barra3)"/>';
        if (a) svg += '<rect x="' + cx + '" y="' + y(r + a) + '" width="' + an + '" height="' + Math.max(0, y(r) - y(r + a) - 2) + '" rx="3" fill="var(--gpe-barra2)"/>';
        svg += '<text class="gpe-eje" x="' + (cx + an / 2) + '" y="' + (H - 8) + '" text-anchor="middle">' + fechaCorta(x.lunes) + "</text>";
        svg += '<rect x="' + (L + paso * i) + '" y="' + T + '" width="' + paso + '" height="' + ih + '" fill="transparent" data-tip="' + esc("Semana del " + fechaCorta(x.lunes) + "<br>Recibidos <b>" + x.recibidos + "</b> · resueltos <b>" + x.resueltos + "</b>") + '"/>';
      });
      svg += "</svg>";
    }
    var lista = B.recientes.length ? B.recientes.map(function (m) { var e = ESTADO[m.estado] || ["gris", m.estado]; return '<div class="gpe-msg"><div class="gpe-mcab">' + chip(e[0], e[1]) + "<span>" + hora(m.t) + "</span><span>" + esc(m.tipo) + "</span><span>" + esc(m.quien) + "</span><span>" + esc(m.grupo) + "</span>" + (m.primeraH != null ? "<span>1.ª respuesta en " + m.primeraH + " h</span>" : "") + "</div><p>" + esc(m.texto) + "</p></div>"; }).join("") : '<p class="gpe-vacio">Ningún mensaje en estas fechas.</p>';
    return '<div class="gpe-cifras">' + cifra(suma(w.map(function (x) { return x.recibidos; })), null, "Mensajes en estas fechas") + cifra(suma(w.map(function (x) { return x.resueltos; })), null, "Resueltos") +
      cifra(B.abiertos, null, "Abiertos ahora", "De todas las fechas") + cifra(u.primeraRespuestaH, null, "Horas hasta la 1.ª respuesta", "Mediana de la última semana") + "</div>" +
      '<div class="gpe-bloque gpe-grafica"><h2>Mensajes por semana</h2><div class="gpe-leyenda"><span style="--c:var(--gpe-barra3)">Resueltos</span><span style="--c:var(--gpe-barra2)">Abiertos o para el coordinador</span></div>' + (svg || '<p class="gpe-vacio">Ningún mensaje.</p>') + "</div>" +
      '<div class="gpe-bloque"><h2>Los mensajes</h2>' + lista + "</div>";
  }
  /**
   * 16-oct · DE DÓNDE ES EL ALUMNADO Y SU EDAD (pieza `origen`, functions/modOrigen.js). 🔴 Solo cifras: cuántos en cada rango de edad y
   * en cada país, con los filtros de grupo y equipo. Sin la pieza (STARGATE hasta su próxima edición), la pestaña no sale.
   */
  var DN = null;
  function nombrePais(c) { try { DN = DN || new Intl.DisplayNames(["es"], { type: "region" }); return DN.of(c) || c; } catch (e) { return c; } }
  function paisesDe(O) {
    return Object.keys(O.paises || {}).map(function (k) { return { pais: k, nombre: nombrePais(k), n: O.paises[k] }; })
      .sort(function (a, b) { return b.n - a.n || a.nombre.localeCompare(b.nombre, "es"); });
  }
  function vOrigen(D) {
    var O = D.origen;
    if (!O) return '<div class="gpe-bloque"><p class="gpe-vacio">Este mod no pide el origen.</p></div>';
    var tot = O.total || 0, por = function (v) { return tot ? Math.round(v / tot * 100) : 0; }, P = paisesDe(O);
    var edades = (O.etiquetas || []).map(function (e) { var v = O.edades[e[0]] || 0; return [esc(e[1]), n(v), pct(por(v))]; });
    var paises = P.map(function (x) { return [esc(x.nombre), n(x.n), pct(por(x.n))]; });
    return '<div class="gpe-cifras">' + cifra(tot, tot + (O.sinDatos || 0), "Han dicho de dónde son") + cifra(P.length, null, "Países") +
      cifra(P.length ? P[0].n : 0, null, P.length ? "En " + P[0].nombre : "El país con más gente") + cifra(O.sinDatos, null, "Sin decirlo todavía", "Se les pregunta al entrar (dos veces como mucho)") + "</div>" +
      '<div class="gpe-bloque"><h2>Rango de edad</h2><p class="gpe-sub">Solo cifras: la edad de cada cual no se ve en ningún sitio.</p>' + tabla(["Rango", "#Personas", "%"], edades, "Nadie lo ha dicho aún.") + "</div>" +
      '<div class="gpe-bloque"><h2>Por país</h2>' + tabla(["País", "#Personas", "%"], paises, "Nadie lo ha dicho aún.") + "</div>";
  }
  var VISTAS = { resumen: vResumen, curso: vCurso, equipos: vEquipos, retos: vRetos, horas: vHoras, horarios: vHorarios, buzon: vBuzon, origen: vOrigen };

  // ───────────────────────────── la página ─────────────────────────────
  function puedo(llamar, mod) { return llamar("modEstadisticas", { accion: "puedo", mod: mod }).then(function (r) { return !!(r && r.puede); }, function () { return false; }); }

  function crear(o) {
    ponerEstilo();
    var raiz = o.raiz, llamar = o.llamar, mod = o.mod, memo = {}, datos = null, pedida = 0;
    var CLAVE = "gpe-" + mod;
    // 16-oct · `o.grupo`: el grupo elegido en la barra de la web (sin él, o «*», todos los que puede ver)
    var estado = { pestana: "resumen", grupo: o.grupo && /^[\w-]{1,200}$/.test(o.grupo) ? o.grupo : "*", equipo: "*", reto: "*", desde: "", hasta: "" };
    try { var g = JSON.parse(localStorage.getItem(CLAVE) || "{}"); if (g.pestana && VISTAS[g.pestana]) estado.pestana = g.pestana; } catch (e) { /* sin almacenamiento */ }
    function guardar() { try { localStorage.setItem(CLAVE, JSON.stringify({ pestana: estado.pestana })); } catch (e) { /* sin almacenamiento */ } }

    raiz.classList.add("gpe");
    raiz.innerHTML = '<header class="gpe-cab"><div><h1>Estadísticas</h1><p class="gpe-sub" data-gpe-hora>Cargando…</p></div><div class="gpe-acciones">' +
      '<button type="button" class="gpe-b" data-gpe-actualizar>' + ICONO.actualizar + "Actualizar</button>" +
      '<button type="button" class="gpe-b" data-gpe-csv disabled>' + ICONO.descargar + "CSV</button></div></header>" +
      '<div class="gpe-filtros" data-gpe-filtros></div><nav class="gpe-pestanas" role="tablist">' +
      PESTANAS.map(function (p) { return '<button type="button" role="tab" data-gpe-p="' + p[0] + '">' + p[1] + "</button>"; }).join("") + "</nav>" +
      '<main class="gpe-cuerpo" data-gpe-cuerpo><div class="gpe-bloque"><p class="gpe-vacio">Cargando las cifras…</p></div></main>';
    var $ = function (s) { return raiz.querySelector(s); };
    var tip = document.createElement("div"); tip.className = "gpe-tip"; tip.hidden = true; document.body.appendChild(tip);
    raiz.addEventListener("pointermove", function (e) {
      var t = e.target.closest && e.target.closest("[data-tip]"); if (!t) { tip.hidden = true; return; }
      tip.innerHTML = t.getAttribute("data-tip"); tip.hidden = false;
      tip.style.left = Math.max(8, Math.min(e.clientX + 12, innerWidth - tip.offsetWidth - 8)) + "px"; tip.style.top = Math.max(8, e.clientY - tip.offsetHeight - 10) + "px";
    });
    raiz.addEventListener("pointerleave", function () { tip.hidden = true; });

    function filtros() {
      var op = opcionesDeFiltro(datos, estado), hoy = (datos && datos.hoy) || hoyMadrid(), eq = (datos && datos.equipo) || "Equipo";
      if (estado.equipo !== "*" && !op.equipos.some(function (e) { return e.id === estado.equipo; })) estado.equipo = "*";
      if (estado.reto !== "*" && !op.retos.some(function (r) { return r.id === estado.reto; })) estado.reto = "*";
      var sel = function (k, l, todos, lista) {
        return "<label>" + esc(l) + '<select data-gpe-f="' + k + '"><option value="*">' + esc(todos) + "</option>" + lista.map(function (x) { return '<option value="' + esc(x.id) + '"' + (estado[k] === x.id ? " selected" : "") + ">" + esc(x.nombre) + "</option>"; }).join("") + "</select></label>";
      };
      var rap = [["hoy", "Hoy"], ["7", "7 días"], ["30", "30 días"], ["curso", "Todo el curso"]];
      $("[data-gpe-filtros]").innerHTML =
        sel("grupo", "Grupo", "Todos los grupos (" + op.grupos.length + ")", op.grupos.map(function (g) { return { id: g.id, nombre: g.nombre + " · semana " + g.semana }; })) +
        sel("equipo", eq, "Todos", op.equipos) + sel("reto", "Reto", "Todos los retos", op.retos) +
        '<label>Desde<input type="date" data-gpe-f="desde" value="' + esc(estado.desde || (datos && datos.desde) || "") + '" max="' + hoy + '"></label>' +
        '<label>Hasta<input type="date" data-gpe-f="hasta" value="' + esc(estado.hasta || hoy) + '" max="' + hoy + '"></label>' +
        '<div class="gpe-rapidos">' + rap.map(function (r) { return '<button type="button" class="gpe-b" data-gpe-r="' + r[0] + '">' + r[1] + "</button>"; }).join("") + "</div>";
    }
    function pintar() {
      // 16-oct · la pestaña «Origen», solo si el mod tiene la pieza (llega `origen` del servidor)
      var hay = function (k) { return k !== "origen" || !!(datos && datos.origen); };
      if (datos && !hay(estado.pestana)) estado.pestana = "resumen";
      var vistas = 0;
      raiz.querySelectorAll("[data-gpe-p]").forEach(function (b) {
        var k = b.getAttribute("data-gpe-p"); b.hidden = !hay(k); if (!b.hidden) vistas++;
        b.setAttribute("aria-selected", String(k === estado.pestana));
      });
      $(".gpe-pestanas").style.setProperty("--gpe-np", String(vistas));
      if (!datos) return;
      $("[data-gpe-cuerpo]").innerHTML = VISTAS[estado.pestana](datos);
      $("[data-gpe-csv]").disabled = false;
    }
    function cargar(forzar) {
      var p = peticionDe(estado, mod), k = JSON.stringify(p), yo = ++pedida, cuerpo = $("[data-gpe-cuerpo]");
      if (!forzar && memo[k]) { datos = memo[k]; filtros(); pintar(); return Promise.resolve(datos); }
      cuerpo.classList.add("gpe-cargando");
      $("[data-gpe-hora]").textContent = "Cargando…";
      return llamar("modEstadisticas", p).then(function (r) {
        if (yo !== pedida) return r;
        memo[k] = datos = r;
        // 16-oct · el grupo que llegó de la barra no está entre los que cuentan (de prueba, sin empezar…): todos, y otra vez
        if (estado.grupo !== "*" && r && r.opciones && !(r.opciones.grupos || []).some(function (g) { return g.id === estado.grupo; })) { estado.grupo = "*"; return cargar(); }
        $("[data-gpe-hora]").textContent = (r.nombre || mod) + " · del " + fechaCorta(r.desde) + " al " + fechaCorta(r.hasta) + " · datos de " + hora(r.generado);
        cuerpo.classList.remove("gpe-cargando");
        filtros(); pintar();
        return r;
      }, function (e) {
        if (yo !== pedida) return;
        cuerpo.classList.remove("gpe-cargando");
        var c = e && (e.codigo || e.code) || "";
        $("[data-gpe-hora]").textContent = "";
        cuerpo.innerHTML = '<div class="gpe-aviso">' + (/permission/.test(c) ? "Las estadísticas son del equipo docente: con esta cuenta no hay grupos que ver." : e && e.sinDesplegar ? "Las estadísticas aún no están publicadas en el servidor." : "No se han podido cargar las cifras. Pulsa «Actualizar» dentro de un momento.") + "</div>";
      });
    }
    raiz.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b || !raiz.contains(b)) return;
      if (b.hasAttribute("data-gpe-p")) { estado.pestana = b.getAttribute("data-gpe-p"); guardar(); pintar(); return; }
      if (b.hasAttribute("data-gpe-actualizar")) { memo = {}; cargar(true); return; }
      if (b.hasAttribute("data-gpe-csv") && datos) {
        var blob = new Blob(["﻿" + csvDe(estado.pestana, datos)], { type: "text/csv;charset=utf-8" }), a = document.createElement("a");
        a.href = URL.createObjectURL(blob); a.download = "estadisticas-" + mod + "-" + estado.pestana + "-" + datos.desde + "_" + datos.hasta + ".csv";
        document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
        return;
      }
      var r = b.getAttribute("data-gpe-r");
      if (r) {
        var hoy = (datos && datos.hoy) || hoyMadrid();
        estado.hasta = hoy; estado.desde = r === "hoy" ? hoy : r === "7" ? masDias(hoy, -6) : r === "30" ? masDias(hoy, -29) : "";
        cargar();
      }
    });
    var reloj = null;
    raiz.addEventListener("change", function (e) {
      var t = e.target, k = t.getAttribute && t.getAttribute("data-gpe-f");
      if (k) {
        estado[k] = t.value || (k === "desde" ? "" : k === "hasta" ? "" : "*");
        if (k === "grupo") { estado.equipo = "*"; estado.reto = "*"; }
        clearTimeout(reloj); reloj = setTimeout(cargar, k === "desde" || k === "hasta" ? 500 : 0);
        return;
      }
      if (t.hasAttribute && t.hasAttribute("data-gpe-huso")) {
        t.disabled = true;
        llamar("modEstadisticas", { accion: "huso", mod: mod, grupo: t.getAttribute("data-grupo"), equipo: t.getAttribute("data-equipo"), huso: t.value })
          .then(function () { memo = {}; var w = window.GP && window.GP.tarjetas; if (w) w.cerrar(); return cargar(true); }, function () { t.disabled = false; });
      }
    });
    return { cargar: function () { return cargar(true); }, estado: estado, datos: function () { return datos; } };
  }

  return { crear: crear, puedo: puedo, csvDe: csvDe, aCSV: aCSV, textoFranja: textoFranja, semanaTipo: semanaTipo, opcionesDeFiltro: opcionesDeFiltro,
    peticionDe: peticionDe, CSS: CSS, VISTAS: VISTAS, PESTANAS: PESTANAS };
});
