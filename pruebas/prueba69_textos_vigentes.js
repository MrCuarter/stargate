'use strict';
/**
 * BATERÍA 69 · LO QUE SE LEE DICE LA VERDAD DE HOY.
 *
 * 🔴 13-sep · Un docente nuevo que abriera la guía se encontraba «regístralo en la Bitácora de mando
 * (un formulario)», «el panel de profes → Ajustes del PER», «el PIN que te dará tu referente» y una
 * visita guiada que le llevaba a una sala que ya no existe. Nada estaba roto: estaba VIEJO, que para
 * quien llega por primera vez es peor, porque no sabe que lo es.
 *
 * Aquí se vigila que las páginas vivas (portada, guía, cronología, el tablero, pasos, privacidad,
 * recursos) y las dos bienvenidas (NEBULA y el Capitán) no vuelvan a hablar del sistema viejo. Las
 * menciones en negativo («no hay PIN», «sin formularios») y la página del archivo son legítimas.
 */
const fs = require("fs"), path = require("path");
const RAIZ = path.resolve(__dirname, "..");
let ok = 0; const fallos = [];
function c(cierto, nombre, detalle) { if (cierto) { ok++; return; } fallos.push(nombre + (detalle ? " — " + detalle : "")); }
const leer = f => fs.readFileSync(path.join(RAIZ, f), "utf8");
function visible(html) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ").replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ");
}
// lo que solo pudo escribirse con el sistema viejo en la cabeza (en afirmativo)
const VIEJO = [
  [/Bitácora de mando/, "la Bitácora de mando (el formulario viejo)"],
  [/foro dinámico/i, "el «foro dinámico»"],
  [/sala del docente/i, "la «sala del docente»"],
  [/Panel de profes|panel del profesorado \(con el PIN/i, "el panel de profes con PIN"],
  [/Doc de enlaces/i, "el Doc de enlaces del PER"],
  [/Ajustes del PER/, "«Ajustes del PER»"],
  [/PIN que te dará|con el PIN|el PIN del profesorado|Cambiar PIN/i, "un PIN que pedir"],
  [/escribe (ahí arriba )?(tu|el) correo/i, "«escribe tu correo»"],
  [/generador de enlaces, embeds y QR/i, "el generador de embeds viejo"],
];
const PAGINAS = ["index.html", "entrar.html", "guia.html", "cronologia.html", "registro.html", "pasos.html",
  "privacidad.html", "recursos.html", "actividades.html", "consola.html", "sesion.html", "aula.html",
  "llamada.html", "validar.html", "huevo.html", "alistarse.html", "ayuda.html", "foro.html", "tickets.html"];
PAGINAS.forEach(f => {
  if (!fs.existsSync(path.join(RAIZ, f))) return;
  const t = visible(leer(f));
  VIEJO.forEach(([re, que]) => {
    const m = t.match(re);
    c(!m, "🔴 " + f + " no habla de " + que, m ? "…" + t.slice(Math.max(0, m.index - 70), m.index + 60) + "…" : "");
  });
});
// las dos bienvenidas
const tour = leer("assets/js/tour.js");
const pasosTour = (tour.match(/x:'[^']*'/g) || []).join(" ");
VIEJO.concat([[/registro\.html'/, "el registro viejo como parada"], [/\bPIN\b(?! que repartir)/, "un PIN"]]).forEach(([re, que]) => {
  c(!re.test(pasosTour), "🔴 la visita del Capitán no habla de " + que);
});
c(/p:'consola\.html',sel:'\.gp'/.test(tour), "🔴 la visita del Capitán empieza en Mis grupos, señalando su grupo");
c(!/p:'index\.html'/.test(tour), "   y ya no se para en la portada pública");
c(/__CRED_A__/.test(tour) === false, "   y las cifras de créditos salen del catálogo, no de un marcador sin sustituir");
const R = leer("assets/js/recluta.js");
const acto = R.slice(R.indexOf("var PASOS=["), R.indexOf("// Un solo motor"));
c(!/correo/i.test(acto), "🔴 la bienvenida de NEBULA (motor nuevo) no pide ningún correo");
c(/foco:'\.cine'/.test(acto) && /SG_TOPE_DIA/.test(acto) && /enlace/.test(acto),
  "   y cuenta lo de hoy: los vídeos, el tope diario y el enlace obligatorio");
// el enlace del tablero de los mensajes del foro no puede llevar al alumnado a la puerta del profesorado
const D = leer("_site_data.py");
c(/registro\.html\?solo=1&per=\{id-del-PER\}/.test(D), "🔴 el {tablero} de los mensajes del foro es el ranking público (solo=1)");
// la portada no enseña al público páginas del sistema viejo
const idx = leer("index.html");
["embed.html", "foro.html", "profes.html", "grupos.html"].forEach(p =>
  c(idx.indexOf('href="' + p) < 0, "la portada no enlaza " + p + " (del sistema anterior)"));

module.exports = { nombre: "Lo que se lee dice la verdad de hoy", ok, fallos };
if (require.main === module) {
  console.log("\n  Batería 69 · lo que se lee dice la verdad de hoy");
  console.log("  " + ok + " comprobaciones, " + fallos.length + " fallos");
  fallos.forEach(f => console.log("   ✗ " + f));
  process.exit(fallos.length ? 1 : 0);
}
