'use strict';
/**
 * MEDIR LAS PÁGINAS (23-sep, tanda 3 de la nota del 22-sep) · NO es una batería: es la cinta métrica.
 *
 * Siembra la Nave Escuela (semana 15, 30 reclutas: el caso más pesado que hay) en los EMULADORES, entra como un recluta
 * (una cuenta del emulador que se queda con una ficha sembrada) y como Rita (referente), y:
 *   · --peso      → qué pide cada página al cargar: veces el tablero, funciones, Firestore, imágenes y KB (lo más gordo)
 *   · --anchos=…  → recorre las páginas a esos anchos: lo que se sale por la derecha y los botones que se pisan, con foto
 *                   en /tmp/lab-fotos/mp-<etiqueta>-<página>-<ancho>.png
 *
 *   node pruebas/medir_paginas.cjs antes --peso
 *   node pruebas/medir_paginas.cjs b --anchos=800,900,1280 --paginas=sesion,consola
 *
 * Medido el 23-sep: la Nave del recluta pedía el tablero 4 veces y bajaba 13 MB de imágenes (11 eran las insignias en
 * PNG); después, 2 veces (la segunda, la recarga tras escribir un logro) y 1,8 MB.
 * 🔴 Borra los emuladores al empezar (como el laboratorio): NUNCA a la vez que otro laboratorio.
 */
const path = require("path"), fs = require("fs"), { spawnSync } = require("child_process");
const WEB = path.join(__dirname, "..");
const L = require("./laboratorio.cjs");
const { persona, dormir, admin } = L;
const ETQ = process.argv[2] || "x";
const ANCHOS = (process.argv.find(a => a.indexOf("--anchos=") === 0) || "--anchos=").slice(9).split(",").filter(Boolean).map(Number);
const PESO = process.argv.includes("--peso");
const MEDIR = `(function(){
  var r=performance.getEntriesByType('resource'), g={}, img={n:0,kb:0,fuera:0}, fn={}, fs={n:0};
  r.forEach(function(e){
    var u=new URL(e.name, location.href), k=u.port==='5001'?'funciones':u.port==='8080'?'firestore':u.port==='9099'?'auth':u.host===location.host?'propio':u.host;
    g[k]=(g[k]||0)+1;
    if(k==='funciones'){ var f=u.pathname.split('/').pop(); fn[f]=(fn[f]||0)+1; }
    if(k==='firestore'){ var p=u.pathname.replace(/.*documents/,'').replace(/projects\\/[^/]+\\/databases\\/[^/]+/,''); fs[p]=(fs[p]||0)+1; fs.n++; }
    if(e.initiatorType==='img'||/\\.(png|jpe?g|webp|gif)(\\?|$)/.test(u.pathname)){ img.n++; img.kb+=Math.round((e.transferSize||e.encodedBodySize||0)/1024); }
  });
  var alto=innerHeight; [].slice.call(document.images).forEach(function(i){ if(i.complete&&i.naturalWidth&&i.getBoundingClientRect().top>alto*2) img.fuera++; });
  var top=r.filter(function(e){return /\\.(png|jpe?g|webp|gif|mp4)(\\?|$)/.test(e.name);}).sort(function(a,b){return (b.encodedBodySize||0)-(a.encodedBodySize||0);}).slice(0,14).map(function(e){return Math.round((e.encodedBodySize||0)/1024)+'k '+e.name.replace(location.origin,'').slice(0,90);});
  return JSON.stringify({ top:top, recursos:r.length, grupos:g, funciones:fn, firestore:fs, imagenes:img,
    dom:document.getElementsByTagName('*').length, t: window.__tListo||null, total:Math.round(performance.now()) });
})()`;
const SOLO = (process.argv.find(a => a.indexOf("--paginas=") === 0) || "").slice(10).split(",").filter(Boolean);
const SCAN = `(function(){ var W=document.documentElement.clientWidth, m=[];
  [].slice.call(document.querySelectorAll('body *')).forEach(function(e){
    var r=e.getBoundingClientRect(); if(!r.width||r.right<=W+2) return;
    var cs=getComputedStyle(e); if(cs.position==='fixed'||cs.visibility==='hidden') return;
    for(var a=e.parentElement;a&&a!==document.body;a=a.parentElement){ var o=getComputedStyle(a); if(/(auto|scroll|hidden|clip)/.test(o.overflowX)) return; }
    m.push((e.id?'#'+e.id:'')+'.'+String(e.className&&e.className.baseVal!==undefined?e.className.baseVal:e.className||e.tagName).split(' ')[0]+' '+Math.round(r.right)); });
  // lo que se pisa: botones y enlaces visibles que se solapan con otro botón o enlace
  var bs=[].slice.call(document.querySelectorAll('button,a,.tr')).filter(function(b){ var r=b.getBoundingClientRect(); return r.width>4&&r.height>4&&r.bottom>0&&r.top<innerHeight&&getComputedStyle(b).visibility!=='hidden'; }), pis=[];
  for(var i=0;i<bs.length;i++) for(var j=i+1;j<bs.length;j++){ if(bs[i].contains(bs[j])||bs[j].contains(bs[i])) continue;
    var a=bs[i].getBoundingClientRect(), b=bs[j].getBoundingClientRect(), x=Math.min(a.right,b.right)-Math.max(a.left,b.left), y=Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top);
    if(x>6&&y>6) pis.push((bs[i].id||bs[i].textContent.trim().slice(0,18))+' × '+(bs[j].id||bs[j].textContent.trim().slice(0,18))); }
  return JSON.stringify({W:W, sw:document.documentElement.scrollWidth, fuera:m.slice(0,10), pisa:pis.slice(0,8)}); })()`;
(async () => {
  if (!(await L.emuladoresVivos())) { console.log("sin emuladores"); process.exit(3); }
  await L.reiniciar();
  const r = spawnSync(process.execPath, [path.join(WEB, "motor", "sembrar_prueba.js"), "--escuela"],
    { encoding: "utf8", env: Object.assign({}, process.env, { FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080" }) });
  if (r.status) { console.log(r.stderr || r.stdout); process.exit(2); }
  await L.arrancar(false);
  const P = "nave-escuela", fsA = admin().firestore();
  const al = await persona("mp recluta");
  await al.ir("entrar.html"); await al.entrarComo("medir@lab.test", "Medir");
  const uid = await al.js("window.SG.MOTOR.auth.currentUser.uid");
  const f = (await fsA.collection("student_profiles").where("projectId", "==", P).get()).docs.sort((a, b) => (b.data().xp || 0) - (a.data().xp || 0))[8];
  const viejo = f.data().userId; await f.ref.update({ userId: uid, email: "medir@lab.test" });
  for (const d of (await fsA.collection("stargate_alias").where("uid", "==", viejo).get()).docs) await d.ref.update({ uid });
  const doc = await persona("mp docente");
  await doc.ir("entrar.html"); await doc.entrarComo("rita@lab.test", "Rita Referente");
  await doc.hasta("location.pathname.indexOf('consola.html')>=0 || !!document.querySelector('.elegir-camino .camino.docente')", 20);
  await doc.js("(function(){var a=document.querySelector('.elegir-camino .camino.docente'); if(a) a.click(); return 1;})()");
  const PAG = [
    ["recluta", al, "recluta.html?per=" + P, ".nave-ficha"],
    ["recluta-retos", al, "recluta.html?per=" + P + "#retos", "#nave-panel"],
    ["recluta-botin", al, "recluta.html?per=" + P + "#botin", "#nave-panel"],
    ["recluta-mercado", al, "recluta.html?per=" + P + "#mercado", "#nave-panel"],
    ["recluta-rankings", al, "recluta.html?per=" + P + "#rankings", "#nave-panel"],
    ["consola", doc, "consola.html?per=" + P, "#doc-ava"],
    ["consola-alumnado", doc, "consola.html?per=" + P + "&tab=alumnado", "#c-cuerpo"],
    ["consola-mios", doc, "consola.html?per=" + P + "&tab=mios", "#c-cuerpo"],
    ["sesion", doc, "sesion.html?per=" + P, ".dia"],
    ["gestion", doc, "gestion.html?per=" + P, ".gs-panel [data-tab]"],
    ["gestion-cal", doc, "gestion.html?per=" + P, ".gs-panel [data-tab]", "calendario"],
    ["gestion-premios", doc, "gestion.html?per=" + P, ".gs-panel [data-tab]", "premios"],
    ["aula", doc, "aula.html?per=" + P, "#au-cuerpo, .au-tabs, main"],
    ["prestreno", doc, "prestreno.html", ".dia, main"],
  ].filter(x => !SOLO.length || SOLO.indexOf(x[0]) >= 0);
  if (PESO) {
    const vistos = {};
    for (const [n, p, url, listo] of PAG.filter(x => ["recluta", "consola", "sesion"].indexOf(x[0]) >= 0)) {
      await p.tamano(1280, 900); await p.ir(url); await p.hasta(`!!document.querySelector(${JSON.stringify(listo)})`, 60);
      await p.js("window.__tListo=Math.round(performance.now()); 1"); await dormir(12000);
      const m = JSON.parse(await p.js(MEDIR)); vistos[n] = m; console.log(n, JSON.stringify(m));
    }
    fs.writeFileSync("/tmp/lab-fotos/medir-" + ETQ + ".json", JSON.stringify(vistos, null, 1));
  }
  for (const w of ANCHOS) {
    for (const [n, p, url, listo, pest] of PAG) {
      await p.tamano(w, 900); await p.ir(url);
      const ok = await p.hasta(`!!document.querySelector(${JSON.stringify(listo)})`, 60); await dormir(3500);
      if (pest) { await p.js(`(function(){var b=document.querySelector('.gs-panel [data-tab="${pest}"]'); if(b) b.click(); return 1;})()`); await dormir(2500); }
      const res = await p.js(SCAN);
      console.log(w, n, ok ? "" : "(NO CARGÓ)", res);
      await p.foto("/tmp/lab-fotos/mp-" + ETQ + "-" + n + "-" + w + ".png");
    }
  }
  await al.cerrar(); await doc.cerrar(); await L.parar(); process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
