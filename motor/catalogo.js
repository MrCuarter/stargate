'use strict';
/**
 * STARGATE · EL CATÁLOGO, EN UN SOLO SITIO
 *
 * Todo lo que define la experiencia —los retos, las insignias, los temas, los niveles, las
 * recompensas, los cromos y los héroes— vive en `apps-script/Datos.gs` desde el primer día. Al
 * mudarnos a Firestore, la tentación evidente es copiarlo a mano al nuevo motor. No.
 *
 * 🔴 «Un dato, un sitio». Este módulo LEE Datos.gs y devuelve su contenido como objeto. Si mañana
 * cambia un xp o se añade un reto, el motor nuevo se entera solo. El día que Apps Script se apague
 * del todo, este fichero seguirá siendo la única puerta al catálogo y bastará con moverlo de sitio.
 *
 * No ejecuta nada de Google: Datos.gs son declaraciones (`var X = [...]`) y un puñado de funciones
 * auxiliares. Se evalúa en una caja de arena vacía.
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const RUTA_DATOS = process.env.STARGATE_DATOS
  ? path.resolve(process.env.STARGATE_DATOS)
  : path.join(__dirname, "..", "apps-script", "Datos.gs");

// stargate.js lleva la ficha larga de cada insignia (nombre, tipo, cómo se gana, la cita). Es lo
// que se le enseña al recluta, y también vive en un solo sitio: la web lo usa tal cual.
const RUTA_BADGE = path.join(__dirname, "..", "assets", "js", "stargate.js");

function leerDatos() {
  const caja = {};
  // Datos.gs llama a funciones de Google en tiempo de ejecución, nunca al declarar. Estos huecos
  // existen solo para que el fichero se evalúe entero sin reventar.
  caja.PropertiesService = { getScriptProperties: () => ({ getProperty: () => "" }) };
  caja.Utilities = { formatDate: () => "" };
  caja.Logger = { log: () => {} };
  vm.createContext(caja);
  vm.runInContext(fs.readFileSync(RUTA_DATOS, "utf8"), caja, { filename: "Datos.gs" });
  return caja;
}

// Las fichas de insignia viven dentro de una función en stargate.js. Se extrae el objeto literal
// `BADGE={...}` y se evalúa suelto: leer el fichero entero arrastraría el DOM del navegador.
function leerInsignias() {
  const txt = fs.readFileSync(RUTA_BADGE, "utf8");
  const i = txt.indexOf("var BADGE=");
  if (i < 0) throw new Error("No encuentro el catálogo de insignias (BADGE) en assets/js/stargate.js");
  const abre = txt.indexOf("{", i);
  let n = 0, fin = -1;
  for (let k = abre; k < txt.length; k++) {
    if (txt[k] === "{") n++;
    else if (txt[k] === "}") { n--; if (n === 0) { fin = k + 1; break; } }
  }
  if (fin < 0) throw new Error("El catálogo de insignias está sin cerrar en stargate.js");
  return JSON.parse(txt.slice(abre, fin));
}

/**
 * El catálogo completo, con las listas ya convertidas de «array de arrays» a objetos con nombre.
 * Los arrays de Datos.gs son cómodos de escribir a mano pero ilegibles a los seis meses; aquí se
 * les pone nombre UNA vez y el resto del motor nuevo ya no vuelve a ver un `x[3]`.
 */
function catalogo() {
  const D = leerDatos();
  const reto = r => ({ id: r[0], titulo: r[1], insignias: r[2], xp: r[3], tema: r[4] });
  const cromo = c => ({ clave: c[0], nombre: c[1], peso: c[2], rareza: c[3], serie: c[4] });
  const heroe = h => ({ clave: h[0], nombre: h[1], peso: h[2], rareza: h[3] });
  const recompensa = r => ({ nombre: r[0], coste: r[1], maximo: r[2], descripcion: r[3], desdeSemana: r[4], tipo: r[5] });
  const nivel = n => ({ nivel: n[0], xp: n[1], rango: n[2], titulo: n[3] });
  const tema = (t, i) => (t ? { n: i, planeta: t[0], materia: t[1], clave: t[2] } : null);

  return {
    version: 1,
    fuente: "stargate",
    retos: { REGULAR: D.RETOS_REGULAR.map(reto), PUA: D.RETOS_PUA.map(reto) },
    derivadas: D.DERIVADAS.map(d => ({ insignia: d[0], xp: d[1], requiere: d[2] })),
    insignias: leerInsignias(),
    temas: D.TEMAS.map(tema).filter(Boolean),
    rangos: D.RANGOS,
    niveles: D.NIVELES.map(nivel),
    creditos: D.CREDITOS,
    xpReclutamiento: D.XP_RECLUTAMIENTO,
    xpViaje: D.XP_VIAJE,
    semanas: D.SEMANAS_PER,
    semanaDelTema: D.SEMANA_DEL_TEMA,
    semanaArsenal: D.SEMANA_ARSENAL,
    bonus: { planeta: D.BONUS_PLANETA, racha: D.BONUS_RACHA, album: D.BONUS_ALBUM,
             serie: D.BONUS_SERIE, tutorial: D.BONUS_TUTORIAL },
    semanasCanjeExtra: D.SEMANAS_CANJE_EXTRA,
    recompensas: D.RECOMPENSAS_INICIALES.map(recompensa),
    cromos: D.CROMOS.map(cromo),
    heroes: D.HEROES.map(heroe),
    series: D.SERIES_ALBUM.map(s => ({ clave: s[0], serie: s[1], nombre: s[2] })),
    moneda: D.MONEDA,
    imagenRecompensa: D.IMG_RECOMPENSA || {}
  };
}

module.exports = { catalogo, leerDatos, leerInsignias, RUTA_DATOS };

// `node motor/catalogo.js` lo vuelca por pantalla: útil para mirarlo sin escribir código.
if (require.main === module) process.stdout.write(JSON.stringify(catalogo(), null, 2) + "\n");
