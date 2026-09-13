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
  // 🔴 y con VARIOS grupos (el vitalicio los ve todos): con uno solo no se vio que el botón de la
  // invitación se salía de las tarjetas estrechas
  ["n.cuartero.10@gmail.com", "Norberto Cuartero", "consola.html", "consola-varios"],
  ["rita@lab.test", "Rita", "consola.html?per=lab-clase", "consola-gente"],
  ["rita@lab.test", "Rita", "aula.html?per=lab-clase", "aula"],
  ["rita@lab.test", "Rita", "sesion.html?per=lab-clase", "sesion"],
  [null, null, "index.html", "portada"],
  [null, null, "entrar.html", "entrar"],
  ["ana@lab.test", "Ana", "recluta.html?per=lab-clase#rankings", "nave-rankings"],
  ["rita@lab.test", "Rita", "entrar.html", "entrar-eres-tu"],
  ["rita@lab.test", "Rita", "consola.html?per=lab-clase#huevos", "consola-premios"],
  ["rita@lab.test", "Rita", "crear.html", "crear"],
  ["rita@lab.test", "Rita", "llamada.html?per=lab-clase", "llamada"],
];
(async () => {
  await L.arrancar(false);
  const pequenas = [], desbordes = [], cajas = [];
  for (const movil of [false, true]) {
    for (const [correo, nombre, url, id] of PANTALLAS) {
      const p = await L.persona(id);
      await p.env("Emulation.setDeviceMetricsOverride", movil
        ? { width: 390, height: 844, deviceScaleFactor: 2, mobile: true }
        : { width: 1280, height: 860, deviceScaleFactor: 1, mobile: false });
      if (correo) { await p.ir("entrar.html"); await p.entrarComo(correo, nombre); }
      await p.ir(url); await L.dormir(6000);
      // una pestaña concreta de la consola: el hash dice cuál (la consola no lo lee sola)
      const pest = (url.match(/consola\.html\?per=[^#]+#(\w+)/) || [])[1];
      if (pest) { await p.js(`(function(){var b=document.querySelector('.pest[data-tab="${pest}"]'); if(b) b.click(); return 1;})()`); await L.dormir(1500); }
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
      // 🔴 13-sep · y lo que se sale de SU caja (un botón que asoma fuera de su tarjeta): la página no
      // desborda, así que la medición de arriba no lo ve. Así se escapó «Copiar invitación» con varios grupos.
      const fuera = await p.js(`(function(){ var out=[];
        [].slice.call(document.querySelectorAll('button,.btn,a.gp-b,input,select,code,img,.chip')).forEach(function(e){
          var r=e.getBoundingClientRect(); if(!r.width||!r.height) return; var s=getComputedStyle(e); if(s.position==='fixed'||s.position==='absolute') return;
          var p=e.parentElement; while(p&&p!==document.body){ var ps=getComputedStyle(p); if(ps.overflowX!=='visible') return; if(ps.display!=='contents'&&(ps.borderLeftStyle!=='none'||ps.backgroundColor!=='rgba(0, 0, 0, 0)')) break; p=p.parentElement; }
          if(!p||p===document.body) return; var q=p.getBoundingClientRect();
          if(r.right>q.right+2||r.left<q.left-2) out.push((e.tagName.toLowerCase())+(typeof e.className==='string'&&e.className?'.'+e.className.trim().split(/\s+/)[0]:'')+' «'+(e.textContent||e.value||'').trim().slice(0,22)+'» sale '+Math.round(Math.max(r.right-q.right,q.left-r.left))+'px de '+(typeof p.className==='string'?p.className.split(' ')[0]:p.tagName));
        }); return out.slice(0,8); })()`);
      if (fuera && fuera.length) cajas.push((movil ? "móvil " : "") + id + ": " + fuera.join(" · "));
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
  console.log("se sale de su caja:\n  " + (cajas.length ? cajas.join("\n  ") : "nada"));
  await L.parar(); process.exit(0);
})().catch(e => { console.error(e); L.parar(); process.exit(1); });
