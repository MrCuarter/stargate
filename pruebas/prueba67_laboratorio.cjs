'use strict';
/**
 * BATERÍA 67 · EL LABORATORIO — la web entera contra el motor DE VERDAD.
 * Ver `laboratorio.cjs` para el porqué. Hace falta tener los emuladores arrancados:
 *
 *   cd ~/Claude/vibewebs/gamificapro
 *   ./node_modules/.bin/firebase emulators:start --only auth,firestore,functions --project demo-stargate
 *
 *   node pruebas/prueba67_laboratorio.cjs [--ver] [--solo=N]
 */
const path = require("path");
const L = require("./laboratorio.cjs");
const { persona, comprobar: c, dormir, leerDoc, consultar } = L;
const VER = process.argv.includes("--ver");
const SOLO = (process.argv.find(a => a.indexOf("--solo=") === 0) || "").split("=")[1];
const FOTOS = "/tmp/lab-fotos"; require("fs").mkdirSync(FOTOS, { recursive: true });
const hacer = n => !SOLO || SOLO.split(",").indexOf(String(n)) >= 0;

(async () => {
  if (!(await L.emuladoresVivos())) {
    console.log("\n  Batería 67 · el laboratorio — SIN EMULADORES, no se ha probado nada.");
    console.log("  Arráncalos con: firebase emulators:start --only auth,firestore,functions --project demo-stargate");
    process.exit(3);
  }
  const CODIGO = await L.reiniciar();
  process.stderr.write("  laboratorio sembrado · código de clase " + CODIGO + "\n");
  await L.arrancar(VER);
  const vivas = [];
  const nueva = async n => { const p = await persona(n); vivas.push(p); return p; };
  try {
    // ============================================================ 1 · LOS TRES DOCENTES
    if (hacer(1)) {
      const casos = [
        ["rita@lab.test", "Rita Referente", 7, "referente que imparte"],
        ["dani@lab.test", "Dani Docente", 3, "docente raso"],
        ["sol@lab.test", "Sol Coordina", 7, "referente que NO imparte"],
      ];
      for (const [correo, nombre, pestanas, quien] of casos) {
        const p = await nueva(quien);
        await p.ir("entrar.html");
        await p.entrarComo(correo, nombre);
        const fue = await p.hasta("location.pathname.indexOf('consola.html')>=0", 20);
        c("docentes · el " + quien + " entra y cae en su puesto de mando", fue, await p.js("location.pathname"));
        const tarjeta = await p.hasta("document.body.innerText.indexOf('LAB')>=0", 20);
        c("docentes · y ve su grupo (" + quien + ")", tarjeta, (await p.texto()).slice(0, 200));
        const t = await p.texto();
        c("docentes · la tarjeta dice cuántos se han alistado (" + quien + ")", /20\s*alistad/i.test(t), (t.match(/\d+\s*alistad\w*/i) || ["—"])[0]);
        c("docentes · y en qué semana va (" + quien + ")", /10\s*de 15 semanas/i.test(t), (t.match(/\d+\s*de \d+ semanas/) || ["—"])[0]);
        // entrar al grupo
        const r = await p.js(`(function(){ var b=[].slice.call(document.querySelectorAll('a,button')).filter(function(x){return /Ver mi gente/i.test(x.textContent)&&x.offsetParent})[0]; if(!b) return 'no hay'; b.click(); return b.textContent.trim(); })()`);
        await p.hasta("document.querySelectorAll('.pestanas .pest').length>0", 20);
        const tabs = await p.js("[].slice.call(document.querySelectorAll('.pestanas .pest')).map(function(b){return b.textContent.trim()})");
        c("docentes · el " + quien + " ve " + pestanas + " pestañas", (tabs || []).length === pestanas, "botón «" + r + "» · vio [" + tabs + "]");
        await dormir(800);
        const gente = await p.texto();
        const n = (gente.match(/reclutas?/gi) || []).length;
        c("docentes · «Mi gente» del " + quien + " no revienta", p.errores.length === 0, p.errores[0]);
        await p.foto(FOTOS + "/1-" + quien.replace(/\W+/g, "-") + ".png");
      }
    }

    // ============================================================ 2 · UNA ALUMNA NUEVA, DE PRINCIPIO A FIN
    if (hacer(2)) {
      const ana = await nueva("Ana, alumna nueva");
      await ana.ir("entrar.html");
      await ana.entrarComo("ana@lab.test", "Ana Nueva");
      const pide = await ana.hasta("!!document.querySelector('#e-cod')", 20);
      c("alumna · al no estar en ninguna clase, se le pide el código", pide, (await ana.texto()).slice(0, 160));
      await ana.js(`document.querySelector('#e-cod').value=${JSON.stringify(CODIGO.toLowerCase())}; document.querySelector('#e-cod-ok').click(); 1`);
      const alis = await ana.hasta("location.pathname.indexOf('alistarse.html')>=0", 20);
      c("alumna · con el código (en minúsculas) llega al alistamiento", alis, await ana.js("location.href"));
      const form = await ana.hasta("!!document.querySelector('#a-enviar')", 25);
      c("alumna · y ve el formulario de alistamiento", form, (await ana.texto()).slice(0, 220));
      await ana.foto(FOTOS + "/2-alistarse.png");
      // el formulario, como lo rellenaría ella
      await ana.js(`(function(){
        document.querySelector('#a-nombre').value='Ana'; document.querySelector('#a-apellidos').value='Nueva Prueba';
        document.querySelector('#a-alias').value='Andrómeda';
        var r=document.querySelector('input[name=cmd]'); if(r) r.checked=true;
        var av=document.querySelector('#a-avatares button, #a-avatares .av'); if(av) av.click();
        return 1; })()`);
      await ana.js("document.querySelector('#a-enviar').click(); 1");
      const bienvenida = await ana.hasta("/Bienvenid|Embarc|tu Nave/i.test(document.body.innerText) && !document.querySelector('#a-enviar')", 25);
      c("alumna · se alista de verdad (el motor crea su ficha)", bienvenida, (await ana.texto()).slice(0, 200));
      const fichas = await consultar("student_profiles", "displayName", "Andrómeda");
      c("alumna · y su ficha existe en Firestore, en su grupo", fichas.length === 1 && fichas[0].projectId === "lab-clase",
        JSON.stringify(fichas.map(f => f.projectId)));
      await ana.foto(FOTOS + "/2b-bienvenida.png");

      // 🔴 EL FALLO DEL 12-SEP: con ficha, entrar tiene que llevarla a SU Nave, con su grupo puesto
      await ana.ir("entrar.html");
      const nave = await ana.hasta("location.pathname.indexOf('recluta.html')>=0", 20);
      const q = await ana.js("location.search");
      c("alumna · al volver a entrar va a su Nave CON SU GRUPO (?per=)", nave && /per=lab-clase/.test(q), q);
      const dentro = await ana.hasta("/Andrómeda/.test(document.body.innerText)", 25);
      c("alumna · y la Nave la reconoce (sale su alias)", dentro, (await ana.texto()).slice(0, 180));
      c("alumna · sin «te falta el enlace de tu clase»", !/Te falta el enlace/.test(await ana.texto()));
      // y por la puerta de atrás: la Nave sin grupo
      await ana.ir("recluta.html");
      const reencauza = await ana.hasta("/per=lab-clase/.test(location.search)", 20);
      c("alumna · la Nave SIN grupo ya no es un callejón: la reencauza a la suya", reencauza, await ana.js("location.href"));
    }

    // ============================================================ 3 · LA CUENTA DE NORBERTO: DOCENTE, SIN FICHA
    if (hacer(3)) {
      const p = await nueva("referente sin ficha, por la baldosa de la Nave");
      await p.ir("recluta.html");                       // lo que hizo él: la Nave sin grupo…
      await p.entrarComo("rita@lab.test", "Rita Referente");   // …y entrar con su cuenta
      await p.ir("recluta.html");
      const fue = await p.hasta("location.pathname.indexOf('consola.html')>=0", 20);
      c("🔴 referente · la Nave sin grupo le lleva a SU PUESTO DE MANDO, no a «te falta el enlace»", fue,
        await p.js("location.href") + " · " + (await p.texto()).slice(0, 120));
    }

    // ============================================================ 4 · DOCENTE Y ALUMNA A LA VEZ
    if (hacer(4)) {
      const p = await nueva("Dani: docente y además alumno");
      await p.ir("alistarse.html?per=lab-clase&codigo=" + CODIGO);
      await p.entrarComo("dani@lab.test", "Dani Docente");
      const form = await p.hasta("!!document.querySelector('#a-enviar')", 25);
      if (form) {
        await p.js(`(function(){ document.querySelector('#a-nombre').value='Dani'; document.querySelector('#a-apellidos').value='Docente';
          document.querySelector('#a-alias').value='Doble'; var r=document.querySelector('input[name=cmd]'); if(r) r.checked=true; return 1; })()`);
        await p.js("document.querySelector('#a-enviar').click(); 1");
        await p.hasta("!document.querySelector('#a-enviar')", 25);
      }
      await p.ir("entrar.html");
      const pregunta = await p.hasta("!!document.querySelector('.elegir-camino')", 20);
      c("ambos · a quien es docente y alumno se le PREGUNTA cómo entra", pregunta, (await p.texto()).slice(0, 200));
      const caminos = await p.js("[].slice.call(document.querySelectorAll('.elegir-camino .camino')).map(function(a){return a.textContent.replace(/\\s+/g,' ').trim()+' → '+a.getAttribute('href')})");
      c("ambos · y le ofrece los dos caminos, con el nombre de su grupo",
        (caminos || []).some(x => /docente/i.test(x) && /consola/.test(x)) && (caminos || []).some(x => /recluta/i.test(x) && /per=lab-clase/.test(x)),
        JSON.stringify(caminos));
      await p.foto(FOTOS + "/4-como-entras.png");
    }
  } catch (e) {
    c("la batería no puede reventar", false, e.message);
  } finally {
    for (const p of vivas) await p.cerrar();
    await L.parar();
  }
  const { ok, fallos } = L.marcador();
  console.log("\n  Batería 67 · el laboratorio (motor de verdad)");
  console.log("  " + ok + " comprobaciones correctas, " + fallos.length + " fallos");
  fallos.forEach(f => console.log("   ✗ " + f));
  process.exit(fallos.length ? 1 : 0);
})().catch(e => { console.error("EXPLOTÓ:", e.stack || e.message); L.parar(); process.exit(2); });
