'use strict';
/**
 * BATERÍA 81 · LO QUE UN GRUPO PUA NO TIENE (16-sep-2026).
 *
 * Norberto: «en PUA podríamos capar ciertas opciones. Nooo hay sorteo, podemos quitar zoco, ¿algo más?». Decidido por
 * él: fuera el **Gran Sorteo**, el **Zoco** y el **Hangar** (el sobre épico y las dos cápsulas caras), y los **logros
 * de a bordo pasan a 12 en 4 cubiertas** —el Contramaestre llega al completar esas cuatro—, porque sin Zoco ni sorteo
 * cuatro de ellos serían imposibles y el premio, inalcanzable.
 *
 * Un PUA dura 8 semanas: así se queda con un capítulo por semana (Nave, Mercado, héroes, adornos, ofertas, logros,
 * simulador y Arsenal) en vez de diez apretados.
 *
 * Esto comprueba que lo dicen lo mismo los cuatro sitios que tienen que decirlo: los datos de la web, el paquete que
 * se siembra en cada grupo nuevo, lo que ven la Nave, la consola y la sesión, y el servidor (GamificaPro).
 */
const fs = require("fs"), path = require("path"), { execFileSync } = require("child_process"), { pathToFileURL } = require("url");
const RAIZ = path.resolve(__dirname, ".."), GP = "/Users/nor/Claude/vibewebs/gamificapro/functions";
let ok = 0; const fallos = [];
function c(cierto, nombre, detalle) { if (cierto) { ok++; return; } fallos.push(nombre + (detalle ? " — " + detalle : "")); }
const leer = f => fs.readFileSync(path.join(RAIZ, f), "utf8");

(async () => {
  // 1 · los datos (un dato, un sitio: _site_data.py)
  const D = JSON.parse(execFileSync("python3", ["-c",
    "import json,_site_data as D;print(json.dumps({'S':D.SIN_PUA,'caps':[{'clave':c['clave'],'titulo':c['titulo'],'semanas':c['semanas'],'mercado':c['mercado']} for c in D.CAPITULOS]," +
    "'H':[h[0] for h in D.HITOS_A_BORDO],'C':[x[0] for x in D.CUBIERTAS_A_BORDO]}))"], { cwd: RAIZ, encoding: "utf8" }));
  const S = D.S, pua = D.caps.filter(x => x.semanas.PUA != null);

  c(JSON.stringify(S.capitulos) === JSON.stringify(["c6", "c8", "c5"]), "🔴 en PUA no hay Gran Sorteo (c6), Hangar (c8) ni Zoco (c5)", JSON.stringify(S.capitulos));
  c(pua.length === 8 && pua.every((x, i) => x.semanas.PUA === i + 1),
    "🔴 y quedan ocho capítulos, uno por semana", pua.map(x => x.clave + ":" + x.semanas.PUA).join(" "));
  c(S.tienda.length === 5 && ["sorteo", "sobre_raro", "sobre_epico", "capsula_elite", "capsula_legendaria"].every(t => S.tienda.indexOf(t) >= 0),
    "   la tienda pierde lo que vendían esos capítulos", S.tienda.join(","));
  c(S.sorteo === true, "   y el grupo nace sin sorteo");
  c(JSON.stringify(S.cubiertas) === JSON.stringify(["zoco"]) && JSON.stringify(S.hitos) === JSON.stringify(["cambio", "sorteo", "trato", "zoco"]),
    "🔴 los logros de a bordo en PUA: 12 en 4 cubiertas (sin la del Zoco ni el del sorteo)", JSON.stringify(S.hitos));
  c(D.H.length - S.hitos.length === 12 && D.C.length - S.cubiertas.length === 4, "   las cuentas cuadran con el catálogo",
    (D.H.length - S.hitos.length) + " logros · " + (D.C.length - S.cubiertas.length) + " cubiertas");
  c(S.hitos.every(k => D.H.indexOf(k) >= 0) && S.cubiertas.every(k => D.C.indexOf(k) >= 0), "   y lo quitado existe (nada de claves fantasma)");

  // 2 · el paquete del grupo (motor/paquete.js): lo que se siembra de verdad
  const { paquete } = require(path.join(RAIZ, "motor", "paquete.js"));
  const cat = require(path.join(RAIZ, "motor", "catalogo.json"));
  c(JSON.stringify((cat.sinPua || {}).capitulos) === JSON.stringify(S.capitulos), "el catálogo congelado lleva la misma lista", JSON.stringify(cat.sinPua || {}));
  const grupo = t => paquete({ id: "x", nombre: "X", tipo: t, inicio: "2026-10-05",
    docentes: [{ nombre: "D", correo: "d@x.es", rol: "referente" }], referente: "d@x.es" }, cat);
  const reg = grupo("REGULAR"), pu = grupo("PUA");
  const tipos = p => p.recompensas.filter(r => r.inStore).map(r => r.stargateTipo);
  c(S.tienda.every(t => tipos(reg).indexOf(t) >= 0), "🔴 un grupo REGULAR sigue teniendo todo", tipos(reg).join(","));
  c(S.tienda.every(t => tipos(pu).indexOf(t) < 0), "🔴 y un PUA no siembra nada de lo quitado", tipos(pu).join(","));
  c(pu.recompensas.filter(r => /sorteo/.test(r.stargateTipo || "")).length === 0
    && reg.recompensas.filter(r => /sorteo/.test(r.stargateTipo || "")).length > 0, "   ni el Gran Sorteo con su premio y su papeleta");
  c(tipos(pu).indexOf("cromo") >= 0 && tipos(pu).indexOf("heroe") >= 0 && tipos(pu).indexOf("nota") >= 0,
    "   pero sí lo que se queda: sobres, héroes, adornos y el Arsenal");
  c(reg.recompensas.filter(r => r.inStore).length - pu.recompensas.filter(r => r.inStore).length === 5,
    "   y son exactamente cinco recompensas menos", (reg.recompensas.filter(r => r.inStore).length) + " vs " + (pu.recompensas.filter(r => r.inStore).length));

  // 3 · la web lo mira por tipo de grupo (no lo esconde a mano)
  const N = leer("assets/js/recluta.js"), K = leer("assets/js/consola.js"), SE = leer("assets/js/sesion.js");
  c(/function capsTipo\(\)/.test(N) && !/\bCAPS\.filter\(/.test(N), "la Nave filtra los capítulos por el tipo del grupo");
  c(/get hitos\(\)/.test(N) && /SINPUA/.test(N), "   y sus logros: en PUA, sin los del Zoco ni el del sorteo");
  c(/SG_SIN_PUA/.test(K) && /esPUA/.test(K), "   la consola cuenta los mismos");
  c(/SG_SIN_PUA/.test(SE), "   y la sesión proyectada, también");
  ["recluta.html", "consola.html", "sesion.html", "clase.html", "batalla.html"].forEach(p =>
    c(/window\.SG_SIN_PUA=/.test(leer(p)), "   la lista llega a " + p));

  // 4 · el servidor (GamificaPro)
  let A = null, Z = null;
  try { A = await import(pathToFileURL(path.join(GP, "stargateABordo.js")).href); } catch (e) { A = null; }
  try { Z = await import(pathToFileURL(path.join(GP, "stargateZoco.js")).href); } catch (e) { Z = null; }
  c(!!A && !!Z, "🔴 existen el catálogo y el Zoco del servidor");
  if (A) {
    c(JSON.stringify(A.SIN_PUA.hitos.slice().sort()) === JSON.stringify(S.hitos.slice().sort())
      && JSON.stringify(A.SIN_PUA.cubiertas) === JSON.stringify(S.cubiertas),
      "🔴 servidor y web: los MISMOS logros fuera en PUA", JSON.stringify(A.SIN_PUA));
    c(Object.keys(A.hitosDe("PUA")).length === 12 && Object.keys(A.cubiertasDe("PUA")).length === 4
      && Object.keys(A.hitosDe("REGULAR")).length === 16, "   12 logros y 4 cubiertas en PUA; 16 y 5 en regular");
    const c9 = D.caps.filter(x => x.clave === A.CAPITULO.clave)[0];
    c(!!c9 && c9.semanas.PUA === A.CAPITULO.semana.PUA && c9.semanas.REGULAR === A.CAPITULO.semana.REGULAR,
      "   y se presentan la misma semana que dice la web", JSON.stringify(c9 && c9.semanas) + " · " + JSON.stringify(A.CAPITULO.semana));
  }
  if (Z) {
    c(Z.zocoAbierto({ tipo: "PUA", inicio: "2020-01-06" }) === false, "🔴 el servidor no abre el Zoco en PUA (aunque hayan pasado años)");
    c(Z.zocoAbierto({ tipo: "PUA", inicio: "2020-01-06", capitulosAbiertos: { c5: true } }) === false, "   ni forzándolo desde el calendario");
    c(Z.zocoAbierto({ tipo: "REGULAR", inicio: "2020-01-06" }) === true, "   y en REGULAR sigue abriéndose");
  }

  console.log("\n  Batería 81 · lo que un grupo PUA no tiene");
  console.log("  " + ok + " comprobaciones, " + fallos.length + " fallos");
  fallos.forEach(f => console.log("   ✗ " + f));
  process.exit(fallos.length ? 1 : 0);
})();
