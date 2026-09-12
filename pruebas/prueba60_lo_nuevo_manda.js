'use strict';
// 60 · LO NUEVO ES LO QUE MANDA
//
// El 12-sep Norberto lo zanjó: «Vamos a usar LO NUEVO, el legacy ahora me da igual». Hasta ese
// momento el sistema tenía un fallo que no daba error y que nadie veía en las pruebas: el motor por
// defecto era «apps». Todo lo que se verificaba en producción funcionaba porque quien lo probaba
// añadía `?motor=firestore` a mano. El enlace que un docente reparte NO lo lleva — así que el
// alumnado entraba al sistema VIEJO mientras dábamos el nuevo por bueno.
//
// Esta batería existe para que ese interruptor no se vuelva atrás en silencio. Un fallo aquí no
// rompe ninguna página: simplemente devuelve todo el curso al sistema archivado.
const E = require("./entorno.js");
const { comprobar: c, contiene } = E;
const fs = require("fs"), path = require("path");
const raiz = f => fs.readFileSync(path.join(__dirname, "..", f), "utf8");
console.log("\n▶ 60 · Lo nuevo es lo que manda");

// ---------------------------------------------------------------- a) el interruptor
const build = raiz("_build_site.py");
c(/MOTOR_POR_DEFECTO\s*=\s*"firestore"/.test(build),
  "🔴 MOTOR_POR_DEFECTO es «firestore»: el enlace normal entra al sistema nuevo");
c(!/MOTOR_POR_DEFECTO\s*=\s*"apps"/.test(build),
  "   y no queda ninguna asignación a «apps» rondando");

// ---------------------------------------------------------------- b) y llega al HTML
// El valor de Python no sirve de nada si no viaja a la página: esto es lo que lee el navegador.
["recluta.html", "clase.html", "panel.html", "sesion.html", "tickets.html"].forEach(function (f) {
  contiene(raiz(f), 'SG_MOTOR="firestore"', f + " nace en el motor nuevo");
});

// ---------------------------------------------------------------- c) la vuelta atrás sigue ahí
// Girar el interruptor no puede ser un viaje de ida: si el motor nuevo falla en mitad de una clase,
// `?motor=apps` tiene que devolver el sistema de siempre sin tocar ni un fichero.
c(/q\.get\("motor"\)\s*\|\|\s*window\.SG_MOTOR/.test(build),
  "🔴 la URL manda sobre el valor por defecto: ?motor=apps sigue siendo la salida de emergencia");

// ---------------------------------------------------------------- d) las páginas solo-nuevas
// aula, llamada y alistarse no existen en el sistema viejo: cargan el motor SIEMPRE, sin preguntar.
// Si alguna dependiera del interruptor, un ?motor=apps las dejaría en blanco.
["aula.html", "llamada.html", "alistarse.html"].forEach(function (f) {
  const h = raiz(f);
  c(/motor\/paquete\.js/.test(h) && /assets\/js\/motor\.js/.test(h),
    f + " carga el motor nuevo sin depender del interruptor");
});

// ---------------------------------------------------------------- e) la portada lleva a lo nuevo
// 🔴 El fallo que esto cierra: la rejilla de la portada mandaba al profesorado referente a
// `profes.html`, que habla DIRECTAMENTE con Apps Script (no pasa por `fuente.js`, mírese su
// `post()`). Es decir: la puerta principal de la web llevaba al sistema archivado.
const idx = raiz("index.html");
contiene(idx, 'href="consola.html"', "🔴 la portada lleva al puesto de mando nuevo");
contiene(idx, 'href="crear.html"', "   y a crear un grupo sin hojas de cálculo");
c(!/href="profes\.html"/.test(idx),
  "🔴 y ya NO ofrece el panel viejo con PIN como si fuera el camino normal");

// ---------------------------------------------------------------- f) el aula se puede encontrar
// Una página que no enlaza nadie no existe. El aula y la llamada viven dentro del Genially, pero el
// docente tiene que poder abrirlas para copiar su enlace: se ofrecen desde su sala.
const clase = raiz("assets/js/clase.js");
contiene(clase, "aula.html?per=", "la sala del docente enlaza el aula");
contiene(clase, "llamada.html?per=", "   y la llamada a filas");

// ---------------------------------------------------------------- g) y se incrustan de verdad
// 🔴 El fallo: las dos páginas hechas para vivir DENTRO del Genially eran las únicas que no se
// ponían `body.embed`. Su propia documentación prometía «?embed=1 se incrusta sin cabecera ni pie»
// y no lo hacía nadie: al pegarlas en una presentación aparecía el menú entero de la web —«Mi
// clase», «Registro», «Grupos»— encima de lo que se quería enseñar. Sin error, sin aviso.
["assets/js/aula.js", "assets/js/llamada.js"].forEach(function (f) {
  c(/get\("embed"\)\s*===\s*"1"[\s\S]{0,80}classList\.add\("embed"\)/.test(raiz(f)),
    "🔴 " + f.split("/").pop() + " se quita la cabecera al incrustarse");
});
// y la hoja de estilos tiene que seguir sabiendo esconderla: la clase sola no pinta nada
contiene(raiz("assets/css/stargate.css"), "body.embed .nav",
  "   y la hoja de estilos esconde el menú cuando esa clase está puesta");

E.resumen("Lo nuevo es lo que manda");
