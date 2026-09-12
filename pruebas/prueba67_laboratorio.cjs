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
const { persona, comprobar: c, dormir, leerDoc, consultar, admin, fichaDe } = L;
const VER = process.argv.includes("--ver");
const SOLO = (process.argv.find(a => a.indexOf("--solo=") === 0) || "").split("=")[1];
const FOTOS = "/tmp/lab-fotos"; require("fs").mkdirSync(FOTOS, { recursive: true });
const hacer = n => !SOLO || SOLO.split(",").indexOf(String(n)) >= 0;
const REG = {};   // cifras que se apuntan para el informe

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
        const pregunto = await p.entrarPorLaPuerta(correo, nombre);
        c("docentes · con sesión guardada, la puerta pregunta «¿Eres tú?» (" + quien + ")", pregunto);
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
      await ana.entrarPorLaPuerta("ana@lab.test", "Ana Nueva");
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
      await ana.hasta("!!document.getElementById('e-seguir')", 15);
      await ana.js("document.getElementById('e-seguir').click(); 1");
      const nave = await ana.hasta("location.pathname.indexOf('recluta.html')>=0", 20);
      const q = await ana.js("location.search");
      c("alumna · al volver a entrar va a su Nave CON SU GRUPO (?per=)", nave && /per=lab-clase/.test(q), q);
      const dentro = await ana.hasta("/Andrómeda/.test(document.body.innerText)", 25);
      c("alumna · y la Nave la reconoce (sale su alias)", dentro, (await ana.texto()).slice(0, 180));
      c("alumna · sin «te falta el enlace de tu clase»", !/Te falta el enlace/.test(await ana.texto()));
      // y por la puerta de atrás: la Nave sin grupo
      await ana.ir("recluta.html");
      await ana.hasta("!!document.getElementById('e-seguir')", 15);
      await ana.js("document.getElementById('e-seguir') && document.getElementById('e-seguir').click(); 1");
      const reencauza = await ana.hasta("/per=lab-clase/.test(location.search)", 20);
      c("alumna · la Nave SIN grupo ya no es un callejón: la reencauza a la suya", reencauza, await ana.js("location.href"));
    }

    // ============================================================ 3 · LA CUENTA DE NORBERTO: DOCENTE, SIN FICHA
    if (hacer(3)) {
      const p = await nueva("referente sin ficha, por la baldosa de la Nave");
      await p.ir("recluta.html");                       // lo que hizo él: la Nave sin grupo…
      await p.entrarComo("rita@lab.test", "Rita Referente");   // …y entrar con su cuenta
      await p.ir("recluta.html");
      const pregunta = await p.hasta("!!document.getElementById('e-seguir')", 15);
      c("referente · la Nave sin grupo la manda a la puerta, que le pregunta si es ella", pregunta);
      await p.js("document.getElementById('e-seguir') && document.getElementById('e-seguir').click(); 1");
      const fue = await p.hasta("location.pathname.indexOf('consola.html')>=0", 20);
      c("🔴 referente · la Nave sin grupo le lleva a SU PUESTO DE MANDO, no a «te falta el enlace»", fue,
        await p.js("location.href") + " · " + (await p.texto()).slice(0, 120));
    }

    // ============================================================ 3bis · EL CASO EXACTO DEL 12-SEP
    /**
     * Un navegador con la sesión de OTRA cuenta guardada (la de alumno, de pruebas anteriores) y una
     * persona que llega a la puerta queriendo entrar como docente. La puerta NO puede repartir con
     * la guardada sin decirlo: tiene que enseñar quién cree que eres y dejar cambiar.
     */
    if (hacer(3)) {
      const p = await nueva("navegador con la sesión de otra cuenta guardada");
      await p.ir("entrar.html");
      await p.entrarComo("ana@lab.test", "Ana Nueva");     // la sesión vieja que había en el navegador
      await p.ir("entrar.html");                           // y llega la docente
      const pregunta = await p.hasta("!!document.getElementById('e-seguir')", 15);
      c("🔴 12-sep · con otra sesión guardada, la puerta NO reparte a ciegas: pregunta", pregunta,
        await p.js("location.pathname") + " · " + (await p.texto()).slice(0, 120));
      const dice = await p.texto();
      c("   y dice con qué cuenta cree que estás", /ana@lab\.test/.test(dice), dice.slice(0, 160));
      c("   y ofrece usar otra, igual de visible", await p.js("!!document.getElementById('e-otra-cuenta')"));
      c("   y no se ha movido de la puerta", /entrar\.html/.test(await p.js("location.pathname")));
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
      await p.hasta("!!document.getElementById('e-seguir')", 15);
      await p.js("document.getElementById('e-seguir').click(); 1");
      const pregunta = await p.hasta("!!document.querySelector('.elegir-camino')", 20);
      c("ambos · a quien es docente y alumno se le PREGUNTA cómo entra", pregunta, (await p.texto()).slice(0, 200));
      const caminos = await p.js("[].slice.call(document.querySelectorAll('.elegir-camino .camino')).map(function(a){return a.textContent.replace(/\\s+/g,' ').trim()+' → '+a.getAttribute('href')})");
      c("ambos · y le ofrece los dos caminos, con el nombre de su grupo",
        (caminos || []).some(x => /docente/i.test(x) && /consola/.test(x)) && (caminos || []).some(x => /recluta/i.test(x) && /per=lab-clase/.test(x)),
        JSON.stringify(caminos));
      await p.foto(FOTOS + "/4-como-entras.png");
    }
    // ============================================================ 5 · UNA CLASE ENTERA
    /**
     * Norberto: «simula una clase: el docente lanza la asistencia, varios estudiantes se apuntan,
     * los que se han alistado aparecen en la ventana del docente, el docente reparte algún premio…».
     * Todo contra el motor de verdad: si algo se lo niegan las reglas o el servidor, aquí se ve.
     */
    if (hacer(5)) {
      const alistar = async (p, correo, nombre, alias, cmd) => {
        await p.ir("alistarse.html?per=lab-clase&codigo=" + CODIGO);
        await p.entrarComo(correo, nombre);
        await p.hasta("!!document.querySelector('#a-enviar')", 25);
        await p.js(`(function(){ document.querySelector('#a-nombre').value=${JSON.stringify(nombre.split(" ")[0])};
          document.querySelector('#a-apellidos').value='Prueba'; document.querySelector('#a-alias').value=${JSON.stringify(alias)};
          var r=document.querySelectorAll('input[name=cmd]')[${cmd || 0}]; if(r) r.checked=true; return 1; })()`);
        await p.js("document.querySelector('#a-enviar').click(); 1");
        return p.hasta("!document.querySelector('#a-enviar')", 25);
      };
      const beto = await nueva("Beto"), carla = await nueva("Carla"), ana = await nueva("Ana (otra vez)");
      c("clase · Beto se alista", await alistar(beto, "beto@lab.test", "Beto Prueba", "Bólido", 0));
      c("clase · Carla se alista (con el otro Comandante)", await alistar(carla, "carla@lab.test", "Carla Prueba", "Cometa", 1));
      await ana.ir("entrar.html"); await ana.entrarComo("ana@lab.test", "Ana Nueva");

      // la racha necesita historia: una llamada AYER a la que Ana sí vino
      const A = admin(), fs = A.firestore();
      const fAna = await fichaDe("ana@lab.test", "lab-clase");
      const ayer = new Date(Date.now() - 864e5);
      const sAyer = await fs.collection("attendance_sessions").add({ projectId: "lab-clase", startTime: ayer,
        endTime: new Date(ayer.getTime() + 5 * 6e4), pointsReward: 15, coinsReward: 30, autoReward: true, isActive: false });
      await fs.collection("attendance_records").add({ sessionId: sAyer.id, projectId: "lab-clase", userId: fAna._uid,
        studentProfileId: fAna._id, registeredAt: ayer });

      // Rita abre la llamada, con el regalo marcado
      const rita = await nueva("Rita abre la llamada");
      await rita.entrarPorLaPuerta("rita@lab.test", "Rita Referente");
      await rita.hasta("location.pathname.indexOf('consola.html')>=0", 20);
      await rita.ir("llamada.html?per=lab-clase");
      const lista = await rita.hasta("!!document.getElementById('ll-tocar')", 25);
      c("clase · la referente ve el botón de tocar la llamada", lista, (await rita.texto()).slice(0, 200));
      await rita.js("var r=document.getElementById('ll-sobre'); if(r) r.checked=true; document.getElementById('ll-tocar').click(); 1");
      const abierta = await rita.hasta("!!document.getElementById('ll-lista')", 20);
      c("clase · la llamada queda abierta, con cuenta atrás", abierta, (await rita.texto()).slice(0, 200));
      const sesiones = await consultar("attendance_sessions", "projectId", "lab-clase");
      const hoy = sesiones.filter(x => x.isActive !== false && x._id !== sAyer.id);
      c("clase · y existe en Firestore, con el regalo apuntado", hoy.some(x => x.stargateRegalo === "sobre"),
        JSON.stringify(hoy.map(x => ({ regalo: x.stargateRegalo, activa: x.isActive }))));
      await rita.foto(FOTOS + "/5-llamada-abierta.png");

      // los tres fichan desde su Nave
      const fichar = async (p, alias) => {
        await p.ir("recluta.html?per=lab-clase");
        await p.hasta("/" + alias + "/.test(document.body.innerText)", 25);
        const hay = await p.hasta("[].slice.call(document.querySelectorAll('button')).some(function(b){return /Presente/.test(b.textContent)})", 25);
        if (!hay) return { hay: false, texto: (await p.texto()).slice(0, 200) };
        await p.js("[].slice.call(document.querySelectorAll('button')).filter(function(b){return /Presente/.test(b.textContent)})[0].click(); 1");
        await dormir(9000);
        return { hay: true, texto: await p.texto() };
      };
      const antesAna = await fichaDe("ana@lab.test", "lab-clase");
      const rAna = await fichar(ana, "Andrómeda"), rBeto = await fichar(beto, "Bólido");
      c("clase · a Ana y Beto (escuadrón de Rita) les sale «✋ Presente»", rAna.hay && rBeto.hay,
        [rAna, rBeto].filter(x => !x.hay).map(x => x.texto).join(" | "));
      // 🔴 Carla es del OTRO Comandante: la llamada de Rita no es suya y no debe verla
      await carla.ir("recluta.html?per=lab-clase");
      await carla.hasta("/Cometa/.test(document.body.innerText)", 25);
      await dormir(3000);
      c("🔴 clase · a Carla (otro escuadrón) NO le sale el «Presente» de una llamada que no es suya",
        !(await carla.js("[].slice.call(document.querySelectorAll('button')).some(function(b){return /Presente/.test(b.textContent)})")));
      const dAna = await fichaDe("ana@lab.test", "lab-clase");
      c("clase · fichar paga la asistencia (xp y créditos del servidor)",
        dAna.totalPoints > antesAna.totalPoints && dAna.coins > antesAna.coins,
        "xp " + antesAna.totalPoints + "→" + dAna.totalPoints + " · ◈ " + antesAna.coins + "→" + dAna.coins);
      c("🔴 clase · y la RACHA: Ana vino ayer y hoy → +5 ◈ extra (30 base + 5)",
        dAna.coins - antesAna.coins === 35, "ha cobrado " + (dAna.coins - antesAna.coins) + " ◈");
      const cartasAntes = (antesAna.inventory || []).filter(x => /__cromo_/.test(x)).length;
      const cartasDespues = (dAna.inventory || []).filter(x => /__cromo_/.test(x)).length;
      c("🔴 clase · y el REGALO: tres cartas nuevas en su álbum", cartasDespues - cartasAntes === 3,
        "cartas " + cartasAntes + "→" + cartasDespues + " · inventario: " + (dAna.inventory || []).slice(-5).join(","));
      const marca = await leerDoc("stargate_asistencia/" + hoy[0]._id + "__" + fAna._uid);
      c("clase · y queda apuntado que ya cobró (no se paga dos veces)", !!marca, JSON.stringify(marca));
      await ana.foto(FOTOS + "/5-ana-presente.png");

      // pulsar otra vez no paga otra vez
      const r2 = await fichar(ana, "Andrómeda");
      const dAna2 = await fichaDe("ana@lab.test", "lab-clase");
      c("clase · fichar dos veces NO cobra dos veces", dAna2.coins === dAna.coins, dAna.coins + " → " + dAna2.coins);

      // el aula ve a los que han fichado
      await rita.ir("aula.html?per=lab-clase");
      const ve = await rita.hasta("/Andrómeda/.test(document.body.innerText) && /Bólido/.test(document.body.innerText)", 25);
      c("clase · en el aula de la referente aparecen los que han fichado, con su alias", ve, (await rita.texto()).slice(0, 300));
      c("clase · y dice cuántos van", /2\s*presentes/.test(await rita.texto()));
      await rita.foto(FOTOS + "/5-aula.png");

      // premio a mano
      const fBeto = await fichaDe("beto@lab.test", "lab-clase");
      await rita.js("[].slice.call(document.querySelectorAll('button')).filter(function(b){return /Premiar/.test(b.textContent)})[0].click(); 1");
      await rita.hasta("!!document.getElementById('au-quien')", 10);
      await rita.js(`(function(){ var s=document.getElementById('au-quien'); s.value=${JSON.stringify(fBeto._id)};
        var b=[].slice.call(document.querySelectorAll('.au-pr')).filter(function(x){return x.getAttribute('data-cr')==='20' && x.getAttribute('data-xp')==='0'})[0]; b.click(); return 1; })()`);
      await dormir(5000);
      const fBeto2 = await fichaDe("beto@lab.test", "lab-clase");
      c("clase · la referente premia a mano a Beto con +20 ◈", fBeto2.coins - fBeto.coins === 20,
        fBeto.coins + " → " + fBeto2.coins + " · " + await rita.js("(document.getElementById('au-pmsg')||{}).textContent||''"));
      const RUIDO = /youtube|genially|gstatic|googleapis|favicon/i;
      const propios = [rita, ana, beto, carla].map(p => ({ n: p.nombre, r: p.rotos.filter(u => !RUIDO.test(u)),
        e: p.errores.filter(x => !/Failed to load resource/.test(x)) }));
      c("clase · ninguna pantalla revienta ni pide un fichero que no existe", propios.every(x => !x.r.length && !x.e.length),
        propios.filter(x => x.r.length || x.e.length).map(x => x.n + ": " + (x.r[0] || x.e[0])).join(" | "));
    }

    // ============================================================ 6 · LOS ESCONDITES, CON SUS TRES TOPES
    if (hacer(6)) {
      const rita = await nueva("Rita configura los escondites");
      await rita.entrarPorLaPuerta("rita@lab.test", "Rita Referente");
      await rita.hasta("location.pathname.indexOf('consola.html')>=0", 20);
      await rita.ir("consola.html?per=lab-clase");
      await rita.hasta("document.querySelectorAll('.pestanas .pest').length>0", 20);
      await rita.js("[].slice.call(document.querySelectorAll('.pestanas .pest')).filter(function(b){return /Premios por enlace/.test(b.textContent)})[0].click(); 1");
      await rita.hasta("!!document.getElementById('hv-save')", 15);
      // p2 → bolsa de 40 con tope TOTAL 1 · p3 → sobre con tope POR ESCUADRÓN 1
      await rita.js(`(function(){
        var filas=[].slice.call(document.querySelectorAll('.hv-f'));
        function pon(f, premio, lim, esc){ var s=f.querySelector('.h-premio'); s.value=premio; s.dispatchEvent(new Event('change'));
          var l=f.querySelector('.h-lim'); l.value=lim; l.dispatchEvent(new Event('input'));
          var e=f.querySelector('.h-esc'); e.value=esc; e.dispatchEvent(new Event('input')); }
        pon(filas[1],'bolsa',1,0); pon(filas[2],'sobre',0,1);
        document.getElementById('hv-save').click(); return filas.length; })()`);
      await dormir(4000);
      const p2 = await leerDoc("rewards/lab-clase__huevo_p2"), p3 = await leerDoc("rewards/lab-clase__huevo_p3");
      c("escondites · al guardar, cada uno es una recompensa del servidor", !!p2 && !!p3);
      c("escondites · p2: bolsa con tope total 1", p2 && p2.claimLinkMaxTotal === 1 && p2.stargateHuevo.premio === "bolsa", JSON.stringify(p2 && { t: p2.claimLinkMaxTotal, pr: p2.stargateHuevo }));
      c("escondites · p3: tope 1 por escuadrón", p3 && p3.claimLinkMaxPerSquad === 1, JSON.stringify(p3 && p3.claimLinkMaxPerSquad));
      c("escondites · y no salen en el Mercado", p2 && p2.inStore === false);

      const reclamar = async (correo, nombre, h) => {
        const p = await nueva(nombre + " busca " + h);
        await p.ir("huevo.html?h=" + h);
        await p.entrarComo(correo, nombre);
        await p.ir("huevo.html?h=" + h);
        // con sesión, el escondite enseña «🥚 Abrirlo» (hv-abrir); sin ella, la puerta (hv-entrar)
        const ab = await p.hasta("!!document.getElementById('hv-abrir') || /ya lo ten|no existe|cerrado|tarde/i.test(document.body.innerText)", 15);
        if (ab) await p.js("var b=document.getElementById('hv-abrir'); if(b) b.click(); 1");
        await dormir(9000);
        p.__foto = FOTOS + "/6-" + nombre + "-" + h + ".png"; await p.foto(p.__foto);
        const t = await p.texto();
        await p.cerrar();
        return t;
      };
      const antes = await fichaDe("ana@lab.test", "lab-clase");
      const t1 = await reclamar("ana@lab.test", "Ana", "p1");
      const d1 = await fichaDe("ana@lab.test", "lab-clase");
      const nuevas = (d1.inventory || []).filter(x => /__cromo_/.test(x)).length - (antes.inventory || []).filter(x => /__cromo_/.test(x)).length;
      c("🔴 escondites · Ana encuentra p1 (sobre) y se lleva TRES cartas de verdad", nuevas === 3, "cartas nuevas: " + nuevas + " · " + t1.slice(0, 200));
      const t1b = await reclamar("ana@lab.test", "Ana", "p1");
      const d1b = await fichaDe("ana@lab.test", "lab-clase");
      c("escondites · si vuelve al mismo, «ya lo tenías» y no paga", /ya lo ten|ya era|ya lo encontr/i.test(t1b) &&
        (d1b.inventory || []).length === (d1.inventory || []).length, t1b.slice(0, 160));
      const t2a = await reclamar("ana@lab.test", "Ana", "p2");
      const d2a = await fichaDe("ana@lab.test", "lab-clase");
      c("🔴 escondites · p2 (tope total 1): Ana llega primera y cobra la bolsa (50 ◈)", d2a.coins - d1b.coins === 50, (d1b.coins) + " → " + d2a.coins + " · " + t2a.slice(0, 160));
      const bAntes = await fichaDe("beto@lab.test", "lab-clase");
      const t2b = await reclamar("beto@lab.test", "Beto", "p2");
      const bDesp = await fichaDe("beto@lab.test", "lab-clase");
      c("🔴 escondites · p2: Beto llega segundo → «llegaste tarde» y no cobra", /tarde/i.test(t2b) && bDesp.coins === bAntes.coins, t2b.slice(0, 200));
      // p3, uno por escuadrón: Ana y Beto eligieron el mismo Comandante; Carla, el otro
      const t3a = await reclamar("ana@lab.test", "Ana", "p3");
      const t3b = await reclamar("beto@lab.test", "Beto", "p3");
      const t3c = await reclamar("carla@lab.test", "Carla", "p3");
      c("🔴 escondites · p3 (1 por escuadrón): Ana sí, Beto (su mismo escuadrón) no, Carla (otro) sí",
        /cartas|toca|sobre|Ver mi Nave/i.test(t3a) && /tarde|agotado/i.test(t3b) && /cartas|toca|sobre|Ver mi Nave/i.test(t3c),
        "Ana: " + t3a.slice(0, 80) + " | Beto: " + t3b.slice(0, 80) + " | Carla: " + t3c.slice(0, 80));
    }

    // ============================================================ 7 · DESHACER, Y EL TRAMPOSO
    if (hacer(7)) {
      const ana = await nueva("Ana registra y deshace");
      await ana.ir("entrar.html"); await ana.entrarComo("ana@lab.test", "Ana Nueva");
      await ana.ir("recluta.html?per=lab-clase#retos");
      await ana.hasta("[].slice.call(document.querySelectorAll('button')).some(function(b){return /Lo he hecho/.test(b.textContent)})", 25);
      const antes = await fichaDe("ana@lab.test", "lab-clase");
      await ana.js("[].slice.call(document.querySelectorAll('button')).filter(function(b){return /Lo he hecho/.test(b.textContent)&&!b.disabled})[0].click(); 1");
      await dormir(7000);
      const tras = await fichaDe("ana@lab.test", "lab-clase");
      c("deshacer · «Lo he hecho» registra el reto (completeMission de verdad)", tras.totalPoints > antes.totalPoints,
        antes.totalPoints + " → " + tras.totalPoints);
      const retoNuevo = (tras.completedMissionIds || []).filter(x => (antes.completedMissionIds || []).indexOf(x) < 0)[0];
      await ana.ir("recluta.html?per=lab-clase#retos");
      await ana.hasta("!!document.querySelector('[data-deshacer]')", 20);
      await ana.js("var b=document.querySelector('[data-deshacer]'); b.click(); 1");
      await dormir(1500);
      // NEBULA pregunta; se confirma
      await ana.js("var c=document.querySelector('.neb-capa'); var b=c&&[].slice.call(c.querySelectorAll('button')).filter(function(x){return !/Ahora no|Mejor no|Cancelar/i.test(x.textContent)})[0]; if(b) b.click(); 1");
      await dormir(7000);
      const deshecho = await fichaDe("ana@lab.test", "lab-clase");
      c("🔴 deshacer · la ALUMNA deshace su propio reto (el botón que Norberto marcó IMPORTANTE)",
        deshecho.totalPoints === antes.totalPoints && (deshecho.completedMissionIds || []).indexOf(retoNuevo) < 0,
        "xp " + tras.totalPoints + " → " + deshecho.totalPoints + " (tenía " + antes.totalPoints + ") · " + (await ana.texto()).slice(0, 160));
      const aud = await consultar("stargate_anulaciones", "projectId", "lab-clase");
      c("deshacer · y queda escrito quién lo deshizo", aud.some(x => x.por === "recluta"), JSON.stringify(aud.map(x => x.por)));
    }
    // ============================================================ 8 · ABRIR UN SOBRE, CARTA A CARTA
    if (hacer(8)) {
      const ana = await nueva("Ana abre un sobre");
      await ana.ir("entrar.html"); await ana.entrarComo("ana@lab.test", "Ana Nueva");
      await ana.ir("recluta.html?per=lab-clase#mercado");
      await ana.hasta("!!document.querySelector('button[data-canje]')", 25);
      const antes = await fichaDe("ana@lab.test", "lab-clase");
      await ana.js(`(function(){ var b=[].slice.call(document.querySelectorAll('button[data-canje]')).filter(function(x){return /Sobre de cromos/.test(x.getAttribute('data-nombre')||'')})[0]; b.click(); return 1; })()`);
      await ana.hasta("!!document.querySelector('.neb-capa')", 8);
      await ana.js("var c=document.querySelector('.neb-capa'); [].slice.call(c.querySelectorAll('button')).filter(function(x){return /canjear/i.test(x.textContent)})[0].click(); 1");
      const sale = await ana.hasta("!!document.querySelector('.sb-capa .sb-carta')", 25);
      c("sobre · al canjear, sale la primera carta BOCA ABAJO", sale && !(await ana.js("document.querySelector('.sb-carta').classList.contains('girada')")));
      c("sobre · y dice cuántas vienen (tres puntos)", (await ana.js("document.querySelectorAll('.sb-puntos i').length")) === 3);
      await ana.foto(FOTOS + "/8a-sobre-boca-abajo.png");
      const vistas = [];
      for (let k = 0; k < 3; k++) {
        await ana.js("document.querySelector('.sb-sig').click(); 1");            // darle la vuelta
        await dormir(900);
        vistas.push(await ana.js("(document.querySelector('.sb-nombre')||{}).textContent||''"));
        const img = await ana.js("(function(){var i=document.querySelector('.sb-frente img'); return i? (i.complete && i.naturalWidth>0) : false;})()");
        c("sobre · la carta " + (k + 1) + " se da la vuelta y su arte carga", img && !!vistas[k], vistas[k]);
        if (k === 0) await ana.foto(FOTOS + "/8b-sobre-girada.png");
        await ana.js("document.querySelector('.sb-sig').click(); 1");            // siguiente / resumen
        await dormir(600);
      }
      const abanico = await ana.hasta("document.querySelectorAll('.sb-mini').length===3", 5);
      c("sobre · al final, las tres juntas en abanico", abanico);
      await ana.foto(FOTOS + "/8c-sobre-abanico.png");
      await ana.js("document.querySelector('.sb-fin').click(); 1");
      await dormir(600);
      c("sobre · y «Seguir» cierra y vuelve a la Nave", !(await ana.js("!!document.querySelector('.sb-capa')")));
      const desp = await fichaDe("ana@lab.test", "lab-clase");
      c("sobre · el servidor cobró 15 ◈ y dio 3 cartas", antes.coins - desp.coins === 15 &&
        (desp.inventory || []).filter(x => /__cromo_/.test(x)).length - (antes.inventory || []).filter(x => /__cromo_/.test(x)).length === 3,
        "◈ " + antes.coins + "→" + desp.coins);
      c("sobre · sin 404 ni errores", !ana.rotos.filter(u => !/youtube|genially|gstatic/.test(u)).length && !ana.errores.filter(x => !/Failed to load/.test(x)).length,
        (ana.rotos[0] || "") + " " + (ana.errores[0] || ""));
    }
    // ============================================================ 9 · TRES REPETIDAS POR UN SOBRE
    /**
     * Inventario CONTROLADO: cuatro copias de Bran y nada más repetido (tres repetidas justas). Así
     * se ve sin ruido si el cambio retira exactamente tres copias, si deja la última, si entrega un
     * sobre de verdad y si el servidor dice que no cuando ya no llegan.
     */
    if (hacer(9)) {
      const A = admin(), fs = A.firestore();
      const f0 = await fichaDe("ana@lab.test", "lab-clase");
      const B = "lab-clase__cromo_P1_bran";
      await fs.collection("student_profiles").doc(f0._id).update({ inventory: [B, B, B, B], consumableUses: {} });
      const ana = await nueva("Ana cambia repetidas");
      await ana.ir("entrar.html"); await ana.entrarComo("ana@lab.test", "Ana Nueva");
      await ana.ir("recluta.html?per=lab-clase#mercado");
      const hay = await ana.hasta("[].slice.call(document.querySelectorAll('button[data-canje]')).some(function(b){return b.getAttribute('data-tipo')==='cromo_repes'})", 20);
      c("repetidas · con 3 repetidas justas, el botón «Cambiar» aparece", hay);
      await ana.js("[].slice.call(document.querySelectorAll('button[data-canje]')).filter(function(b){return b.getAttribute('data-tipo')==='cromo_repes'})[0].click(); 1");
      await ana.hasta("!!document.querySelector('.neb-capa')", 8);
      await ana.js("var c=document.querySelector('.neb-capa'); var b=c&&[].slice.call(c.querySelectorAll('button')).filter(function(x){return !/Ahora no/i.test(x.textContent)})[0]; if(b) b.click(); 1");
      const sobre = await ana.hasta("!!document.querySelector('.sb-capa')", 25);
      c("repetidas · el cambio abre un SOBRE, carta a carta", sobre);
      await dormir(1500);
      const f1 = await fichaDe("ana@lab.test", "lab-clase");
      const inv = f1.inventory || [];
      const bran = inv.filter(x => x === B).length;
      const cartas = inv.filter(x => /__cromo_/.test(x)).length;
      c("🔴 repetidas · retira tres copias y deja la última (Bran: 4 → 1, más las que traiga el sobre)", bran >= 1 && bran <= 4 && cartas === 4,
        "Bran " + bran + " · cartas en total " + cartas + " (4 − 3 + 3)");
      // y sin repetidas suficientes, el servidor dice que no aunque se llame a mano
      await fs.collection("student_profiles").doc(f0._id).update({ inventory: [B, B, "lab-clase__cromo_P2_tomas"] });
      const r = await ana.js("window.SG.MOTOR.llamar('stargateCambiarRepes', {projectId:'lab-clase'}).then(function(){return 'LO DEJÓ'}).catch(function(e){return e.message})");
      c("🔴 repetidas · con menos de 3, el SERVIDOR lo rechaza aunque se llame a mano", /Necesitas 3/.test(r), r);
    }

    // ============================================================ 10 · EL TRAMPOSO
    /**
     * Norberto: «simula qué ocurre si un estudiante verifica todas las misiones sin ninguna
     * evidencia, gasta sus créditos y el docente deshace todos los cambios. ¿Qué pasa? ¿Qué
     * deberíamos hacer?». Aquí se hace de verdad y se apuntan las cifras para el informe.
     */
    if (hacer(10)) {
      const beto = await nueva("Beto hace trampa");
      await beto.ir("entrar.html"); await beto.entrarComo("beto@lab.test", "Beto Prueba");
      const f0 = await fichaDe("beto@lab.test", "lab-clase");
      await beto.ir("recluta.html?per=lab-clase#retos");
      await beto.hasta("[].slice.call(document.querySelectorAll('button')).some(function(b){return /Lo he hecho/.test(b.textContent)})", 25);
      // 🔴 Con las reglas del 13-sep: el tramposo intenta marcarlo TODO, y donde le piden enlace pega
      // basura («www.culo.com», el ejemplo de Norberto). El tope de 3 al día lo frena igual.
      let intentos = 0;
      for (let k = 0; k < 25; k++) {
        const hay = await beto.js(`(function(){ var bs=[].slice.call(document.querySelectorAll('button[data-hecho]')).filter(function(x){return !x.disabled && x.offsetParent});
          var b=bs[0]; if(!b) return false; var id=b.getAttribute('data-hecho');
          [].slice.call(document.querySelectorAll('[data-ev="'+id+'"]')).forEach(function(i){ i.value='www.culo.com'; });
          b.click(); return true; })()`);
        if (!hay) break;
        intentos++; await dormir(4500);
        await beto.js("var f=document.querySelector('.sb-fin, .neb-capa [data-cerrar]'); if(f) f.click(); 1");
        if ((await fichaDe("beto@lab.test", "lab-clase")).completedMissionIds.length >= 3 && intentos >= 4) break;
      }
      const f1 = await fichaDe("beto@lab.test", "lab-clase");
      const marcados = (f1.completedMissionIds || []).length - (f0.completedMissionIds || []).length;
      REG.tramposo = { antes: "15 retos, +4.100 xp, +880 ◈ en un minuto (sin tope ni enlace)",
                       marcados, xp: f1.totalPoints - f0.totalPoints, creditos: f1.coins - f0.coins };
      c("🔴 tramposo · con el tope, por mucho que pulse solo registra 3 retos hoy", marcados === 3, JSON.stringify(REG.tramposo));
      const avisoTope = await beto.js("(document.getElementById('nave-aviso')||{}).textContent||''");
      c("tramposo · y la Nave le dice por qué", /Hoy ya has registrado 3/.test(avisoTope), avisoTope.slice(0, 120));
      const suyas = await consultar("mission_deliveries", "studentProfileId", f1._id);
      c("tramposo · y deja rastro: su basura queda como evidencia a la vista del docente", suyas.some(x => /culo/.test(x.enlace || "")),
        JSON.stringify(suyas.map(x => x.stargateReto + ":" + x.enlace)));
      // se lo gasta en sobres
      let sobres = 0;
      for (let k = 0; k < 80; k++) {
        const f = await fichaDe("beto@lab.test", "lab-clase"); if (f.coins < 15) break;
        await beto.ir("recluta.html?per=lab-clase#mercado");
        await beto.hasta("!!document.querySelector('button[data-canje]')", 15);
        const ok = await beto.js(`(function(){ var b=[].slice.call(document.querySelectorAll('button[data-canje]')).filter(function(x){return /Sobre de cromos/.test(x.getAttribute('data-nombre')||'')})[0]; if(!b) return false; b.click(); return true; })()`);
        if (!ok) break;
        await beto.hasta("!!document.querySelector('.neb-capa')", 8);
        const conf = await beto.js("(function(){var c=document.querySelector('.neb-capa'); if(!c) return 'sin ventana'; var b=[].slice.call(c.querySelectorAll('button')).filter(function(x){return /canjear/i.test(x.textContent)})[0]; if(!b) return 'NO:'+c.innerText.replace(/\\s+/g,' ').slice(0,160); b.click(); return 'ok';})()");
        if (conf !== "ok") { REG.tramposo.paroEnSobres = conf; await beto.js("var n=document.querySelector('.neb-capa [data-no], .neb-capa [data-cerrar]'); if(n) n.click(); 1"); break; }
        await beto.hasta("!!document.querySelector('.sb-capa')", 20);
        await beto.js("var s=document.querySelector('.sb-saltar'); if(s) s.click(); 1"); await dormir(400);
        await beto.js("var f=document.querySelector('.sb-fin'); if(f) f.click(); 1"); await dormir(600);
        sobres++;
      }
      const f2 = await fichaDe("beto@lab.test", "lab-clase");
      REG.tramposo.sobres = sobres; REG.tramposo.saldoTrasGastar = f2.coins;
      c("tramposo · se gasta los créditos en sobres", sobres >= 1, sobres + " sobres, le quedan " + f2.coins + " ◈");
      c("🔴 cofres · " + sobres + " sobres seguidos del mismo grupo y NINGUNO sale vacío", !REG.tramposo.paroEnSobres,
        REG.tramposo.paroEnSobres || "");
      // intenta deshacer, para recuperar créditos, un reto QUE DIO CRÉDITOS (los A solo dan xp)
      const M = await consultar("missions", "projectId", "lab-clase");
      // solo los retos que el recluta ve con su botón de deshacer (A, B, X); los hitos (H1…) van solos
      const conCreditos = (f2.completedMissionIds || []).map(id => M.find(m => m._id === id))
        .filter(m => m && /^[ABX]\d/.test(m.stargateId || "") && Number(m.coinsReward || 0) > f2.coins);
      const objetivo = conCreditos[0] && conCreditos[0].stargateId;
      if (!objetivo) { c("tramposo · tiene un reto con créditos que ya gastó", false, JSON.stringify(REG.tramposo)); throw new Error("sin reto objetivo"); }
      REG.tramposo.intentaDeshacer = objetivo + " (" + (conCreditos[0] && conCreditos[0].coinsReward) + " ◈, le quedan " + f2.coins + ")";
      await beto.ir("recluta.html?per=lab-clase#retos");
      await beto.hasta("!!document.querySelector('[data-deshacer=\"" + objetivo + "\"]')", 20);
      await beto.js("document.querySelector('[data-deshacer=\"" + objetivo + "\"]').click(); 1");
      await beto.hasta("/ya no se puede|te los has gastado/i.test((document.querySelector('.neb-capa')||{}).innerText||'')", 6);
      const aviso = await beto.js("(document.querySelector('.neb-capa')||{}).innerText||''");
      c("🔴 tramposo · no puede deshacer un reto cuyos créditos ya gastó: la Nave se lo explica", /ya no se puede deshacer|ya te los has gastado/i.test(aviso), aviso.replace(/\s+/g, " ").slice(0, 200));
      await beto.foto(FOTOS + "/10-tramposo-no-puede.png");
      await beto.js("var b=document.querySelector('.neb-capa [data-si], .neb-capa [data-cerrar], .neb-capa .btn'); if(b) b.click(); 1");
      const forzado = await beto.js("window.SG.MOTOR.llamar('stargateAnularReto',{projectId:'lab-clase',studentProfileId:" + JSON.stringify(f2._id) + ",retoId:" + JSON.stringify(objetivo) + "}).then(function(){return 'LO DEJÓ'}).catch(function(e){return e.message})");
      c("🔴 tramposo · y si lo fuerza a mano, el SERVIDOR también se lo niega", /gastado/i.test(forzado), forzado.slice(0, 160));
      // la docente lo anula todo, uno a uno (como en la consola)
      const rita = await nueva("Rita anula al tramposo");
      await rita.ir("entrar.html"); await rita.entrarComo("rita@lab.test", "Rita Referente");
      await rita.ir("consola.html?per=lab-clase");
      await rita.hasta("!!(window.SG && SG.MOTOR)", 15);
      const suyos = (f2.completedMissionIds || []).map(id => (M.find(m => m._id === id) || {}).stargateId).filter(Boolean);
      const res = await rita.js("(async function(){ var out=[]; var L=" + JSON.stringify(suyos) + "; for (var k=0;k<L.length;k++){ try{ out.push(await window.SG.MOTOR.anularReto('lab-clase'," + JSON.stringify(f2._id) + ",L[k],'trampa')); }catch(e){ out.push({error:e.message}); } } return out; })()", 120000);
      const f3 = await fichaDe("beto@lab.test", "lab-clase");
      const noRet = (res || []).reduce((a, x) => a + Number((x && x.noRetirados) || 0), 0);
      REG.tramposo.anulados = suyos.length; REG.tramposo.noRetirados = noRet;
      REG.tramposo.xpFinal = f3.totalPoints; REG.tramposo.saldoFinal = f3.coins;
      REG.tramposo.cartasQueConserva = (f3.inventory || []).filter(x => /__cromo_/.test(x)).length;
      c("tramposo · la docente anula todos sus retos y la xp de los retos desaparece", (f3.completedMissionIds || []).length === 0,
        JSON.stringify((res || []).filter(x => x && x.error)));
      c("tramposo · el servidor le dice a la docente cuánto no pudo retirar", noRet > 0, noRet + " ◈ que ya se había gastado");
      console.error("   · TRAMPOSO: " + JSON.stringify(REG.tramposo));
    }
    // ============================================================ 11 · EL ENLACE OBLIGATORIO Y LO QUE VE EL DOCENTE
    if (hacer(11)) {
      const carla = await nueva("Carla y los enlaces");
      await carla.ir("entrar.html"); await carla.entrarComo("carla@lab.test", "Carla Prueba");
      await carla.ir("recluta.html?per=lab-clase#retos");
      await carla.hasta("!!document.querySelector('button[data-hecho=\"B1\"]')", 25);
      const ph = await carla.js("(document.querySelector('[data-ev=\"B1\"]')||{}).placeholder||''");
      c("evidencia · el campo de B1 dice que es OBLIGATORIO antes de pulsar", /obligatorio/.test(ph), ph);
      const ph0 = await carla.js("(document.querySelector('[data-ev=\"A0\"]')||{}).placeholder||''");
      c("evidencia · y el de A0 (lo primero en clase) solo lo recomienda", /recomendado/.test(ph0), ph0);
      const antes = await fichaDe("carla@lab.test", "lab-clase");
      await carla.js("document.querySelector('button[data-hecho=\"B1\"]').click(); 1");
      await dormir(2500);
      const f1 = await fichaDe("carla@lab.test", "lab-clase");
      c("🔴 evidencia · sin enlace, B1 NO se registra", (f1.completedMissionIds || []).length === (antes.completedMissionIds || []).length);
      c("evidencia · y el campo se marca en rojo con el aviso", await carla.js("!!document.querySelector('[data-ev=\"B1\"].falta')") &&
        /necesita el enlace/.test(await carla.js("(document.getElementById('nave-aviso')||{}).textContent||''")));
      await carla.foto(FOTOS + "/11-sin-enlace.png");
      await carla.js("[].slice.call(document.querySelectorAll('[data-ev=\"B1\"]')).forEach(function(i){i.value='https://padlet.com/carla/mi-imagen-ia';}); document.querySelector('button[data-hecho=\"B1\"]').click(); 1");
      await dormir(6000);
      const f2 = await fichaDe("carla@lab.test", "lab-clase");
      c("evidencia · con enlace, B1 se registra", (f2.completedMissionIds || []).length === (antes.completedMissionIds || []).length + 1);
      // el docente lo ve: la ficha de Carla con su enlace, y un aviso en quien tenga huecos
      const A = admin(), fs = A.firestore();
      const fAna = await fichaDe("ana@lab.test", "lab-clase");
      // Ana registró un reto obligatorio ANTES de la regla (o se lo otorgaron): sin enlace
      await fs.collection("student_profiles").doc(fAna._id).update({ completedMissionIds: (fAna.completedMissionIds || []).concat(["lab-clase__B3"]) });
      const rita = await nueva("Rita revisa evidencias");
      await rita.ir("entrar.html"); await rita.entrarComo("rita@lab.test", "Rita Referente");
      await rita.ir("consola.html?per=lab-clase");
      await rita.hasta("document.querySelectorAll('.pestanas .pest').length>0", 20);
      const aviso = await rita.hasta("!!document.querySelector('.sin-evid')", 12);
      c("🔴 evidencia · en «Mi gente», un aviso junto a quien tiene retos obligatorios sin enlace", aviso,
        await rita.js("[].slice.call(document.querySelectorAll('.sin-evid')).map(function(x){return x.closest('tr').querySelector('b').textContent+': '+x.textContent}).join(' | ')"));
      await rita.foto(FOTOS + "/11-mi-gente-avisos.png");
      await rita.js("[].slice.call(document.querySelectorAll('[data-r]')).filter(function(f){return /Cometa/.test(f.textContent)})[0].click(); 1");
      const enlace = await rita.hasta("((document.querySelector('.evid-ficha')||{}).innerHTML||'').indexOf('padlet.com/carla')>=0", 12);
      c("🔴 evidencia · y en la ficha de Carla, su enlace pulsable junto al reto", enlace,
        await rita.js("(document.querySelector('.evid-ficha')||{}).innerHTML||''"));
      await rita.foto(FOTOS + "/11-ficha-evidencias.png");
    }
    // ============================================================ 12 · PREMIOS POR ENLACE, INCRUSTADOS EN OTRA WEB
    /**
     * Norberto: «¿un docente referente podría crear una recompensa de xp, dinero o material y
     * embeberla en Genially? … por ejemplo: una recompensa para los 5 primeros de cada grupo, al
     * pulsarla ganan 3 cromos. Hazlo y testéalo». Aquí la crea Rita desde su pantalla y la cobran
     * los alumnos DESDE DENTRO de una página de otro sitio, como una presentación.
     */
    if (hacer(12)) {
      const rita = await nueva("Rita crea premios");
      await rita.ir("entrar.html"); await rita.entrarComo("rita@lab.test", "Rita Referente");
      await rita.ir("consola.html?per=lab-clase");
      await rita.hasta("document.querySelectorAll('.pestanas .pest').length>0", 20);
      await rita.js("[].slice.call(document.querySelectorAll('.pestanas .pest')).filter(function(b){return /Premios por enlace/.test(b.textContent)})[0].click(); 1");
      await rita.hasta("!!document.getElementById('hv-add')", 15);
      const nFilas = await rita.js("document.querySelectorAll('.hv-f').length");
      await rita.js("document.getElementById('hv-add').click(); document.getElementById('hv-add').click(); 1");
      const ids = await rita.js(`(function(){
        var f=[].slice.call(document.querySelectorAll('.hv-f')); var a=f[f.length-2], b=f[f.length-1];
        function pon(x, sel, v, ev){ var e=x.querySelector(sel); e.value=v; e.dispatchEvent(new Event(ev||'input')); }
        pon(a,'.h-nom','Los 5 primeros de cada escuadrón'); pon(a,'.h-premio','sobre','change'); pon(a,'.h-esc','5');
        pon(b,'.h-nom','Experiencia para todos'); pon(b,'.h-premio','xp','change'); pon(b,'.h-cantidad','100');
        var visible = !b.querySelector('.h-cant').hidden && a.querySelector('.h-cant').hidden;
        document.getElementById('hv-save').click();
        return { a: a.querySelector('.h-id').value, b: b.querySelector('.h-id').value, cantidadSoloDondeToca: visible };
      })()`);
      await dormir(4000);
      c("premios · la referente añade dos premios desde su pantalla", nFilas + 2 === await rita.js("document.querySelectorAll('.hv-f').length"));
      c("premios · la caja «Cantidad» solo sale para créditos y xp", ids.cantidadSoloDondeToca);
      c("premios · los nuevos nacen con un identificador que no se adivina", /^e\d+-[a-z0-9]{5}$/.test(ids.a) && /^e\d+-[a-z0-9]{5}$/.test(ids.b), ids.a + " · " + ids.b);
      const ra = await leerDoc("rewards/lab-clase__huevo_" + ids.a), rb = await leerDoc("rewards/lab-clase__huevo_" + ids.b);
      c("premios · «5 primeros de cada escuadrón → sobre» queda así en el servidor", ra && ra.claimLinkMaxPerSquad === 5 && ra.stargateHuevo.premio === "sobre",
        JSON.stringify(ra && { esc: ra.claimLinkMaxPerSquad, p: ra.stargateHuevo }));
      c("premios · «+100 xp para todos» también", rb && rb.stargateHuevo.premio === "xp" && rb.consumeEffects.attributes.addPoints === 100,
        JSON.stringify(rb && rb.consumeEffects));
      await rita.foto(FOTOS + "/12-premios-por-enlace.png");

      // cobrarlos desde DENTRO de una página de otro sitio (como una presentación de Genially)
      const cobrar = async (correo, nombre, h) => {
        const p = await nueva(nombre + " en la presentación");
        await p.ir("http://127.0.0.1:" + L.P_WEB2 + "/genially.html?que=" + encodeURIComponent("huevo.html?h=" + h + "&embed=1"));
        const f = await p.marco("huevo.html");
        if (!f) return { error: "no encuentro el iframe" };
        const puerta = await f.hasta("!!document.getElementById('hv-entrar')", 15);
        const sinCabecera = await f.js("!document.querySelector('nav.nav') || getComputedStyle(document.querySelector('nav.nav')).display==='none'");
        await f.entrarComo(correo, nombre);
        await f.recargar(); await dormir(2500);
        const f2 = await p.marco("huevo.html");
        await f2.hasta("!!document.getElementById('hv-abrir')", 15);
        await f2.js("var b=document.getElementById('hv-abrir'); if(b) b.click(); 1");
        await dormir(7000);
        const sobre = await f2.js("!!document.querySelector('.sb-capa')");
        if (sobre) { await f2.js("var s=document.querySelector('.sb-saltar'); if(s) s.click(); 1"); await dormir(500);
                     await f2.js("var x=document.querySelector('.sb-fin'); if(x) x.click(); 1"); await dormir(800); }
        const t = await f2.texto();
        await p.foto(FOTOS + "/12-" + nombre + "-" + h + ".png");
        await p.cerrar();
        return { puerta, sinCabecera, sobre, texto: t, errores: p.errores };
      };
      const b0 = await fichaDe("beto@lab.test", "lab-clase");
      const rb1 = await cobrar("beto@lab.test", "Beto", ids.a);
      const b1 = await fichaDe("beto@lab.test", "lab-clase");
      c("🔴 embebido · dentro de la presentación, sin sesión, sale la puerta de Google AHÍ MISMO", rb1.puerta, rb1.error || "");
      c("embebido · y sin la cabecera de la web", rb1.sinCabecera);
      c("🔴 embebido · Beto entra desde el iframe, abre el sobre carta a carta y se lleva 3 cartas", rb1.sobre &&
        (b1.inventory || []).filter(x => /__cromo_/.test(x)).length - (b0.inventory || []).filter(x => /__cromo_/.test(x)).length === 3,
        rb1.texto.slice(0, 160));
      const c0 = await fichaDe("carla@lab.test", "lab-clase");
      const rc = await cobrar("carla@lab.test", "Carla", ids.b);
      const c1 = await fichaDe("carla@lab.test", "lab-clase");
      c("🔴 embebido · Carla cobra «+100 xp» desde la presentación", c1.totalPoints - c0.totalPoints === 100,
        c0.totalPoints + " → " + c1.totalPoints + " · " + rc.texto.slice(0, 140));
      c("embebido · sin errores dentro del iframe", !rb1.errores.length && !rc.errores.length, (rb1.errores[0] || "") + (rc.errores[0] || ""));

      // validar un reto desde la presentación: B2 pide enlace, y se pega ahí mismo
      const ana = await nueva("Ana valida B2 en la presentación");
      const a0 = await fichaDe("ana@lab.test", "lab-clase");
      await ana.ir("http://127.0.0.1:" + L.P_WEB2 + "/genially.html?que=" + encodeURIComponent("validar.html?reto=B2&embed=1"));
      const fv = await ana.marco("validar.html");
      await fv.hasta("!!document.getElementById('v-entrar')", 15);
      await fv.entrarComo("ana@lab.test", "Ana Nueva");
      await fv.recargar(); await dormir(2500);
      const fv2 = await ana.marco("validar.html");
      const pide = await fv2.hasta("!!document.getElementById('v-enlace')", 15);
      c("🔴 validar embebido · B2 pide el enlace ahí mismo, dentro de la presentación", pide, (await fv2.texto()).slice(0, 160));
      await fv2.js("document.getElementById('v-ok').click(); 1"); await dormir(800);
      c("validar embebido · sin enlace no deja registrar", await fv2.js("!!document.querySelector('#v-enlace.falta')"));
      await fv2.js("document.getElementById('v-enlace').value='https://youtu.be/ana-videotutorial'; document.getElementById('v-ok').click(); 1");
      await fv2.hasta("/Registrado/.test(document.body.innerText)", 15);
      const a1 = await fichaDe("ana@lab.test", "lab-clase");
      const ev = await leerDoc("mission_deliveries/lab-clase__B2__" + a1._id);
      c("validar embebido · con enlace, B2 queda registrado Y su enlace guardado para el docente",
        (a1.completedMissionIds || []).indexOf("lab-clase__B2") >= 0 && ev && /ana-videotutorial/.test(ev.enlace), JSON.stringify(ev));
      await ana.foto(FOTOS + "/12-validar-embebido.png");
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
