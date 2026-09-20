'use strict';
/**
 * Batería 103 · LA PRESENTACIÓN PARA EL EQUIPO (20-sep)
 *
 * Norberto: «monta la presentación. Debe ser visual, usar los recursos de STARGATE, interactiva… como las sesiones
 * semanales. La diferencia clave: está orientada a docentes primerizos. Esta presentación está disponible si eres
 * profe referente».
 *
 * 🔴 LO QUE SE VIGILA AQUÍ es lo que no se ve mirando la pantalla una vez: que **no haya ni un dato escrito a mano**.
 * Los planetas, las semanas, los retos, los capítulos y la Tripulación Cero salen de `_site_data.py`; el día que se
 * mueva un tema o se renombre un reto, la presentación lo dirá bien sin que nadie se acuerde de ella.
 */
const fs = require("fs"), path = require("path");
const R = path.join(__dirname, "..");
const L = f => fs.readFileSync(path.join(R, f), "utf8");
let ok = 0; const fallos = [];
const c = (cond, txt, dato) => { if (cond) ok++; else fallos.push(txt); console.log("   " + (cond ? "✓" : "✗") + " " + txt + (cond || dato === undefined ? "" : "  →  " + dato)); };

const JS = L("assets/js/prestreno.js"), HTML = L("prestreno.html"), CSS = L("assets/css/stargate.css");
const CONS = L("assets/js/consola.js");

// ── 1 · existe, está tras la puerta del profesorado y no se enlaza al alumnado
c(fs.existsSync(path.join(R, "prestreno.html")), "🔴 la presentación del equipo existe (prestreno.html)");
c(/assets\/js\/puerta\.js/.test(HTML), "   y va tras la puerta del profesorado");
c(/Solo referentes/.test(HTML), "   dice a quién es: solo referentes");
const enAlumnado = ["recluta.html", "alistarse.html", "index.html"].filter(f => /prestreno\.html/.test(L(f)));
c(!enAlumnado.length, "🔴 no se enlaza desde ninguna página del alumnado", enAlumnado.join(", "));

// ── 2 · dónde se abre: «Gestionar grupos», que es la página del referente
c(/gs-prestreno/.test(CONS) && /href="prestreno\.html"/.test(CONS),
  "🔴 se abre desde «Gestionar grupos» (la página que solo ve el referente)");
c(/gs-prestreno/.test(CSS), "   y tiene su tarjeta con estilo propio");

// ── 3 · 🔴 ni un dato a mano: todo sale de los globales del sitio
[["SG_SEMANAS", "las semanas"], ["SG_PLANETAS", "los planetas"], ["SG_RETOS", "los retos"],
 ["SG_CAPITULOS", "los capítulos"], ["SG_CROMOS", "la Tripulación Cero"], ["SG_TOPE_SEMANA", "el tope semanal"],
 ["SG_PER_ESCUELA", "la Nave Escuela"]].forEach(function (x) {
  c(JS.indexOf("window." + x[0]) >= 0 && HTML.indexOf("window." + x[0] + "=") >= 0, "🔴 " + x[1] + " salen del sitio, no escritos a mano");
});
// los ocho planetas y las semanas, de verdad, en el HTML servido
const plan = (HTML.match(/window\.SG_PLANETAS=(\[.*?\]\]);/) || [, "[]"])[1];
c((JSON.parse(plan) || []).length === 8, "   los ocho planetas viajan con la página", (JSON.parse(plan) || []).length);
c(/window\.SG_PER_ESCUELA="nave-escuela"/.test(HTML), "   y el grupo para trastear, por su identificador de verdad");

// ── 4 · se maneja como la sesión de clase (ese es el argumento: enseña el producto funcionando)
c(/class="mazo pr-mazo"/.test(JS) && /barra-pasos/.test(JS) && /class="nav ant"/.test(JS),
  "🔴 usa el mazo de la sesión: mismas flechas, misma barra de abajo");
c(/ArrowRight/.test(JS) && /ArrowLeft/.test(JS), "   y se pasa con las flechas del teclado");
c(/requestFullscreen/.test(JS), "   con pantalla completa, que es para proyectar");

// ── 5 · lo interactivo: el mapa de planetas y las preguntas
c(/data-pl=/.test(JS) && /function fichaPlaneta/.test(JS), "🔴 el mapa: pulsar un planeta abre su tema");
c(/Aquí se quedó/.test(JS) && /tarjetas\/' \+ esc\(T\.clave\)/.test(JS),
  "   con el tripulante que se quedó allí y su carta");
c(/pr-q/.test(JS) && /aria-expanded/.test(JS), "🔴 las preguntas se abren de una en una (da tiempo a contestar)");
c((JS.match(/\["¿/g) || []).length >= 5, "   y son las cinco que siempre salen", (JS.match(/\["¿/g) || []).length);
c(/data-video=/.test(JS), "   el vídeo de bienvenida se ve dentro, con el visor de la casa");

// ── 6 · y el guion está en la guía, no duplicado aquí
const GUIA = fs.readFileSync(path.join(R, "..", "GUIA_PROFES_PDF.md"), "utf8");
c(/# PARTE 0 · El guion de la reunión/.test(GUIA), "🔴 la guía del profesorado lleva su guion (Parte 0)");
c(/Presentar STARGATE al equipo/.test(GUIA), "   y dice dónde está la presentación montada");

console.log("\n  Batería 103 · la presentación para el equipo (20-sep)");
console.log("  " + (ok + fallos.length) + " comprobaciones, " + fallos.length + " fallos");
process.exit(fallos.length ? 1 : 0);
