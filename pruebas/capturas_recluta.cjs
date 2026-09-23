'use strict';
/**
 * LAS CAPTURAS DE LA GUÍA DEL RECLUTA (23-sep) · NO es una batería: hace las fotos de `guia-recluta.html`.
 *
 * Norberto: «igual está bien una guía del estudiante, que aparece al estudiante (y al docente para que la vea)». Una guía
 * se entiende con lo que se ve, así que las imágenes son de la Nave de verdad, desde el lado del estudiante: se siembra la
 * Nave Escuela (semana 15, 30 reclutas, TODO abierto y sin el nombre del máster) en los EMULADORES, una cuenta del
 * emulador se queda con una ficha de las del medio, y se fotografía cada pestaña. Rita abre una llamada para que se vea
 * el «Presente», y una cuenta nueva llega con el código de clase para fotografiar el alistamiento.
 *
 *   node pruebas/capturas_recluta.cjs          → assets/img/capturas/<clave>.webp  (todas; las usan la guía del recluta y el dossier de la portada)
 *   node pruebas/capturas_recluta.cjs nave     → solo esa
 *
 * 🔴 Borra los emuladores al empezar (como el laboratorio): NUNCA a la vez que otro laboratorio. Y no reconstruyas el
 * sitio mientras corre. Salen en WebP (PNG a 2x → 1400 px de ancho como mucho), que es lo que pide la página.
 */
const path = require("path"), fs = require("fs"), { spawnSync } = require("child_process");
const L = require("./laboratorio.cjs");
const { persona, dormir, admin } = L;
const WEB = path.join(__dirname, "..");
const SALIDA = path.join(WEB, "assets", "img", "capturas");
const CRUDO = "/tmp/lab-fotos/guia-recluta";
const SOLO = process.argv.slice(2).filter(a => !a.startsWith("--"));
const quiero = k => !SOLO.length || SOLO.indexOf(k) >= 0;
const P = "nave-escuela";
fs.mkdirSync(SALIDA, { recursive: true }); fs.mkdirSync(CRUDO, { recursive: true });
const hechas = [];

// la foto: un elemento (con su margen) o lo que se ve de la ventana; a 2x, y luego a WebP
async function foto(p, clave, o) {
  o = o || {};
  if (!quiero(clave)) return;
  const W = o.w || 1280, H = o.h || 860, pad = o.pad == null ? 14 : o.pad;
  await p.env("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 2, mobile: false });
  await dormir(o.espera || 900);
  await p.js("[].slice.call(document.querySelectorAll('.tour-invite,.neb-capa,.tour-pop,.tour-velo,.sb-capa,#nave-logro.open')).forEach(function(x){x.remove()}); 1").catch(() => {});
  const selJs = s => s.startsWith("js:") ? s.slice(3) : "document.querySelector(" + JSON.stringify(s) + ")";
  if (o.sel) {
    await p.js("(function(){var e=" + selJs(o.sel) + "; if(!e) return 0; var r=e.getBoundingClientRect(); window.scrollTo(0, Math.max(0, r.top + scrollY - " + (pad + (o.arriba == null ? 150 : o.arriba)) + ")); return 1;})()");
    await dormir(600);
  }
  const sc = await p.js("({x:Math.round(scrollX), y:Math.round(scrollY)})");
  let clip = { x: sc.x, y: sc.y, width: W, height: H, scale: 1 };
  if (o.sel && !o.ventana) {
    const r = await p.js("(function(){var e=" + selJs(o.sel) + "; if(!e) return null; var r=e.getBoundingClientRect(); return {x:r.left,y:r.top,w:r.width,h:r.height};})()");
    if (!r) { console.error("   ✗ " + clave + ": no encuentro " + o.sel); return; }
    clip = { x: Math.max(0, Math.round(r.x - pad)) + sc.x, y: Math.max(0, Math.round(r.y - pad)) + sc.y,
             width: Math.round(Math.min(W, r.w + 2 * pad)), height: Math.round(Math.min(o.hmax || 1600, r.h + 2 * pad)), scale: 1 };
  }
  const { data } = await p.env("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip });
  const png = path.join(CRUDO, clave + ".png");
  fs.writeFileSync(png, Buffer.from(data, "base64"));
  const r = spawnSync("python3", ["-c",
    "import sys\nfrom PIL import Image\nim=Image.open(sys.argv[1]).convert('RGB')\nw=min(1400,im.width)\nim=im.resize((w,round(im.height*w/im.width)),Image.LANCZOS)\nim.save(sys.argv[2],'WEBP',quality=80,method=6)",
    png, path.join(SALIDA, clave + ".webp")], { encoding: "utf8" });
  if (r.status) { console.error("   ✗ " + clave + ": " + r.stderr); return; }
  hechas.push(clave);
  console.log("  ✓ " + clave + "  (" + clip.width + "×" + clip.height + ")");
}
const porTexto = (css, re) => "js:[].slice.call(document.querySelectorAll(" + JSON.stringify(css) + ")).filter(function(x){return x.offsetParent!==null && " + re + ".test(x.textContent)})[0]";

(async () => {
  if (!(await L.emuladoresVivos())) { console.log("SIN EMULADORES: arráncalos (ver prueba67_laboratorio.cjs)"); process.exit(3); }
  await L.reiniciar();
  const s = spawnSync(process.execPath, [path.join(WEB, "motor", "sembrar_prueba.js"), "--escuela"],
    { encoding: "utf8", env: Object.assign({}, process.env, { FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080" }) });
  if (s.status) { console.log(s.stderr || s.stdout); process.exit(2); }
  await L.arrancar(false);
  const db = admin().firestore();
  const vivas = [];
  const nueva = async n => { const p = await persona(n); vivas.push(p); return p; };
  const sinBienvenidas = p => p.js("['c1','c2','c3','c4','c5','c6','c7','c8','c9','c10','c11'].forEach(function(k){localStorage.setItem('sgCap_" + P + "_'+k,'hecho')}); localStorage.setItem('sgNaveOnboard_" + P + "','1'); localStorage.setItem('sgTourDone','1'); 1");
  try {
    // el recluta: una cuenta del emulador que se queda con una ficha de las del medio (con cosas, pero no con todas)
    const al = await nueva("recluta");
    await al.ir("entrar.html"); await al.entrarComo("recluta@lab.test", "Recluta Guía");
    const uid = await al.js("window.SG.MOTOR.auth.currentUser.uid");
    const fichas = (await db.collection("student_profiles").where("projectId", "==", P).get()).docs
      .sort((a, b) => (b.data().totalPoints || 0) - (a.data().totalPoints || 0));
    const f = fichas[8], viejo = f.data().userId;
    await f.ref.update({ userId: uid, email: "recluta@lab.test" });
    for (const d of (await db.collection("stargate_alias").where("uid", "==", viejo).get()).docs) await d.ref.update({ uid });
    await sinBienvenidas(al);
    const tab = async (t, listo) => {
      await al.ir("recluta.html?per=" + P + "#" + t);
      await al.hasta(listo || "!!document.querySelector('#nave-panel')", 60); await dormir(2500);
      await al.js("window.scrollTo(0,0); 1");
    };
    await tab("nave", "!!document.querySelector('.nave-ficha')");
    for (let k = 0; k < 12 && await al.js("!!document.querySelector('.sb-capa')"); k++) {   // los sobres que traiga, abiertos
      await al.js("var b=document.querySelector('.sb-fin')||document.querySelector('.sb-sig'); b&&b.click(); 1"); await dormir(450);
    }
    await foto(al, "nave", { sel: ".nave-ficha", hmax: 1300 });
    await foto(al, "orden", { sel: ".orden-carta", hmax: 1500 });
    await al.js("var b=document.getElementById('nb-mas'); b&&b.click(); 1"); await dormir(500);
    await foto(al, "menu", { sel: "#nb-menu", pad: 6, arriba: 120 });
    await al.js("document.body.click(); 1");
    await tab("retos");
    await foto(al, "mapa", { sel: ".nave-mapa", pad: 20 });
    await foto(al, "retos", { sel: porTexto("h2", "/Qué hay que hacer/"), ventana: true, arriba: 30 });
    // un reto sin hacer, abierto por «Cómo se hace, paso a paso»: el de un planeta que aún no ha empezado
    await al.js("(function(){var r=[].slice.call(document.querySelectorAll('details.reto-pl:not(.lock) details.reto-sem:not(.hecho)'))[0]; if(!r) return 0; r.closest('details.reto-pl').open=true; r.open=true; r.setAttribute('data-guia','1'); return 1;})()"); await dormir(800);
    await foto(al, "reto", { sel: "details.reto-sem[data-guia]", hmax: 1500 });
    await tab("botin");
    await foto(al, "botin", { ventana: true });
    await al.js("(function(){var d=document.getElementById('a-bordo'); if(d) d.open=true; return 1;})()"); await dormir(600);
    await foto(al, "logros", { sel: "#a-bordo", hmax: 1300 });
    await tab("archivo"); await foto(al, "archivo", { ventana: true });
    await tab("mercado"); await foto(al, "mercado", { ventana: true });
    await tab("zoco"); await foto(al, "zoco", { ventana: true });
    await tab("rankings", "!!document.querySelector('#nave-ranking:not([hidden]) .rank, #nave-ranking:not([hidden]) table, #nave-ranking:not([hidden]) li')");
    await foto(al, "rankings", { sel: "#nave-ranking", ventana: true, arriba: 70 });

    // la llamada a filas, desde el lado del recluta: Rita (su grupo) toca llamada y en su Nave sale «Presente»
    if (quiero("presente")) {
      const rita = await nueva("Rita");
      await rita.ir("entrar.html"); await rita.entrarComo("rita@lab.test", "Rita Referente");
      await rita.ir("consola.html?per=" + P); await rita.hasta("!!(window.SG&&window.SG.MOTOR&&window.SG.MOTOR.abrirLlamada)", 40);
      const esc = (await db.collection("projects").doc(P).get()).data();
      const miProfe = f.data().stargateProfe || "";
      const quienLlama = (esc.stargate && miProfe) ? miProfe : "Rita Referente";
      const correoProfe = quienLlama === "Dani Docente" ? "dani@lab.test" : "rita@lab.test";
      if (correoProfe !== "rita@lab.test") { await rita.ir("entrar.html"); await rita.entrarComo(correoProfe, quienLlama); await rita.ir("consola.html?per=" + P); await rita.hasta("!!(window.SG&&window.SG.MOTOR&&window.SG.MOTOR.abrirLlamada)", 40); }
      await rita.js(`window.SG.MOTOR.abrirLlamada(${JSON.stringify(P)}, 30).then(function(){return 1},function(e){return e.message})`, 60000);
      await tab("nave", "!!document.querySelector('.nave-ficha')");
      await al.hasta("!!document.getElementById('pase-ok')", 30);
      await foto(al, "presente", { sel: "js:(document.getElementById('pase-ok')||{}).closest ? document.getElementById('pase-ok').closest('.pase-nave') : null", pad: 18 });
    }
    // el alistamiento: una cuenta nueva con el código de clase
    if (quiero("alistarse")) {
      const cod = ((await db.collection("projects").doc(P).get()).data() || {}).joinCode;
      const nv = await nueva("nuevo");
      await nv.ir("alistarse.html?per=" + P + "&codigo=" + cod);
      await nv.entrarComo("nuevo@lab.test", "Nuevo Recluta");
      await nv.hasta("!!document.querySelector('#a-enviar')", 30);
      await nv.js("document.querySelector('#a-nombre').value='Lucía'; document.querySelector('#a-apellidos').value='Martín'; document.querySelector('#a-alias').value='Aurora'; var r=document.querySelectorAll('input[name=cmd]')[0]; if(r) r.checked=true; 1");
      await foto(nv, "alistarse", { sel: "#alistarse-app", hmax: 1900 });
    }
    // 23-sep · para el dossier de la portada: la clase proyectada, desde el lado del docente
    if (quiero("sesion")) {
      const dc = await nueva("docente");
      await dc.ir("entrar.html"); await dc.entrarComo("rita@lab.test", "Rita Referente");
      await dc.hasta("location.pathname.indexOf('consola.html')>=0 || !!document.querySelector('.elegir-camino .camino.docente')", 20);
      await dc.js("localStorage.setItem('sgTourDone','1'); 1");
      await dc.ir("sesion.html?per=" + P); await dc.hasta("!!document.querySelector('.mazo .dia')", 60); await dormir(2500);
      await foto(dc, "sesion", { sel: ".mazo", pad: 8, arriba: 70 });
    }
    // el Simulador de Joran (el reto A6), como lo ve el recluta
    if (quiero("simulador")) {
      await al.ir("batalla.html?per=" + P); await al.hasta("document.body.innerText.length>200", 40); await dormir(2500);
      await foto(al, "simulador", { ventana: true });
    }
  } catch (e) { console.error(e); }
  console.log("\n  " + hechas.length + " capturas en " + path.relative(process.cwd(), SALIDA));
  for (const p of vivas) await p.cerrar();
  await L.parar(); process.exit(0);
})();
