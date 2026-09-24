'use strict';
/**
 * 24-sep · LAS CAPTURAS DEL «CÓMO SE HACE» DE LA PRESENTACIÓN (prestreno.js). Norberto: «en el de profes normales podrías
 * añadir capturas de iniciar sesión y cómo cambiar el Genially del grupo o los mensajes del foro, es algo que muchos harán».
 * Recorre el laboratorio (emuladores) como Rita y fotografía, a 2x y recortado a su caja:
 *   · el panel de control con «Cambiar el enlace» abierto  → assets/img/pres/guia/panel.webp
 *   · el mensaje del foro con «Editar» abierto              → assets/img/pres/guia/foro.webp
 * (La puerta, crear un grupo, el equipo y el grupo listo salen de la guía en PDF, ya anotadas: `guia_pdf/anotadas/`.)
 *
 *   (emuladores arrancados)  node herramientas/capturas_presentacion.cjs
 */
const fs = require("fs"), path = require("path"), { execFileSync } = require("child_process");
const L = require("../pruebas/laboratorio.cjs");
const OUT = path.join(__dirname, "..", "assets", "img", "pres", "guia");
const P = "lab-clase";
(async () => {
  if (!(await L.emuladoresVivos())) { console.log("Sin emuladores."); process.exit(3); }
  fs.mkdirSync(OUT, { recursive: true });
  await L.reiniciar(); await L.arrancar(false);
  const p = await L.persona("capturas-pres");
  await p.ir("entrar.html"); await p.entrarComo("rita@lab.test", "Rita Referente");
  await p.js("localStorage.setItem('sgTourDone','1'); 1");
  await p.env("Emulation.setDeviceMetricsOverride", { width: 1280, height: 1000, deviceScaleFactor: 2, mobile: false });
  await p.ir("consola.html?per=" + P); await p.hasta("!!document.getElementById('pt-panel-ed') && !!document.getElementById('ht-foro-ed')", 60);
  await L.dormir(1500);
  // fuera lo que tapa (bienvenidas, logros, NEBULA)
  const limpiar = () => p.js("[].slice.call(document.querySelectorAll('.tour-invite,.neb-capa,.tour-pop,.tour-velo,.logro-capa,.sgp-capa')).forEach(function(x){x.remove()}); " +
    "(function(){ var b=[].slice.call(document.querySelectorAll('button')).filter(function(x){ return /A la nave|Entendido/.test(x.textContent) && x.offsetParent; })[0]; if(b) b.click(); })(); 1");
  await limpiar(); await L.dormir(600); await limpiar();
  const foto = async (sel, nombre, alto) => {
    // (la barra de arriba es fija: se aparta para que no tape la caja)
    await p.js("[].slice.call(document.querySelectorAll('nav.nav,.nave-barra,.nave-barra-u')).forEach(function(n){ n.style.visibility='hidden'; }); (function(){ var e=document.querySelector(" + JSON.stringify(sel) + "); window.scrollTo(0, e.getBoundingClientRect().top + scrollY - 120); return 1; })()");
    await L.dormir(900);
    const r = await p.js("(function(){ var r=document.querySelector(" + JSON.stringify(sel) + ").getBoundingClientRect(); return {x:r.left+scrollX, y:r.top+scrollY, w:r.width, h:r.height}; })()");
    const clip = { x: Math.max(0, r.x - 8), y: Math.max(0, r.y - 8), width: r.w + 16, height: Math.min(alto || 900, r.h + 16), scale: 1 };
    const { data } = await p.env("Page.captureScreenshot", { format: "png", clip });
    const png = path.join(OUT, "_" + nombre + ".png"); fs.writeFileSync(png, Buffer.from(data, "base64"));
    execFileSync("python3", ["-c", "from PIL import Image;im=Image.open(" + JSON.stringify(png) + ").convert('RGB');im.thumbnail((1600,1600));im.save(" + JSON.stringify(path.join(OUT, nombre + ".webp")) + ",quality=84)"]);
    fs.unlinkSync(png); console.log("  ✓ " + nombre + " (" + Math.round(clip.width) + "×" + Math.round(clip.height) + ")");
  };
  // el panel: «Cambiar el enlace» abierto, con una dirección de ejemplo escrita
  await p.js("document.getElementById('pt-panel-ed').click(); 1"); await L.dormir(500);
  await p.js("var i=document.getElementById('pt-panel-in'); if(i){ i.value='https://view.genially.com/tu-panel-de-control'; } 1");
  await p.js("var m=document.querySelector('.pt-panel-marco'); if(m) m.style.maxHeight='260px'; 1");
  await foto(".pt-panel", "panel", 760);
  // el mensaje del foro: «Editar» abierto
  await p.js("document.getElementById('ht-foro-ed').click(); 1"); await L.dormir(600);
  // solo la cabecera (Editar · Ver todos · Copiar) y la caja de escribir: la carta entera ya sale en otra diapositiva
  await p.js("[].slice.call(document.querySelectorAll('#ht-foro > *')).forEach(function(x){ if(!x.matches('.ht-foro-cab,#ht-foro-caja,p')) x.style.display='none'; }); 1");
  await foto("#ht-foro", "foro", 820);
  await p.cerrar(); await L.parar(); process.exit(0);
})().catch(e => { console.error(e); L.parar(); process.exit(2); });
