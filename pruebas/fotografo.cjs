'use strict';
/**
 * EL FOTÓGRAFO DEL LABORATORIO — capturas de página entera de las pantallas clave, en escritorio y
 * en móvil, con sesión de verdad (emuladores), para la revisión VISUAL. Y una medición: todo texto
 * visible por debajo de 12 px se apunta, porque «letra pequeña» es lo que primero se queja quien
 * lo lee en un portátil.
 *   node pruebas/fotografo.cjs     (con los emuladores arrancados y el laboratorio sembrado)
 */
const L = require("./laboratorio.cjs");
const fs = require("fs");
const OUT = "/tmp/lab-fotos/ver"; fs.mkdirSync(OUT, { recursive: true });
const PANTALLAS = [
  ["ana@lab.test", "Ana", "recluta.html?per=lab-clase", "nave-minave"],
  ["ana@lab.test", "Ana", "recluta.html?per=lab-clase#retos", "nave-retos"],
  ["ana@lab.test", "Ana", "recluta.html?per=lab-clase#botin", "nave-botin"],
  ["ana@lab.test", "Ana", "recluta.html?per=lab-clase#mercado", "nave-mercado"],
  ["rita@lab.test", "Rita", "consola.html", "consola-grupos"],
  ["rita@lab.test", "Rita", "consola.html?per=lab-clase", "consola-gente"],
  ["rita@lab.test", "Rita", "aula.html?per=lab-clase", "aula"],
  ["rita@lab.test", "Rita", "sesion.html?per=lab-clase", "sesion"],
  [null, null, "index.html", "portada"],
  [null, null, "entrar.html", "entrar"],
];
(async () => {
  await L.arrancar(false);
  const pequenas = [], desbordes = [];
  for (const movil of [false, true]) {
    for (const [correo, nombre, url, id] of PANTALLAS) {
      const p = await L.persona(id);
      await p.env("Emulation.setDeviceMetricsOverride", movil
        ? { width: 390, height: 844, deviceScaleFactor: 2, mobile: true }
        : { width: 1280, height: 860, deviceScaleFactor: 1, mobile: false });
      if (correo) { await p.ir("entrar.html"); await p.entrarComo(correo, nombre); }
      await p.ir(url); await L.dormir(6000);
      const chicas = await p.js(`(function(){ var out=[];
        [].slice.call(document.querySelectorAll('body *')).forEach(function(e){
          if(!e.childNodes.length) return; var t=[].slice.call(e.childNodes).filter(function(n){return n.nodeType===3&&n.textContent.trim().length>2}).map(function(n){return n.textContent.trim()}).join(' ');
          if(!t) return; var s=getComputedStyle(e); if(s.display==='none'||s.visibility==='hidden'||e.getBoundingClientRect().width===0) return;
          var px=parseFloat(s.fontSize); if(px<12) out.push(Math.round(px*10)/10+'px '+e.tagName.toLowerCase()+(e.className&&typeof e.className==='string'?'.'+e.className.trim().split(/\s+/).join('.'):'')+' «'+t.slice(0,24)+'»');
        }); return out.slice(0,14); })()`);
      if (chicas.length) pequenas.push((movil ? "móvil " : "") + id + ": " + chicas.join(" · "));
      // lo que se sale por la derecha (la página entera no debe desplazarse en horizontal)
      const anchas = await p.js(`(function(){ var W=document.documentElement.clientWidth, out=[];
        if(document.documentElement.scrollWidth<=W+1) return out;
        [].slice.call(document.querySelectorAll('body *')).forEach(function(e){ var r=e.getBoundingClientRect();
          if(r.width&&r.right>W+1&&getComputedStyle(e).position!=='fixed'){ var dentro=e.parentElement&&e.parentElement.getBoundingClientRect().right>W+1;
            if(!dentro) out.push(e.tagName.toLowerCase()+(typeof e.className==='string'&&e.className?'.'+e.className.trim().split(/\s+/).join('.'):'')+' →'+Math.round(r.right)); }});
        return ['ancho '+document.documentElement.scrollWidth+' > '+W].concat(out.slice(0,8)); })()`);
      if (anchas.length) desbordes.push((movil ? "móvil " : "") + id + ": " + anchas.join(" · "));
      // las visitas guiadas se fotografían aparte: aquí se cierran y se vuelve arriba
      await p.js(`(function(){ [].slice.call(document.querySelectorAll('.tour-exit,.tour .x,[data-tour-salir]')).forEach(function(b){ try{b.click()}catch(e){} });
        window.scrollTo(0,0); return true; })()`);
      await L.dormir(900);
      const r = await p.env("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
      fs.writeFileSync(OUT + "/" + (movil ? "m-" : "") + id + ".png", Buffer.from(r.data, "base64"));
      await p.cerrar();
    }
  }
  console.log("capturas en", OUT);
  console.log("letra < 12 px:\n  " + (pequenas.length ? pequenas.join("\n  ") : "ninguna"));
  console.log("desbordes horizontales:\n  " + (desbordes.length ? desbordes.join("\n  ") : "ninguno"));
  await L.parar(); process.exit(0);
})().catch(e => { console.error(e); L.parar(); process.exit(1); });
