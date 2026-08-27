'use strict';
// 19 · LO QUE SE PEGA DICE LO MISMO QUE LO QUE SE ESCRIBIÓ
// La regla de oro del proyecto es pegar la copia 100 % ASCII. Tenía un agujero: los caracteres
// FUERA DEL BMP (los emojis 🔴🟡🟢) no caben en «\uXXXX» y hay que escribirlos como par surrogado.
// Con el escape de cuatro dígitos, «ὓ4» lo lee JavaScript como ὓ + un «4», y el semáforo
// del parte de salud salía en pantalla como «ù4». Se vio EN PRODUCCIÓN el 26-ago, no aquí: el banco
// compara comportamiento, no glifos. Esta batería cierra ese hueco.
const fs = require("fs");
const path = require("path");
const E = require("./entorno.js");
const { comprobar: c, igual } = E;
console.log("\n▶ 19 · La copia ASCII dice lo mismo que el original (emojis incluidos)");

const RAIZ = path.join(__dirname, "..");
// v3.30 · El parte de salud se mudó a Bonus.gs (Code.gs ya no cabía), y con él el semáforo. La
// regla vale para los DOS ficheros que se pegan a mano, así que se miran los dos.
const ORIG = fs.readFileSync(path.join(RAIZ, "apps-script", "Code.gs"), "utf8");
const ASCII = fs.readFileSync(path.join(RAIZ, "assets", "descargas", "Code.gs.ascii.txt"), "utf8");
const ORIG_B = fs.readFileSync(path.join(RAIZ, "apps-script", "Bonus.gs"), "utf8");
const ASCII_B = fs.readFileSync(path.join(RAIZ, "assets", "descargas", "Bonus.gs.ascii.txt"), "utf8");

// ---------------------------------------------------------------- a) la copia es ASCII de verdad
igual([...ASCII].filter(ch => ch.charCodeAt(0) > 127).length, 0, "la copia no tiene un solo byte no-ASCII");
igual([...ASCII_B].filter(ch => ch.charCodeAt(0) > 127).length, 0, "y la de Bonus.gs, tampoco");

// ---------------------------------------------------------------- b) ningún surrogado suelto
// OJO: «cinco dígitos» no se puede detectar contando caracteres — JavaScript lee SIEMPRE cuatro, y
// «\u00abc» es un escape correcto seguido de una «c». Lo que sí delata el fallo es un surrogado ALTO
// (D800-DBFF) sin su pareja detrás: eso es un emoji partido por la mitad.
const escapes = [...ASCII.matchAll(/\\u([0-9a-fA-F]{4})/g)].map(m => parseInt(m[1], 16));
let sueltos = 0;
for (let i = 0; i < escapes.length; i++) {
  const v = escapes[i];
  if (v >= 0xD800 && v <= 0xDBFF) {                 // alto: el siguiente TIENE que ser bajo
    const sig = escapes[i + 1];
    if (!(sig >= 0xDC00 && sig <= 0xDFFF)) sueltos++; else i++;
  } else if (v >= 0xDC00 && v <= 0xDFFF) sueltos++; // bajo sin alto delante
}
igual(sueltos, 0, "🔴 ningún surrogado suelto: no hay emojis partidos por la mitad");

// ---------------------------------------------------------------- c) cada carácter fuera del BMP
// aparece en la copia como PAR surrogado, y JavaScript lo vuelve a leer igual
function paresDe(ch) {
  const o = ch.codePointAt(0) - 0x10000;
  const alto = 0xD800 + (o >> 10), bajo = 0xDC00 + (o & 0x3FF);
  return "\\u" + alto.toString(16).padStart(4, "0") + "\\u" + bajo.toString(16).padStart(4, "0");
}
// 🔴 Solo se exige que sobreviva lo que va DENTRO DE CADENAS: eso es lo que acaba en la pantalla de
// alguien (el semáforo del parte de salud). Lo de los comentarios se translitera a posta, y exigirlo
// aquí daba un falso rojo en cuanto alguien escribía un emoji nuevo en un comentario.
// La lista la publica el propio conversor (_ascii_gs.py → *.encadena.json): un solo analizador.
[["Code.gs", "Code.gs.encadena.json", ORIG, ASCII],
 ["Bonus.gs", "Bonus.gs.encadena.json", ORIG_B, ASCII_B]].forEach(([nombre, json, orig, ascii]) => {
  const EN_CADENA = JSON.parse(fs.readFileSync(path.join(RAIZ, "assets", "descargas", json), "utf8"));
  EN_CADENA.forEach(ch => c(orig.indexOf(ch) >= 0,
    "«" + ch + "» sale de una cadena del " + nombre + " de verdad (el conversor no se lo inventa)"));
  EN_CADENA.filter(ch => ch.codePointAt(0) > 0xFFFF).forEach(ch => {
    const par = paresDe(ch);
    c(ascii.indexOf(par) >= 0, "🔴 «" + ch + "» va como par surrogado en " + nombre + " (" + par + ")");
    igual(eval('"' + par + '"'), ch, "y JavaScript lo lee otra vez como «" + ch + "»");
  });
});
const TODO_EN_CADENA = ["Code.gs.encadena.json", "Bonus.gs.encadena.json"]
  .reduce((L, j) => L.concat(JSON.parse(fs.readFileSync(path.join(RAIZ, "assets", "descargas", j), "utf8"))), []);
const fuera = TODO_EN_CADENA.filter(ch => ch.codePointAt(0) > 0xFFFF);
c(fuera.length > 0, "lo que se pega pone " + fuera.length + " carácter(es) fuera del BMP en pantalla: " + fuera.join(" "));

// ---------------------------------------------------------------- d) el semáforo del parte de salud
// es lo que se vio roto en producción: se comprueba tal cual, en la copia que se pega
const m = ASCII_B.match(/var icono = \{[^}]*\}/);
c(!!m, "el semáforo del parte de salud está en la copia de Bonus.gs");
if (m) {
  const iconos = eval("(" + m[0].replace("var icono = ", "") + ")");
  igual(iconos.mal, "🔴", "🔴 rojo = rojo (no «ù4»)");
  igual(iconos.aviso, "🟡", "ámbar = ámbar");
  igual(iconos.ok, "🟢", "verde = verde");
}

// ---------------------------------------------------------------- e) y las dos copias se comportan igual
// (lo comprueba `run.js --ascii` corriendo TODAS las baterías contra la copia; aquí solo se deja
// constancia de que los dos ficheros existen y no se han quedado desincronizados en tamaño)
const G1 = E.nuevoMundo();
c(typeof G1.salud_ === "function", "el Code.gs cargado expone salud_()");
c(Math.abs(ASCII.length - ORIG.length) < ORIG.length * 0.15,
  "las dos copias tienen un tamaño parecido (" + ORIG.length + " vs " + ASCII.length + ")");

E.resumen("La copia ASCII dice lo mismo");
