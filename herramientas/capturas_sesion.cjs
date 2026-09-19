'use strict';
/**
 * 19-sep · LAS CAPTURAS DE «CONFIGURAR LA SESIÓN». Norberto: «añade capturas de cada diapositiva para que lo sepa el
 * docente; si no, no sabe lo que es cada cosa». Recorre la sesión del grupo del laboratorio (emuladores) semana a semana
 * y, de cada sección (data-sec de la barra de pasos), guarda la primera diapositiva que encuentra, a 480×270.
 *
 *   (emuladores arrancados)  node herramientas/capturas_sesion.cjs
 * Salen en assets/img/sesion/<seccion>.jpg (las mismas claves que SESION_SECCIONES).
 */
const fs = require("fs"), path = require("path"), { execFileSync } = require("child_process");
const L = require("../pruebas/laboratorio.cjs");
const OUT = path.join(__dirname, "..", "assets", "img", "sesion");
(async () => {
  if (!(await L.emuladoresVivos())) { console.log("Sin emuladores."); process.exit(3); }
  fs.mkdirSync(OUT, { recursive: true });
  await L.reiniciar(); await L.arrancar(false);
  const p = await L.persona("capturas");
  await p.ir("entrar.html"); await p.entrarComo("rita@lab.test", "Rita Referente");
  const hechas = {};
  for (const sem of [10, 1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15]) {
    await p.ir("sesion.html?per=lab-clase&sem=" + sem + "&embed=1");
    if (!(await p.hasta("document.querySelectorAll('.barra-pasos .p[data-sec]').length>2", 90))) { console.log("  semana " + sem + ": no cargó"); continue; }
    await L.dormir(1500);
    const pasos = JSON.parse(await p.js("JSON.stringify([].slice.call(document.querySelectorAll('.barra-pasos .p')).map(function(b){return b.getAttribute('data-sec')}))"));
    for (let i = 0; i < pasos.length; i++) {
      const k = pasos[i]; if (!k || hechas[k]) continue;
      await p.js("document.querySelectorAll('.barra-pasos .p')[" + i + "].click(); 1");
      await L.dormir(2200);
      const png = path.join(OUT, "_" + k + ".png"); await p.foto(png);
      // 1280×860 → la franja 16:9 de arriba (la diapositiva), a 480×270
      execFileSync("python3", ["-c", "from PIL import Image;im=Image.open(" + JSON.stringify(png) + ").convert('RGB').crop((0,0,1280,720)).resize((480,270),Image.LANCZOS);im.save(" + JSON.stringify(path.join(OUT, k + ".jpg")) + ",quality=80,optimize=True)"]);
      fs.unlinkSync(png); hechas[k] = sem; console.log("  " + k + " ← semana " + sem);
    }
  }
  console.log("hechas:", Object.keys(hechas).length, JSON.stringify(hechas));
  await p.cerrar(); await L.parar(); process.exit(0);
})().catch(e => { console.error(e); L.parar(); process.exit(2); });
