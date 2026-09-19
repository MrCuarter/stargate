'use strict';
/**
 * BATERÍA 77 · LA CONSOLA DEL GRUPO, REPENSADA, Y LA SIMETRÍA DE LA NAVE (15-sep-2026, tarde).
 *
 * Norberto, de un tirón: «Cola de nota solo si hay algo que hacer, al final y brillando», «indica en el Zoco la fecha
 * exacta», «no es intuitivo cambiar el equipo docente», «el referente debe poder clicar en el escuadrón y verlo todo»,
 * «el calendario, como un calendario, y que lo vea el docente raso», «hago clic en el estudiante y no se abre nada»,
 * «el botón de Google en el premio por enlace», «los embeds que son cajas, sin fondo», «los retos a la misma altura»
 * y «0/4, 0/2… en el mismo eje». Y en el servidor, quitar a alguien del equipo.
 */
const fs = require("fs"), path = require("path");
const RAIZ = path.resolve(__dirname, "..");
let ok = 0; const fallos = [];
function c(cierto, nombre, detalle) { if (cierto) { ok++; return; } fallos.push(nombre + (detalle ? " — " + detalle : "")); }
const leer = f => fs.readFileSync(path.join(RAIZ, f), "utf8");
const K = leer("assets/js/consola.js"), CSS = leer("assets/css/stargate.css"), M = leer("assets/js/motor.js");
const trozo = (s, desde, n) => { const i = s.indexOf(desde); return i < 0 ? "" : s.slice(i, i + (n || 4000)); };

// 1 · la Cola de nota
const tabs = (K.match(/var TABS = \[([\s\S]*?)\];/) || [, ""])[1];
c(/\["canjes", "Cola de nota"\]\s*$/.test(tabs.trim()), "🔴 la Cola de nota es la ÚLTIMA pestaña", tabs.trim().slice(-60));
c(/x\[0\] !== "canjes" \|\| cola > 0/.test(K), "🔴 y solo sale si hay algo pendiente");
c(/pest-aviso/.test(K) && /class="pest-n"/.test(K) && /\.pest\.pest-aviso\{[^}]*animation:colaBrilla/.test(CSS), "   brilla, con el número en un globo");
c(/if \(!misTabs\(\)\.some\(function \(x\) \{ return x\[0\] === TAB; \}\)\) TAB = misTabs\(\)\[0\]\[0\];\s*app\.innerHTML/.test(K),
  "   al resolver la última, se cae a la primera pestaña ANTES de pintarlas (la encendida es la que se ve)");
c(/where\("status", "==", "pending"\)/.test(M) && /x\.cola = /.test(M) && /class="gp-cola"/.test(K) && /data-ir="canjes"/.test(K),
  "   y la tarjeta de Mis grupos avisa, con un botón que lleva directo a la cola");

// 2 · el Zoco con su fecha
c(/function zocoCuando\(\)/.test(K) && /inicioDeSemana\(S\.inicio, sem, S\.pausas\)/.test(trozo(K, "function zocoCuando")) && /c\.clave === "c5"/.test(K),
  "el Zoco dice el DÍA en que se abre (su semana, saltando las no lectivas)");
c(!/Se abre en la <b>semana 5<\/b>\. Lo que se ofrece/.test(K), "   y ya no solo «semana 5»");

// 3 · la ficha, en una ventana
c(/function modalFicha\(/.test(K) && /document\.body\.appendChild\(m\)/.test(K) && !/<div id='c-ficha'><\/div>/.test(K),
  "🔴 la ficha se abre en una ventana encima (antes se pintaba debajo de la tabla, fuera de la vista)");
c(/e\.key === "Escape"/.test(K) && /data-cerrar-ficha/.test(K), "   se cierra con ✕, Escape o pulsando fuera");
c(/reabrirFicha\(ficha, \(tiene \? "Anulado "/.test(K), "   y tras otorgar o anular se reabre con los datos nuevos");
c(/fila\.onkeydown/.test(K) && /tabindex="0"/.test(trozo(K, "function tablaGente")), "   las filas también se abren con el teclado");

// 4 · Mi gente por escuadrones, y los escuadrones que se abren
c(/function filtroDe\(t\)/.test(K) && /data-gf=/.test(K) && /"el tuyo"/.test(K), "Mi gente: filtro por escuadrón (el suyo por defecto, si imparte aquí)");
const E = trozo(K, "function verEscuadrones", 6000);
c(/<details class="esc-det"/.test(E) && /tablaGente\(x\.suyos/.test(E) && /cablearFilas\(app, t\)/.test(E),
  "🔴 cada escuadrón se abre con su gente, y cada fila abre la ficha");
c(/Comandante/.test(E) && /Media de xp/.test(E) && /Insignias de media/.test(E), "   con su Comandante y sus cifras");
c(/EVID_PER === PER/.test(E), "   y los avisos de enlace son los de ESTE grupo (no los del último que se miró)");

// 5 · el equipo docente, persona a persona
const Q = trozo(K, "function verEquipo", 11000);   // (17-sep · más largo: sus preguntas ya no son confirm() de una línea)
c(/class="eq-p/.test(Q) && /data-rol=/.test(Q) && /data-pasar=/.test(Q) && /data-quitar=/.test(Q) && /data-ver-esc=/.test(Q),
  "🔴 cada persona del equipo, con sus botones: rol, pasar su alumnado, quitar, ver su escuadrón");
c(/refs <= 1/.test(Q) && /vital \|\| soyYo \? ""/.test(Q), "   sin dejar el grupo sin referente, ni quitarse uno mismo, ni quitar a un vitalicio");
c(/MOTOR\.traspasar\(PER, d\.nombre, sel\.value\)[\s\S]{0,80}MOTOR\.quitarDocente\(PER, d\.correo\)/.test(Q), "   si tiene alumnado, se pasa ANTES de quitarle");
c(/También en/.test(Q) && /x\.equipo = eq\.map/.test(M), "   y en qué otros de tus grupos está");
c(/async function quitarDocente\(perId, correo\)[\s\S]{0,200}quitar: true/.test(M), "el motor quita por el servidor (stargateEquipo con quitar)");
const SRV = "/Users/nor/Claude/vibewebs/gamificapro/functions/stargateEquipo.js";
if (fs.existsSync(SRV)) {
  const S = fs.readFileSync(SRV, "utf8");
  c(/export function equipoSin\(/.test(S) && /arrayRemove\(persona\.correo\)/.test(S) && /stargateProfe', '==', r\.nombre/.test(S),
    "GamificaPro: quitar = fuera del equipo y de coTeacherEmails, y no si aún tiene alumnado");
}

// 6 · el calendario
const C = trozo(K, "function verCalendario", 16000);
c(/\["calendario", "Calendario"\]/.test(K), "🔴 el calendario lo ve todo el equipo");
c(/var edita = soyRefAqui\(\);/.test(C) && /var toca = edita && futura;/.test(C) && /if \(!edita\) return;/.test(C), "   pero solo el referente lo cambia (y solo semanas futuras)");
c(/class="cal-7"/.test(C) && /cal-d/.test(C) && /INICIALES\[\(dia0 \+ k\) % 7\]/.test(C), "   como un calendario: una fila por semana con sus siete días");
c(/"S" \+ f\.semana/.test(C) && /iconos\/p\/calendario\.png/.test(C) && /nave\/iconos\/mercado\.png/.test(C), "   cada semana con su número, las festivas y la de canje");
c(/data-cal-tg=/.test(C) && /Marcar no lectiva/.test(C), "   una semana se marca como no lectiva pulsándola");
c(/tramos/.test(C) && /empieza el <b>/.test(C), "🔴 y «Al guardar» dice a qué día se mueve cada semana (lo que echaba en falta)");
c(/semanas lectivas/.test(C) && /no lectiva/.test(C), "   con el resumen arriba: semanas lectivas, no lectivas y canje");
c(/\.cal-fila\{display:grid/.test(CSS) && /@media\(max-width:760px\)\{\s*\.cal-fila\{/.test(CSS), "   y en el móvil se recoloca");
c(/const total = \(S\.tipo === "PUA"\) \? \(sem\.PUA \|\| 8\)/.test(M), "🔴 un PUA dura lo que dice el catálogo (8), no 10");
c(/var sinSaltar = festivas\.filter/.test(C) && /id="cal-festivos"/.test(C) && /debería ser no lectiva/.test(C),
  "🔴 un grupo de antes de la regla: las festivas de la UNIR que aún cuentan como lectivas se señalan y se saltan de un clic");

// 7 · el premio por enlace
const H = leer("assets/js/huevo.js");
// (17-sep · la portada dice «recompensa» o «huevo» según el enlace: `invita()` y `botonAbrir()`)
c(/function puerta\(\) \{\s*marcarPagina\(\);\s*pinta\(portada\(invita\(\), botonAbrir\("hv-abrir0"\)\)\)/.test(H) && /Hay algo aquí para ti/.test(H), "🔴 sin sesión, la misma portada que la vista previa, con «🥚 Abrirlo» (o «🎁 Conseguir mi recompensa»)");
c(/function puertaGoogle\(\)/.test(H) && /QUIERE = true/.test(H) && /if \(auto && e\.estado === "abierto" && !e\.yaEra\) return reclamar\(\);/.test(H),
  "   «Abrirlo» → Google → se reclama solo al volver");
c(/function otraCuenta\(\)/.test(H) && /Entrar con otra cuenta/.test(H) && /if \(!fichas\.length\) return pareceDocente\(\) \|\| \(MOTOR\.misPERs && !VISTA\) \? simular\(\) : otraCuenta\(\);/.test(H),
  "   con una cuenta sin grupo: con qué cuenta estás y botón para entrar con otra");

// 8 · las cajas incrustadas, sin fondo
["huevo.js", "validar.js", "foro.js"].forEach(f => c(/embed-caja/.test(leer("assets/js/" + f)), f + ": caja incrustada sin fondo"));
["sesion.js", "aula.js", "llamada.js", "tablero.js"].forEach(f => c(!/embed-caja/.test(leer("assets/js/" + f)), f + ": ocupa el lienzo, conserva el fondo"));
c(/html:has\(body\.embed\.embed-caja\)\{background:transparent;color-scheme:normal\}/.test(CSS), "   transparente de verdad (también el esquema de color)");

// 9 · la Nave: simetría
c(/\.reto-pl \.reto-cuenta\{margin-left:auto;min-width:3\.2em;text-align:right/.test(CSS) && /\.reto-pl>summary::after\{margin-left:14px\}/.test(CSS),
  "🔴 los contadores de los planetas, en el mismo eje");
c(/\.rs-grid\{align-items:stretch\}/.test(CSS) && /\.rs-grid:has\(\.reto-sem\[open\]\)\{align-items:start\}/.test(CSS) && /\.reto-sem:not\(\[open\]\) \.rs-premio\{margin-top:auto\}/.test(CSS),
  "🔴 los dos retos de la semana a la misma altura (y si abres uno, el otro no se estira)");

// 10 · la Nave: la misma tarjeta en «esta semana» y en «Qué hay que hacer, explicado», y el ejemplo solo donde lo hay
const N = leer("assets/js/recluta.js");
c(/function tarjetaReto\(t, mios\)/.test(N) && (N.match(/tarjetaReto\(/g) || []).length >= 3 && /class="rs-grid rs-grid-pl"/.test(N),
  "🔴 «Qué hay que hacer, explicado» pinta la MISMA tarjeta que la de la semana (con su insignia)");
c(!/<article class="reto'\+\(ya\?' ok':''\)\+'">'\s*\+'<header><span class="reto-id">'\+esc\(r\[0\]\)\+'<\/span><h4>'\+esc\(r\[1\]\)\+'<\/h4>'\s*\+'<span class="reto-xp">'\+r\[3\]\+' xp<\/span>'\s*\+\(ya\?'<span class="reto-ya">✅ ya lo tienes<\/span>':''\)\+'<\/header>'\s*\+\(texto/.test(N),
  "   y la ficha vieja (solo texto) ya no está");
c(/window\.SG_EJEMPLOS\|\|\{\}/.test(N) && /Ver un ejemplo ↗/.test(N) && /EJEMPLOS_RETOS = \{/.test(leer("_site_data.py")) && /window\.SG_EJEMPLOS=/.test(leer("recluta.html")),
  "   «💡 Ver un ejemplo» solo en los retos que tienen uno (EJEMPLOS_RETOS, un solo sitio)");
const CARTAS = path.resolve(RAIZ, "..", "Retos e Insignias", "_work", "cartas.py");
if (fs.existsSync(CARTAS)) {
  const P = fs.readFileSync(CARTAS, "utf8");
  c(/y_ep = ART_H - 10 - 26 - 44/.test(P) && !/centrado\(nombre, ft_name, 96,/.test(P), "🔴 las cartas: el nombre y el epíteto al pie del arte (no tapan caras)");
}

if (require.main === module) {
  console.log("\n  Batería 77 · la consola del grupo repensada y la simetría de la Nave");
  console.log("  " + ok + " comprobaciones, " + fallos.length + " fallos");
  fallos.forEach(f => console.log("   ✗ " + f));
  process.exit(fallos.length ? 1 : 0);
}
