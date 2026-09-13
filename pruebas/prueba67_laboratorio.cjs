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
  // 13-sep · los capítulos de NEBULA, ya vistos (para las secciones que no van de eso: si no, a mitad
  // de una prueba sale NEBULA contando el Mercado)
  const sinBienvenidas = p => p.js("['c1','c2','c3','c4','c5','c6'].forEach(function(k){localStorage.setItem('sgCap_lab-clase_'+k,'hecho')}); localStorage.setItem('sgNaveOnboard_lab-clase','1'); 1");
  // alistarse de verdad, por la pantalla (lo usan la clase entera y el héroe por enlace)
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
      // 🔴 13-sep · Sol coordina y NO imparte: no tiene escuadrón y no puede salir como Comandante
      const cmds = await ana.js("[].slice.call(document.querySelectorAll('.comandante')).map(function(l){return l.textContent.trim()})");
      c("alumna · los Comandantes que se ofrecen son solo quienes imparten (sin Sol, que coordina)",
        cmds.length === 2 && cmds.indexOf("Sol Coordina") < 0 && !(await ana.js("!!document.querySelector('input[name=cmd]:checked')")), JSON.stringify(cmds));
      c("alumna · las caras de los personajes se ven enteras (no tiras de 40 px)",
        await ana.js("document.querySelector('#a-avatares .av').getBoundingClientRect().height > 90"));
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
      // 🔴 13-sep · la bienvenida tenía HTML y NINGÚN estilo: una columna de imágenes a tamaño natural.
      // Se comprueba que está maquetada (rejilla, Capitán acotado, titular del alistamiento fuera).
      const bvOk = await ana.js(`(function(){ var f=document.querySelector('.bv-fila'), c=document.querySelector('.bv-cap'), h=document.querySelector('header.hero');
        return !!f && getComputedStyle(f).display==='grid' && !!c && c.getBoundingClientRect().height<=320 && (!h || getComputedStyle(h).display==='none'); })()`);
      c("alumna · la bienvenida está maquetada (Capitán, texto y emblema en fila; sin el «Únete» de arriba)", bvOk);
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

      // 🔴 13-sep · «En clase hoy»: quien ha respondido hoy, con sus caras (Carla es de otro escuadrón)
      c("clase · «La clase» enseña «🟢 En clase hoy · 2»", /En clase hoy · 2/.test(await rita.texto()), (await rita.texto()).slice(0, 300));
      await rita.js("[].slice.call(document.querySelectorAll('.au-t')).filter(function(b){return /Premiar/.test(b.textContent)})[0].click(); 1");
      await rita.hasta("document.querySelectorAll('.au-cara').length>0", 15);
      const caras = await rita.js("[].slice.call(document.querySelectorAll('.au-cara b')).map(function(b){return b.textContent})");
      const fuente = await rita.js("(document.querySelector('[data-fuente][aria-pressed=true]')||{}).textContent||''");
      c("premiar · abre en «En clase hoy» con las caras de Ana y Beto (y nadie más)", /En clase hoy/.test(fuente)
        && caras.length === 2 && caras.indexOf("Andrómeda") >= 0 && caras.indexOf("Bólido") >= 0, fuente + " · " + JSON.stringify(caras));
      await rita.foto(FOTOS + "/5-aula-premiar.png");
      const tocar = alias => rita.js(`[].slice.call(document.querySelectorAll('.au-cara')).filter(function(b){return b.querySelector('b').textContent===${JSON.stringify(alias)}})[0].click(); 1`);
      const dar = async k => { await rita.js(`document.querySelector('.au-pr[data-k=${k}]').click(); 1`);
        await rita.hasta("!/Repartiendo/.test((document.getElementById('au-pmsg')||{}).textContent||'Repartiendo') && !!(document.getElementById('au-pmsg')||{}).textContent", 30); };
      // a uno: +20 ◈ a Beto
      const fBeto = await fichaDe("beto@lab.test", "lab-clase");
      await tocar("Bólido"); await dar("cr20");
      const fBeto2 = await fichaDe("beto@lab.test", "lab-clase");
      c("premiar · tocando su cara, +20 ◈ a Beto", fBeto2.coins - fBeto.coins === 20,
        fBeto.coins + " → " + fBeto2.coins + " · " + await rita.js("(document.getElementById('au-pmsg')||{}).textContent||''"));
      // a varios: Todos → +25 xp
      const a0 = await fichaDe("ana@lab.test", "lab-clase"), b0 = await fichaDe("beto@lab.test", "lab-clase");
      await rita.js("document.getElementById('au-todos').click(); 1");
      c("premiar · «Todos» elige a los dos", /Para 2/.test(await rita.js("document.getElementById('au-para').textContent")));
      await dar("xp25");
      const a1 = await fichaDe("ana@lab.test", "lab-clase"), b1 = await fichaDe("beto@lab.test", "lab-clase");
      c("🔴 premiar · +25 xp a los DOS de una vez", a1.totalPoints - a0.totalPoints === 25 && b1.totalPoints - b0.totalPoints === 25,
        (a1.totalPoints - a0.totalPoints) + " / " + (b1.totalPoints - b0.totalPoints));
      // un héroe al azar a los dos
      await dar("heroe");
      const a2 = await fichaDe("ana@lab.test", "lab-clase"), b2 = await fichaDe("beto@lab.test", "lab-clase");
      const nHe = f => (f.inventory || []).filter(x => /__heroe_/.test(x)).length;
      c("🔴 premiar · «Un héroe al azar»: uno para cada uno", nHe(a2) - nHe(a1) === 1 && nHe(b2) - nHe(b1) === 1,
        await rita.js("document.getElementById('au-pmsg').innerText"));
      // un héroe elegido, solo a Beto
      await rita.js("document.getElementById('au-nadie').click(); 1"); await tocar("Bólido");
      await rita.js("document.querySelector('.au-pr[data-k=heroe_el]').click(); var s=document.getElementById('au-heroe'); s.value='H05_eco'; s.dispatchEvent(new Event('change')); 1");
      const imgH = await rita.js("document.getElementById('au-heroe-img').getAttribute('src')");
      await rita.js("document.getElementById('au-heroe-dar').click(); 1");
      await rita.hasta("/Eco de la Cero/.test((document.getElementById('au-pmsg')||{}).textContent||'')", 30);
      const b3 = await fichaDe("beto@lab.test", "lab-clase");
      c("premiar · «Un héroe que eliges»: Beto recibe EXACTAMENTE a Eco de la Cero (con su cara en el selector)",
        (b3.inventory || []).filter(x => x === "lab-clase__heroe_H05_eco").length - (b2.inventory || []).filter(x => x === "lab-clase__heroe_H05_eco").length === 1
          && /H05_eco/.test(imgH), imgH);
      // un adorno a Ana, y otra vez (ya lo tiene)
      await rita.js("document.getElementById('au-nadie').click(); 1"); await tocar("Andrómeda");
      await dar("marco");
      const marcoId = ((await consultar("rewards", "projectId", "lab-clase")).filter(r => r.stargateTipo === "marco")[0] || {})._id;
      const a3 = await fichaDe("ana@lab.test", "lab-clase");
      c("premiar · el marco dorado entra en el inventario de Ana", !!marcoId && (a3.inventory || []).indexOf(marcoId) >= 0, marcoId);
      await dar("marco");
      c("premiar · regalarlo otra vez: «ya lo tenía» (no se duplica)", /ya lo ten/i.test(await rita.js("document.getElementById('au-pmsg').textContent"))
        && ((await fichaDe("ana@lab.test", "lab-clase")).inventory || []).filter(x => x === marcoId).length === 1);
      // 🔴 y Ana lo ve en su Nave para ponérselo (el inventario cuenta como comprado)
      await ana.ir("recluta.html?per=lab-clase");
      await ana.hasta("!!document.querySelector('.nb-t[data-tab=\"botin\"]')", 25);
      await ana.js("document.querySelector('.nb-t[data-tab=\"botin\"]').click(); 1");
      c("🔴 premiar · Ana ve «🖼️ El marco dorado» en Mi botín para ponérselo", await ana.hasta("/El marco dorado/.test(document.body.innerText)", 15));
      // 🎲 pregunta al azar, sin repetir
      await rita.js("document.getElementById('au-azar').click(); 1");
      await rita.hasta("!document.getElementById('au-sorteo').hidden", 15);
      const sale1 = await rita.js("document.querySelector('#au-sorteo b').textContent");
      await rita.js("document.getElementById('au-azar').click(); 1"); await dormir(300);
      await rita.hasta("document.querySelector('#au-sorteo b') && document.querySelector('#au-sorteo b').textContent!==" + JSON.stringify(sale1), 15);
      const sale2 = await rita.js("document.querySelector('#au-sorteo b').textContent");
      c("🔴 pregunta al azar · sale uno de los presentes, y el siguiente es el OTRO (sin repetir)",
        ["Andrómeda", "Bólido"].indexOf(sale1) >= 0 && ["Andrómeda", "Bólido"].indexOf(sale2) >= 0 && sale1 !== sale2, sale1 + " → " + sale2);
      c("pregunta al azar · y queda elegido para premiarlo", new RegExp("Para " + sale2).test(await rita.js("document.getElementById('au-para').textContent")));
      await rita.foto(FOTOS + "/5-aula-azar.png");
      const RUIDO = /youtube|genially|gstatic|googleapis|favicon/i;
      const propios = [rita, ana, beto, carla].map(p => ({ n: p.nombre, r: p.rotos.filter(u => !RUIDO.test(u)),
        e: p.errores.filter(x => !/Failed to load resource/.test(x)) }));
      c("clase · ninguna pantalla revienta ni pide un fichero que no existe", propios.every(x => !x.r.length && !x.e.length),
        propios.filter(x => x.r.length || x.e.length).map(x => x.n + ": " + (x.r[0] || x.e[0])).join(" | "));
      // (después del recuento de errores: este 403 es a propósito)
      // un estudiante no puede regalarse nada
      const trampa = await ana.js(`window.SG.MOTOR.llamar("stargateRegalar",{projectId:"lab-clase",fichas:[${JSON.stringify(a3._id)}],regalo:{tipo:"heroe"}}).then(function(){return "PASÓ"},function(e){return e.message})`);
      c("🔴 premiar · un estudiante que llama a mano a «regalar» recibe un no del servidor", /equipo docente/i.test(trampa), trampa);
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
    // ============================================================ 13 · LA PUERTA DEL MATERIAL, SIN CLIC DE MÁS
    // Una docente con la sesión de Google abierta pero SIN la marca del navegador (la borró, o entró
    // por otra puerta) abría «Proyectar la clase» y se encontraba la caja «Iniciar sesión con Google».
    // Ahora la puerta pregunta sola y se abre. Y al alumnado, con su sesión, se le queda cerrada.
    if (hacer(13)) {
      const rita = await nueva("rita-sin-marca");
      await rita.ir("entrar.html"); await rita.entrarComo("rita@lab.test", "Rita Referente");
      await rita.js("localStorage.removeItem('sgEsDocente'); 1");
      await rita.ir("sesion.html?per=lab-clase");
      const abre = await rita.hasta("!document.getElementById('puerta') && !document.documentElement.classList.contains('cerrado')", 20);
      c("🔴 puerta · docente con sesión y sin marca: la sesión de la semana se abre SOLA, sin pulsar nada", abre,
        await rita.js("document.getElementById('puerta')?'sigue la caja':'—'"));
      const ana = await nueva("ana-en-sesion");
      await ana.ir("entrar.html"); await ana.entrarComo("ana@lab.test", "Ana Nueva");
      await ana.ir("sesion.html?per=lab-clase"); await dormir(5000);
      c("puerta · a una alumna con sesión NO se le abre el material del profesorado",
        await ana.js("!!document.getElementById('puerta')"));
    }
    // ============================================================ 14 · LAS BIENVENIDAS (SIN AUDIO)
    // NEBULA para el alumnado, el Capitán para el docente. Cada paso tiene que señalar algo que
    // EXISTE en pantalla, en el orden que toca, y no volver a salir una vez vista.
    if (hacer(14)) {
      // 14a · una alumna recién alistada: NEBULA, un solo acto, ya dentro
      const leo = await nueva("Leo, recién alistada");
      await leo.entrarPorLaPuerta("leo@lab.test", "Leo Nueva");
      await leo.hasta("!!document.querySelector('#e-cod')", 20);
      await leo.js(`document.querySelector('#e-cod').value=${JSON.stringify(CODIGO)}; document.querySelector('#e-cod-ok').click(); 1`);
      await leo.hasta("!!document.querySelector('#a-enviar')", 25);
      await leo.js(`(function(){
        document.querySelector('#a-nombre').value='Leo'; document.querySelector('#a-apellidos').value='Nueva';
        document.querySelector('#a-alias').value='Lyra Nueva';
        var r=document.querySelector('input[name=cmd]'); if(r) r.checked=true;
        var av=document.querySelector('#a-avatares button, #a-avatares .av'); if(av) av.click(); return 1; })()`);
      await leo.js("document.querySelector('#a-enviar').click(); 1");
      await leo.hasta("!document.querySelector('#a-enviar')", 25);
      await leo.ir("recluta.html?per=lab-clase");
      const sale = await leo.hasta("!!document.querySelector('#nave-onboard.open')", 25);
      const paso = () => leo.js(`(function(){var o=document.querySelector('#nave-onboard.open'); if(!o) return null; var f=document.querySelector('.tour-foco');
        return {n:o.querySelector('.tour-step').textContent, t:o.querySelector('h3').textContent, x:o.querySelector('p').textContent, foco:f?f.className:''};})()`);
      const p0 = await paso();
      c("🔴 bienvenida · a la alumna recién alistada le sale NEBULA en su primera visita, ya dentro", sale && p0 && /1 \/ 6/.test(p0.n), JSON.stringify(p0));
      c("🔴 capítulos · llega en la semana 10: le tocan los capítulos 1 a 4, EN ORDEN («Capítulo 1 de 4»)", p0 && /Capítulo 1 de 4/.test(p0.n), p0 && p0.n);
      c("bienvenida · y NO le pide «escribe tu correo» (esa puerta ya no existe)", p0 && !/correo/i.test(p0.x), p0 && p0.x.slice(0, 120));
      const focos = [p0 && p0.foco];
      for (let k = 0; k < 5; k++) { await leo.js("document.querySelector('#nave-onboard .tour-next').click(); 1"); await dormir(700); const pk = await paso(); focos.push(pk ? pk.foco : "—"); }
      const esperados = ["nave-estado", "cine", "retos-semana", "nb-fin", "nb-tabs", "nb-t"];
      c("bienvenida · cada paso señala lo suyo: ficha, vídeos, retos, marcadores, pestañas y mercado",
        esperados.every((e, k) => (focos[k] || "").split(/\s+/).indexOf(e) >= 0), JSON.stringify(focos));
      // al acabar el 1, sigue el 2, el 3 y el 4, cada uno con lo suyo
      const titulos = [];
      await leo.js("document.querySelector('#nave-onboard .tour-next').click(); 1"); await dormir(900);
      for (let k = 0; k < 12; k++) {
        const pk = await paso(); if (!pk) break;
        if (titulos.indexOf(pk.n.split(" · ").slice(0, 2).join(" · ")) < 0) titulos.push(pk.n.split(" · ").slice(0, 2).join(" · "));
        await leo.js("document.querySelector('#nave-onboard .tour-next').click(); 1"); await dormir(700);
      }
      c("🔴 capítulos · detrás del 1 vienen el Mercado, la Rebelión y los adornos, uno tras otro",
        titulos.length === 3 && /2 de 4/.test(titulos[0]) && /Mercado/.test(titulos[0]) && /Rebeli/.test(titulos[1]) && /insignia de mando/i.test(titulos[2]), JSON.stringify(titulos));
      c("bienvenida · al terminar se cierra", !(await paso()));
      await dormir(1500);
      const fLeo = await fichaDe("leo@lab.test", "lab-clase");
      const caps = fLeo.stargateCapitulos || {};
      c("🔴 capítulos · quedan apuntados EN SU FICHA (no solo en el navegador): c1, c2, c3 y c4 «hecho»",
        ["c1", "c2", "c3", "c4"].every(k => caps[k] && caps[k].estado === "hecho"), JSON.stringify(caps));
      await leo.ir("recluta.html?per=lab-clase"); await leo.hasta("/Lyra Nueva/.test(document.body.innerText)", 25); await dormir(2500);
      c("bienvenida · y en la segunda visita ya no sale", !(await paso()));
      // en otro navegador (sin nada guardado), tampoco: manda su ficha
      const leo2 = await nueva("Leo en otro ordenador");
      await leo2.ir("entrar.html"); await leo2.entrarComo("leo@lab.test", "Leo Nueva");
      await leo2.ir("recluta.html?per=lab-clase"); await leo2.hasta("/Lyra Nueva/.test(document.body.innerText)", 25); await dormir(2500);
      c("🔴 capítulos · en otro ordenador tampoco vuelve a salir (lo sabe su ficha)", !(await leo2.js("!!document.querySelector('#nave-onboard.open')")));
      await leo.js("document.getElementById('btn-onboard') && document.getElementById('btn-onboard').click(); 1"); await dormir(400);
      const menu = await leo.js("[].slice.call(document.querySelectorAll('#rep-menu [data-cap]')).map(function(b){return b.textContent})");
      c("capítulos · «Repetir bienvenida» ofrece los capítulos abiertos", (menu || []).length === 4 && /Canal abierto/.test(menu[0]), JSON.stringify(menu));
      await leo.js("document.querySelector('#rep-menu [data-cap=c1]').click(); 1"); await dormir(700);
      const rep = await paso();
      c("bienvenida · y el 1 se vuelve a poner desde el principio", rep && /1 \/ 6/.test(rep.n), JSON.stringify(rep));
      await leo.js("document.querySelector('#nave-onboard .tour-exit') && document.querySelector('#nave-onboard .tour-exit').click(); 1");
      // 14b · la Nave sin sesión ya no es otra puerta
      const nadie = await nueva("sin sesión en la Nave");
      await nadie.ir("recluta.html?per=lab-clase");
      c("bienvenida · la Nave sin sesión manda a la puerta única", await nadie.hasta("location.pathname.indexOf('entrar.html')>=0", 20), await nadie.js("location.href"));
      // 14c · el Capitán, en Mis grupos: referente (con sus pasos) y docente (sin ellos)
      for (const [correo, nombre, total, ref] of [["rita@lab.test", "Rita Referente", 14, true], ["dani@lab.test", "Dani Docente", 11, false]]) {
        const p = await nueva("visita " + nombre);
        await p.entrarPorLaPuerta(correo, nombre);
        // Dani es también alumna desde la sección 4: entonces la puerta pregunta, y aquí entra como docente
        await p.hasta("location.pathname.indexOf('consola.html')>=0 || !!document.querySelector('.elegir-camino .camino.docente')", 20);
        await p.js("(function(){var a=document.querySelector('.elegir-camino .camino.docente'); if(a) a.click(); return 1;})()");
        await p.hasta("location.pathname.indexOf('consola.html')>=0", 20);
        const inv = await p.hasta("!!document.querySelector('.tour-invite .tour-start')", 20);
        c("capitán · a " + nombre + " le ofrece la visita la primera vez que entra en Mis grupos", inv);
        if (!inv) continue;
        await p.js("document.querySelector('.tour-invite .tour-start').click(); 1");
        const vista = () => p.js(`(function(){var o=document.querySelector('.tour.open'); if(!o) return null; var t=document.querySelector('.tour-target');
          return {pag:location.pathname.split('/').pop(), n:o.querySelector('.tour-step').textContent, t:o.querySelector('h3').textContent, diana:t?t.className:''};})()`);
        await p.hasta("!!document.querySelector('.tour.open')", 15);
        const recorrido = [await vista()];
        for (let k = 0; k < total + 2; k++) {
          const hay = await p.js("(function(){var b=document.querySelector('.tour.open .tour-next'); if(!b) return 0; b.click(); return 1;})()");
          if (!hay) break;
          await p.hasta("!!document.querySelector('.tour.open') || !document.querySelector('.tour')", 12); await dormir(1200);
          const v = await vista(); if (!v) break; recorrido.push(v);
        }
        const nums = recorrido.map(v => v && v.n);
        c("capitán · " + nombre + ": " + total + " pasos, contados igual de principio a fin", recorrido.length === total && nums.every(n => new RegExp("/ " + total + "$").test(n)), JSON.stringify(nums));
        const enConsola = recorrido.filter(v => v.pag === "consola.html" && v.t !== "Listo para el salto");
        c("capitán · " + nombre + ": en Mis grupos cada paso señala un botón de verdad",
          enConsola.every(v => /\bgp|ref-zona|cajon/.test(v.diana)), JSON.stringify(enConsola.map(v => v.t + "→" + v.diana)));
        const titulos = recorrido.map(v => v.t);
        c("capitán · " + nombre + (ref ? " (referente) ve sus pasos: su zona y crear un grupo" : " (docente) NO ve los del referente"),
          ref ? titulos.indexOf("Como referente") >= 0 && titulos.indexOf("Referente: crear un grupo") >= 0
              : titulos.indexOf("Como referente") < 0 && !titulos.some(t => /^Referente/.test(t)), JSON.stringify(titulos));
        c("capitán · " + nombre + ": pasa por la guía, la cronología y las actividades, y acaba en Mis grupos",
          ["guia.html", "cronologia.html", "actividades.html"].every(x => recorrido.some(v => v.pag === x)) && recorrido[recorrido.length - 1].pag === "consola.html",
          JSON.stringify(recorrido.map(v => v.pag)));
        // 14d · la visita de dentro del grupo
        await p.js("document.querySelector('.tour.open .tour-next') && document.querySelector('.tour.open .tour-next').click(); 1");
        await p.ir("consola.html?per=lab-clase");
        const invG = await p.hasta("!!document.querySelector('.tour-invite .tour-aqui')", 20);
        c("capitán · dentro del grupo ofrece «¿Te enseño tu grupo por dentro?» (" + nombre + ")", invG);
        await p.js("document.querySelector('.tour-invite .tour-aqui').click(); 1"); await dormir(900);
        const loc = [await vista()];
        for (let k = 0; k < 12; k++) {
          const hay = await p.js("(function(){var b=document.querySelector('.tour.open .tour-next'); if(!b) return 0; b.click(); return 1;})()");
          if (!hay) break; await dormir(700); const v = await vista(); if (!v) break; loc.push(v);
        }
        const nTabs = ref ? 7 : 3;
        c("capitán · la visita del grupo tiene " + (nTabs + 2) + " pasos, uno por pestaña que " + nombre + " ve",
          loc.length === nTabs + 2 && loc.slice(1, nTabs + 1).every(v => /\bpest\b/.test(v.diana)), JSON.stringify(loc.map(v => v.t + "→" + v.diana)));
      }
    }
    // ============================================================ 15 · LOS VITALICIOS CREAN GRUPOS
    // Norberto: «n.cuartero.10 y mutecdgami están flagueados como referente: deberían poder crear
    // grupos nuevos». Nunca se había probado de punta a punta: formulario → siembra en el motor de
    // verdad (con sus reglas) → el grupo aparece en Mis grupos con su código → alguien se alista.
    if (hacer(15)) {
      const hoy = new Date().toISOString().slice(0, 10);
      for (const [correo, nombre, grupo] of [["n.cuartero.10@gmail.com", "Norberto Cuartero", "Prueba Vitalicio Uno"],
                                             ["mutecdgami@gmail.com", "Mando UNIR", "Prueba Vitalicio Dos"]]) {
        const v = await nueva("vitalicio " + correo);
        await v.ir("entrar.html"); await v.entrarComo(correo, nombre);
        await v.ir("crear.html");
        const form = await v.hasta("!!document.getElementById('f-nombre') && !!document.getElementById('btn-crear')", 25);
        c("vitalicio · " + correo + " llega al formulario de crear grupo (no al «esto lo hace tu referente»)", form,
          (await v.texto()).slice(0, 160));
        if (!form) continue;
        await v.js(`(function(){ var n=document.getElementById('f-nombre'); n.value=${JSON.stringify(grupo)}; n.dispatchEvent(new Event('input',{bubbles:true}));
          var f=document.getElementById('f-inicio'); f.value=${JSON.stringify(hoy)}; f.dispatchEvent(new Event('input',{bubbles:true})); f.dispatchEvent(new Event('change',{bubbles:true}));
          return 1; })()`);
        await dormir(500);
        await v.js("document.getElementById('btn-crear').click(); 1");
        const listo = await v.hasta("/Grupo listo/.test(document.body.innerText)", 60);
        const codigo = await v.js("(document.querySelector('.codigo-grande')||{}).textContent||''");
        c("vitalicio · " + correo + " siembra el grupo entero y le sale su código", listo && /^[A-Z0-9]{6}$/.test(codigo),
          listo ? "código «" + codigo + "»" : (await v.texto()).slice(0, 200));
        if (!listo) continue;
        const id = await v.js("(document.querySelector('a[href^=\"consola.html?per=\"]')||{}).getAttribute ? document.querySelector('a[href^=\"consola.html?per=\"]').getAttribute('href').split('per=')[1] : ''");
        const proy = await leerDoc("projects/" + id);
        c("vitalicio · el grupo existe en Firestore con los dos vitalicios en el equipo",
          proy && ["n.cuartero.10@gmail.com", "mutecdgami@gmail.com"].every(x => (proy.coTeacherEmails || []).indexOf(x) >= 0),
          JSON.stringify(proy && proy.coTeacherEmails));
        const misiones = await consultar("missions", "projectId", id);
        c("vitalicio · y con sus retos sembrados", misiones.length >= 20, misiones.length + " misiones");
        await v.ir("consola.html");
        const ve = await v.hasta("document.body.innerText.indexOf(" + JSON.stringify(grupo.toUpperCase()) + ")>=0 || document.body.innerText.indexOf(" + JSON.stringify(grupo) + ")>=0", 25);
        c("vitalicio · el grupo nuevo aparece en Mis grupos con su código a la vista", ve && (await v.texto()).indexOf(codigo) >= 0,
          (await v.texto()).slice(0, 240));
        // y alguien se alista con ese código
        const nuevo = await nueva("alumno de " + grupo);
        const alumno = "alumno." + id.replace(/[^a-z0-9]/g, "") + "@lab.test";
        await nuevo.entrarPorLaPuerta(alumno, "Alumno Nuevo");
        await nuevo.hasta("!!document.querySelector('#e-cod')", 20);
        await nuevo.js(`document.querySelector('#e-cod').value=${JSON.stringify(codigo)}; document.querySelector('#e-cod-ok').click(); 1`);
        const al = await nuevo.hasta("location.pathname.indexOf('alistarse.html')>=0 && location.search.indexOf(" + JSON.stringify(id) + ")>=0", 20);
        c("vitalicio · con el código del grupo nuevo, un alumno llega a SU alistamiento", al, await nuevo.js("location.href"));
      }
      // y un docente que no es referente, no
      const dani = await nueva("dani en crear");
      await dani.ir("entrar.html"); await dani.entrarComo("dani@lab.test", "Dani Docente");
      await dani.ir("crear.html");
      const no = await dani.hasta("/Esto lo hace tu profe referente/.test(document.body.innerText)", 20);
      c("crear · a un docente que no es referente se le dice con claridad que eso lo hace su referente", no, (await dani.texto()).slice(0, 160));
    }
    // ============================================================ 16 · LO QUE ESTÁ A MEDIAS NO SE PIERDE
    // Visto con una cuenta real: la alumna pega su enlace en un reto, la Nave se repinta (llega una
    // llamada, se refresca la ficha…) y el enlace desaparece con la tarjeta cerrada. «Lo he hecho» no
    // hacía nada. Aquí la docente toca llamada a filas JUSTO mientras la alumna escribe.
    if (hacer(16)) {
      const rita = await nueva("Rita, la llamada a media escritura");
      await rita.ir("entrar.html"); await rita.entrarComo("rita@lab.test", "Rita Referente");
      await rita.ir("llamada.html?per=lab-clase");
      await rita.hasta("!!document.getElementById('ll-tocar') || !!document.getElementById('ll-cerrar')", 25);
      if (await rita.js("!!document.getElementById('ll-cerrar')")) {
        await rita.js("document.getElementById('ll-cerrar').click(); 1");
        await rita.hasta("!!document.getElementById('ll-tocar')", 20);
      }
      const ana = await nueva("Ana, a media escritura");
      await ana.ir("entrar.html"); await ana.entrarComo("ana@lab.test", "Ana Nueva");
      await sinBienvenidas(ana);
      await ana.ir("recluta.html?per=lab-clase");
      await ana.hasta("!!document.querySelector('.retos-semana details.reto-sem:not(.hecho)')", 25); await dormir(2500);
      const escrito = "https://ejemplo.org/mi-trabajo-a-medias";
      const ok0 = await ana.js(`(function(){ var d=document.querySelector('.retos-semana details.reto-sem:not(.hecho)'); if(!d) return false; d.open=true;
        var i=d.querySelector('input[data-ev]'); if(!i) return false; i.focus(); i.value=${JSON.stringify(escrito)}; return true; })()`);
      c("a medias · la alumna abre un reto y pega su enlace", ok0);
      await rita.js("document.getElementById('ll-tocar').click(); 1");
      const llega = await ana.hasta("!!document.getElementById('pase-ok')", 25);
      c("a medias · le llega la llamada de su docente (la Nave se repinta)", llega);
      const sigue = await ana.js(`(function(){ var i=document.querySelector('.retos-semana input[data-ev]'); var d=i&&i.closest('details');
        return JSON.stringify({valor:i&&i.value, abierta:!!(d&&d.open), foco:document.activeElement===i}); })()`);
      const o = JSON.parse(sigue);
      c("🔴 a medias · su enlace SIGUE escrito y la tarjeta sigue abierta tras el repintado", o.valor === escrito && o.abierta, sigue);
      c("   y el cursor sigue en el campo, para seguir escribiendo", o.foco, sigue);
      await rita.js("var b=document.getElementById('ll-cerrar'); if(b) b.click(); 1");
    }
    // ============================================================ 17 · LO QUE ENTREGASTE, A LA VISTA
    // Visto con una cuenta real: se entregaba un enlace con «Lo he hecho» y en «Mis retos» el campo
    // salía vacío. Y al cambiar de pestaña la página se quedaba a media altura de la nueva.
    if (hacer(17)) {
      const leo = await nueva("Leo entrega y lo ve");
      await leo.ir("entrar.html"); await leo.entrarComo("leo@lab.test", "Leo Nueva");
      await sinBienvenidas(leo);
      await leo.ir("recluta.html?per=lab-clase");
      await leo.hasta("!!document.querySelector('.retos-semana details.reto-sem:not(.hecho)')", 25); await dormir(1500);
      const url = "https://ejemplo.org/leo-entrega-" + Date.now();
      const reto = await leo.js(`(function(){ var d=document.querySelector('.retos-semana details.reto-sem:not(.hecho)'); d.open=true;
        var i=d.querySelector('input[data-ev]'); i.value=${JSON.stringify(url)}; var b=d.querySelector('[data-hecho]'); b.click(); return b.getAttribute('data-hecho'); })()`);
      const hecho = await leo.hasta("/registrado/i.test(document.body.innerText)", 25);
      c("entregado · Leo registra " + reto + " con su enlace", hecho);
      await leo.js("window.scrollTo(0, document.body.scrollHeight); 1"); await dormir(400);
      await leo.js("document.querySelector('.nb-t[data-tab=\"retos\"]').click(); 1"); await dormir(1500);
      c("entregado · al cambiar de pestaña la página sube al principio", (await leo.js("window.pageYOffset")) < 60, String(await leo.js("window.pageYOffset")));
      await leo.hasta("!!document.querySelector('.rh-ya')", 15);
      const ya = await leo.js("[].slice.call(document.querySelectorAll('.rh-ya a')).map(function(a){return a.getAttribute('href')})");
      c("🔴 entregado · en «Mis retos» ve SU enlace (no un campo vacío que invita a pegarlo otra vez)", (ya || []).indexOf(url) >= 0, JSON.stringify(ya));
    }

    // ============================================================ 18 · UN HÉROE QUE ELIGES TÚ, CON FECHAS Y TOPE
    /**
     * Norberto (13-sep): «lanzo un reto en clase y al superarlo les lleva a una página con el héroe
     * conseguido, que se suma a su colección; activo/desactivado, tiempo activo y cuántos pueden
     * reclamarlo». Y: «si ya lo tiene, NEBULA le ofrece quedárselo repetido, 40 créditos o un sobre».
     * Y la mecánica nueva: dos héroes repetidos por uno al azar.
     */
    if (hacer(18)) {
      const HE = "H03_xeno", HID = "lab-clase__heroe_" + HE;
      // cerrar la revelación: con varias cartas «Verlas todas» + «Seguir»; con una, darle la vuelta y «Guardarlo»
      const cerrarSobre = async p => {
        if (!(await p.js("!!document.querySelector('.sb-capa')"))) return;
        if (await p.js("!!document.querySelector('.sb-saltar')")) { await p.js("document.querySelector('.sb-saltar').click(); 1"); await dormir(500); }
        else { await p.js("document.querySelector('.sb-sig').click(); 1"); await dormir(700); await p.js("var b=document.querySelector('.sb-sig'); if(b) b.click(); 1"); await dormir(600); }
        await p.js("var x=document.querySelector('.sb-fin'); if(x) x.click(); 1"); await dormir(900);
      };
      const local = ms => { const d = new Date(ms); return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 16); };
      const rita = await nueva("Rita crea un héroe por enlace");
      await rita.ir("entrar.html"); await rita.entrarComo("rita@lab.test", "Rita Referente");
      await rita.ir("consola.html?per=lab-clase");
      await rita.hasta("document.querySelectorAll('.pestanas .pest').length>0", 20);
      const aPremios = async () => {
        await rita.js("[].slice.call(document.querySelectorAll('.pestanas .pest')).filter(function(b){return /Premios por enlace/.test(b.textContent)})[0].click(); 1");
        await rita.hasta("!!document.getElementById('hv-add')", 15); await dormir(1200);
      };
      await aPremios();
      await rita.js("document.getElementById('hv-add').click(); 1");
      const fila = await rita.js(`(function(){
        var f=[].slice.call(document.querySelectorAll('.hv-f')).pop();
        function pon(sel, v, ev){ var e=f.querySelector(sel); e.value=v; e.dispatchEvent(new Event(ev||'input')); }
        pon('.h-nom','Reto del lunes'); pon('.h-premio','heroe_fijo','change'); pon('.h-heroe',${JSON.stringify(HE)},'change');
        pon('.h-desde',${JSON.stringify(local(Date.now() + 3600e3))},'change'); pon('.h-lim','4');
        return { id: f.querySelector('.h-id').value, heroeVisible: !f.querySelector('.h-c-heroe').hidden,
                 cantidadOculta: f.querySelector('.h-cant').hidden, img: f.querySelector('.h-heroe-img').getAttribute('src'),
                 estado: f.querySelector('.h-estado').textContent, pendiente: document.getElementById('hv-save').classList.contains('pendiente') };
      })()`);
      c("héroe · el editor enseña el selector de héroe con su cara (y esconde «Cantidad»)", fila.heroeVisible && fila.cantidadOculta && fila.img.indexOf(HE) >= 0, JSON.stringify(fila));
      c("héroe · el estado dice «⏳ Se abre…» antes de guardar, y el botón avisa de cambios", /Se abre/.test(fila.estado) && fila.pendiente, fila.estado);
      await rita.js("document.getElementById('hv-save').click(); 1"); await dormir(4000);
      const RID = "lab-clase__huevo_" + fila.id;
      let R = await leerDoc("rewards/" + RID);
      c("🔴 héroe · en el servidor: un cofre de UNA pieza, ese héroe, con tope 4 y fecha de apertura",
        R && R.stargateHuevo.premio === "heroe_fijo" && R.consumeEffects.lootBox.items[0].rewardId === HID && R.claimLinkMaxTotal === 4
          && R.claimLinkStartsAt > Date.now() + 3000e3, JSON.stringify(R && { p: R.stargateHuevo, lb: R.consumeEffects, t: R.claimLinkMaxTotal, d: R.claimLinkStartsAt }));
      await rita.foto(FOTOS + "/18-editor-heroe.png");

      // Eva, alumna nueva, llega antes de hora
      const eva = await nueva("Eva gana el reto");
      c("héroe · Eva se alista", await alistar(eva, "eva@lab.test", "Eva Prueba", "Eva Estelar", 0));
      await eva.ir("huevo.html?h=" + fila.id);
      const pronto = await eva.hasta("/se abre/i.test(document.body.innerText) && !!document.querySelector('.hv-fig img')", 20);
      c("héroe · antes de la hora, Eva VE el héroe y «se abre…», con el botón apagado", pronto && await eva.js("!!document.querySelector('.btn.epico[disabled]') && !document.getElementById('hv-abrir')"),
        (await eva.texto()).slice(0, 200));
      await eva.foto(FOTOS + "/18-eva-pronto.png");
      const forzado = await eva.js(`window.SG.MOTOR.llamar("claimLinkedReward",{rewardId:${JSON.stringify(RID)},modo:"item"}).then(function(){return "PASÓ"},function(e){return e.message})`);
      c("🔴 héroe · y si fuerza la llamada, el SERVIDOR dice que aún no está abierto", /aún no está abierto/i.test(forzado), forzado);

      // Rita lo abre desde ya y hasta dentro de una hora
      await rita.ir("consola.html?per=lab-clase"); await rita.hasta("document.querySelectorAll('.pestanas .pest').length>0", 20); await aPremios();
      await rita.js(`(function(){ var f=[].slice.call(document.querySelectorAll('.hv-f')).filter(function(x){return x.querySelector('.h-id').value===${JSON.stringify(fila.id)}})[0];
        function pon(sel, v){ var e=f.querySelector(sel); e.value=v; e.dispatchEvent(new Event('change')); }
        pon('.h-desde',${JSON.stringify(local(Date.now() - 120e3))}); pon('.h-hasta',${JSON.stringify(local(Date.now() + 3600e3))});
        document.getElementById('hv-save').click(); return 1; })()`);
      await dormir(4000);
      await eva.ir("huevo.html?h=" + fila.id);
      await eva.hasta("!!document.getElementById('hv-abrir')", 20);
      c("héroe · abierto: «Sumarlo a mi colección»", /Sumarlo a mi colecci/.test(await eva.texto()));
      await eva.foto(FOTOS + "/18-eva-abierto.png");
      await eva.js("document.getElementById('hv-abrir').click(); 1");
      await eva.hasta("!!document.querySelector('.sb-capa') || /Nuevo en tu colecci/.test(document.body.innerText)", 30);
      await cerrarSobre(eva);
      const fe = await fichaDe("eva@lab.test", "lab-clase");
      c("🔴 héroe · Eva se lleva EXACTAMENTE ese héroe a su colección", (fe.inventory || []).filter(x => x === HID).length === 1, JSON.stringify(fe.inventory));
      c("héroe · y la pantalla lo celebra como nuevo", /Nuevo en tu colecci/i.test(await eva.texto()), (await eva.texto()).slice(0, 160));
      await eva.foto(FOTOS + "/18-eva-ganado.png");
      await eva.ir("huevo.html?h=" + fila.id); await eva.hasta("/ya es tuyo|ya est/i.test(document.body.innerText)", 20);
      c("héroe · si vuelve, «Ya es tuyo» (sin cobrar otra vez)", (await fichaDe("eva@lab.test", "lab-clase")).inventory.filter(x => x === HID).length === 1);

      // 🔴 un alias que ya lleva otro recluta del grupo no se acepta (el laboratorio siembra un «Halo»)
      const dup = await nueva("Alguien quiere ser Halo");
      await dup.ir("alistarse.html?per=lab-clase&codigo=" + CODIGO); await dup.entrarComo("dup@lab.test", "Dup Prueba");
      await dup.hasta("!!document.querySelector('#a-enviar')", 25);
      await dup.js(`(function(){ document.querySelector('#a-nombre').value='Dup'; document.querySelector('#a-apellidos').value='Prueba';
        document.querySelector('#a-alias').value='halo'; var r=document.querySelectorAll('input[name=cmd]')[0]; if(r) r.checked=true;
        document.querySelector('#a-enviar').click(); return 1; })()`);
      const rechazo = await dup.hasta("/ya lo lleva alguien/i.test(document.body.innerText)", 20);
      c("🔴 alias · «halo» no se acepta si ya hay un «Halo» en el grupo", rechazo && !(await fichaDe("dup@lab.test", "lab-clase")), (await dup.texto()).slice(0, 200));

      // 🔴 ni desde la consola del navegador: Eva escribe a mano en su ficha «Halo» → el SERVIDOR (reglas) dice que no
      const consola = await eva.js(`(async function(){ var M=window.SG.MOTOR; var yo=await M.sesion();
        var r=await M.getDocs(M.query(M.collection(M.db,'student_profiles'), M.where('projectId','==','lab-clase'), M.where('userId','==',yo.uid)));
        return M.updateDoc(M.doc(M.db,'student_profiles',r.docs[0].id), {displayName:'Halo'}).then(function(){return 'PASÓ'},function(e){return e.code||e.message}); })()`);
      c("🔴 alias · ni forzándolo desde la consola del navegador: las reglas lo rechazan", consola !== "PASÓ" && (await fichaDe("eva@lab.test", "lab-clase")).displayName === "Eva Estelar", consola);
      // y tampoco desde el puesto de mando: la referente no puede rebautizar a Eva como «HALO»
      // (la corrección de ficha va por la fuente de datos, la que cargan las páginas de clase: registro.html la trae)
      await rita.ir("registro.html?per=lab-clase"); await rita.hasta("!!(window.SG && window.SG.FUENTE && window.SG.MOTOR)", 20);
      const reb = await rita.js(`window.SG.FUENTE.accion({accion:"ficha", per:"lab-clase", email:"eva@lab.test", alias:"HALO"}).then(function(r){return JSON.stringify(r)},function(e){return "ERROR " + e.message})`);
      const evaSigue = (await fichaDe("eva@lab.test", "lab-clase")).displayName;
      c("🔴 alias · la docente tampoco puede poner a Eva un alias que ya lleva otro («HALO»)", /ya lo lleva/i.test(reb) && evaSigue === "Eva Estelar", reb + " · " + evaSigue);

      // tres que YA lo tienen: NEBULA les ofrece quedárselo, 40 ◈ o un sobre
      const conHeroe = async (correo, nombre, alias, opcion) => {
        const p = await nueva(nombre + " ya lo tenía");
        await alistar(p, correo, nombre, alias, 1);
        const f0 = await fichaDe(correo, "lab-clase");
        await admin().firestore().collection("student_profiles").doc(f0._id).update({ inventory: (f0.inventory || []).concat([HID]) });
        await p.ir("huevo.html?h=" + fila.id);
        await p.hasta("!!document.getElementById('hv-abrir')", 20);
        const burbuja = await p.js("(document.querySelector('.hv-copias')||{}).textContent||''");
        const avisa = /ya lo tienes/i.test(await p.texto());
        await p.js("document.getElementById('hv-abrir').click(); 1");
        const ofrece = await p.hasta("document.querySelectorAll('.hv-op').length===3", 20);
        const txt = await p.texto();
        if (opcion === "quedar") await p.foto(FOTOS + "/18-nebula-oferta.png");
        await p.js(`(function(){ var r=document.querySelector('.hv-op input[value=${opcion}]'); r.checked=true; r.dispatchEvent(new Event('change')); document.getElementById('hv-elegir').click(); return 1; })()`);
        await p.hasta("!!document.querySelector('.sb-capa') || !!document.querySelector('.hv-caja.gana') || !!document.querySelector('.hv-caja.mal')", 40);
        await cerrarSobre(p);
        const f1 = await fichaDe(correo, "lab-clase");
        const fin = await p.texto();
        await p.foto(FOTOS + "/18-" + opcion + ".png");
        return { burbuja, avisa, ofrece, txt, f0: Object.assign({}, f0, { inventory: (f0.inventory || []).concat([HID]) }), f1, fin, errores: p.errores };
      };
      const cuenta = (f, re) => (f.inventory || []).filter(x => re.test(x)).length;
      const fer = await conHeroe("fer@lab.test", "Fer Prueba", "Fer Faro", "creditos");
      c("héroe repetido · la portada avisa «ya lo tienes» con la burbuja ×1", fer.avisa && /×1/.test(fer.burbuja), fer.burbuja);
      c("🔴 héroe repetido · NEBULA ofrece las tres opciones", fer.ofrece && /parece que ya tienes/i.test(fer.txt), fer.txt.slice(0, 200));
      c("🔴 héroe repetido · Fer elige 40 ◈: +40 y ni una copia más del héroe", fer.f1.coins - fer.f0.coins === 40 && cuenta(fer.f1, /__heroe_H03_xeno$/) === 1
        && cuenta(fer.f1, /__huevo_/) === 0, (fer.f1.coins - fer.f0.coins) + " ◈ · " + JSON.stringify(fer.f1.inventory));
      const gus = await conHeroe("gus@lab.test", "Gus Prueba", "Gus Géiser", "sobre");
      c("🔴 héroe repetido · Gus elige el sobre: tres cartas nuevas", cuenta(gus.f1, /__cromo_/) - cuenta(gus.f0, /__cromo_/) === 3 && cuenta(gus.f1, /__huevo_/) === 0,
        JSON.stringify(gus.f1.inventory));
      const hugo = await conHeroe("hugo@lab.test", "Hugo Prueba", "Hugo Halo", "quedar");
      c("🔴 héroe repetido · Hugo se lo queda: ahora tiene DOS", cuenta(hugo.f1, /__heroe_H03_xeno$/) === 2, JSON.stringify(hugo.f1.inventory));
      c("héroe repetido · y la pantalla se lo dice con la burbuja ×2", /Repetido en tu colecci/i.test(hugo.fin), hugo.fin.slice(0, 160));
      c("héroe repetido · sin errores en ninguna de las tres", !fer.errores.length && !gus.errores.length && !hugo.errores.length,
        fer.errores[0] || gus.errores[0] || hugo.errores[0] || "");
      const forzar = await eva.js(`window.SG.MOTOR.llamar("stargateHeroeRepetido",{projectId:"lab-clase",rewardId:${JSON.stringify(RID)},opcion:"creditos"}).then(function(){return "PASÓ"},function(e){return e.message})`);
      c("🔴 héroe repetido · nadie cobra 40 ◈ por un premio que ya abrió", forzar !== "PASÓ", forzar);

      // en pausa, agotado, cerrado
      await rita.ir("consola.html?per=lab-clase"); await rita.hasta("document.querySelectorAll('.pestanas .pest').length>0", 20); await aPremios();
      await rita.js(`(function(){ var f=[].slice.call(document.querySelectorAll('.hv-f')).filter(function(x){return x.querySelector('.h-id').value===${JSON.stringify(fila.id)}})[0];
        var s=f.querySelector('.h-on'); s.checked=false; s.dispatchEvent(new Event('change')); return 1; })()`);
      await dormir(4000);
      R = await leerDoc("rewards/" + RID);
      c("🔴 héroe · el interruptor lo PAUSA al momento (sin pulsar Guardar)", R.claimLinkEnabled === false, String(R.claimLinkEnabled));
      const ivan = await nueva("Iván llega tarde");
      await alistar(ivan, "ivan@lab.test", "Ivan Prueba", "Iván Ión", 0);
      await ivan.ir("huevo.html?h=" + fila.id);
      c("héroe · en pausa, Iván lee «Está en pausa»", await ivan.hasta("/en pausa/i.test(document.body.innerText)", 20), (await ivan.texto()).slice(0, 160));
      await rita.js(`(function(){ var f=[].slice.call(document.querySelectorAll('.hv-f')).filter(function(x){return x.querySelector('.h-id').value===${JSON.stringify(fila.id)}})[0];
        var s=f.querySelector('.h-on'); s.checked=true; s.dispatchEvent(new Event('change')); return 1; })()`);
      await dormir(4000);
      await ivan.ir("huevo.html?h=" + fila.id);
      c("héroe · activo otra vez, pero con el tope (4) cubierto: «Llegaste tarde»", await ivan.hasta("/llegaste tarde/i.test(document.body.innerText)", 20), (await ivan.texto()).slice(0, 160));
      const estadoRita = await rita.js(`(function(){ var f=[].slice.call(document.querySelectorAll('.hv-f')).filter(function(x){return x.querySelector('.h-id').value===${JSON.stringify(fila.id)}})[0]; return f.querySelector('.h-estado').textContent; })()`);
      c("héroe · la referente ve cuántos lo han reclamado", /4 lo han reclamado|Agotado: 4 de 4/.test(estadoRita), estadoRita);
      await rita.js(`(function(){ var f=[].slice.call(document.querySelectorAll('.hv-f')).filter(function(x){return x.querySelector('.h-id').value===${JSON.stringify(fila.id)}})[0];
        function pon(sel, v){ var e=f.querySelector(sel); e.value=v; e.dispatchEvent(new Event('change')); }
        pon('.h-lim',''); pon('.h-desde',${JSON.stringify(local(Date.now() - 7200e3))}); pon('.h-hasta',${JSON.stringify(local(Date.now() - 60e3))});
        document.getElementById('hv-save').click(); return 1; })()`);
      await dormir(4000);
      await ivan.ir("huevo.html?h=" + fila.id);
      c("héroe · pasada la hora de cierre, «Se cerró…»", await ivan.hasta("/se cerr/i.test(document.body.innerText)", 20), (await ivan.texto()).slice(0, 160));
      const cerrado = await ivan.js(`window.SG.MOTOR.llamar("claimLinkedReward",{rewardId:${JSON.stringify(RID)},modo:"item"}).then(function(){return "PASÓ"},function(e){return e.message})`);
      c("🔴 héroe · y el SERVIDOR también lo da por cerrado", /ya se ha cerrado/i.test(cerrado), cerrado);

      // la vista previa de la referente
      await rita.ir("huevo.html?h=" + fila.id + "&per=lab-clase&vista=1");
      const vista = await rita.hasta("/vista previa|así lo verá/i.test(document.body.innerText) || /se cerr/i.test(document.body.innerText)", 20);
      c("héroe · «👁 Ver cómo se ve» enseña la página del alumnado sin reclamar", vista && await rita.js("!document.getElementById('hv-abrir')"), (await rita.texto()).slice(0, 160));

      // DOS REPETIDOS POR UNO AL AZAR: a Hugo le damos otro repetido y cambia desde el vestuario
      const fh = await fichaDe("hugo@lab.test", "lab-clase");
      await admin().firestore().collection("student_profiles").doc(fh._id).update({ inventory: fh.inventory.concat(["lab-clase__heroe_H07_tejedor", "lab-clase__heroe_H07_tejedor"]) });
      const hugo2 = await nueva("Hugo cambia repetidos");
      await hugo2.ir("entrar.html"); await hugo2.entrarComo("hugo@lab.test", "Hugo Prueba");
      await sinBienvenidas(hugo2);
      await hugo2.ir("recluta.html?per=lab-clase");
      await hugo2.hasta("!!document.querySelector('.nb-t[data-tab=\"botin\"]')", 25);
      await hugo2.js("document.querySelector('.nb-t[data-tab=\"botin\"]').click(); 1");
      const hay = await hugo2.hasta("!!document.querySelector('#vestuario [data-canje=heroe_repes]')", 20);
      const burb = await hugo2.js("[].slice.call(document.querySelectorAll('#vestuario .vest .nx')).map(function(x){return x.textContent})");
      c("héroes repetidos · el vestuario enseña las copias (×2) y el botón de cambiar", hay && (burb || []).indexOf("×2") >= 0, JSON.stringify(burb));
      await hugo2.js("document.querySelector('#vestuario').scrollIntoView(); 1"); await dormir(400);
      await hugo2.foto(FOTOS + "/18-vestuario-repes.png");
      const h0 = await fichaDe("hugo@lab.test", "lab-clase");
      await hugo2.js("document.querySelector('#vestuario [data-canje=heroe_repes]').click(); 1");
      await hugo2.hasta("!!document.querySelector('.neb-capa .btn.primary')", 10);
      const pregunta = await hugo2.js("document.querySelector('.neb-capa').innerText");
      await hugo2.js("document.querySelector('.neb-capa .btn.primary').click(); 1");
      const revela = await hugo2.hasta("!!document.querySelector('.sb-capa')", 40);
      const h1 = await fichaDe("hugo@lab.test", "lab-clase");
      const heroesDe = f => (f.inventory || []).filter(x => /__heroe_/.test(x));
      const n = (f, k) => (f.inventory || []).filter(x => x === "lab-clase__heroe_" + k).length;
      c("🔴 héroes repetidos · NEBULA pregunta y dice que nunca se va el último", /nunca el último/i.test(pregunta), pregunta.slice(0, 160));
      c("🔴 héroes repetidos · se retiran DOS copias y entra UN héroe: uno menos en total", heroesDe(h1).length === heroesDe(h0).length - 1 && revela,
        heroesDe(h0).length + " → " + heroesDe(h1).length + " · " + JSON.stringify(heroesDe(h1)));
      c("héroes repetidos · y ninguno pierde su última copia", n(h1, "H03_xeno") >= 1 && n(h1, "H07_tejedor") >= 1, JSON.stringify(heroesDe(h1)));
      const otra = await hugo2.js(`window.SG.MOTOR.llamar("stargateCambiarHeroesRepes",{projectId:"lab-clase"}).then(function(){return "PASÓ"},function(e){return e.message})`);
      const repesQuedan = heroesDe(h1).length - new Set(heroesDe(h1)).size;
      c("héroes repetidos · sin dos repetidos, el servidor no deja cambiar", repesQuedan >= 2 || /Necesitas 2/.test(otra), repesQuedan + " · " + otra);
    }

    // ============================================================ 19 · LA NAVE POR CAPÍTULOS, SEMANA A SEMANA
    /**
     * Norberto: «primera semana solo alistarse y primeras misiones; segunda, el Mercado con sobres;
     * la siguiente, héroes… Si un estudiante se engancha en la semana 3, debería hacer el onboarding
     * de la semana 1, 2 y 3 en ese orden». La Nave acepta ?semana=N (como la sesión), así que se
     * recorre el calendario con la misma alumna.
     */
    if (hacer(19)) {
      const nora = await nueva("Nora recorre las semanas");
      c("semanas · Nora se alista", await alistar(nora, "nora@lab.test", "Nora Prueba", "Nora Nébula", 0));
      const tabs = () => nora.js("[].slice.call(document.querySelectorAll('.nb-t')).map(function(b){return b.getAttribute('data-tab')})");
      const paso = () => nora.js(`(function(){var o=document.querySelector('#nave-onboard.open'); if(!o) return null;
        return {n:o.querySelector('.tour-step').textContent, t:o.querySelector('h3').textContent};})()`);
      // semana 1
      await nora.ir("recluta.html?per=lab-clase&semana=1");
      await nora.hasta("document.querySelectorAll('.nb-t').length>0", 25);
      const t1 = await tabs();
      c("🔴 semana 1 · solo Mi nave, Mis retos y Mi botín (ni Mercado ni rankings)", JSON.stringify(t1) === JSON.stringify(["nave", "retos", "botin"]), JSON.stringify(t1));
      c("semana 1 · una línea dice qué llega: «La semana que viene: 🛒 El Mercado Estelar»", /La semana que viene: .*Mercado Estelar/.test(await nora.texto()));
      await nora.hasta("!!document.querySelector('#nave-onboard.open')", 15);
      const q1 = await paso();
      c("semana 1 · NEBULA: capítulo 1, que no habla del Mercado", q1 && /Capítulo 1/.test(q1.n) && !/2 de/.test(q1.n), JSON.stringify(q1));
      for (let k = 0; k < 8 && (await paso()); k++) { await nora.js("document.querySelector('#nave-onboard .tour-next').click(); 1"); await dormir(600); }
      await nora.foto(FOTOS + "/19-semana1.png");
      // se intenta ir al Mercado a mano: no existe todavía
      await nora.ir("recluta.html?per=lab-clase&semana=1#mercado"); await nora.hasta("document.querySelectorAll('.nb-t').length>0", 25); await dormir(1200);
      c("semana 1 · un enlace a #mercado aterriza en Mi nave", (await nora.js("(document.querySelector('.nb-t.on')||{}).getAttribute ? document.querySelector('.nb-t.on').getAttribute('data-tab') : ''")) === "nave");
      /**
       * 🔴 Cada semana, en un navegador NUEVO (como otro ordenador: los capítulos los sabe su ficha). Y
       * no es solo por eso: con el emulador local (HTTP/1.1), tras escribir en una página, la siguiente
       * página de ese mismo navegador no conseguía escribir (las conexiones se quedan ocupadas). Firestore
       * de verdad va por HTTP/2 y no le pasa. Se reprodujo sin la Nave, con dos escrituras y una recarga.
       */
      const nora3 = await nueva("Nora en la semana 3");
      await nora3.ir("entrar.html"); await nora3.entrarComo("nora@lab.test", "Nora Prueba");
      const paso3 = () => nora3.js(`(function(){var o=document.querySelector('#nave-onboard.open'); if(!o) return null;
        return {n:o.querySelector('.tour-step').textContent, t:o.querySelector('h3').textContent};})()`);
      // semana 3: llega de golpe → capítulos 2 y 3, en orden
      await nora3.ir("recluta.html?per=lab-clase&semana=3");
      await nora3.hasta("!!document.querySelector('#nave-onboard.open')", 25);
      const vistos = [];
      for (let k = 0; k < 10; k++) { const pk = await paso3(); if (!pk) break; const cab = pk.n.split(" · ").slice(0, 2).join(" · "); if (vistos.indexOf(cab) < 0) vistos.push(cab);
        await nora3.js("document.querySelector('#nave-onboard .tour-next').click(); 1"); await dormir(600); }
      c("🔴 semana 3 · le tocan el 2 (Mercado) y el 3 (Rebelión), en ese orden", vistos.length === 2 && /1 de 2 · 🛒/.test(vistos[0]) && /2 de 2 · 🛡️/.test(vistos[1]), JSON.stringify(vistos));
      const t3 = await nora3.js("[].slice.call(document.querySelectorAll('.nb-t')).map(function(b){return b.getAttribute('data-tab')})");
      c("semana 3 · ya están el Mercado y los rankings", t3.indexOf("mercado") >= 0 && t3.indexOf("rankings") >= 0, JSON.stringify(t3));
      await nora3.js("document.querySelector('.nb-t[data-tab=\"mercado\"]').click(); 1"); await dormir(1500);
      const merc = await nora3.js("[].slice.call(document.querySelectorAll('.nave-rec .rec-card h3')).map(function(h){return h.textContent})");
      const prox = await nora3.js("(document.querySelector('.rec-prox')||{}).textContent||''");
      c("🔴 semana 3 · el Mercado enseña sobre, cambio de repetidas y héroe; nada «clasificado»",
        merc.length === 3 && merc.some(x => /Héroe/.test(x)) && !merc.some(x => /clasificada/i.test(x)), JSON.stringify(merc));
      c("semana 3 · y una línea con lo que llega: adornos (semana 4) y el Arsenal (semana 15)", /insignia de mando.*semana 4/.test(prox) && /Arsenal.*semana 15/.test(prox), prox);
      await nora3.foto(FOTOS + "/19-semana3-mercado.png");
      // lo apunta en segundo plano: se espera a que llegue (como mucho, diez segundos)
      let fN = await fichaDe("nora@lab.test", "lab-clase");
      for (let k = 0; k < 20 && !["c1", "c2", "c3"].every(x => (fN.stargateCapitulos || {})[x]); k++) { await dormir(500); fN = await fichaDe("nora@lab.test", "lab-clase"); }
      c("semanas · en su ficha: c1, c2 y c3 vistos", ["c1", "c2", "c3"].every(k => (fN.stargateCapitulos || {})[k]), JSON.stringify(fN.stargateCapitulos));
      // semana 4, y «Salir» a mitad: se apunta como saltado
      const nora4 = await nueva("Nora en la semana 4");
      await nora4.ir("entrar.html"); await nora4.entrarComo("nora@lab.test", "Nora Prueba");
      await nora4.ir("recluta.html?per=lab-clase&semana=4");
      const sale4 = await nora4.hasta("!!document.querySelector('#nave-onboard.open')", 25);
      c("semana 4 · le sale el capítulo 4", sale4, await nora4.js("JSON.stringify({ls:Object.keys(localStorage).filter(function(k){return /sgCap/.test(k)}), h:(document.querySelector('.tab-head h3')||{}).textContent, ob:(document.querySelector('#nave-onboard')||{}).className, txt:document.body.innerText.slice(0,200)})") + " · " + JSON.stringify(nora4.errores.slice(-4)));
      await nora4.js("var x=document.querySelector('#nave-onboard .tour-exit'); if(x) x.click(); 1");
      let fN2 = await fichaDe("nora@lab.test", "lab-clase");
      for (let k = 0; k < 20 && !((fN2.stargateCapitulos || {}).c4); k++) { await dormir(500); fN2 = await fichaDe("nora@lab.test", "lab-clase"); }
      c("semanas · «Salir» a mitad del capítulo 4 lo apunta como saltado (lo ve su docente)", ((fN2.stargateCapitulos || {}).c4 || {}).estado === "saltado", JSON.stringify(fN2.stargateCapitulos));
      // y su docente lo ve en «Alumnado»
      const rita = await nueva("Rita mira las bienvenidas");
      await rita.ir("entrar.html"); await rita.entrarComo("rita@lab.test", "Rita Referente");
      await rita.ir("consola.html?per=lab-clase"); await rita.hasta("!!document.querySelector('td.bienv')", 25);
      const celda = await rita.js("[].slice.call(document.querySelectorAll('tr[data-r]')).filter(function(t){return /Nora Nébula/.test(t.textContent)}).map(function(t){return t.querySelector('td.bienv').textContent})[0]||''");
      c("🔴 semanas · la consola dice cuántos capítulos ha visto Nora (3 de 4, 1 saltado)", /3\/4/.test(celda) && /1 saltado/.test(celda), celda);
    }

    // ============================================================ 20 · LA NAVE DEL COMANDANTE (simulacro)
    /**
     * Norberto: «embeber la demo del estudiante con lo desbloqueado para que el docente pueda
     * interactuar… que el propio Comandante tenga su avatar dentro del juego». La Nave de verdad, con
     * el Comandante de recluta, y NADA se guarda: se comprueba en la base de datos.
     */
    if (hacer(20)) {
      const A = admin(), fs = A.firestore();
      const foto0 = async () => {
        const perf = await fs.collection("student_profiles").where("projectId", "==", "lab-clase").get();
        const asis = await fs.collection("attendance_records").where("projectId", "==", "lab-clase").get();
        return { n: perf.size, huella: perf.docs.map(d => d.id + ":" + (d.data().coins || 0) + ":" + (d.data().inventory || []).length).sort().join("|"), asis: asis.size };
      };
      const antes = await foto0();
      const rita = await nueva("Rita enseña la Nave");
      await rita.ir("entrar.html"); await rita.entrarComo("rita@lab.test", "Rita Referente");
      await rita.ir("recluta.html?simulacro=1&per=lab-clase&semana=2");
      const hay = await rita.hasta("!!document.querySelector('.sim-barra') && document.querySelectorAll('.nb-t').length>0", 25);
      const ident = await rita.js("(document.querySelector('.nb-id-txt b')||{}).textContent||''");
      c("🔴 simulacro · la Nave del Comandante: su barra, «nada de esto cuenta» y el Comandante de recluta",
        hay && /nada de esto cuenta/i.test(await rita.texto()) && /^Cmdte\./.test(ident), ident);
      c("simulacro · en la semana 2 ya está el Mercado (y no los héroes)", (await rita.js("!!document.querySelector('.nb-t[data-tab=\"mercado\"]')"))
        && !(await rita.js("/Héroes de la Rebelión/.test((document.querySelector('#nave-panel')||{}).innerText||'')")));
      c("simulacro · NEBULA no salta sola (la lanza el docente cuando quiere)", !(await rita.js("!!document.querySelector('#nave-onboard.open')")));
      const cr0 = Number(await rita.js("(document.querySelector('#nb-cr b')||{}).textContent||0"));
      // compra un sobre
      await rita.js("document.querySelector('.nb-t[data-tab=\"mercado\"]').click(); 1"); await dormir(1200);
      await rita.js("var b=[].slice.call(document.querySelectorAll('[data-canje]')).filter(function(x){return x.getAttribute('data-tipo')==='cromo'})[0]; b.click(); 1");
      await rita.hasta("!!document.querySelector('.neb-capa .btn.primary')", 10);
      await rita.js("document.querySelector('.neb-capa .btn.primary').click(); 1");
      const sobre = await rita.hasta("!!document.querySelector('.sb-capa')", 15);
      await rita.js("var s=document.querySelector('.sb-saltar'); if(s) s.click(); 1"); await dormir(500);
      await rita.js("var x=document.querySelector('.sb-fin'); if(x) x.click(); 1"); await dormir(1500);
      const cr1 = Number(await rita.js("(document.querySelector('#nb-cr b')||{}).textContent||0"));
      c("🔴 simulacro · comprar un sobre: se abre carta a carta y bajan 15 ◈ (de mentira)", sobre && cr0 - cr1 === 15, cr0 + " → " + cr1);
      await rita.foto(FOTOS + "/20-simulacro-sobre.png");
      // llamada a filas de mentira
      await rita.js("document.getElementById('sim-ll').click(); 1");
      await rita.hasta("!!document.getElementById('pase-ok')", 10);
      await rita.js("document.getElementById('pase-ok').click(); 1");
      const regalo = await rita.hasta("!!document.querySelector('.sb-capa')", 15);
      await rita.js("var s=document.querySelector('.sb-saltar'); if(s) s.click(); 1"); await dormir(500);
      await rita.js("var x=document.querySelector('.sb-fin'); if(x) x.click(); 1"); await dormir(1500);
      c("simulacro · «📣 Llamada a filas» y «✋ Presente»: créditos y el sobre de regalo", regalo && /Presente/.test(await rita.texto()));
      // semana 3, sin recargar: héroes, y el capítulo de NEBULA de esa semana
      await rita.js("var s=document.getElementById('sim-sem'); s.value='3'; s.dispatchEvent(new Event('change')); 1");
      await rita.hasta("/Rebeli/.test((document.getElementById('sim-cap')||{}).textContent||'')", 15);
      await rita.js("document.querySelector('.nb-t[data-tab=\"botin\"]').click(); 1"); await dormir(1200);
      c("simulacro · en la semana 3, el vestuario con héroes (y dos repetidos para enseñar el cambio)",
        await rita.js("!!document.querySelector('#vestuario [data-canje=heroe_repes]')"));
      await rita.js("document.getElementById('sim-cap').click(); 1");
      const cap = await rita.hasta("/Rebeli/.test((document.querySelector('#nave-onboard.open .tour-step')||{}).textContent||'')", 10);
      c("simulacro · «▶ NEBULA» lanza el capítulo de esa semana en pantalla", cap);
      await rita.js("var x=document.querySelector('#nave-onboard .tour-exit'); if(x) x.click(); 1"); await dormir(500);
      // su personaje
      await rita.js("document.getElementById('sim-pj').click(); document.querySelector('#sim-pjs [data-pj=\"6m\"]').click(); 1"); await dormir(1500);
      c("simulacro · «🎭 Mi personaje» cambia el avatar sin recargar", /p6m/.test(await rita.js("(document.querySelector('.nb-cara')||{}).getAttribute ? document.querySelector('.nb-cara').getAttribute('src') : ''")));
      // empezar de cero
      await rita.js("document.getElementById('sim-cero').click(); 1"); await dormir(1500);
      await rita.foto(FOTOS + "/20-simulacro-semana3.png");
      await dormir(1500);
      const despues = await foto0();
      c("🔴 simulacro · NADA llega a la base de datos: mismas fichas, mismos créditos, ni un fichaje", JSON.stringify(antes) === JSON.stringify(despues),
        JSON.stringify({ antes: antes.n + "/" + antes.asis, despues: despues.n + "/" + despues.asis }));
      c("simulacro · sin errores en la página", !rita.errores.filter(x => !/Failed to load resource/.test(x)).length, rita.errores[0] || "");
    }

    // ============================================================ 21 · LA SESIÓN QUE SE PROYECTA: LO NUEVO DE LA SEMANA
    if (hacer(21)) {
      const rita = await nueva("Rita proyecta la semana 2");
      await rita.ir("entrar.html"); await rita.entrarComo("rita@lab.test", "Rita Referente");
      await rita.ir("sesion.html?per=lab-clase&sem=2");
      await rita.hasta("document.querySelectorAll('.barra-pasos .p').length>0", 25);
      const rot = await rita.js("[].slice.call(document.querySelectorAll('.barra-pasos .p')).map(function(b){return b.getAttribute('title')})");
      await rita.js("[].slice.call(document.querySelectorAll('.barra-pasos .p')).filter(function(b){return b.getAttribute('title')==='El plan'})[0].click(); 1"); await dormir(500);
      const plan = await rita.js("[].slice.call(document.querySelectorAll('.pasos-sesion .t')).map(function(x){return x.textContent})");
      c("🔴 sesión · la semana 2 lleva «Lo nuevo» y «Enséñalo», antes del contenido", rot.indexOf("Lo nuevo") > 0 && rot.indexOf("Enséñalo") === rot.indexOf("Lo nuevo") + 1, JSON.stringify(rot));
      c("sesión · y el plan de hoy lo anuncia", plan.some(x => /Lo nuevo en la Nave: El Mercado Estelar/.test(x)), JSON.stringify(plan));
      await rita.js("[].slice.call(document.querySelectorAll('.barra-pasos .p')).filter(function(b){return b.getAttribute('title')==='Lo nuevo'})[0].click(); 1"); await dormir(700);
      c("sesión · «🔓 Se abre esta semana en STARGATE: El Mercado Estelar», con lo que se puede hacer", /Se abre esta semana/i.test(await rita.texto()) && /sobres de cromos/i.test(await rita.texto()));
      await rita.foto(FOTOS + "/21-sesion-lo-nuevo.png");
      await rita.js("[].slice.call(document.querySelectorAll('.barra-pasos .p')).filter(function(b){return b.getAttribute('title')==='Enséñalo'})[0].click(); 1"); await dormir(700);
      const src = await rita.js("(document.querySelector('.dia.simulacro iframe')||{}).getAttribute ? document.querySelector('.dia.simulacro iframe').getAttribute('src') : ''");
      c("🔴 sesión · «Enséñalo» incrusta la Nave del Comandante en ESA semana", /simulacro=1/.test(src) && /semana=2/.test(src) && /per=lab-clase/.test(src), src);
      // (el marco es de la misma web: se mira por dentro desde la página)
      const dentro = await rita.hasta("(function(){ var f=document.querySelector('.dia.simulacro iframe'); var d=f&&f.contentDocument; return !!(d&&d.querySelector('.sim-barra')&&d.querySelectorAll('.nb-t').length>0); })()", 30);
      c("sesión · y dentro se puede usar (la barra del simulacro y las pestañas de la semana 2)", dentro);
      await dormir(1500); await rita.foto(FOTOS + "/21-sesion-ensenalo.png");
      await rita.ir("sesion.html?per=lab-clase&sem=6"); await rita.hasta("document.querySelectorAll('.barra-pasos .p').length>0", 25);
      const rot6 = await rita.js("[].slice.call(document.querySelectorAll('.barra-pasos .p')).map(function(b){return b.getAttribute('title')})");
      c("sesión · una semana que no abre nada no lleva esas diapositivas (la 6)", rot6.indexOf("Lo nuevo") < 0, JSON.stringify(rot6));
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
