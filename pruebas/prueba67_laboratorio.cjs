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
  const sinBienvenidas = p => p.js("['c1','c2','c3','c4','c5','c6','c7','c8'].forEach(function(k){localStorage.setItem('sgCap_lab-clase_'+k,'hecho')}); localStorage.setItem('sgNaveOnboard_lab-clase','1'); 1");
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
        // 13-sep · +1: «El Zoco» (el registro de trueques y «Deshacer»), para todo el profesorado;
        // y +1 para quien lleva el grupo: «Calendario» (congelar semanas, abrir capítulos antes)
        // 14-sep · y +1 para quien lleva el grupo: «Ofertas» (la oferta de la semana y las suyas)
        ["rita@lab.test", "Rita Referente", 11, "referente que imparte"],
        ["dani@lab.test", "Dani Docente", 4, "docente raso"],
        ["sol@lab.test", "Sol Coordina", 11, "referente que NO imparte"],
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
      await ana.js(`(function(){ var b=[].slice.call(document.querySelectorAll('button[data-canje]')).filter(function(x){return /Sobre de cromos/.test(x.getAttribute('data-nombre')||'') && !/^oferta/.test(x.getAttribute('data-tipo')||'')})[0]; b.click(); return 1; })()`);
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
        const ok = await beto.js(`(function(){ var b=[].slice.call(document.querySelectorAll('button[data-canje]')).filter(function(x){return /Sobre de cromos/.test(x.getAttribute('data-nombre')||'') && !/^oferta/.test(x.getAttribute('data-tipo')||'')})[0]; if(!b) return false; b.click(); return true; })()`);
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
      await sinBienvenidas(carla);   // esto no va de NEBULA: si no, a mitad de la prueba sale el capítulo 1 y repinta
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
      c("🔴 capítulos · llega en la semana 10: le tocan los capítulos 1 a 7, EN ORDEN («Capítulo 1 de 7»)", p0 && /Capítulo 1 de 7/.test(p0.n), p0 && p0.n);
      c("bienvenida · y NO le pide «escribe tu correo» (esa puerta ya no existe)", p0 && !/correo/i.test(p0.x), p0 && p0.x.slice(0, 120));
      const focos = [p0 && p0.foco];
      for (let k = 0; k < 5; k++) { await leo.js("document.querySelector('#nave-onboard .tour-next').click(); 1"); await dormir(700); const pk = await paso(); focos.push(pk ? pk.foco : "—"); }
      const esperados = ["nave-estado", "cine", "retos-semana", "nb-fin", "nb-tabs", "nb-t"];
      c("bienvenida · cada paso señala lo suyo: ficha, vídeos, retos, marcadores, pestañas y mercado",
        esperados.every((e, k) => (focos[k] || "").split(/\s+/).indexOf(e) >= 0), JSON.stringify(focos));
      // al acabar el 1, sigue el 2, el 3, el 4 y el 5, cada uno con lo suyo
      const titulos = [];
      await leo.js("document.querySelector('#nave-onboard .tour-next').click(); 1"); await dormir(900);
      for (let k = 0; k < 24; k++) {
        const pk = await paso(); if (!pk) break;
        if (titulos.indexOf(pk.n.split(" · ").slice(0, 2).join(" · ")) < 0) titulos.push(pk.n.split(" · ").slice(0, 2).join(" · "));
        await leo.js("document.querySelector('#nave-onboard .tour-next').click(); 1"); await dormir(700);
      }
      c("🔴 capítulos · detrás del 1 vienen el Mercado, la Rebelión, los adornos, el Zoco, el Gran Sorteo y el Hangar de las Leyendas, uno tras otro",
        titulos.length === 6 && /2 de 7/.test(titulos[0]) && /Mercado/.test(titulos[0]) && /Rebeli/.test(titulos[1]) && /insignia de mando/i.test(titulos[2]) && /Zoco/.test(titulos[3]) && /Sorteo/.test(titulos[4]) && /Hangar/.test(titulos[5]), JSON.stringify(titulos));
      c("bienvenida · al terminar se cierra", !(await paso()));
      await dormir(1500);
      const fLeo = await fichaDe("leo@lab.test", "lab-clase");
      const caps = fLeo.stargateCapitulos || {};
      c("🔴 capítulos · quedan apuntados EN SU FICHA (no solo en el navegador): c1 a c6 y el Hangar (c8) «hecho»",
        ["c1", "c2", "c3", "c4", "c5", "c6", "c8"].every(k => caps[k] && caps[k].estado === "hecho"), JSON.stringify(caps));
      await leo.ir("recluta.html?per=lab-clase"); await leo.hasta("/Lyra Nueva/.test(document.body.innerText)", 25); await dormir(2500);
      c("bienvenida · y en la segunda visita ya no sale", !(await paso()));
      // en otro navegador (sin nada guardado), tampoco: manda su ficha
      const leo2 = await nueva("Leo en otro ordenador");
      await leo2.ir("entrar.html"); await leo2.entrarComo("leo@lab.test", "Leo Nueva");
      await leo2.ir("recluta.html?per=lab-clase"); await leo2.hasta("/Lyra Nueva/.test(document.body.innerText)", 25); await dormir(2500);
      c("🔴 capítulos · en otro ordenador tampoco vuelve a salir (lo sabe su ficha)", !(await leo2.js("!!document.querySelector('#nave-onboard.open')")));
      await leo.js("document.getElementById('btn-onboard') && document.getElementById('btn-onboard').click(); 1"); await dormir(400);
      const menu = await leo.js("[].slice.call(document.querySelectorAll('#rep-menu [data-cap]')).map(function(b){return b.textContent})");
      c("capítulos · «Repetir bienvenida» ofrece los capítulos abiertos (los 7 de la semana 10)", (menu || []).length === 7 && /Canal abierto/.test(menu[0]) && /Sorteo/.test(menu[5]) && /Hangar/.test(menu[6]), JSON.stringify(menu));
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
        const nTabs = ref ? 11 : 4;   // 13-sep · +1: «El Zoco» (todos); referente, +«Calendario», (14-sep) +«Sorteos» y +«Ofertas»
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
        // 15-sep · el código va TAPADO en la tarjeta (Norberto: «mantenlo oculto, obliga a clicar para mostrar»)
        const tapado = await v.js(`(function(){ var b=[].slice.call(document.querySelectorAll('.gp-cod')).filter(function(x){return x.getAttribute('data-cod')===${JSON.stringify(codigo)}})[0];
          if(!b||b.textContent.indexOf(${JSON.stringify(codigo)})>=0) return false; b.click(); return b.textContent.indexOf(${JSON.stringify(codigo)})>=0; })()`);
        c("vitalicio · el grupo nuevo aparece en Mis grupos con su código tapado, que se destapa al pulsar", ve && tapado,
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
      c("🔴 semana 3 · el Mercado enseña sobre, cambio de repetidas y la cápsula de rescate; nada «clasificado»",
        merc.length === 3 && merc.some(x => /Cápsula de rescate/.test(x)) && !merc.some(x => /clasificada/i.test(x)), JSON.stringify(merc));
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
      c("🔴 semanas · la consola dice cuántos capítulos ha visto Nora (3 de los 7 abiertos en la semana 10, 1 saltado)", /3\/7/.test(celda) && /1 saltado/.test(celda), celda);
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
      // (14-sep · «El plan de hoy» ya no va aparte: Norberto eligió juntarlo con las misiones)
      c("🔴 sesión · la semana 2 lleva «Lo nuevo» y «Enséñalo», justo antes de las misiones de hoy",
        rot.indexOf("Lo nuevo") > 1 && rot.indexOf("Enséñalo") === rot.indexOf("Lo nuevo") + 1 && rot.indexOf("Misión 1") > rot.indexOf("Enséñalo"), JSON.stringify(rot));
      await rita.js("[].slice.call(document.querySelectorAll('.barra-pasos .p')).filter(function(b){return b.getAttribute('title')==='Lo nuevo'})[0].click(); 1"); await dormir(700);
      c("sesión · «🔓 Se abre esta semana en STARGATE: El Mercado Estelar», con lo que se puede hacer", /Se abre esta semana/i.test(await rita.texto()) && /sobres de cromos/i.test(await rita.texto()));
      await rita.foto(FOTOS + "/21-sesion-lo-nuevo.png");
      await rita.js("[].slice.call(document.querySelectorAll('.barra-pasos .p')).filter(function(b){return b.getAttribute('title')==='Enséñalo'})[0].click(); 1"); await dormir(700);
      const src = await rita.js("(document.querySelector('.dia.simulacro iframe')||{}).getAttribute ? document.querySelector('.dia.simulacro iframe').getAttribute('src') : ''");
      c("🔴 sesión · «Enséñalo» incrusta la Nave del Comandante en ESA semana, con NEBULA", /simulacro=1/.test(src) && /semana=2/.test(src) && /per=lab-clase/.test(src) && /nebula=1/.test(src), src);
      // (el marco es de la misma web: se mira por dentro desde la página)
      const dentro = await rita.hasta("(function(){ var f=document.querySelector('.dia.simulacro iframe'); var d=f&&f.contentDocument; return !!(d&&d.querySelector('.sim-barra')&&d.querySelectorAll('.nb-t').length>0); })()", 30);
      c("sesión · y dentro se puede usar (la barra del simulacro y las pestañas de la semana 2)", dentro);
      c("🔴 sesión · y NEBULA arranca sola con el capítulo de la semana (el mismo onboarding que ve el alumnado)",
        await rita.hasta("(function(){ var f=document.querySelector('.dia.simulacro iframe'); var d=f&&f.contentDocument; var t=d&&d.querySelector('.tour.open'); return !!t && /Mercado/i.test(t.textContent); })()", 20));
      await dormir(1500); await rita.foto(FOTOS + "/21-sesion-ensenalo.png");
      // (14-sep · la 6 ya abre el Gran Sorteo: la que no abre nada es la 7)
      await rita.ir("sesion.html?per=lab-clase&sem=7"); await rita.hasta("document.querySelectorAll('.barra-pasos .p').length>0", 25);
      const rot6 = await rita.js("[].slice.call(document.querySelectorAll('.barra-pasos .p')).map(function(b){return b.getAttribute('title')})");
      c("sesión · una semana que no abre nada no lleva esas diapositivas (la 7)", rot6.indexOf("Lo nuevo") < 0, JSON.stringify(rot6));
    }

    // ============================================================ 22 · EL ZOCO ESTELAR, TODAS LAS COMBINACIONES
    /**
     * Norberto: «…esto requerirá muchas pruebas para que no haya errores, no se dupliquen ítems» y
     * «simula la puesta en venta, otro estudiante lanza una oferta, se acepta; lo mismo, pero el
     * vendedor no acepta y pide otra cosa, el comprador acepta; lo mismo rechazando… todas las
     * combinaciones. Asegúrate de que cambia de un usuario a otro».
     *
     * Cuatro reclutas de verdad (Olga, Pau, Quim y Rut), cada paso en SU Nave y en un navegador
     * aparte (como cada uno en su casa), contra el servidor de verdad. Y un contable: después de cada
     * escena se suman los créditos y las piezas de los cuatro (más lo apartado en tratos abiertos) y
     * tiene que salir EXACTAMENTE lo mismo que al principio. Si algo se duplica o se pierde, salta.
     */
    if (hacer(22)) {
      const A = admin(), fs = A.firestore();
      const P = "lab-clase", pz = k => P + "__" + k;
      const HX = pz("heroe_H03_xeno"), HT = pz("heroe_H07_tejedor"), HE = pz("heroe_H05_eco"),
            CN = pz("cromo_E1_nebula"), CB = pz("cromo_P1_bran"), CT = pz("cromo_P2_tomas"), CS = pz("cromo_P3_sylla");
      const GENTE = { olga: ["olga@lab.test", "Olga Prueba", "Olga Órbita", 0], pau: ["pau@lab.test", "Pau Prueba", "Pau Púlsar", 1],
                      quim: ["quim@lab.test", "Quim Prueba", "Quim Quásar", 0], rut: ["rut@lab.test", "Rut Prueba", "Rut Radar", 1] };
      const QUIEN = Object.keys(GENTE);
      for (const k of QUIEN) {
        const [correo, nombre, alias, cmd] = GENTE[k];
        for (let intento = 0; intento < 2 && !(await fichaDe(correo, P)); intento++) {
          const p = await nueva("Alta " + nombre + (intento ? " (otra vez)" : ""));
          const ok = await alistar(p, correo, nombre, alias, cmd);
          if (!ok) process.stderr.write("   · alta de " + nombre + " sin terminar: " + (await p.texto()).slice(0, 200) + " · " + JSON.stringify(p.errores.slice(-3)) + "\n");
          await dormir(800); await p.cerrar();
        }
      }
      const F = {}; for (const k of QUIEN) F[k] = await fichaDe(GENTE[k][0], P);
      c("zoco · cuatro reclutas alistados para el Zoco", QUIEN.every(k => F[k] && F[k].displayName === GENTE[k][2]), JSON.stringify(QUIEN.map(k => F[k] && F[k].displayName)));
      const ficha = k => fichaDe(GENTE[k][0], P);
      const cambia = (k, cambios) => fs.collection("student_profiles").doc(F[k]._id).update(cambios);
      await cambia("olga", { inventory: [HX, HX, CB, CB, CT], coins: 20 });
      await cambia("pau", { inventory: [CN, HT, CS], coins: 200 });
      await cambia("quim", { inventory: [HE], coins: 120 });
      await cambia("rut", { inventory: [CT, CS], coins: 60 });
      const n = (f, id) => (f.inventory || []).filter(x => x === id).length;
      const tratos = () => consultar("stargate_tratos", "projectId", P);
      const trato = async id => (await tratos()).filter(t => t._id === id)[0];
      const anuncios = () => consultar("stargate_zoco", "projectId", P);
      const anuncioDe = async (k, id) => (await anuncios()).filter(a => a.estado === "abierto" && a.vende.uid === F[k]._uid && a.pieza.id === id).map(a => a._id);
      const tratoDe = async (anuncio, k) => (await tratos()).filter(t => t.anuncio === anuncio && t.compra.uid === F[k]._uid).sort((a, b) => b.creado - a.creado)[0];

      // ── el contable
      const mundo = async () => {
        const fichas = await Promise.all(QUIEN.map(ficha));
        const abiertos = (await tratos()).filter(t => t.estado === "abierto");
        let cr = 0; const m = {};
        const suma = l => (l || []).filter(x => /__(heroe|cromo)_/i.test(x)).forEach(x => { m[x] = (m[x] || 0) + 1; });
        fichas.forEach(f => { cr += Number(f.coins || 0); suma(f.inventory); });
        abiertos.forEach(t => { cr += Number((t.ofrece || {}).creditos || 0); suma((t.ofrece || {}).piezas); });
        return JSON.stringify({ cr, piezas: Object.keys(m).sort().map(x => x.split("__")[1] + "×" + m[x]) });
      };
      let MUNDO = await mundo();
      const cuadra = async que => { const m = await mundo(); c("🔴 zoco · " + que + " — las cuentas cuadran: ni un ◈ ni una pieza de más o de menos", m === MUNDO, m + " ≠ " + MUNDO); };
      const reajusta = async () => { MUNDO = await mundo(); };   // tras tocar una ficha a mano (simular que gastó algo)

      // ── cada uno, en su Nave y en su navegador
      const nave = async (k, nota) => {
        const [correo, nombre] = GENTE[k];
        const q = await nueva(nombre.split(" ")[0] + " · " + nota);
        await q.ir("entrar.html"); await q.entrarComo(correo, nombre); await sinBienvenidas(q);
        await q.ir("recluta.html?per=" + P);
        await q.hasta("!!document.querySelector('.nb-t[data-tab=\"zoco\"]')", 30);
        return q;
      };
      const alZoco = async q => {
        if (!(await q.js("!!document.getElementById('z-poner')"))) await q.js("document.querySelector('.nb-t[data-tab=\"zoco\"]').click(); 1");
        return q.hasta("!!document.getElementById('z-poner')", 30);
      };
      const naveZoco = async (k, nota) => { const q = await nave(k, nota); await alZoco(q); await dormir(600); return q; };
      const borraAviso = q => q.js("var a=document.getElementById('nave-aviso'); if(a) a.innerHTML=''; 1");
      const avisoEs = (q, re) => q.hasta("new RegExp(" + JSON.stringify(re.source) + ",'i').test((document.getElementById('nave-aviso')||{}).innerText||'')", 30);
      const finEs = (q, re) => q.hasta("!!document.querySelector('.neb-capa [data-cerrar]') && new RegExp(" + JSON.stringify(re.source) + ",'i').test(document.querySelector('.neb-capa').innerText)", 30);
      const seguir = q => q.js("var b=document.querySelector('.neb-capa [data-cerrar]'); if(b) b.click(); 1");
      const abreHistorial = q => q.js("[].forEach.call(document.querySelectorAll('.zoco details.cajon'),function(d){d.open=true}); 1");
      const llama = (q, fn, args) => q.js(`window.SG.MOTOR.${fn}(${args.map(a => JSON.stringify(a)).join(",")}).then(function(r){return JSON.stringify(r)},function(e){return "ERROR " + e.message})`, 60000);
      const conQuien = k => GENTE[k][2];
      // pulsar un botón de la tarjeta de un trato (la del otro recluta)
      const pulsaTrato = async (q, otro, accion) => { await borraAviso(q); return q.js(`(function(){ var t=[].slice.call(document.querySelectorAll('.zt')).filter(function(x){
          return x.innerText.indexOf(${JSON.stringify(conQuien(otro))})>=0 && x.querySelector('[data-zt="${accion}"]'); })[0];
        if(!t) return false; t.querySelector('[data-zt="${accion}"]').click(); return true; })()`); };
      // rellenar una ventana del Zoco (oferta o contraoferta) y enviarla
      const rellena = async (q, cr, piezas, msg) => { await borraAviso(q); return q.js(`(function(){ var cap=document.querySelector('.zoco-capa'); if(!cap) return 'sin ventana';
          var i=cap.querySelector('#zm-cr'); if(i) i.value=${JSON.stringify(String(cr))};
          var fal=[]; ${JSON.stringify(piezas)}.forEach(function(id){ var p=cap.querySelector('.zm-p[data-p="'+id+'"]'); if(p && !p.disabled) p.click(); else fal.push(id); });
          var m=cap.querySelector('#zm-msg'); if(m) m.value=${JSON.stringify(msg || "")};
          if(fal.length) return 'sin pieza ' + fal.join(',');
          cap.querySelector('#zm-ok').click(); return 'ok'; })()`); };
      const ofertaUI = async (q, anuncio, cr, piezas, msg) => {
        await borraAviso(q);
        const b = await q.js(`(function(){ var b=document.querySelector('[data-zofertar="${anuncio}"]'); if(!b) return false; b.click(); return true; })()`);
        if (!b) return "sin botón de oferta";
        await q.hasta("!!document.querySelector('.zoco-capa #zm-ok')", 10);
        return rellena(q, cr, piezas, msg);
      };
      const cerrarTodas = async (...qs) => { for (const q of qs) if (q) await q.cerrar(); };
      const sinErrores = (que, ...qs) => c("zoco · " + que + ": sin errores en las páginas", qs.every(x => !x.errores.filter(e => !/Failed to load resource/i.test(e)).length),
        qs.map(x => x.errores.filter(e => !/Failed to load resource/i.test(e))[0] || "").filter(Boolean).join(" | "));

      // ─────────────────────────────────────────── 1 · OLGA PONE COSAS EN EL ZOCO (de las tres maneras)
      const o1 = await naveZoco("olga", "pone");
      c("zoco · 1 · el Zoco se abre con «Poner algo mío» y «En el Zoco ahora»", /En el Zoco ahora/i.test(await o1.texto()));
      await o1.js("document.getElementById('z-poner').click(); 1");
      await o1.hasta("!!document.querySelector('.zoco-capa .zm-p')", 10);
      const rotulo = await o1.js(`(function(){ var cap=document.querySelector('.zoco-capa');
        ['${HX}','${CB}'].forEach(function(id){ cap.querySelector('.zm-p[data-p="'+id+'"]').click(); });
        var ok=cap.querySelector('#zm-ok'), t=ok.textContent; ok.click(); return t; })()`);
      c("zoco · 1 · «Poner algo mío»: marca dos y el botón lo cuenta («Poner 2 en el Zoco»)", /Poner 2/i.test(rotulo), rotulo);
      await avisoEs(o1, /2 cosas en el Zoco/);
      const L_HX1 = (await anuncioDe("olga", HX))[0], L_CB1 = (await anuncioDe("olga", CB))[0];
      c("🔴 zoco · 1 · Olga pone su Xeno y su Bran desde su Nave", !!L_HX1 && !!L_CB1);
      c("zoco · 1 · y los ve en «Lo tuyo en el Zoco», con «sin ofertas aún»", await o1.hasta("/Lo tuyo en el Zoco/i.test(document.body.innerText) && document.querySelectorAll('[data-zretirar]').length===2 && /sin ofertas/i.test(document.body.innerText)", 15));
      // desde la carta en grande (su álbum): Tomás
      await o1.js("document.querySelector('.nb-t[data-tab=\"botin\"]').click(); 1");
      await o1.hasta("!!document.querySelector('.album .c[data-c=\"P2_tomas\"]')", 15);
      await o1.js("document.querySelector('.album .c[data-c=\"P2_tomas\"]').click(); 1");
      const hayLupa = await o1.hasta("!!document.getElementById('lupa-zoco')", 10);
      c("zoco · 1 · al abrir una carta en grande sale «🔄 Poner en el Zoco»", hayLupa);
      await o1.foto(FOTOS + "/22-1-carta-en-grande.png");
      await borraAviso(o1); await o1.js("document.getElementById('lupa-zoco').click(); 1");
      await o1.hasta("!!document.querySelector('.neb-capa [data-si]')", 10);
      await o1.js("document.querySelector('.neb-capa [data-si]').click(); 1");
      await avisoEs(o1, /ya está en el Zoco/);
      c("zoco · 1 · …y NEBULA pregunta, pone la carta y se cierra sola", !(await o1.js("!!document.querySelector('.neb-capa')")) && (await anuncioDe("olga", CT)).length === 1);
      // desde el vestuario: el 🔄 de su otro Xeno
      await o1.hasta(`!!document.querySelector('[data-zoco-poner="${HX}"]')`, 15);
      await borraAviso(o1); await o1.js(`document.querySelector('[data-zoco-poner="${HX}"]').click(); 1`);
      await o1.hasta("!!document.querySelector('.neb-capa [data-si]')", 10);
      await o1.js("document.querySelector('.neb-capa [data-si]').click(); 1");
      await avisoEs(o1, /ya está en el Zoco/);
      for (let k = 0; k < 20 && (await anuncioDe("olga", HX)).length < 2; k++) await dormir(300);
      const L_CT = (await anuncioDe("olga", CT))[0], lhx = await anuncioDe("olga", HX), L_HX2 = lhx.filter(x => x !== L_HX1)[0];
      c("🔴 zoco · 1 · y desde el 🔄 de un héroe del vestuario (su segundo Xeno)", lhx.length === 2 && !!L_HX2);
      // la ventana de poner ya sabe lo que tiene puesto
      await alZoco(o1);
      await o1.js("document.getElementById('z-poner').click(); 1"); await o1.hasta("!!document.querySelector('.zoco-capa .zm-p')", 10);
      const marcas = JSON.parse(await o1.js(`JSON.stringify({ hx: document.querySelector('.zoco-capa .zm-p[data-p="${HX}"]').disabled,
        cb: document.querySelector('.zoco-capa .zm-p[data-p="${CB}"]').disabled, cbt: document.querySelector('.zoco-capa .zm-p[data-p="${CB}"]').innerText })`));
      c("zoco · 1 · al volver a «Poner»: los dos Xeno salen «ya en el Zoco» (apagado) y el Bran «1 en el Zoco»", marcas.hx === true && marcas.cb === false && /1 en el Zoco/i.test(marcas.cbt), JSON.stringify(marcas));
      await o1.foto(FOTOS + "/22-1-poner-ya-puesto.png");
      await o1.js("document.querySelector('.zoco-capa [data-cerrar]').click(); 1");
      const f1 = await ficha("olga");
      c("🔴 zoco · 1 · poner NO quita nada: Olga sigue con sus 2 Xeno, 2 Bran y Tomás", n(f1, HX) === 2 && n(f1, CB) === 2 && n(f1, CT) === 1 && f1.coins === 20, JSON.stringify(f1.inventory));
      await cuadra("1 · poner");
      sinErrores("1", o1); await cerrarTodas(o1);

      // ─────────────────────────────────────────── 2 · PAU (OTRO RECLUTA, OTRO NAVEGADOR) OFERTA
      const p2 = await naveZoco("pau", "oferta");
      c("zoco · 2 · Pau ve lo de Olga en «En el Zoco ahora» (de Olga Órbita)", await p2.hasta(`!!document.querySelector('[data-zofertar="${L_HX1}"]') && /de Olga Órbita/i.test(document.body.innerText)`, 20));
      await p2.foto(FOTOS + "/22-2-pau-ve-el-zoco.png");
      const r2 = await ofertaUI(p2, L_HX1, 50, [CN], "¿Te vale mi NEBULA y 50?");
      c("zoco · 2 · Pau rellena su oferta: 50 ◈ + su carta de NEBULA y un mensaje", r2 === "ok", r2);
      await avisoEs(p2, /Oferta enviada a Olga/);
      const T2 = await tratoDe(L_HX1, "pau"), fP2 = await ficha("pau");
      c("🔴 zoco · 2 · lo ofrecido queda APARTADO: a Pau le bajan 50 ◈ y su NEBULA sale de su ficha", fP2.coins === 150 && n(fP2, CN) === 0 && T2 && T2.ofrece.creditos === 50 && T2.ofrece.piezas[0] === CN,
        fP2.coins + " ◈ · " + JSON.stringify(fP2.inventory));
      c("zoco · 2 · el trato: paso 1, le toca a Olga, con el mensaje de Pau", T2 && T2.paso === 1 && T2.turno === "vendedor" && /NEBULA y 50/i.test((T2.mensajes[0] || {}).texto));
      c("zoco · 2 · el mensaje llega también a los mensajes internos de GamificaPro (lo ve el docente)",
        (await consultar("internal_messages", "projectId", P)).some(m => m.threadKey === "zoco_" + T2._id && /\[Zoco Estelar\].*NEBULA y 50/i.test(m.body || "")));
      c("zoco · 2 · en la Nave de Pau: «Tus tratos en marcha · Esperando a Olga Órbita» y «Ya has ofertado»",
        await p2.hasta("/Tus tratos en marcha/i.test(document.body.innerText) && /Esperando a Olga Órbita/i.test(document.body.innerText) && /Ya has ofertado/i.test(document.body.innerText)", 15));
      c("zoco · 2 · y le dice cuánto tiene apartado: «Tienes 150 ◈ · 50 ◈ apartados»", /Tienes 150 ◈ · 50 ◈ apartados/i.test(await p2.texto()));
      await p2.foto(FOTOS + "/22-2-pau-oferta-enviada.png");
      // lo que no se puede
      c("🔴 zoco · 2 · Pau NO puede ofertar dos veces por lo mismo", /Ya tienes una oferta/i.test(await llama(p2, "zocoOfertar", [L_HX1, { creditos: 10, piezas: [] }, ""])));
      c("🔴 zoco · 2 · ni ofrecer su NEBULA en otra oferta (está apartada)", /Ya no tienes/i.test(await llama(p2, "zocoOfertar", [L_CB1, { creditos: 0, piezas: [CN] }, ""])));
      c("zoco · 2 · ni 46 ◈ por un cromo (el tope es 45)", /como mucho 45/i.test(await llama(p2, "zocoOfertar", [L_CB1, { creditos: 46, piezas: [] }, ""])));
      c("zoco · 2 · ni 181 ◈ por un héroe (el tope es 180)", /como mucho 180/i.test(await llama(p2, "zocoOfertar", [L_HX2, { creditos: 181, piezas: [] }, ""])));
      c("zoco · 2 · ni una oferta vacía", /Ofrece algo/i.test(await llama(p2, "zocoOfertar", [L_CB1, { creditos: 0, piezas: [] }, ""])));
      c("zoco · 2 · ni seis piezas (como mucho 5)", /Como mucho 5/i.test(await llama(p2, "zocoOfertar", [L_CB1, { creditos: 0, piezas: [HT, HT, HT, HT, HT, HT] }, ""])));
      c("zoco · 2 · ni una pieza de otro grupo en el Zoco", /solo entran/i.test(await llama(p2, "zocoPoner", [P, ["otro-grupo__heroe_H03_xeno"]])));
      c("zoco · 2 · ni poner algo que no tiene", /tantas copias/i.test(await llama(p2, "zocoPoner", [P, [HE]])));
      sinErrores("2", p2); await cerrarTodas(p2);
      await cuadra("2 · oferta con créditos y carta");

      // ─────────────────────────────────────────── 3 · OLGA ENTRA OTRO DÍA: AVISO, Y ACEPTA
      const o3 = await nave("olga", "acepta");
      await o3.hasta("!!document.querySelector('.zoco-aviso')", 20);
      const banda = await o3.js("(document.querySelector('.zoco-aviso')||{}).innerText||''");
      const insignia = await o3.js("(document.querySelector('.nb-t[data-tab=\"zoco\"] .nb-badge')||{}).textContent||''");
      c("🔴 zoco · 3 · al entrar, Olga ve la franja «El Zoco Estelar: tienes 1 trato esperando tu respuesta»", /tienes 1 trato esperando/i.test(banda), banda);
      c("zoco · 3 · y la pestaña del Zoco lleva la burbuja «1»", insignia === "1", insignia);
      await dormir(4000);
      c("zoco · 3 · la franja NO se va sola a los segundos (el aviso de antes duraba 3 s)", await o3.js("!!document.querySelector('.zoco-aviso')"));
      await o3.foto(FOTOS + "/22-3-olga-aviso.png");
      await o3.js("document.querySelector('.zoco-aviso [data-tab=\"zoco\"]').click(); 1");
      await o3.hasta("!!document.getElementById('z-poner')", 20);
      const t3 = await o3.texto();
      c("zoco · 3 · «Ir al Zoco» la lleva a «🔔 Te toca responder»: Pau quiere tu Xeno, con su mensaje",
        /Te toca responder/i.test(t3) && /Pau Púlsar quiere tu Xeno/i.test(t3) && /NEBULA y 50/i.test(t3), t3.slice(0, 300));
      c("zoco · 3 · y ya no sale la franja dentro del Zoco", !(await o3.js("!!document.querySelector('.zoco-aviso')")));
      await o3.foto(FOTOS + "/22-3-olga-te-toca.png");
      await pulsaTrato(o3, "pau", "aceptar");
      await o3.hasta("!!document.querySelector('.neb-capa [data-si]')", 10);
      const preg = await o3.js("document.querySelector('.neb-capa').innerText");
      c("zoco · 3 · NEBULA le pregunta «¿Cambias tu Xeno?» y le enseña lo que se lleva (50 ◈ + NEBULA)", /Cambias tu/i.test(preg) && /50 ◈/i.test(preg) && /NEBULA/i.test(preg), preg);
      await o3.js("document.querySelector('.neb-capa [data-si]').click(); 1");
      c("🔴 zoco · 3 · «Sí, cambiar» → NEBULA dice «¡Trato hecho!» (y no se queda la pregunta abierta)", await finEs(o3, /Trato hecho/));
      await o3.foto(FOTOS + "/22-3-trato-hecho.png");
      await seguir(o3);
      c("zoco · 3 · «Seguir» cierra la ventana", await o3.hasta("!document.querySelector('.neb-capa')", 5));
      const fO3 = await ficha("olga"), fP3 = await ficha("pau");
      c("🔴 zoco · 3 · Olga: un Xeno menos, +50 ◈ (20 → 70) y la NEBULA de Pau", n(fO3, HX) === 1 && fO3.coins === 70 && n(fO3, CN) === 1, fO3.coins + " · " + JSON.stringify(fO3.inventory));
      c("🔴 zoco · 3 · Pau: su Xeno nuevo, y paga lo apartado (150 ◈, sin NEBULA)", n(fP3, HX) === 1 && fP3.coins === 150 && n(fP3, CN) === 0, fP3.coins + " · " + JSON.stringify(fP3.inventory));
      c("zoco · 3 · el anuncio se cierra y el trato queda «aceptado»", (await anuncios()).filter(a => a._id === L_HX1)[0].estado === "cerrado" && (await trato(T2._id)).estado === "aceptado");
      await abreHistorial(o3);
      c("zoco · 3 · en el historial de Olga: «✅ Cambiado»", await o3.hasta("/Cambiado/i.test(document.body.innerText)", 10));
      sinErrores("3", o3); await cerrarTodas(o3);
      await cuadra("3 · aceptar a la primera");
      // Pau lo ve al entrar
      const p3 = await nave("pau", "ve su Xeno");
      await p3.hasta("!!document.querySelector('.zoco-aviso')", 20);
      const nov3 = await p3.js("(document.querySelector('.zoco-aviso')||{}).innerText||''");
      c("🔴 zoco · 3 · Pau entra y se entera: «🆕 El Zoco Estelar: Olga Órbita ha aceptado: Xeno ya es tuyo»", /Olga Órbita ha aceptado: Xeno.* ya es tuyo/i.test(nov3), nov3);
      c("zoco · 3 · sin burbuja en la pestaña (no le toca responder nada)", !(await p3.js("!!document.querySelector('.nb-badge')")));
      await p3.foto(FOTOS + "/22-3-pau-se-entera.png");
      await p3.js("document.querySelector('.zoco-aviso [data-tab=\"zoco\"]').click(); 1"); await p3.hasta("!!document.getElementById('z-poner')", 20);
      c("zoco · 3 · y dentro del Zoco, arriba: «🆕 Novedades» con el trato «✅ Cambiado»", /Novedades[\s\S]*Cambiado/i.test(await p3.texto()));
      await p3.foto(FOTOS + "/22-3-pau-novedades.png");
      await p3.js("document.querySelector('.nb-t[data-tab=\"botin\"]').click(); 1");
      c("🔴 zoco · 3 · y el Xeno ya está en SU vestuario (con su 🔄 para volver a cambiarlo)", await p3.hasta(`!!document.querySelector('[data-zoco-poner="${HX}"]')`, 15));
      sinErrores("3b", p3); await cerrarTodas(p3);

      // ─────────────────────────────────────────── 4 · CONTRAOFERTA → EL COMPRADOR ACEPTA
      const q4 = await naveZoco("quim", "oferta por el Bran");
      c("zoco · 4 · Quim oferta 20 ◈ por el Bran", (await ofertaUI(q4, L_CB1, 20, [], "20 por tu Bran")) === "ok");
      await avisoEs(q4, /Oferta enviada/); await cerrarTodas(q4);
      const T4 = await tratoDe(L_CB1, "quim");
      const o4 = await naveZoco("olga", "contraoferta");
      await pulsaTrato(o4, "quim", "contraofertar");
      await o4.hasta("!!document.querySelector('.zoco-capa #zm-cr')", 10);
      const ve4 = JSON.parse(await o4.js(`JSON.stringify({ eco: !!document.querySelector('.zoco-capa .zm-p[data-p="${HE}"]'), cr: document.querySelector('.zoco-capa #zm-cr').value,
        max: document.querySelector('.zoco-capa #zm-cr').max, txt: document.querySelector('.zoco-capa').innerText.slice(0, 200) })`));
      c("🔴 zoco · 4 · al contraofertar, Olga ve lo que tiene Quim (su Eco) para pedírselo", ve4.eco, JSON.stringify(ve4));
      c("zoco · 4 · la ventana parte de lo que ofreció (20 ◈) y avisa del tope (45 por un cromo)", ve4.cr === "20" && ve4.max === "45", JSON.stringify(ve4));
      await o4.foto(FOTOS + "/22-4-contraoferta-inventario.png");
      c("zoco · 4 · Olga pide 30 ◈ + el Eco de Quim", (await rellena(o4, 30, [HE], "Súmale tu Eco")) === "ok");
      await avisoEs(o4, /Contraoferta enviada a Quim/);
      const T4b = await trato(T4._id);
      c("zoco · 4 · paso 2: la pelota en el tejado de Quim, con lo que pide Olga", T4b.paso === 2 && T4b.turno === "comprador" && T4b.pide.creditos === 30 && T4b.pide.piezas[0] === HE, JSON.stringify(T4b.pide));
      c("zoco · 4 · Olga lo ve «Esperando a Quim Quásar · paso 2 de 3»", await o4.hasta("/Esperando a Quim Quásar/i.test(document.body.innerText) && /paso 2 de 3/i.test(document.body.innerText)", 10));
      sinErrores("4a", o4); await cerrarTodas(o4);
      await cuadra("4 · contraoferta enviada");
      const q4b = await nave("quim", "acepta la contraoferta");
      await q4b.hasta("!!document.querySelector('.zoco-aviso')", 20);
      c("zoco · 4 · Quim entra y le avisa: «tienes 1 trato esperando»", /1 trato/i.test(await q4b.js("document.querySelector('.zoco-aviso').innerText")));
      await alZoco(q4b);
      const t4 = await q4b.texto();
      c("zoco · 4 · y ve «Te pide 30 ◈ + Eco» con el mensaje de Olga", /Te pide/i.test(t4) && /30 ◈/i.test(t4) && /Súmale tu Eco/i.test(t4), t4.slice(0, 300));
      await q4b.foto(FOTOS + "/22-4-quim-le-piden.png");
      await pulsaTrato(q4b, "olga", "aceptar");
      await q4b.hasta("!!document.querySelector('.neb-capa [data-si]')", 10);
      c("zoco · 4 · NEBULA: «¿Aceptas y te llevas Bran?» con lo que paga", /Aceptas y te llevas/i.test(await q4b.js("document.querySelector('.neb-capa').innerText")));
      await q4b.js("document.querySelector('.neb-capa [data-si]').click(); 1");
      c("zoco · 4 · «¡Trato hecho! Bran ya es tuyo»", await finEs(q4b, /Bran.*ya es tuyo/));
      await seguir(q4b);
      const fO4 = await ficha("olga"), fQ4 = await ficha("quim");
      c("🔴 zoco · 4 · Quim: recupera sus 20, paga 30 y el Eco, y se lleva el Bran (120 → 90)", n(fQ4, CB) === 1 && n(fQ4, HE) === 0 && fQ4.coins === 90, fQ4.coins + " · " + JSON.stringify(fQ4.inventory));
      c("🔴 zoco · 4 · Olga: un Bran menos, +30 ◈ (70 → 100) y el Eco", n(fO4, CB) === 1 && n(fO4, HE) === 1 && fO4.coins === 100, fO4.coins + " · " + JSON.stringify(fO4.inventory));
      sinErrores("4b", q4b); await cerrarTodas(q4b);
      await cuadra("4 · contraoferta aceptada");

      // ─────────────────────────────────────────── 5 · CONTRAOFERTA → EL COMPRADOR DICE «NO, GRACIAS»
      const r5 = await naveZoco("rut", "oferta por Tomás");
      c("zoco · 5 · Rut oferta 15 ◈ + Sylla por el Tomás de Olga", (await ofertaUI(r5, L_CT, 15, [CS], "Te doy Sylla")) === "ok");
      await avisoEs(r5, /Oferta enviada/); await cerrarTodas(r5);
      const T5 = await tratoDe(L_CT, "rut");
      const o5 = await naveZoco("olga", "pide más a Rut");
      await pulsaTrato(o5, "rut", "contraofertar"); await o5.hasta("!!document.querySelector('.zoco-capa #zm-cr')", 10);
      c("zoco · 5 · Olga contraoferta: 45 ◈ (lo que ofreció en piezas no lo marca)", (await rellena(o5, 45, [], "45 y es tuyo")) === "ok");
      await avisoEs(o5, /Contraoferta enviada/); await cerrarTodas(o5);
      const r5b = await naveZoco("rut", "dice que no");
      await pulsaTrato(r5b, "olga", "rechazar"); await r5b.hasta("!!document.querySelector('.zoco-capa #zm-msg')", 10);
      c("zoco · 5 · Rut pulsa «No, gracias» y la ventana le deja un mensaje", /No aceptar/i.test(await r5b.js("document.querySelector('.zoco-capa').innerText")));
      await r5b.js("document.querySelector('.zoco-capa #zm-msg').value='Demasiado para mí'; document.querySelector('.zoco-capa #zm-ok').click(); 1");
      await avisoEs(r5b, /ha vuelto a ti/);
      const T5b = await trato(T5._id), fR5 = await ficha("rut");
      c("🔴 zoco · 5 · «No, gracias»: el trato se cierra y a Rut le vuelve TODO (15 ◈ y Sylla)", T5b.estado === "rechazado" && fR5.coins === 60 && n(fR5, CS) === 1, T5b.estado + " · " + fR5.coins);
      c("zoco · 5 · con los tres mensajes en orden (Rut, Olga, Rut)", (T5b.mensajes || []).map(m => m.de).join() === "comprador,vendedor,comprador", JSON.stringify(T5b.mensajes));
      c("zoco · 5 · el Tomás sigue en el Zoco (se puede volver a ofertar)", (await anuncios()).filter(a => a._id === L_CT)[0].estado === "abierto");
      await abreHistorial(r5b);
      c("zoco · 5 · y Rut lo ve «✖️ Rechazado» en su historial", await r5b.hasta("/Rechazado/i.test(document.body.innerText)", 10));
      sinErrores("5", r5b); await cerrarTodas(r5b);
      const o5b = await naveZoco("olga", "lee la respuesta");
      await o5b.js("var d=document.querySelector('.zoco details.cajon'); if(d) d.open=true; 1");
      c("zoco · 5 · Olga lee en su historial la respuesta de Rut: «Demasiado para mí»", /Rut Radar:\s*«Demasiado para mí»/i.test(await o5b.texto()));
      await o5b.foto(FOTOS + "/22-5-historial-olga.png");
      sinErrores("5b", o5b); await cerrarTodas(o5b);
      await cuadra("5 · contraoferta rechazada");

      // ─────────────────────────────────────────── 6 · EL VENDEDOR RECHAZA, CON MENSAJE
      const p6 = await naveZoco("pau", "oferta Sylla");
      c("zoco · 6 · Pau oferta solo su Sylla (sin créditos) por el Tomás", (await ofertaUI(p6, L_CT, 0, [CS], "")) === "ok");
      await avisoEs(p6, /Oferta enviada/); await cerrarTodas(p6);
      const T6 = await tratoDe(L_CT, "pau");
      const o6 = await naveZoco("olga", "rechaza a Pau");
      await pulsaTrato(o6, "pau", "rechazar"); await o6.hasta("!!document.querySelector('.zoco-capa #zm-msg')", 10);
      await o6.js("document.querySelector('.zoco-capa #zm-msg').value='Ya tengo a Sylla'; document.querySelector('.zoco-capa #zm-ok').click(); 1");
      await avisoEs(o6, /Su oferta ha vuelto a Pau/); await cerrarTodas(o6);
      const T6b = await trato(T6._id), fP6 = await ficha("pau");
      c("🔴 zoco · 6 · Olga rechaza: su Sylla vuelve a Pau", T6b.estado === "rechazado" && n(fP6, CS) === 1, T6b.estado + " · " + JSON.stringify(fP6.inventory));
      const p6b = await naveZoco("pau", "lee el rechazo");
      await p6b.js("var d=document.querySelector('.zoco details.cajon'); if(d) d.open=true; 1");
      c("zoco · 6 · y Pau lee al entrar «✖️ Rechazado · Olga Órbita: «Ya tengo a Sylla»»", /Rechazado/i.test(await p6b.texto()) && /Olga Órbita:\s*«Ya tengo a Sylla»/i.test(await p6b.texto()));
      sinErrores("6", p6b); await cerrarTodas(p6b);
      await cuadra("6 · el vendedor rechaza");

      // ─────────────────────────────────────────── 7 · EL COMPRADOR RETIRA SU OFERTA
      const q7 = await naveZoco("quim", "retira");
      await ofertaUI(q7, L_CT, 10, [], ""); await avisoEs(q7, /Oferta enviada/);
      c("zoco · 7 · Quim oferta 10 ◈ (le bajan a 80)", (await ficha("quim")).coins === 80);
      await q7.hasta("!!document.querySelector('[data-zt=\"retirar\"]')", 15);
      await pulsaTrato(q7, "olga", "retirar");
      await avisoEs(q7, /Oferta retirada/);
      c("🔴 zoco · 7 · «Retirar mi oferta»: le vuelven sus 10 ◈", (await ficha("quim")).coins === 90);
      c("zoco · 7 · y puede volver a ofertar por lo mismo", !/ERROR/i.test(await llama(q7, "zocoOfertar", [L_CT, { creditos: 12, piezas: [] }, ""])));
      sinErrores("7", q7); await cerrarTodas(q7);
      await cuadra("7 · el comprador retira");

      // ─────────────────────────────────────────── 8 · EL VENDEDOR RETIRA SU ANUNCIO CON OFERTAS (PASO 1 Y PASO 2)
      const r8 = await nave("rut", "oferta 5");
      await llama(r8, "zocoOfertar", [L_CT, { creditos: 5, piezas: [] }, ""]); await cerrarTodas(r8);
      const T8r = await tratoDe(L_CT, "rut"), T8q = await tratoDe(L_CT, "quim");
      const o8 = await naveZoco("olga", "retira el anuncio");
      await llama(o8, "zocoResponder", [T8r._id, "contraofertar", { pide: { creditos: 10, piezas: [] }, mensaje: "" }]);
      c("zoco · 8 · Tomás tiene dos tratos abiertos: Quim en el paso 1 y Rut en el paso 2", (await trato(T8q._id)).paso === 1 && (await trato(T8r._id)).paso === 2);
      await o8.js("document.querySelector('.nb-t[data-tab=\"nave\"]').click(); 1"); await alZoco(o8);
      await borraAviso(o8); await o8.js(`document.querySelector('[data-zretirar="${L_CT}"]').click(); 1`);
      await avisoEs(o8, /Retirado del Zoco/);
      const fQ8 = await ficha("quim"), fR8 = await ficha("rut");
      c("🔴 zoco · 8 · Olga retira el Tomás: a Quim le vuelven 12 ◈ y a Rut 5 ◈", fQ8.coins === 90 && fR8.coins === 60, fQ8.coins + " / " + fR8.coins);
      c("zoco · 8 · los dos tratos quedan «retirado» y el anuncio también", (await trato(T8q._id)).estado === "retirado" && (await trato(T8r._id)).estado === "retirado"
        && (await anuncios()).filter(a => a._id === L_CT)[0].estado === "retirado");
      c("zoco · 8 · Olga conserva su Tomás", n(await ficha("olga"), CT) === 1);
      sinErrores("8", o8); await cerrarTodas(o8);
      await cuadra("8 · el vendedor retira su anuncio");

      // ─────────────────────────────────────────── 9 · A QUIÉN LE TOCA (y quién no puede tocar nada)
      const o9 = await nave("olga", "turnos"), p9 = await nave("pau", "turnos"), q9 = await nave("quim", "curiosea");
      const L_CN = JSON.parse(await llama(o9, "zocoPoner", [P, [CN]])).anuncios[0];
      await llama(p9, "zocoOfertar", [L_CN, { creditos: 10, piezas: [] }, ""]);
      const T9 = await tratoDe(L_CN, "pau");
      c("zoco · 9 · Pau no puede aceptar su propia oferta (le toca a Olga)", /no te toca/i.test(await llama(p9, "zocoResponder", [T9._id, "aceptar", {}])));
      c("zoco · 9 · ni contraofertar él", /no te toca/i.test(await llama(p9, "zocoResponder", [T9._id, "contraofertar", { pide: { creditos: 5, piezas: [] } }])));
      c("🔴 zoco · 9 · Quim (un tercero) no puede responder un trato ajeno", /no es tuyo/i.test(await llama(q9, "zocoResponder", [T9._id, "aceptar", {}])));
      c("🔴 zoco · 9 · ni leerlo", /permission|insufficient/i.test(await q9.js(`window.SG.MOTOR.getDoc(window.SG.MOTOR.doc(window.SG.MOTOR.db,'stargate_tratos',${JSON.stringify(T9._id)})).then(function(){return 'LEYÓ'},function(e){return e.code||e.message})`)));
      c("zoco · 9 · pero el anuncio sí lo ve todo el grupo", /LEYÓ/i.test(await q9.js(`window.SG.MOTOR.getDoc(window.SG.MOTOR.doc(window.SG.MOTOR.db,'stargate_zoco',${JSON.stringify(L_CN)})).then(function(){return 'LEYÓ'},function(e){return e.code||e.message})`)));
      const escribe = (q, ruta, id, datos) => q.js(`window.SG.MOTOR.setDoc(window.SG.MOTOR.doc(window.SG.MOTOR.db,${JSON.stringify(ruta)},${JSON.stringify(id)}),${JSON.stringify(datos)},{merge:true}).then(function(){return 'ESCRIBIÓ'},function(e){return e.code||e.message})`);
      c("🔴 zoco · 9 · desde la consola del navegador: Pau no puede darse el trato por aceptado", !/ESCRIBIÓ/i.test(await escribe(p9, "stargate_tratos", T9._id, { estado: "aceptado" })));
      c("🔴 zoco · 9 · ni fabricarse un anuncio", !/ESCRIBIÓ/i.test(await escribe(p9, "stargate_zoco", "trampa", { projectId: P, estado: "abierto" })));
      c("🔴 zoco · 9 · ni tocarse los créditos o el inventario", !/ESCRIBIÓ/i.test(await escribe(p9, "student_profiles", F.pau._id, { coins: 9999 })) && !/ESCRIBIÓ/i.test(await escribe(p9, "student_profiles", F.pau._id, { inventory: [HX, HX, HX] })));
      await llama(o9, "zocoResponder", [T9._id, "contraofertar", { pide: { creditos: 20, piezas: [] }, mensaje: "" }]);
      c("zoco · 9 · en el paso 2 Olga ya no puede aceptar (le toca a Pau)", /no te toca/i.test(await llama(o9, "zocoResponder", [T9._id, "aceptar", {}])));
      c("zoco · 9 · ni contraofertar otra vez (3 pasos como mucho)", /no te toca/i.test(await llama(o9, "zocoResponder", [T9._id, "contraofertar", { pide: { creditos: 25, piezas: [] } }])));
      const ret9 = await llama(o9, "zocoResponder", [T9._id, "retirar", {}]);
      c("zoco · 9 · pero sí echarse atrás de su contraoferta: el trato se cierra y a Pau le vuelven sus 10", /retirado/i.test(ret9) && (await ficha("pau")).coins === 150, ret9);
      sinErrores("9", o9, p9, q9); await cerrarTodas(o9, p9, q9);
      await cuadra("9 · turnos");

      // ─────────────────────────────────────────── 10 · NO SE PIDE LO QUE EL OTRO NO TIENE
      const r10 = await nave("rut", "oferta 5 por NEBULA"), o10 = await nave("olga", "pide de más");
      await llama(r10, "zocoOfertar", [L_CN, { creditos: 5, piezas: [] }, ""]);
      const T10 = await tratoDe(L_CN, "rut");
      const pideN = await llama(o10, "zocoResponder", [T10._id, "contraofertar", { pide: { creditos: 0, piezas: [HT] } }]);
      c("🔴 zoco · 10 · Olga no puede pedirle a Rut un Tejedor que no tiene", /Rut Radar no tiene H07_tejedor/i.test(pideN), pideN);
      c("zoco · 10 · ni más de 45 ◈ por un cromo", /Como mucho 45/i.test(await llama(o10, "zocoResponder", [T10._id, "contraofertar", { pide: { creditos: 46, piezas: [] } }])));
      await cambia("rut", { coins: 10 }); await reajusta();
      const pideC = await llama(o10, "zocoResponder", [T10._id, "contraofertar", { pide: { creditos: 40, piezas: [] } }]);
      c("zoco · 10 · ni 40 ◈ si entre lo que tiene y lo apartado solo llega a 15 (y no dice cuánto tiene)", /Rut Radar no tiene 40 ◈/i.test(pideC) && !/15|10 ◈/i.test(pideC), pideC);
      c("zoco · 10 · lo que SÍ tiene (15 ◈ contando lo apartado + Tomás) sí se lo puede pedir", /contraoferta/i.test(await llama(o10, "zocoResponder", [T10._id, "contraofertar", { pide: { creditos: 15, piezas: [CT] }, mensaje: "15 y tu Tomás" }])));
      sinErrores("10", o10, r10); await cerrarTodas(o10, r10);
      await cuadra("10 · pedir lo que no tiene");

      // ─────────────────────────────────────────── 11 · EL COMPRADOR YA NO TIENE LO QUE LE PIDEN
      await cambia("rut", { inventory: (await ficha("rut")).inventory.filter(x => x !== CT) }); await reajusta();   // lo cambió en el Mercado
      const r11 = await naveZoco("rut", "ya no tiene Tomás");
      await pulsaTrato(r11, "olga", "aceptar"); await r11.hasta("!!document.querySelector('.neb-capa [data-si]')", 10);
      await r11.js("document.querySelector('.neb-capa [data-si]').click(); 1");
      c("🔴 zoco · 11 · Rut acepta sin tener ya el Tomás: NEBULA dice «No se ha podido · Ya no tienes «Tomás»» y no se toca nada",
        await finEs(r11, /No se ha podido[\s\S]*Ya no tienes «[^»]+»[\s\S]*No se ha tocado nada/), await r11.js("(document.querySelector('.neb-capa')||{}).innerText||''"));
      await r11.foto(FOTOS + "/22-11-ya-no-tienes.png");
      await seguir(r11);
      c("zoco · 11 · el trato sigue abierto (le sigue tocando a Rut)", (await trato(T10._id)).estado === "abierto");
      await r11.hasta("!!document.querySelector('[data-zt=\"rechazar\"]')", 10);
      await pulsaTrato(r11, "olga", "rechazar"); await r11.hasta("!!document.querySelector('.zoco-capa #zm-ok')", 10);
      await r11.js("document.querySelector('.zoco-capa #zm-ok').click(); 1"); await avisoEs(r11, /ha vuelto a ti/);
      c("zoco · 11 · y dice «No, gracias»: le vuelven sus 5 ◈ (10 → 15)", (await trato(T10._id)).estado === "rechazado" && (await ficha("rut")).coins === 15);
      sinErrores("11", r11); await cerrarTodas(r11);
      await cuadra("11 · el comprador ya no tiene");

      // ─────────────────────────────────────────── 12 · EL VENDEDOR YA NO LO TIENE (ANULADO)
      const q12 = await nave("quim", "oferta por el Xeno"), r12 = await nave("rut", "oferta por el Xeno");
      await llama(q12, "zocoOfertar", [L_HX2, { creditos: 40, piezas: [] }, ""]);
      await llama(r12, "zocoOfertar", [L_HX2, { creditos: 5, piezas: [] }, ""]);
      await cerrarTodas(q12, r12);
      const T12q = await tratoDe(L_HX2, "quim"), T12r = await tratoDe(L_HX2, "rut");
      await cambia("olga", { inventory: (await ficha("olga")).inventory.filter(x => x !== HX) }); await reajusta();   // lo cambió por 2 repetidos
      const o12 = await naveZoco("olga", "ya no tiene el Xeno");
      await pulsaTrato(o12, "quim", "aceptar"); await o12.hasta("!!document.querySelector('.neb-capa [data-si]')", 10);
      await o12.js("document.querySelector('.neb-capa [data-si]').click(); 1");
      c("🔴 zoco · 12 · Olga acepta un Xeno que ya no tiene: «Trato anulado · Ya no lo tienes… su oferta ha vuelto a Quim Quásar»",
        await finEs(o12, /Trato anulado[\s\S]*Ya no lo tienes[\s\S]*Quim Quásar/), await o12.js("(document.querySelector('.neb-capa')||{}).innerText||''"));
      await seguir(o12);
      const fQ12 = await ficha("quim"), fR12 = await ficha("rut");
      c("🔴 zoco · 12 · a Quim le vuelven sus 40 ◈ y no recibe ningún Xeno", fQ12.coins === 90 && n(fQ12, HX) === 0, fQ12.coins + " · " + JSON.stringify(fQ12.inventory));
      c("zoco · 12 · el anuncio se retira y la otra oferta (Rut) se anula y le devuelve sus 5 ◈",
        (await anuncios()).filter(a => a._id === L_HX2)[0].estado === "retirado" && (await trato(T12r._id)).estado === "anulado" && fR12.coins === 15, fR12.coins);
      sinErrores("12", o12); await cerrarTodas(o12);
      await cuadra("12 · el vendedor ya no lo tiene");

      // ─────────────────────────────────────────── 13 · DOS COMPRADORES: SE ACEPTA UNO
      const p13 = await nave("pau", "pone el Tejedor");
      await p13.js("document.querySelector('.nb-t[data-tab=\"botin\"]').click(); 1");
      await p13.hasta(`!!document.querySelector('[data-zoco-poner="${HT}"]')`, 15);
      await borraAviso(p13); await p13.js(`document.querySelector('[data-zoco-poner="${HT}"]').click(); 1`);
      await p13.hasta("!!document.querySelector('.neb-capa [data-si]')", 10);
      await p13.js("document.querySelector('.neb-capa [data-si]').click(); 1"); await avisoEs(p13, /ya está en el Zoco/);
      await cerrarTodas(p13);
      const L_HT = (await anuncioDe("pau", HT))[0];
      const q13 = await naveZoco("quim", "oferta 60"), r13 = await naveZoco("rut", "oferta 10 + Sylla");
      c("zoco · 13 · Quim oferta 60 ◈ por el Tejedor de Pau", (await ofertaUI(q13, L_HT, 60, [], "60 por el Tejedor")) === "ok");
      c("zoco · 13 · y Rut 10 ◈ + su Sylla", (await ofertaUI(r13, L_HT, 10, [CS], "")) === "ok");
      await avisoEs(q13, /Oferta enviada/); await avisoEs(r13, /Oferta enviada/); await cerrarTodas(q13, r13);
      const p13b = await nave("pau", "elige");
      await p13b.hasta("!!document.querySelector('.zoco-aviso')", 20);
      c("zoco · 13 · Pau entra: «tienes 2 tratos esperando» y la burbuja «2»", /2 tratos/i.test(await p13b.js("document.querySelector('.zoco-aviso').innerText"))
        && (await p13b.js("(document.querySelector('.nb-t[data-tab=\"zoco\"] .nb-badge')||{}).textContent")) === "2");
      await alZoco(p13b);
      c("zoco · 13 · y en el Zoco su Tejedor dice «2 ofertas»", /2 ofertas/i.test(await p13b.texto()));
      await p13b.foto(FOTOS + "/22-13-dos-ofertas.png");
      await pulsaTrato(p13b, "quim", "aceptar"); await p13b.hasta("!!document.querySelector('.neb-capa [data-si]')", 10);
      await p13b.js("document.querySelector('.neb-capa [data-si]').click(); 1");
      c("zoco · 13 · acepta la de Quim: «¡Trato hecho!»", await finEs(p13b, /Trato hecho/)); await seguir(p13b);
      const fQ13 = await ficha("quim"), fR13 = await ficha("rut"), fP13 = await ficha("pau");
      const T13r = await tratoDe(L_HT, "rut"), T13q = await tratoDe(L_HT, "quim");
      c("🔴 zoco · 13 · Quim se lleva el Tejedor y paga 60 (90 → 30); Pau cobra (150 → 210)", n(fQ13, HT) === 1 && fQ13.coins === 30 && n(fP13, HT) === 0 && fP13.coins === 210,
        fQ13.coins + " / " + fP13.coins);
      c("🔴 zoco · 13 · la oferta de Rut se cierra sola («vendido») y le vuelven sus 10 ◈ y su Sylla", T13r.estado === "vendido" && fR13.coins === 15 && n(fR13, CS) === 1, T13r.estado + " · " + fR13.coins);
      sinErrores("13", p13b); await cerrarTodas(p13b);
      const r13b = await naveZoco("rut", "se lo quedó otro");
      await r13b.js("var d=document.querySelector('.zoco details.cajon'); if(d) d.open=true; 1");
      c("zoco · 13 · Rut lo ve en su historial: «💰 Se lo quedó otro»", /Se lo quedó otro/i.test(await r13b.texto()));
      await cerrarTodas(r13b);
      await cuadra("13 · dos compradores");

      // ─────────────────────────────────────────── 14 · DOS «SÍ» A LA VEZ POR LO MISMO
      const o14 = await nave("olga", "dos síes"), p14 = await nave("pau", "dos síes"), q14 = await nave("quim", "dos síes");
      const L_CB2 = JSON.parse(await llama(o14, "zocoPoner", [P, [CB]])).anuncios[0];
      await llama(p14, "zocoOfertar", [L_CB2, { creditos: 10, piezas: [] }, ""]);
      await llama(q14, "zocoOfertar", [L_CB2, { creditos: 12, piezas: [] }, ""]);
      const T14p = await tratoDe(L_CB2, "pau"), T14q = await tratoDe(L_CB2, "quim");
      await llama(o14, "zocoResponder", [T14q._id, "contraofertar", { pide: { creditos: 15, piezas: [] } }]);
      const bran0 = QUIEN.length && (await Promise.all(QUIEN.map(ficha))).reduce((a, f) => a + n(f, CB), 0);
      // Olga acepta a Pau (paso 1) justo cuando Quim acepta la contraoferta (paso 2): el mismo Bran, dos síes
      const [rO, rQ] = await Promise.all([llama(o14, "zocoResponder", [T14p._id, "aceptar", {}]), llama(q14, "zocoResponder", [T14q._id, "aceptar", {}])]);
      const e14 = [(await trato(T14p._id)).estado, (await trato(T14q._id)).estado];
      c("🔴 zoco · 14 · dos «sí» a la vez por el mismo Bran: UNO se cierra y el otro no", e14.filter(x => x === "aceptado").length === 1 && e14.filter(x => /anulado|vendido/i.test(x)).length === 1,
        JSON.stringify(e14) + " · " + rO + " · " + rQ);
      const bran1 = (await Promise.all(QUIEN.map(ficha))).reduce((a, f) => a + n(f, CB), 0);
      c("🔴 zoco · 14 · y sigue habiendo los mismos Bran en la clase (" + bran0 + ")", bran1 === bran0, bran0 + " → " + bran1);
      sinErrores("14", o14, p14, q14); await cerrarTodas(o14, p14, q14);
      await cuadra("14 · dos síes a la vez");

      // ─────────────────────────────────────────── 15 · LA MISMA CARTA EN DOS OFERTAS A LA VEZ
      const o15 = await nave("olga", "pone dos"), p15 = await nave("pau", "dos ofertas a la vez");
      const [L_HE, L_CT2] = JSON.parse(await llama(o15, "zocoPoner", [P, [HE, CT]])).anuncios;
      const dosVeces = await Promise.all([llama(p15, "zocoOfertar", [L_HE, { creditos: 0, piezas: [CS] }, ""]), llama(p15, "zocoOfertar", [L_CT2, { creditos: 0, piezas: [CS] }, ""])]);
      c("🔴 zoco · 15 · Pau ofrece su ÚNICA Sylla en dos ofertas a la vez: una sale y la otra «Ya no tienes»",
        dosVeces.filter(x => !/ERROR/i.test(x)).length === 1 && dosVeces.filter(x => /Ya no tienes/i.test(x)).length === 1, JSON.stringify(dosVeces));
      c("zoco · 15 · y su Sylla está en UN solo trato", (await tratos()).filter(t => t.estado === "abierto" && (t.ofrece.piezas || []).indexOf(CS) >= 0 && t.compra.uid === F.pau._uid).length === 1);
      for (const t of (await tratos()).filter(t => t.estado === "abierto" && t.compra.uid === F.pau._uid)) await llama(p15, "zocoResponder", [t._id, "retirar", {}]);
      sinErrores("15", o15, p15); await cerrarTodas(o15, p15);
      await cuadra("15 · la misma carta dos veces");

      // ─────────────────────────────────────────── 16 · LO QUE TIENES PUESTO NO LO PUEDES OFRECER
      const r16 = await naveZoco("rut", "ofrece lo puesto");
      const L_RCS = JSON.parse(await llama(r16, "zocoPoner", [P, [CS]])).anuncios[0];
      const puesto16 = await llama(r16, "zocoOfertar", [L_HE, { creditos: 0, piezas: [CS] }, ""]);
      c("🔴 zoco · 16 · Rut no puede ofrecer su Sylla: la tiene puesta en el Zoco", /está puesto en el Zoco/i.test(puesto16), puesto16);
      await r16.js("document.querySelector('.nb-t[data-tab=\"nave\"]').click(); 1"); await alZoco(r16);
      // (lo puso por detrás de la pantalla: al volver al Zoco, este se pone al día solo)
      c("zoco · 16 · al volver a la pestaña, el Zoco se pone al día: su Sylla ya sale en «Lo tuyo»", await r16.hasta(`!!document.querySelector('[data-zretirar="${L_RCS}"]')`, 15));
      await r16.js(`document.querySelector('[data-zofertar="${L_HE}"]').click(); 1`); await r16.hasta("!!document.querySelector('.zoco-capa #zm-ok')", 10);
      const b16 = await r16.js(`(function(){ var b=document.querySelector('.zoco-capa .zm-p[data-p="${CS}"]'); return JSON.stringify({ off: b && b.disabled, t: b && b.innerText }); })()`);
      c("zoco · 16 · y en la ventana de oferta su Sylla sale apagada «ya en el Zoco»", /"off":true/i.test(b16) && /ya en el Zoco/i.test(b16), b16);
      await r16.foto(FOTOS + "/22-16-ya-en-el-zoco.png");
      await r16.js("document.querySelector('.zoco-capa [data-cerrar]').click(); 1");
      await llama(r16, "zocoRetirar", [L_RCS]);
      const libre16 = await llama(r16, "zocoOfertar", [L_HE, { creditos: 0, piezas: [CS] }, ""]);
      c("zoco · 16 · al retirarla del Zoco, ya puede ofrecerla", !/ERROR/i.test(libre16), libre16);
      const T16 = await tratoDe(L_HE, "rut"); await llama(r16, "zocoResponder", [T16._id, "retirar", {}]);
      sinErrores("16", r16); await cerrarTodas(r16);
      await cuadra("16 · lo puesto no se ofrece");

      // ─────────────────────────────────────────── 17 · LOS TOPES
      const q17 = await naveZoco("quim", "topes");
      await q17.js(`document.querySelector('[data-zofertar="${L_HE}"]').click(); 1`); await q17.hasta("!!document.querySelector('.zoco-capa #zm-cr')", 10);
      const max17 = await q17.js("document.querySelector('.zoco-capa #zm-cr').max");
      c("zoco · 17 · la casilla de créditos no deja poner más de lo que tiene (Quim, 30 ◈ por un héroe)", Number(max17) === Math.min(180, (await ficha("quim")).coins), max17);
      await q17.js("document.querySelector('.zoco-capa [data-cerrar]').click(); 1");
      // 3 ofertas abiertas a la vez
      const p17 = await nave("pau", "cuarto anuncio");
      const L_PX = JSON.parse(await llama(p17, "zocoPoner", [P, [HX]])).anuncios[0];
      const tres = [];
      for (const L of [L_HE, L_CT2, L_PX]) tres.push(await llama(q17, "zocoOfertar", [L, { creditos: 1, piezas: [] }, ""]));
      const L_OX = L_CN;   // la NEBULA que Olga sigue teniendo puesta
      const cuarta = await llama(q17, "zocoOfertar", [L_OX, { creditos: 1, piezas: [] }, ""]);
      c("zoco · 17 · como mucho 3 ofertas abiertas a la vez (la cuarta, no)", tres.every(x => !/ERROR/i.test(x)) && /Como mucho 3 ofertas/i.test(cuarta), JSON.stringify(tres) + " · " + cuarta);
      for (const t of (await tratos()).filter(t => t.estado === "abierto" && t.compra.uid === F.quim._uid)) await llama(q17, "zocoResponder", [t._id, "retirar", {}]);
      // 8 anuncios a la vez
      await cambia("olga", { inventory: (await ficha("olga")).inventory.concat([CB, CB, CB, CB, CB, CB, CB]) }); await reajusta();
      const o17 = await nave("olga", "nueve anuncios");
      const yaTiene = (await anuncios()).filter(a => a.estado === "abierto" && a.vende.uid === F.olga._uid).length;
      const ocho = await llama(o17, "zocoPoner", [P, Array(8 - yaTiene).fill(CB).slice(0, 7)]);
      const nueve = await llama(o17, "zocoPoner", [P, [CB]]);
      c("zoco · 17 · como mucho 8 cosas puestas a la vez", !/ERROR/i.test(ocho) && /Como mucho 8/i.test(nueve), yaTiene + " · " + ocho.slice(0, 80) + " · " + nueve);
      // mensaje de 300 letras → 140
      const larga = "x".repeat(300);
      await llama(p17, "zocoOfertar", [L_HE, { creditos: 1, piezas: [] }, larga]);
      const T17 = await tratoDe(L_HE, "pau");
      c("zoco · 17 · un mensaje larguísimo se guarda recortado a 140", T17 && T17.mensajes[0].texto.length === 140);
      await llama(p17, "zocoResponder", [T17._id, "retirar", {}]);
      // 3 trueques por pareja y semana
      const falsos = [];
      const cerrados = (await tratos()).filter(t => t.estado === "aceptado" && t.compra.uid === F.pau._uid && t.vende.uid === F.olga._uid).length;
      for (let i = cerrados; i < 3; i++) {
        const ref = fs.collection("stargate_tratos").doc(); falsos.push(ref);
        await ref.set({ projectId: P, anuncio: "falso", vende: { ficha: F.olga._id, uid: F.olga._uid, alias: "Olga Órbita" }, compra: { ficha: F.pau._id, uid: F.pau._uid, alias: "Pau Púlsar" },
          pieza: { id: CB, tipo: "cromo", clave: "P1_bran" }, ofrece: { creditos: 1, piezas: [] }, pagado: { creditos: 1, piezas: [] }, pide: null, paso: 1, turno: "vendedor",
          estado: "aceptado", mensajes: [], creado: Date.now(), actualizado: Date.now(), caduca: Date.now() + 864e5 });
      }
      const pareja = await llama(p17, "zocoOfertar", [L_OX, { creditos: 1, piezas: [] }, ""]);
      c("zoco · 17 · como mucho 3 trueques por semana entre la misma pareja (el cuarto, no)", /3 trueques esta semana/i.test(pareja), pareja);
      for (const ref of falsos) await ref.update({ actualizado: Date.now() - 8 * 864e5 });
      const pareja2 = await llama(p17, "zocoOfertar", [L_OX, { creditos: 1, piezas: [] }, ""]);
      c("zoco · 17 · y a la semana siguiente, vuelve a poder", !/ERROR/i.test(pareja2), pareja2);
      const T17b = await tratoDe(L_OX, "pau"); if (T17b) await llama(p17, "zocoResponder", [T17b._id, "retirar", {}]);
      for (const ref of falsos) await ref.delete();
      sinErrores("17", q17, p17, o17); await cerrarTodas(q17, p17, o17);
      await cuadra("17 · topes");

      // ─────────────────────────────────────────── 18 · CADUCIDAD (sin tareas programadas)
      const q18 = await nave("quim", "oferta y se olvida"), p18 = await nave("pau", "contraoferta que caduca");
      const cQ18 = (await ficha("quim")).coins;
      await llama(q18, "zocoOfertar", [L_CT2, { creditos: 7, piezas: [] }, ""]); await cerrarTodas(q18);
      const T18q = await tratoDe(L_CT2, "quim");
      await fs.collection("stargate_tratos").doc(T18q._id).update({ caduca: Date.now() - 864e5 });
      const q18b = await naveZoco("quim", "vuelve a los 8 días");
      c("🔴 zoco · 18 · un trato de hace 8 días: al abrir su Zoco se cierra solo «⌛ Caducó sin respuesta»", await q18b.hasta("/Caducó sin respuesta/i.test(document.body.innerText)", 25));
      c("🔴 zoco · 18 · y le vuelven sus 7 ◈", (await trato(T18q._id)).estado === "caducado" && (await ficha("quim")).coins === cQ18);
      await q18b.js("var d=document.querySelector('.zoco details.cajon'); if(d) d.open=true; 1"); await q18b.foto(FOTOS + "/22-18-caducado.png");
      await cerrarTodas(q18b);
      await llama(p18, "zocoOfertar", [L_HE, { creditos: 9, piezas: [] }, ""]);
      const T18p = await tratoDe(L_HE, "pau");
      const o18 = await nave("olga", "contraoferta y espera");
      await llama(o18, "zocoResponder", [T18p._id, "contraofertar", { pide: { creditos: 12, piezas: [] } }]);
      await fs.collection("stargate_tratos").doc(T18p._id).update({ caduca: Date.now() - 864e5 });
      const cP18 = (await ficha("pau")).coins;
      const q18c = await nave("quim", "usa el Zoco");
      await llama(q18c, "zocoOfertar", [L_CT2, { creditos: 1, piezas: [] }, ""]);   // cualquiera que use el Zoco cierra lo caducado
      c("zoco · 18 · una contraoferta sin respuesta en 7 días también caduca (en cuanto alguien usa el Zoco) y devuelve lo apartado",
        (await trato(T18p._id)).estado === "caducado" && (await ficha("pau")).coins === cP18 + 9);
      const T18z = await tratoDe(L_CT2, "quim"); if (T18z && T18z.estado === "abierto") await llama(q18c, "zocoResponder", [T18z._id, "retirar", {}]);
      await cerrarTodas(q18c);
      sinErrores("18", p18, o18); await cerrarTodas(p18, o18);
      await cuadra("18 · caducidad");

      // ─────────────────────────────────────────── 19 · QUIEN NO ES DEL GRUPO
      const fo = await nueva("Forastero en el Zoco");
      await fo.ir("entrar.html"); await fo.entrarComo("forastero@lab.test", "Forastero"); await fo.ir("recluta.html?per=" + P); await fo.hasta("!!(window.SG&&window.SG.MOTOR)", 20);
      c("🔴 zoco · 19 · alguien sin ficha en el grupo no puede ofertar", /No tienes ficha/i.test(await llama(fo, "zocoOfertar", [L_HE, { creditos: 5, piezas: [] }, ""])));
      c("zoco · 19 · ni poner nada", /No tienes ficha/i.test(await llama(fo, "zocoPoner", [P, [HX]])));
      c("zoco · 19 · ni leer tratos", /permission|insufficient/i.test(await fo.js(`window.SG.MOTOR.getDoc(window.SG.MOTOR.doc(window.SG.MOTOR.db,'stargate_tratos',${JSON.stringify(T2._id)})).then(function(){return 'LEYÓ'},function(e){return e.code||e.message})`)));
      await cerrarTodas(fo);

      // ─────────────────────────────────────────── 20 · LA DOCENTE: EL REGISTRO Y «DESHACER» (todo o nada)
      const rita = await nueva("Rita mira el Zoco");
      await rita.ir("entrar.html"); await rita.entrarComo("rita@lab.test", "Rita Referente");
      await rita.ir("consola.html?per=" + P); await rita.hasta("!!document.querySelector('.pest[data-tab=\"zoco\"]')", 25);
      await rita.js("document.querySelector('.pest[data-tab=\"zoco\"]').click(); 1");
      await rita.hasta("!!document.querySelector('.zoco-tabla')", 25);
      const filas = await rita.js("document.querySelectorAll('.zoco-tabla tbody tr').length"), nTratos = (await tratos()).length;
      c("zoco · 20 · la consola enseña TODOS los tratos del grupo (" + nTratos + ")", filas === nTratos, filas + " de " + nTratos);
      c("zoco · 20 · con sus mensajes («Súmale tu Eco», «Demasiado para mí»)", /Súmale tu Eco/i.test(await rita.texto()) && /Demasiado para mí/i.test(await rita.texto()));
      await rita.foto(FOTOS + "/22-20-consola-zoco.png");
      // deshacer el trueque del Tejedor (Pau → Quim): los dos conservan lo que recibieron
      const antesP = await ficha("pau"), antesQ = await ficha("quim");
      await rita.js("window.confirm=function(){return true}; 1");
      await rita.js(`document.querySelector('[data-deshacer-z="${T13q._id}"]').click(); 1`);
      c("zoco · 20 · «Deshacer» → «Deshecho: cada cosa ha vuelto a su dueño»", await rita.hasta("/Deshecho: cada cosa ha vuelto/i.test((document.getElementById('c-aviso')||{}).innerText||'')", 25),
        await rita.js("(document.getElementById('c-aviso')||{}).innerText||''"));
      const dP = await ficha("pau"), dQ = await ficha("quim");
      c("🔴 zoco · 20 · el Tejedor vuelve a Pau y los 60 ◈ a Quim", n(dP, HT) === n(antesP, HT) + 1 && dP.coins === antesP.coins - 60 && n(dQ, HT) === n(antesQ, HT) - 1 && dQ.coins === antesQ.coins + 60,
        dP.coins + " / " + dQ.coins);
      c("zoco · 20 · el trato queda «deshecho»", (await trato(T13q._id)).estado === "deshecho");
      await cuadra("20 · deshacer");
      // deshacer el del Bran (Quim compró a Olga pagando 30 ◈ + Eco) cuando Olga ya no tiene el Eco
      await cambia("olga", { inventory: (await ficha("olga")).inventory.filter(x => x !== HE) }); await reajusta();
      const antes20 = JSON.stringify([await ficha("olga"), await ficha("quim")].map(f => [f.coins, f.inventory.slice().sort()]));
      await rita.js("document.querySelector('.pest[data-tab=\"zoco\"]').click(); 1"); await rita.hasta("!!document.querySelector('.zoco-tabla')", 25);
      await rita.js(`document.querySelector('[data-deshacer-z="${T4._id}"]').click(); 1`);
      c("🔴 zoco · 20 · si Olga ya cambió el Eco, NO se deshace (si no, habría un Eco de la nada) y lo dice con su nombre",
        await rita.hasta("/No se puede deshacer[\\s\\S]*Olga Órbita ya no tiene «Eco/i.test((document.getElementById('c-aviso')||{}).innerText||'')", 25),
        await rita.js("(document.getElementById('c-aviso')||{}).innerText||''"));
      const despues20 = JSON.stringify([await ficha("olga"), await ficha("quim")].map(f => [f.coins, f.inventory.slice().sort()]));
      c("zoco · 20 · y no se ha tocado nada", antes20 === despues20);
      await rita.foto(FOTOS + "/22-20-no-se-puede-deshacer.png");
      const alu = await nave("pau", "intenta deshacer");
      c("zoco · 20 · un estudiante no puede deshacer", /profesorado/i.test(await llama(alu, "zocoDeshacer", [T2._id])));
      sinErrores("20", rita, alu); await cerrarTodas(rita, alu);
      await cuadra("20 · deshacer bloqueado");

      // ─────────────────────────────────────────── 21 · LA NAVE DEL COMANDANTE: EL ZOCO DE MENTIRA
      const docs0 = (await anuncios()).length + (await tratos()).length;
      const cm = await nueva("Rita en la Nave del Comandante");
      await cm.ir("entrar.html"); await cm.entrarComo("rita@lab.test", "Rita Referente");
      await cm.ir("recluta.html?simulacro=1&per=" + P + "&semana=6");
      await cm.hasta("!!document.querySelector('.nb-t[data-tab=\"zoco\"]')", 30);
      await cm.js("['c1','c2','c3','c4','c5','c6','c7'].forEach(function(k){localStorage.setItem('sgCap_" + P + "_'+k,'hecho')}); var c=document.querySelector('.neb-capa'); if(c) c.remove(); 1");
      await alZoco(cm);
      c("zoco · 21 · en la Nave del Comandante (semana 6) el Zoco sale con cosas de «otros reclutas»", await cm.hasta("document.querySelectorAll('[data-zofertar]').length>0", 15));
      const hayMio = await cm.js("document.getElementById('z-poner').click(); !!document.querySelector('.zoco-capa .zm-p:not([disabled])')");
      if (hayMio) {
        await cm.js("document.querySelector('.zoco-capa .zm-p:not([disabled])').click(); document.querySelector('.zoco-capa #zm-ok').click(); 1");
        c("zoco · 21 · el Comandante pone algo y a los segundos «otro recluta» le hace una oferta", await cm.hasta("!!document.querySelector('.zt.toca [data-zt=\"aceptar\"]')", 15));
        await cm.js("document.querySelector('.zt.toca [data-zt=\"aceptar\"]').click(); 1"); await cm.hasta("!!document.querySelector('.neb-capa [data-si]')", 10);
        await cm.js("document.querySelector('.neb-capa [data-si]').click(); 1");
        c("zoco · 21 · la acepta: «¡Trato hecho!»", await finEs(cm, /Trato hecho/)); await seguir(cm);
      } else c("zoco · 21 · el Comandante tiene algo que poner en el Zoco", false, "sin piezas en la ficha del simulacro");
      await cm.js("var b=document.querySelector('.zoco-capa [data-cerrar]'); if(b) b.click(); 1");
      const idS = await cm.js("(document.querySelector('[data-zofertar]')||{getAttribute:function(){return ''}}).getAttribute('data-zofertar')");
      const rS = await ofertaUI(cm, idS, 5, [], "");
      c("zoco · 21 · y oferta por lo de otro: le contraofertan solo (paso 2) y acepta", rS === "ok" && await cm.hasta("!!document.querySelector('.zt.toca [data-zt=\"aceptar\"]')", 15), rS);
      await cm.js("document.querySelector('.zt.toca [data-zt=\"aceptar\"]').click(); 1"); await cm.hasta("!!document.querySelector('.neb-capa [data-si]')", 10);
      await cm.js("document.querySelector('.neb-capa [data-si]').click(); 1");
      c("zoco · 21 · «¡Trato hecho!» también comprando", await finEs(cm, /Trato hecho/)); await seguir(cm);
      await cm.foto(FOTOS + "/22-21-simulacro-zoco.png");
      c("🔴 zoco · 21 · y en la base de datos no se ha escrito NADA", (await anuncios()).length + (await tratos()).length === docs0);
      sinErrores("21", cm); await cerrarTodas(cm);

      // ─────────────────────────────────────────── 22 · ANTES DE LA SEMANA 5, CERRADO
      const pref = fs.collection("projects").doc(P), sg0 = (await pref.get()).data().stargate;
      const hace2 = new Date(Date.now() - 15 * 864e5); hace2.setDate(hace2.getDate() - ((hace2.getDay() + 6) % 7));
      const ini3 = hace2.toISOString().slice(0, 10);
      await pref.update({ "stargate.inicio": ini3 });
      const o22 = await nueva("Olga en la semana 3");
      await o22.ir("entrar.html"); await o22.entrarComo("olga@lab.test", "Olga Prueba"); await sinBienvenidas(o22);
      await o22.ir("recluta.html?per=" + P); await o22.hasta("!!document.querySelector('.nb-t')", 30); await dormir(1500);
      c("zoco · 22 · en la semana 3 el servidor no deja poner nada («se abre en la semana 5»)", /semana 5/i.test(await llama(o22, "zocoPoner", [P, [CT]])));
      c("zoco · 22 · y la Nave no enseña la pestaña del Zoco", !(await o22.js("!!document.querySelector('.nb-t[data-tab=\"zoco\"]')")));
      await pref.update({ "stargate.capitulosAbiertos": { c5: true } });
      const r22 = await nueva("Rut en la semana 3");
      await r22.ir("entrar.html"); await r22.entrarComo("rut@lab.test", "Rut Prueba"); await r22.ir("recluta.html?per=" + P); await r22.hasta("!!(window.SG&&window.SG.MOTOR)", 20);
      const antes22 = await llama(r22, "zocoPoner", [P, [CS]]);
      c("zoco · 22 · si el referente abre el capítulo antes (capitulosAbiertos.c5), el servidor ya deja", !/ERROR/i.test(antes22), antes22);
      if (!/ERROR/i.test(antes22)) await llama(r22, "zocoRetirar", [JSON.parse(antes22).anuncios[0]]);
      await cerrarTodas(r22);
      await pref.update({ stargate: sg0 });
      await cerrarTodas(o22);
      await cuadra("22 · final");
    }
    // ============================================================ 23 · EL CALENDARIO DEL REFERENTE
    /**
     * Norberto: «algo fácil para ajustar fechas: en Navidad se retrasa una semana, o Semana Santa…
     * una página dedicada que se vea el calendario con posibilidad de mover o congelar una semana».
     * Rita congela una semana que viene, abre un capítulo antes, guarda, y se comprueba en la base de
     * datos que se ha movido TODO lo que cuelga de la semana (y nada de lo de antes). Luego lo deshace
     * y todo tiene que volver a sus fechas exactas.
     */
    if (hacer(23)) {
      const A = admin(), fs = A.firestore(), P = "lab-clase", SS = require("../motor/semanas.js");
      const pref = fs.collection("projects").doc(P);
      const foto = async () => {
        const pr = (await pref.get()).data().stargate;
        const rw = {}, cp = {};
        // (las ofertas de la semana no son del catálogo: tienen su propia ventana y el servidor crea la de cada semana al entrar alguien)
        (await fs.collection("rewards").where("projectId", "==", P).get()).docs.forEach(d => { if (d.data().inStore !== false && d.data().availableFrom != null && d.data().stargateTipo !== "oferta") rw[d.id] = [d.data().availableFrom, d.data().availableUntil, d.data().stargateTipo]; });
        (await fs.collection("campaigns").where("projectId", "==", P).get()).docs.forEach(d => { if (d.data().visibleFromTimestamp != null) cp[d.id] = d.data().visibleFromTimestamp; });
        return { S: pr, rw, cp };
      };
      const F0 = await foto(), S0 = F0.S;
      const semHoy = SS.semanaDelCurso(S0.inicio, S0.pausas || []);
      const futura = SS.inicioDeSemana(S0.inicio, semHoy + 2, S0.pausas || []);   // la semana que empieza dentro de dos
      const rita = await nueva("Rita y el calendario");
      await rita.ir("entrar.html"); await rita.entrarComo("rita@lab.test", "Rita Referente");
      await rita.ir("consola.html?per=" + P); await rita.hasta("!!document.querySelector('.pest[data-tab=\"calendario\"]')", 25);
      await rita.js("var x=document.querySelector('.tour-invite .tour-x, .tour-invite [data-cerrar]'); if(x) x.click(); document.querySelector('.pest[data-tab=\"calendario\"]').click(); 1");
      await rita.hasta("!!document.querySelector('.cal-tabla')", 20);
      const filas = await rita.js("document.querySelectorAll('.cal-tabla tbody tr').length");
      c("calendario · Rita ve las semanas del curso, una por fila (15 + la de canje)", filas === 16, String(filas));
      const filaHoy = await rita.js("(document.querySelector('.cal-tabla tr.cal-hoy')||{}).innerText||''");
      c("calendario · marca la de hoy («hoy»), que es la semana en la que va el grupo", new RegExp("Semana " + semHoy + "\\b").test(filaHoy) && /hoy/i.test(filaHoy), filaHoy);
      c("calendario · y dice qué se abre cada semana (planetas, capítulos, último día de retos y de canje)",
        /Planeta/.test(await rita.texto()) && /Último día para registrar retos/.test(await rita.texto()) && /Último día para canjear/.test(await rita.texto()));
      c("calendario · lo pasado no se toca: ni la semana de hoy ni las de antes tienen «Congelar»",
        await rita.js("[].slice.call(document.querySelectorAll('.cal-tabla tr.cal-pasada, .cal-tabla tr.cal-hoy')).every(function(t){return !t.querySelector('[data-cal-pausa]')})"));
      await rita.foto(FOTOS + "/23-calendario.png");
      // congelar la semana de dentro de dos
      c("calendario · la semana del " + futura + " tiene su botón «⏸️ Congelar»", await rita.js(`!!document.querySelector('[data-cal-pausa="${futura}"]')`));
      await rita.js(`document.querySelector('[data-cal-pausa="${futura}"]').click(); 1`);
      await rita.hasta("!!document.getElementById('cal-guardar')", 10);
      const resumen = await rita.js("document.querySelector('.cal-guardar').innerText");
      c("🔴 calendario · antes de guardar, dice lo que cambia: se congela esa semana y los cierres se retrasan una semana",
        /Se congela la semana/.test(resumen) && /Registrar retos: hasta el/.test(resumen) && /Canjear: hasta el/.test(resumen), resumen);
      c("calendario · y la fila sale como «⏸️ Congelada», con las de detrás renumeradas", await rita.js(`(function(){ var b=document.querySelector('[data-cal-sigue="${futura}"]'); return !!b && /Congelada/.test(b.closest('tr').innerText); })()`));
      await rita.foto(FOTOS + "/23-calendario-congelada.png");
      c("calendario · sin pulsar «Guardar» no se ha tocado nada", JSON.stringify((await pref.get()).data().stargate.pausas || []) === JSON.stringify(S0.pausas || []));
      // y abrir antes el Arsenal (capítulo 6, semana 15)
      await rita.js("var b=document.querySelector('[data-cal-abre=\"c7\"]'); if(b) b.click(); 1");
      await rita.hasta("/Se abre YA/.test(document.querySelector('.cal-guardar').innerText)", 10);
      await rita.js("document.getElementById('cal-guardar').click(); 1");
      c("calendario · «Guardar» → «Calendario guardado: N fechas recalculadas»", await rita.hasta("/Calendario guardado: \\d+ fechas/.test((document.getElementById('c-aviso')||{}).innerText||'')", 25),
        await rita.js("(document.getElementById('c-aviso')||{}).innerText||''"));
      const F1 = await foto(), S1 = F1.S;
      c("🔴 calendario · el grupo guarda la pausa y el capítulo abierto", JSON.stringify(S1.pausas) === JSON.stringify([futura]) && S1.capitulosAbiertos && Number(S1.capitulosAbiertos.c7) === semHoy,
        JSON.stringify([S1.pausas, S1.capitulosAbiertos]));
      const ses = await nueva("Rita proyecta la semana en que abrió el Arsenal");
      await ses.ir("entrar.html"); await ses.entrarComo("rita@lab.test", "Rita Referente");
      await ses.ir("sesion.html?per=" + P + "&sem=" + semHoy); await ses.hasta("document.querySelectorAll('.barra-pasos .p').length>0", 25);
      await ses.hasta("[].slice.call(document.querySelectorAll('.barra-pasos .p')).some(function(b){return b.getAttribute('title')==='Lo nuevo'})", 20);
      // (solo se pinta la diapositiva en pantalla: se pulsa cada «Lo nuevo» y se lee lo que sale)
      const loNuevo = await ses.js("(function(){ var t=''; [].slice.call(document.querySelectorAll('.barra-pasos .p')).forEach(function(b){ if(b.getAttribute('title')==='Lo nuevo'){ b.click(); var d=document.querySelector('.lienzo .dia.nuevo-nave'); t+=(d?d.textContent:'')+' | '; } }); return t; })()");
      c("calendario · la sesión proyectada de ESTA semana presenta el Arsenal abierto antes de tiempo («Lo nuevo»)", /Arsenal/.test(loNuevo), loNuevo.slice(0, 200));
      await ses.cerrar();
      c("🔴 calendario · el cierre de retos y el de canje, una semana más tarde", S1.cierre === SS.masDias(S0.cierre, 7) && S1.cierreCanje === SS.masDias(S0.cierreCanje, 7),
        S0.cierre + "→" + S1.cierre + " · " + S0.cierreCanje + "→" + S1.cierreCanje);
      const lim = new Date(futura + "T00:00:00").getTime(), hoyMs = SS.fecha(new Date()).getTime();
      const esSorteo = k => /__sorteo/.test(k);
      const malR = Object.keys(F0.rw).filter(k => !esSorteo(k)).filter(k => {
        const [d0, u0, tipo] = F0.rw[k], [d1, u1] = F1.rw[k];
        const esperado = tipo === "nota" ? Math.min(d0 < lim ? d0 : new Date(SS.masDias(SS.iso(d0), 7) + "T00:00:00").getTime(), hoyMs)
                                        : d0 < lim ? d0 : new Date(SS.masDias(SS.iso(d0), 7) + "T00:00:00").getTime();
        return d1 !== esperado || u1 !== new Date(S1.cierreCanje + "T00:00:00").getTime();
      });
      c("🔴 calendario · el Mercado: lo de antes de la pausa igual, lo de después una semana más tarde, y el Arsenal ya a la venta", malR.length === 0 && Object.keys(F0.rw).length > 5,
        malR.map(k => k.split("__")[1] + ":" + SS.iso(F0.rw[k][0]) + "→" + SS.iso(F1.rw[k][0])).join(" "));
      const kS = Object.keys(F0.rw).filter(esSorteo)[0];
      c("🔴 calendario · el Gran Sorteo: se sigue vendiendo desde su semana (antes de la pausa) y se sortea una semana más tarde",
        !!kS && F1.rw[kS][0] === F0.rw[kS][0] && F1.rw[kS][1] === new Date(SS.masDias(SS.iso(F0.rw[kS][1]), 7) + "T00:00:00").getTime(),
        kS + " · " + (kS ? SS.iso(F0.rw[kS][1]) + "→" + SS.iso(F1.rw[kS][1]) : ""));
      const malC = Object.keys(F0.cp).filter(k => F1.cp[k] !== (F0.cp[k] < lim ? F0.cp[k] : new Date(SS.masDias(SS.iso(F0.cp[k]), 7) + "T00:00:00").getTime()));
      c("calendario · los planetas: los que vienen detrás de la pausa, una semana más tarde", malC.length === 0 && Object.keys(F0.cp).length > 3, malC.join(","));
      // la Nave de una alumna: la semana de hoy no cambia (la pausa es futura) y el Arsenal ya se ve
      if (!(await fichaDe("tea@lab.test", P))) { const alta = await nueva("Tea se alista"); await alistar(alta, "tea@lab.test", "Tea Prueba", "Tea Tempo", 0); await alta.cerrar(); }
      const ana = await nueva("Tea con el calendario nuevo");
      await ana.ir("entrar.html"); await ana.entrarComo("tea@lab.test", "Tea Prueba"); await sinBienvenidas(ana);
      await ana.ir("recluta.html?per=" + P); await ana.hasta("!!document.querySelector('.nb-t[data-tab=\"mercado\"]')", 30);
      c("calendario · la Nave de Tea sigue en la semana de hoy (congelar el futuro no mueve el presente)", new RegExp("Semana " + semHoy + " de").test(await ana.texto()));
      await ana.js("document.querySelector('.nb-t[data-tab=\"mercado\"]').click(); 1"); await dormir(1500);
      c("🔴 calendario · y en su Mercado ya está el Arsenal (abierto antes de tiempo)", /Subir 0,5 en un entregable/.test(await ana.js("[].slice.call(document.querySelectorAll('.nave-rec .rec-card h3')).map(function(h){return h.textContent}).join(' | ')")),
        await ana.js("[].slice.call(document.querySelectorAll('.nave-rec .rec-card h3')).map(function(h){return h.textContent}).join(' | ')"));
      await ana.foto(FOTOS + "/23-tea-arsenal.png");
      await ana.cerrar();
      // una semana congelada HOY (se fuerza en la base de datos: desde la consola no se puede)
      const hoyIni = SS.inicioDeSemana(S1.inicio, semHoy, S1.pausas);
      await pref.update({ "stargate.pausas": [hoyIni].concat(S1.pausas) });
      const ana2 = await nueva("Tea en una semana congelada");
      await ana2.ir("entrar.html"); await ana2.entrarComo("tea@lab.test", "Tea Prueba"); await sinBienvenidas(ana2);
      await ana2.ir("recluta.html?per=" + P); await ana2.hasta("!!document.querySelector('.nb-t')", 30); await dormir(1200);
      const t2 = await ana2.texto();
      c("🔴 calendario · en una semana congelada la Nave se queda en la de antes y dice «Semana de pausa» y cuándo vuelve",
        new RegExp("Semana " + (semHoy - 1) + " de").test(t2) && /Semana de pausa/.test(t2) && new RegExp("la semana " + semHoy + " empieza el").test(t2), t2.slice(0, 400));
      await ana2.foto(FOTOS + "/23-tea-pausa.png");
      await ana2.cerrar();
      await pref.update({ "stargate.pausas": S1.pausas });
      // deshacerlo todo desde el calendario: descongelar y devolver el Arsenal a su semana
      await rita.js("document.querySelector('.pest[data-tab=\"calendario\"]').click(); 1"); await rita.hasta("!!document.querySelector('.cal-tabla')", 20);
      await rita.js(`document.querySelector('[data-cal-sigue="${futura}"]').click(); 1`); await dormir(300);
      await rita.js("var b=document.querySelector('[data-cal-cierra=\"c7\"]'); if(b) b.click(); 1"); await dormir(300);
      await rita.js("document.getElementById('cal-guardar').click(); 1");
      await rita.hasta("/Calendario guardado/.test((document.getElementById('c-aviso')||{}).innerText||'')", 25);
      const F2 = await foto();
      c("🔴 calendario · al deshacerlo, TODAS las fechas vuelven exactamente a las de antes",
        JSON.stringify(F2.rw) === JSON.stringify(F0.rw) && JSON.stringify(F2.cp) === JSON.stringify(F0.cp) && F2.S.cierre === S0.cierre && F2.S.cierreCanje === S0.cierreCanje
        && (F2.S.pausas || []).length === 0 && !(F2.S.capitulosAbiertos || {}).c7);
      // Ajustes ya no mueve la fecha a medias: manda al calendario
      await rita.js("document.querySelector('.pest[data-tab=\"ajustes\"]').click(); 1"); await rita.hasta("!!document.getElementById('s-guardar')", 15);
      c("calendario · en «Ajustes» ya no se cambia la semana 1 (solo se ve) y un botón lleva al calendario",
        !(await rita.js("!!document.getElementById('s-inicio')")) && await rita.js("!!document.querySelector('#c-cuerpo [data-tab=\"calendario\"]')"));
      await rita.js("document.querySelector('#c-cuerpo [data-tab=\"calendario\"]').click(); 1");
      c("calendario · …y lleva", await rita.hasta("!!document.querySelector('.cal-tabla')", 10));
      c("calendario · sin errores en la consola", !rita.errores.filter(e => !/Failed to load resource/.test(e)).length, rita.errores[0] || "");
      await rita.cerrar();
      // quien solo imparte no ve el calendario
      const dani = await nueva("Dani sin calendario");
      await dani.ir("entrar.html"); await dani.entrarComo("dani@lab.test", "Dani Docente");
      await dani.ir("consola.html?per=" + P); await dani.hasta("document.querySelectorAll('.pestanas .pest').length>0", 25);
      c("calendario · un docente que solo imparte no tiene la pestaña «Calendario»", !(await dani.js("!!document.querySelector('.pest[data-tab=\"calendario\"]')")));
      await dani.cerrar();
    }
    // ============================================================ 24 · EMPEZAR DE CERO: BORRAR UN GRUPO DE PRUEBA
    /**
     * Norberto: «elimina entonces todo lo viejo, empezamos de cero». Borrar datos de producción lo
     * hace él, así que se le da un BOTÓN (en «Ajustes», escribiendo el nombre del grupo). Aquí se crea
     * un grupo, se llena (un alumno con su alias, restos del Zoco) y se borra; y se comprueba que no
     * queda NADA suyo… y que el resto de grupos sigue intacto.
     */
    if (hacer(24)) {
      const A = admin(), fs = A.firestore();
      const cuenta = async (col, per) => (await fs.collection(col).where("projectId", "==", per).get()).size;
      const COLS = ["missions", "rewards", "campaigns", "student_profiles", "stargate_alias", "stargate_zoco", "stargate_tratos"];
      const labAntes = {}; for (const col of COLS) labAntes[col] = await cuenta(col, "lab-clase");
      const nor = await nueva("Norberto crea un grupo para borrarlo");
      await nor.ir("entrar.html"); await nor.entrarComo("n.cuartero.10@gmail.com", "Norberto Cuartero");
      await nor.ir("crear.html");
      await nor.hasta("!!document.getElementById('f-nombre') && !!document.getElementById('btn-crear')", 25);
      const NOMBRE = "PRUEBA · borrar", hoy = new Date().toISOString().slice(0, 10);
      await nor.js(`(function(){ var n=document.getElementById('f-nombre'); n.value=${JSON.stringify(NOMBRE)}; n.dispatchEvent(new Event('input',{bubbles:true}));
        var f=document.getElementById('f-inicio'); f.value=${JSON.stringify(hoy)}; f.dispatchEvent(new Event('input',{bubbles:true})); f.dispatchEvent(new Event('change',{bubbles:true})); return 1; })()`);
      await dormir(500); await nor.js("document.getElementById('btn-crear').click(); 1");
      c("borrar · Norberto crea «PRUEBA · borrar»", await nor.hasta("/Grupo listo/.test(document.body.innerText)", 60));
      const codigo = await nor.js("(document.querySelector('.codigo-grande')||{}).textContent||''");
      const id = await nor.js("(document.querySelector('a[href^=\"consola.html?per=\"]')||{getAttribute:function(){return ''}}).getAttribute('href').split('per=')[1]||''");
      // un alumno se alista (queda su alias reservado) y hay restos del Zoco
      const al = await nueva("alumno del grupo que se borra");
      await al.ir("alistarse.html?per=" + id + "&codigo=" + codigo); await al.entrarComo("borrable@lab.test", "Borja Prueba");
      await al.hasta("!!document.querySelector('#a-enviar')", 25);
      await al.js(`(function(){ document.querySelector('#a-nombre').value='Borja'; document.querySelector('#a-apellidos').value='Prueba';
        document.querySelector('#a-alias').value='Borja Bólido'; var r=document.querySelector('input[name=cmd]'); if(r) r.checked=true; return 1; })()`);
      await al.js("document.querySelector('#a-enviar').click(); 1"); await al.hasta("!document.querySelector('#a-enviar')", 25); await al.cerrar();
      const fB = await fichaDe("borrable@lab.test", id);
      await fs.collection("stargate_zoco").add({ projectId: id, estado: "abierto", vende: { ficha: fB ? fB._id : "", uid: fB ? fB._uid : "", alias: "Borja Bólido" },
        pieza: { id: id + "__cromo_P1_bran", tipo: "cromo", clave: "P1_bran" }, creado: Date.now(), ofertas: 0 });
      await fs.collection("stargate_tratos").add({ projectId: id, estado: "abierto", anuncio: "x", vende: { uid: "a" }, compra: { uid: "b" }, creado: Date.now() });
      const lleno = {}; for (const col of COLS) lleno[col] = await cuenta(col, id);
      c("borrar · el grupo está lleno: retos, Mercado, un alumno, su alias y restos del Zoco",
        !!id && lleno.missions > 10 && lleno.rewards > 5 && lleno.student_profiles === 1 && lleno.stargate_alias === 1 && lleno.stargate_zoco === 1 && lleno.stargate_tratos === 1, JSON.stringify(lleno));
      // el botón, en Ajustes
      await nor.ir("consola.html?per=" + id); await nor.hasta("!!document.querySelector('.pest[data-tab=\"ajustes\"]')", 25);
      await nor.js("document.querySelector('.pest[data-tab=\"ajustes\"]').click(); 1"); await nor.hasta("!!document.getElementById('s-borrar')", 15);
      c("borrar · en «Ajustes» está «Borrar este grupo», apagado hasta escribir el nombre", await nor.js("document.getElementById('s-borrar').disabled"));
      await nor.js("var i=document.getElementById('s-borrar-nombre'); i.value='PRUEBA'; i.dispatchEvent(new Event('input')); 1");
      c("borrar · con el nombre a medias, sigue apagado", await nor.js("document.getElementById('s-borrar').disabled"));
      await nor.js(`var i=document.getElementById('s-borrar-nombre'); i.value=${JSON.stringify(NOMBRE)}; i.dispatchEvent(new Event('input')); 1`);
      c("borrar · con el nombre exacto, se enciende", !(await nor.js("document.getElementById('s-borrar').disabled")));
      await nor.foto(FOTOS + "/24-borrar-grupo.png");
      await nor.js("window.confirm=function(){return true}; document.getElementById('s-borrar').click(); 1");
      c("borrar · vuelve a «Mis grupos» diciendo que se ha borrado", await nor.hasta("location.search.indexOf('borrado=')>=0 && /borrado/i.test(document.body.innerText)", 60),
        await nor.js("location.href") + " · " + (await nor.texto()).slice(0, 200));
      await nor.foto(FOTOS + "/24-borrado.png");
      const queda = {}; for (const col of COLS) queda[col] = await cuenta(col, id);
      c("🔴 borrar · del grupo no queda NADA (tampoco su alias ni el Zoco)", COLS.every(col => queda[col] === 0) && !(await leerDoc("projects/" + id)), JSON.stringify(queda));
      const labDespues = {}; for (const col of COLS) labDespues[col] = await cuenta(col, "lab-clase");
      c("🔴 borrar · y los demás grupos siguen intactos", JSON.stringify(labAntes) === JSON.stringify(labDespues), JSON.stringify([labAntes, labDespues]));
      // lo que no se puede
      const dani = await nueva("Dani intenta borrar");
      await dani.ir("entrar.html"); await dani.entrarComo("dani@lab.test", "Dani Docente"); await dani.ir("consola.html?per=lab-clase"); await dani.hasta("!!(window.SG&&window.SG.MOTOR)", 20);
      const noDani = await dani.js("window.SG.MOTOR.llamar('deleteProject',{projectId:'lab-clase'}).then(function(){return 'BORRÓ'},function(e){return e.message})");
      c("🔴 borrar · un docente que no es el dueño no puede borrar un grupo (el servidor se niega)", !/BORRÓ/.test(noDani) && !!(await leerDoc("projects/lab-clase")), noDani);
      await fs.collection("projects").doc("demo-lab").set({ name: "Demo", teacherId: "sembrado", ownerId: "sembrado", coTeacherEmails: ["n.cuartero.10@gmail.com"], stargate: { version: 1, demoSemana: 10, inicio: hoy } });
      const noDemo = await nor.js("window.SG.MOTOR.llamar('deleteProject',{projectId:'demo-lab'}).then(function(){return 'BORRÓ'},function(e){return e.message})");
      c("🔴 borrar · el grupo de la demostración pública no se borra desde aquí", /demostración/.test(noDemo) && !!(await leerDoc("projects/demo-lab")), noDemo);
      await fs.collection("projects").doc("demo-lab").delete();
      c("borrar · sin errores en la consola", !nor.errores.filter(e => !/Failed to load resource/.test(e)).length, nor.errores[0] || "");
      await nor.cerrar(); await dani.cerrar();
    }
    // ============================================================ 25 · EL GRAN SORTEO
    /**
     * Norberto: «quiero dar más poderes al profe referente para dinamizar las clases… el sorteo de dos
     * licencias de Genially de año completo, a partir de la semana 6: que los estudiantes puedan
     * comprar participaciones y el profe regalarlas, o que el referente embeba participaciones».
     * Cuatro reclutas: una compra por la pantalla hasta el tope, otro compra dos, la docente regala en
     * clase, un enlace da participaciones; la referente lo proyecta y lo sortea el SERVIDOR.
     */
    if (hacer(25)) {
      const A = admin(), fs = A.firestore(), P = "lab-clase";
      const T = P + "__sorteo1", PREMIO = P + "__premio_sorteo1";
      const GENTE = { sara: ["sara@lab.test", "Sara Prueba", "Sara Saturno", 0], iker: ["iker@lab.test", "Iker Prueba", "Íker Ícaro", 1],
                      lola: ["lola@lab.test", "Lola Prueba", "Lola Luna", 0], mateo: ["mateo@lab.test", "Mateo Prueba", "Mateo Marte", 1] };
      for (const k of Object.keys(GENTE)) {
        const [correo, nombre, alias, cmd] = GENTE[k];
        for (let i = 0; i < 2 && !(await fichaDe(correo, P)); i++) { const a = await nueva("Alta " + nombre); await alistar(a, correo, nombre, alias, cmd); await a.cerrar(); }
      }
      const F = {}; for (const k of Object.keys(GENTE)) F[k] = await fichaDe(GENTE[k][0], P);
      c("sorteo · cuatro reclutas (uno con alias «Íker Ícaro»: mayúscula con tilde)", Object.keys(F).every(k => F[k] && F[k].displayName === GENTE[k][2]),
        JSON.stringify(Object.keys(F).map(k => F[k] && F[k].displayName)));
      for (const k of Object.keys(F)) await fs.collection("student_profiles").doc(F[k]._id).update({ coins: 300 });
      const ficha = k => fichaDe(GENTE[k][0], P);
      const papeletas = f => Number(((f && f.lotteryEntries) || {})[T] || 0);
      const trato25 = async id => (await consultar("stargate_tratos", "projectId", P)).filter(t => t._id === id)[0];
      const ticket = async () => (await fs.collection("rewards").doc(T).get()).data();
      c("sorteo · el grupo nace con el Gran Sorteo: la participación (20 ◈, sin tope por persona) apunta a su premio (2 licencias)",
        (await ticket()).systemEffect === "lottery_ticket" && (await ticket()).linkedItemId === PREMIO && (await ticket()).cost === 20 && (await ticket()).maxPerUser == null
        && (await fs.collection("rewards").doc(PREMIO).get()).data().globalStock === 2);
      const naveDe = async (k, nota, tab) => {
        const [correo, nombre] = GENTE[k], q = await nueva(nombre.split(" ")[0] + " · " + nota);
        await q.ir("entrar.html"); await q.entrarComo(correo, nombre); await sinBienvenidas(q);
        await q.ir("recluta.html?per=" + P); await q.hasta("!!document.querySelector('.nb-t[data-tab=\"mercado\"]')", 30);
        if (tab) { await q.js("document.querySelector('.nb-t[data-tab=\"" + tab + "\"]').click(); 1"); await dormir(1200); }
        return q;
      };
      const compra = (q, k) => q.js(`window.SG.MOTOR.llamar('purchaseReward',{projectId:'${P}',rewardId:'${T}',studentProfileId:'${F[k]._id}'}).then(function(){return 'OK'},function(e){return 'ERROR '+e.message})`, 60000);

      // 1 · Sara compra por la pantalla
      const s1 = await naveDe("sara", "compra", "mercado");
      c("🔴 sorteo · en el Mercado de la semana 10 está la tarjeta del Gran Sorteo con la licencia", await s1.hasta("!!document.querySelector('.rec-card.sorteo') && /Licencia de Genially/.test(document.querySelector('.rec-card.sorteo').innerText)", 20));
      c("sorteo · dice cuándo se sortea (solo), cuántos ganan y cuántas llevas («Llevas 0»)", /se sortea solo el/i.test(await s1.js("document.querySelector('.rec-card.sorteo').innerText"))
        && /2 ganadores/i.test(await s1.js("document.querySelector('.rec-card.sorteo').innerText")) && /Llevas 0/.test(await s1.js("document.querySelector('.rec-card.sorteo').innerText")));
      await s1.foto(FOTOS + "/25-mercado-sorteo.png");
      await s1.js("document.querySelector('.rec-card.sorteo [data-canje]').click(); 1");
      await s1.hasta("!!document.querySelector('.neb-capa [data-si]')", 10);
      await s1.js("document.querySelector('.neb-capa [data-si]').click(); 1");
      // (la PREGUNTA ya dice «una participación del Gran Sorteo»: se espera a la ENTREGA, que explica qué es)
      c("sorteo · NEBULA lo entrega: «Una participación del Gran Sorteo… es una papeleta más»", await s1.hasta("/papeleta más/i.test((document.querySelector('.neb-capa')||{}).innerText||'')", 30),
        await s1.js("(document.querySelector('.neb-capa')||{}).innerText||''"));
      await s1.foto(FOTOS + "/25-participacion-entregada.png");
      const fS1 = await ficha("sara");
      c("🔴 sorteo · la papeleta está en su ficha (1) y le han cobrado 20 ◈", papeletas(fS1) === 1 && fS1.coins === 280, papeletas(fS1) + " · " + fS1.coins);
      await s1.js("var b=document.querySelector('.neb-capa [data-cerrar]'); if(b) b.click(); 1"); await dormir(1500);
      c("sorteo · y la tarjeta ya dice «Llevas 1»", await s1.hasta("/Llevas 1 participación/.test((document.querySelector('.rec-card.sorteo')||{}).innerText||'')", 15));
      // sin tope por persona (Norberto: «igual alguien apuesta todo su dinero a por la licencia»)
      for (let i = 0; i < 9; i++) await compra(s1, "sara");
      const once = await compra(s1, "sara");
      const fS2 = await ficha("sara");
      c("🔴 sorteo · sin tope por persona: Sara compra 11 (y paga las 11)", papeletas(fS2) === 11 && !/ERROR/.test(once) && fS2.coins === 80, papeletas(fS2) + " · " + fS2.coins + " · " + once);
      await s1.cerrar();
      const s2 = await naveDe("sara", "sin tope", "mercado");
      c("sorteo · y su tarjeta sigue ofreciendo comprar, sin «como mucho»", await s2.hasta("/Llevas 11 participaciones/.test((document.querySelector('.rec-card.sorteo')||{}).innerText||'') && !!document.querySelector('.rec-card.sorteo [data-canje]') && !/como mucho/.test(document.querySelector('.rec-card.sorteo').innerText)", 15));
      await s2.cerrar();
      // Íker compra dos
      const i1 = await naveDe("iker", "compra dos");
      await compra(i1, "iker"); await compra(i1, "iker");
      c("sorteo · Íker compra dos", papeletas(await ficha("iker")) === 2);
      const intentoS = await i1.js(`window.SG.MOTOR.sortear('${P}','${T}').then(function(){return 'SORTEÓ'},function(e){return e.message})`);
      c("🔴 sorteo · un estudiante NO puede sortear (15-sep: lo sortea el referente)", !/SORTEÓ/.test(intentoS) && /referente/i.test(intentoS), intentoS);
      c("🔴 sorteo · ni darse participaciones a sí mismo desde la consola del navegador",
        !/ESCRIBIÓ/.test(await i1.js(`window.SG.MOTOR.updateDoc(window.SG.MOTOR.doc(window.SG.MOTOR.db,'student_profiles','${F.iker._id}'),{'lotteryEntries.${T}':50}).then(function(){return 'ESCRIBIÓ'},function(e){return e.code||e.message})`)));
      await i1.cerrar();

      // 2 · la docente regala en clase (el aula) y la referente esconde participaciones en un enlace
      const rita = await nueva("Rita y el sorteo");
      await rita.ir("entrar.html"); await rita.entrarComo("rita@lab.test", "Rita Referente");
      await rita.ir("aula.html?per=" + P); await rita.hasta("!!(window.SG&&window.SG.MOTOR)", 20); await dormir(2500);
      await rita.js("var b=[].slice.call(document.querySelectorAll('[data-au]')).filter(function(x){return x.getAttribute('data-au')==='premios'})[0]; if(b) b.click(); 1");
      c("sorteo · en el aula, «Premiar» tiene la fila 🎟️ Sorteo (1, 2 o 3 participaciones)", await rita.hasta("document.querySelectorAll('.au-pr[data-k^=\"part\"]').length===3", 15));
      await rita.foto(FOTOS + "/25-aula-regalar.png");
      const regalo = await rita.js(`window.SG.MOTOR.regalarEnClase('${P}',['${F.lola._id}','${F.mateo._id}'],{tipo:'participacion',sorteo:'${T}',n:3}).then(function(r){return JSON.stringify(r)},function(e){return 'ERROR '+e.message})`, 60000);
      c("🔴 sorteo · la docente regala 3 a Lola y 3 a Mateo", papeletas(await ficha("lola")) === 3 && papeletas(await ficha("mateo")) === 3, regalo);
      const huevos = await rita.js(`window.SG.MOTOR.huevosDe('${P}').then(function(h){return JSON.stringify(h)})`);
      const lista = JSON.parse(huevos || "[]").concat([{ id: "sorteo-lab", nombre: "Dos papeletas escondidas", premio: "participaciones", sorteo: T, cantidad: 2, activo: true, limite: 0, porEscuadron: 0 }]);
      await rita.js(`window.SG.MOTOR.guardarHuevos('${P}', ${JSON.stringify(lista)}).then(function(){return 'OK'})`, 60000);
      const m1 = await nueva("Mateo encuentra el enlace");
      await m1.ir("huevo.html?h=sorteo-lab&per=" + P); await m1.entrarComo("mateo@lab.test", "Mateo Prueba");
      await m1.ir("huevo.html?h=sorteo-lab&per=" + P); await m1.hasta("!!document.getElementById('hv-abrir')", 25);
      await m1.js("document.getElementById('hv-abrir').click(); 1");
      c("🔴 sorteo · un enlace de «Premios por enlace» da 2 participaciones («+2 participaciones»)", await m1.hasta("/\\+2 participaciones/.test(document.body.innerText)", 25), (await m1.texto()).slice(0, 200));
      await m1.foto(FOTOS + "/25-enlace-participaciones.png");
      c("sorteo · …y se suman a su ficha (3 + 2 = 5)", papeletas(await ficha("mateo")) === 5);
      await m1.ir("huevo.html?h=sorteo-lab&per=" + P); await m1.hasta("/ya lo tenías/i.test(document.body.innerText)", 20);
      c("sorteo · el mismo enlace otra vez: «Este ya lo tenías» (y no suma)", papeletas(await ficha("mateo")) === 5);
      await m1.cerrar();

      // 2b · LA REVENTA EN EL ZOCO (Norberto: «debes permitir también añadir al Zoco participaciones»)
      const llamaZ = (q, fn, args) => q.js(`window.SG.MOTOR.${fn}(${args.map(a => JSON.stringify(a)).join(",")}).then(function(r){return JSON.stringify(r)},function(e){return "ERROR " + e.message})`, 60000);
      const s3 = await naveDe("sara", "revende", "mercado");
      c("🔴 reventa · en la tarjeta del sorteo, «🔄 Revender una en el Zoco»", await s3.hasta(`!!document.querySelector('.rec-card.sorteo [data-zoco-poner="${T}"]')`, 15));
      await s3.js(`document.querySelector('.rec-card.sorteo').scrollIntoView({block:'center'}); 1`); await s3.foto(FOTOS + "/25-revender.png");
      await s3.js(`document.querySelector('.rec-card.sorteo [data-zoco-poner="${T}"]').click(); 1`);
      await s3.hasta("!!document.querySelector('.neb-capa [data-si]')", 10);
      c("reventa · NEBULA pregunta «¿Pongo «Participación · Licencia de Genially…» en el Zoco?»", /Participación · Licencia de Genially/i.test(await s3.js("document.querySelector('.neb-capa').innerText")));
      await s3.js("document.querySelector('.neb-capa [data-si]').click(); 1");
      await s3.hasta("/ya está en el Zoco/i.test((document.getElementById('nave-aviso')||{}).innerText||'')", 25);
      const anunciosP = async () => (await consultar("stargate_zoco", "projectId", P)).filter(a => a.estado === "abierto" && a.pieza.id === T);
      await llamaZ(s3, "zocoPoner", [P, [T, T]]);
      c("🔴 reventa · Sara pone 3 participaciones en el Zoco, y siguen siendo suyas (11)", (await anunciosP()).length === 3 && papeletas(await ficha("sara")) === 11);
      await s3.cerrar();
      const iz = await naveDe("iker", "revende de más");
      c("reventa · no se ponen más de las que se tienen (Íker tiene 2 e intenta poner 3)", /No tienes tantas participaciones/.test(await llamaZ(iz, "zocoPoner", [P, [T, T, T]])));
      await iz.cerrar();
      const [A1, A2] = (await anunciosP()).map(a => a._id);
      const l2 = await naveDe("lola", "compra una", "zoco");
      await l2.hasta("!!document.getElementById('z-poner')", 20);
      c("🔴 reventa · Lola ve en el Zoco la «Participación · Licencia de Genially…» de Sara Saturno", await l2.hasta(`!!document.querySelector('[data-zofertar="${A1}"]') && /Participación · Licencia de Genially/.test(document.body.innerText)`, 20));
      await l2.foto(FOTOS + "/25-zoco-participacion.png");
      await l2.js(`document.querySelector('[data-zofertar="${A1}"]').click(); 1`); await l2.hasta("!!document.querySelector('.zoco-capa #zm-cr')", 10);
      const ventana = JSON.parse(await l2.js(`JSON.stringify({ max: document.querySelector('.zoco-capa #zm-cr').max, suya: !!document.querySelector('.zoco-capa .zm-p[data-p="${T}"]'), t: document.querySelector('.zoco-capa').innerText.slice(0,600) })`));
      c("reventa · el tope por una participación es 3 veces su precio (60 ◈) y sus propias papeletas no sirven para pagar", /como mucho 60/i.test(ventana.t) && !ventana.suya, JSON.stringify(ventana));
      await l2.js("document.querySelector('.zoco-capa #zm-cr').value='30'; document.querySelector('.zoco-capa #zm-msg').value='Te la compro'; document.querySelector('.zoco-capa #zm-ok').click(); 1");
      await l2.hasta("/Oferta enviada/i.test((document.getElementById('nave-aviso')||{}).innerText||'')", 25);
      c("reventa · 61 ◈ por una participación, no", /como mucho 60/.test(await llamaZ(l2, "zocoOfertar", [A2, { creditos: 61, piezas: [] }, ""])));
      c("🔴 reventa · y pagar con participaciones, tampoco (se quedarían fuera del bombo)", /Ofrece algo/.test(await llamaZ(l2, "zocoOfertar", [A2, { creditos: 0, piezas: [T] }, ""])));
      await l2.cerrar();
      const tL = (await consultar("stargate_tratos", "projectId", P)).filter(t => t.anuncio === A1 && t.estado === "abierto")[0];
      const s4 = await naveDe("sara", "acepta la reventa");
      const acep = await llamaZ(s4, "zocoResponder", [tL._id, "aceptar", {}]);
      const fSa = await ficha("sara"), fLo = await ficha("lola");
      c("🔴 reventa · trato hecho: la papeleta pasa de Sara (11 → 10) a Lola (3 → 4), y 30 ◈ de Lola a Sara",
        /aceptado/.test(acep) && papeletas(fSa) === 10 && papeletas(fLo) === 4 && fSa.coins === 110 && fLo.coins === 270,
        acep + " · " + [papeletas(fSa), papeletas(fLo), fSa.coins, fLo.coins].join(" · "));
      await s4.cerrar();
      // una oferta que se queda abierta hasta DESPUÉS del sorteo (se comprueba al final)
      const m3 = await naveDe("mateo", "oferta por otra");
      await llamaZ(m3, "zocoOfertar", [A2, { creditos: 20, piezas: [] }, ""]); await m3.cerrar();
      const tM = (await consultar("stargate_tratos", "projectId", P)).filter(t => t.anuncio === A2 && t.estado === "abierto")[0];

      // 3 · la consola: el bombo, cambiar el precio, y sortear en directo
      await rita.ir("consola.html?per=" + P); await rita.hasta("!!document.querySelector('.pest[data-tab=\"sorteos\"]')", 25);
      await rita.js("document.querySelector('.pest[data-tab=\"sorteos\"]').click(); 1");
      await rita.hasta("!!document.querySelector('.sr-caja')", 20);
      const cuenta = await rita.js("(document.querySelector('.sr-cuenta')||{}).innerText||''");
      c("🔴 sorteo · la consola cuenta el bombo: 21 participaciones de 4 reclutas (10 + 2 + 4 + 5, con la reventa)", /21 participaciones de 4 reclutas/.test(cuenta), cuenta);
      await rita.js("var d=document.querySelector('.sr-caja details'); if(d) d.open=true; 1");
      c("sorteo · y cada uno con sus posibilidades (Sara, 10 de 21 = 48 %)", /Sara Saturno[\s\S]*48 %/.test(await rita.texto()));
      await rita.foto(FOTOS + "/25-consola-sorteos.png");
      await rita.js("document.querySelector('.sr-editar').click(); 1"); await rita.hasta("!!document.querySelector('.sr-editar-f .sr-coste')", 10);
      await rita.js("var i=document.querySelector('.sr-editar-f .sr-coste'); i.value='25'; document.querySelector('.sr-editar-f .sr-guardar').click(); 1");
      c("sorteo · la referente cambia el precio a 25 ◈", await rita.hasta("/Sorteo cambiado/.test((document.getElementById('c-aviso')||{}).innerText||'')", 20) && (await ticket()).cost === 25);
      const i2 = await naveDe("iker", "compra a 25"); await compra(i2, "iker"); await i2.cerrar();
      const fI = await ficha("iker");
      c("sorteo · y la siguiente compra ya cuesta 25 (Íker: 300 − 20 − 20 − 25 = 235, con 3 papeletas)", fI.coins === 235 && papeletas(fI) === 3, fI.coins + " · " + papeletas(fI));
      const antes = {}; for (const k of Object.keys(F)) antes[k] = papeletas(await ficha(k));
      // el sorteo, proyectado
      await rita.js("document.querySelector('.pest[data-tab=\"sorteos\"]').click(); 1"); await rita.hasta("!!document.querySelector('.sr-directo')", 20);
      await rita.js("window.confirm=function(){return true}; document.querySelector('.sr-directo').click(); 1");
      c("sorteo · «Sortear en directo» abre el bombo para proyectar (sin nombres reales ni correos)", await rita.hasta("document.querySelectorAll('.sr-proy .sr-chip').length===4", 10)
        && !/@lab\.test/.test(await rita.js("document.querySelector('.sr-proy').innerText")));
      await rita.foto(FOTOS + "/25-bombo.png");
      await rita.js("document.getElementById('sr-go').click(); 1");
      c("🔴 sorteo · ¡Sortear! → la ruleta se para en dos ganadores", await rita.hasta("document.querySelectorAll('.sr-chip.gana').length===2 && /Enhorabuena/.test(document.querySelector('.sr-proy').innerText)", 60),
        await rita.js("(document.querySelector('.sr-proy')||{}).innerText||''"));
      await rita.foto(FOTOS + "/25-ganadores.png");
      const tk = await ticket(), gan = tk.raffleWinnerIds || [];
      const idAk = {}; Object.keys(F).forEach(k => { idAk[F[k]._id] = k; });
      c("🔴 sorteo · el servidor lo cierra: 2 ganadores DISTINTOS, y los dos tenían participaciones", tk.isRaffleCompleted === true && gan.length === 2 && gan[0] !== gan[1] && gan.every(f => antes[idAk[f]] > 0),
        JSON.stringify(gan.map(f => idAk[f])));
      const despues = {}; for (const k of Object.keys(F)) despues[k] = await ficha(k);
      c("🔴 sorteo · cada ganador tiene su licencia en el inventario, y nadie más", Object.keys(F).every(k => (despues[k].inventory || []).filter(x => x === PREMIO).length === (gan.indexOf(F[k]._id) >= 0 ? 1 : 0)));
      c("sorteo · las papeletas de este sorteo se retiran a todos", Object.keys(F).every(k => papeletas(despues[k]) === 0));
      c("sorteo · el premio se queda sin unidades y el sorteo deja de venderse", (await fs.collection("rewards").doc(PREMIO).get()).data().globalStock === 0 && Number(tk.availableUntil) <= Date.now());
      const arch = (await fs.collection("projects").doc(P).collection("lottery_archives").doc(T).get()).data();
      c("🔴 sorteo · el bombo entero queda guardado ANTES de borrar nada (4 reclutas, 22 papeletas, las regaladas y la revendida incluidas)",
        arch && arch.bombo.length === 4 && arch.totalParticipaciones === 22 && arch.bombo.some(b => b.ficha === F.lola._id && b.n === 4), JSON.stringify(arch && { n: arch.bombo.length, t: arch.totalParticipaciones }));
      c("🔴 sorteo · dos veces no se puede sortear", /ya se ha hecho/.test(await rita.js(`window.SG.MOTOR.sortear('${P}','${T}').then(function(){return 'OTRA VEZ'},function(e){return e.message})`)));
      c("sorteo · ni regalar participaciones de un sorteo ya hecho", /ya se ha hecho/.test(await rita.js(`window.SG.MOTOR.regalarEnClase('${P}',['${F.lola._id}'],{tipo:'participacion',sorteo:'${T}',n:1}).then(function(){return 'REGALÓ'},function(e){return e.message})`)));
      await rita.js("document.getElementById('sr-salir').click(); 1"); await rita.hasta("!!document.querySelector('.sr-ganadores')", 20);
      c("sorteo · en la consola, los ganadores con su nombre y su correo (para entregarles la licencia)", /@lab\.test/.test(await rita.js("document.querySelector('.sr-ganadores').innerText")));
      const i3 = await naveDe("iker", "después del sorteo");
      c("🔴 sorteo · después del sorteo nadie puede comprar (el servidor lo cierra)", /ERROR/.test(await compra(i3, "iker")));
      await i3.cerrar();
      const l0 = await nueva("Lola, el enlace tras el sorteo");
      await l0.ir("huevo.html?h=sorteo-lab&per=" + P); await l0.entrarComo("lola@lab.test", "Lola Prueba");
      await l0.ir("huevo.html?h=sorteo-lab&per=" + P); await l0.hasta("!!document.getElementById('hv-abrir')", 25);
      await l0.js("document.getElementById('hv-abrir').click(); 1");
      c("sorteo · el enlace de participaciones, después del sorteo: «Ese sorteo ya se ha hecho»", await l0.hasta("/ya se ha hecho/i.test(document.body.innerText)", 25), (await l0.texto()).slice(0, 160));
      c("   (y no le suma nada)", papeletas(await ficha("lola")) === 0);
      await l0.cerrar();
      // 3b · la reventa, tras el sorteo: lo que quedaba en el Zoco se retira SOLO y cada oferta devuelve lo suyo
      const tM2 = await trato25(tM._id), restos = (await consultar("stargate_zoco", "projectId", P)).filter(a => a.pieza.id === T && a._id !== A1);
      c("🔴 reventa · al sortear, las 2 participaciones que Sara aún tenía en el Zoco se retiran solas", restos.length === 2 && restos.every(a => a.estado === "retirado"),
        JSON.stringify(restos.map(a => a.estado)));
      const fM = await ficha("mateo");
      c("🔴 reventa · y la oferta de Mateo por una de ellas se anula: le vuelven sus 20 ◈ (300)", tM2.estado === "anulado" && tM2.motivo === "sorteo" && fM.coins === 300,
        tM2.estado + " · " + tM2.motivo + " · " + fM.coins);
      const s5 = await naveDe("sara", "tras el sorteo");
      c("reventa · aceptarla después ya no hace nada («Ese trato ya está cerrado»)", /ya está cerrado/.test(await llamaZ(s5, "zocoResponder", [tM._id, "aceptar", {}])));
      c("reventa · ni poner en el Zoco participaciones de un sorteo ya hecho", /ya se ha hecho/.test(await llamaZ(s5, "zocoPoner", [P, [T]])));
      await s5.js("document.querySelector('.nb-t[data-tab=\"zoco\"]').click(); 1"); await s5.hasta("!!document.getElementById('z-poner')", 20);
      c("reventa · y en el Zoco de Sara ya no se ve ninguna participación en venta", !(await s5.js(`[].slice.call(document.querySelectorAll('[data-zofertar],[data-zretirar]')).some(function(b){ var c=b.closest('.zoco-card,.card,li,article')||b.parentNode; return /Participación · /.test(c.innerText); })`)));
      await s5.cerrar();
      const m4 = await naveDe("mateo", "tras el sorteo");
      c("reventa · Mateo lo ve al entrar: «Se hizo el sorteo antes de cerrar el trato… lo apartado ha vuelto»", await m4.hasta("/Se hizo el sorteo antes de cerrar el trato/.test((document.querySelector('.zoco-aviso')||{}).innerText||'')", 20),
        await m4.js("(document.querySelector('.zoco-aviso')||{}).innerText||''"));
      await m4.foto(FOTOS + "/25-reventa-anulada.png");
      await m4.cerrar();
      // 4 · lo que ven quien gana y quien no
      const kG = idAk[gan[0]], kN = Object.keys(F).filter(k => gan.indexOf(F[k]._id) < 0)[0];
      const g1 = await naveDe(kG, "ha ganado");
      c("🔴 sorteo · quien gana lo ve nada más entrar: «🏆 ¡Has ganado el Gran Sorteo!»", await g1.hasta("/Has ganado el Gran Sorteo/.test((document.querySelector('.sorteo-aviso')||{}).innerText||'')", 20));
      await g1.foto(FOTOS + "/25-has-ganado.png");
      await g1.js("document.querySelector('.nb-t[data-tab=\"botin\"]').click(); 1");
      c("sorteo · y en Mi botín: «Lo que has ganado en el Gran Sorteo: Licencia de Genially…»", await g1.hasta("/Lo que has ganado en el Gran Sorteo/.test(document.body.innerText) && /Licencia de Genially/.test(document.body.innerText)", 15));
      await g1.cerrar();
      const n1 = await naveDe(kN, "no ha ganado", "mercado");
      c("sorteo · quien no gana lo sabe también («ya tiene ganadores… para X y Y», con «Ver resultado del sorteo»)", /ya tiene ganadores/i.test(await n1.js("(document.querySelector('.sorteo-aviso')||{}).innerText||''")) && await n1.js("!!document.querySelector('.sorteo-aviso [data-sorteo-ver]')"));
      c("sorteo · y en el Mercado la tarjeta dice quién ganó, sin botón de comprar", /Ya se ha sorteado/.test(await n1.js("(document.querySelector('.rec-card.sorteo')||{}).innerText||''")) && !(await n1.js("!!document.querySelector('.rec-card.sorteo [data-canje]')")));
      await n1.js("document.querySelector('.sorteo-aviso [data-sorteo-visto]:not([data-tab])').click(); 1"); await dormir(400);
      c("sorteo · el aviso se cierra con ✕ y no vuelve a salir en ese navegador", !(await n1.js("!!document.querySelector('.sorteo-aviso')")));
      await n1.foto(FOTOS + "/25-mercado-sorteado.png");
      await n1.cerrar();
      // 5 · la referente crea otro sorteo desde la consola y sale en el Mercado
      await rita.js("document.querySelector('.pest[data-tab=\"sorteos\"]').click(); 1"); await rita.hasta("!!document.getElementById('sr-nuevo')", 20);
      await rita.js("document.getElementById('sr-nuevo').click(); 1"); await rita.hasta("!!document.querySelector('#sr-nuevo-f .sr-premio')", 10);
      await rita.js(`(function(){ var f=document.querySelector('#sr-nuevo-f'); f.querySelector('.sr-premio').value='Una tarde de juegos de mesa'; f.querySelector('.sr-desc').value='Para toda la escuadra ganadora';
        f.querySelector('.sr-gan').value='1'; f.querySelector('.sr-coste').value='5'; f.querySelector('.sr-max').value='3';
        f.querySelector('.sr-guardar').click(); return 1; })()`);
      c("sorteo · la referente crea otro sorteo desde la consola", await rita.hasta("/Sorteo creado/.test((document.getElementById('c-aviso')||{}).innerText||'')", 25),
        await rita.js("(document.getElementById('c-aviso')||{}).innerText||''"));
      const l1 = await naveDe("lola", "el sorteo nuevo", "mercado");
      c("sorteo · y sale en el Mercado de su alumnado", await l1.hasta("[].slice.call(document.querySelectorAll('.rec-card.sorteo')).some(function(x){return /juegos de mesa/.test(x.innerText)})", 20));
      c("sorteo · sin errores en las páginas", [rita, l1].every(x => !x.errores.filter(e => !/Failed to load resource/.test(e)).length), [rita, l1].map(x => x.errores[0] || "").join(" | "));
      await l1.cerrar(); await rita.cerrar();
    }
    // ============================================================ 26 · LA SESIÓN, DENTRO DEL GENIALLY
    /**
     * Norberto: «el referente les va a dar los Geniallys hechos… que en ese embed pida iniciar sesión
     * al docente, detecte sus grupos, primero le pregunte en qué grupo estamos y entonces lance la
     * presentación que toca. El mismo embed para todos». Y: «esto no se embebe… ¡debe poderse embeber!»
     * (el botón copiaba una dirección suelta, y Genially necesita el código).
     */
    if (hacer(26)) {
      const A = admin(), fs = A.firestore(), P = "lab-clase", P2 = "lab-clase-dos";
      const base = (await fs.collection("projects").doc(P).get()).data();
      await fs.collection("projects").doc(P2).set(Object.assign({}, base, { name: "LAB · Segundo grupo", joinCode: "SEGUN2" }));
      const rita = await nueva("Rita copia el embed");
      await rita.ir("entrar.html"); await rita.entrarComo("rita@lab.test", "Rita Referente");
      await rita.ir("consola.html"); await rita.hasta("!!document.querySelector('.gp')", 25);
      // 15-sep · el embed va UNA vez, en «Para tus Geniallys» (el mismo para todos los grupos), no en cada tarjeta
      const cod = await rita.js("(document.querySelector('.gp-gen [data-embed=\"sesion\"]')||{getAttribute:function(){return ''}}).getAttribute('data-copiar')");
      c("🔴 embed · «Para tus Geniallys» copia el CÓDIGO para insertar la sesión (un iframe), no una dirección suelta",
        /^<iframe src="http:\/\/[^"]+\/sesion\.html\?embed=1"/.test(cod) && /allowfullscreen/.test(cod), cod.slice(0, 120));
      c("embed · y va una sola vez para todos los grupos, no repetido en cada tarjeta",
        await rita.js("document.querySelectorAll('.gp [data-embed]').length===0 && document.querySelectorAll('.gp-gen [data-embed]').length===3"));
      c("código · el de clase sale tapado y se destapa al pulsar",
        await rita.js("(function(){ var b=document.querySelector('.gp-cod'); if(!b||/[A-Z0-9]{6}/.test(b.textContent)) return false; b.click(); return /[A-Z0-9]{6}/.test(b.textContent); })()"));
      await rita.cerrar();
      const p = await nueva("La sesión dentro del Genially");
      await p.ir("http://127.0.0.1:" + L.P_WEB2 + "/genially.html?que=" + encodeURIComponent("sesion.html?embed=1"));
      const f = await p.marco("sesion.html");
      c("🔴 embed · dentro de la presentación, sin sesión: «Entra con tu cuenta de docente» con el botón de Google AHÍ MISMO",
        !!f && await f.hasta("!!document.getElementById('ses-entrar')", 20));
      c("embed · y sin la cabecera ni el pie de la web", await f.js("getComputedStyle(document.querySelector('nav.nav')).display==='none' && getComputedStyle(document.querySelector('footer')).display==='none'"));
      await p.foto(FOTOS + "/26-embed-entrar.png");
      await f.entrarComo("rita@lab.test", "Rita Referente");
      await f.recargar(); await dormir(2000);
      const f2 = await p.marco("sesion.html");
      c("🔴 embed · con dos grupos, primero pregunta «¿En qué grupo estamos?»", await f2.hasta("document.querySelectorAll('.ses-grupo').length>=2 && /En qué grupo estamos/.test(document.body.innerText)", 25),
        (await f2.texto()).slice(0, 200));
      await p.foto(FOTOS + "/26-embed-grupo.png");
      await f2.js(`[].slice.call(document.querySelectorAll('.ses-grupo')).filter(function(b){return b.getAttribute('data-per')==='${P}'})[0].click(); 1`);
      c("🔴 embed · elige su grupo y arranca la sesión de la semana que toca", await f2.hasta("!!document.querySelector('.mazo .dia.portada') && /Semana 10/i.test(document.querySelector('.mazo').innerText)", 25),
        (await f2.texto()).slice(0, 200));
      const vista = JSON.parse(await f2.js("JSON.stringify({ prep: !!document.querySelector('.prep'), tira: !!document.querySelector('.sem-tira'), panel: [].slice.call(document.querySelectorAll('.barra-pasos .p')).some(function(b){return b.getAttribute('title')==='Empezar'}), alto: document.querySelector('.mazo').getBoundingClientRect().height, vh: innerHeight, cambiar: !!document.getElementById('ses-cambiar') })"));
      c("embed · se proyecta solo el mazo: sin la tira del docente (el consejo) ni el selector de semanas", !vista.prep && !vista.tira, JSON.stringify(vista));
      c("embed · y llena la caja del Genially", Math.abs(vista.alto - vista.vh) < 4, JSON.stringify(vista));
      c("🔴 embed · sin la diapositiva del panel de Genially (sería el Genially dentro de sí mismo)", !vista.panel, JSON.stringify(vista));
      await p.foto(FOTOS + "/26-embed-sesion.png");
      // la sesión rehecha (14-sep): el orden que eligió Norberto y nada que le hable al docente
      const rots = JSON.parse(await f2.js("JSON.stringify([].slice.call(document.querySelectorAll('.barra-pasos .p')).map(function(b){return b.getAttribute('title')}))"));
      // (15-sep · entre la llamada y el vídeo, «El mensaje»: el del foro, como apertura de saga)
      c("🔴 sesión · empieza por la portada, la llamada a filas y el mensaje; luego el vídeo; y el de cierre va lo último (semana 10)",
        rots[0] === "Portada" && rots[1] === "Llamada a filas" && rots[2] === "El mensaje" && rots[3] === "Vídeo" && rots[rots.length - 1] === "Vídeo" && rots.indexOf("Tu ejemplo") === rots.length - 3, JSON.stringify(rots));
      const ir_ = async t => f2.js(`(function(){ var b=[].slice.call(document.querySelectorAll('.barra-pasos .p')).filter(function(x){return x.getAttribute('title')===${JSON.stringify(t)}})[0]; if(b){ b.click(); return 1; } return 0; })()`);
      // la llamada a filas, tocada DESDE la sesión, y la gente entrando con su cara
      for (const d of (await fs.collection("attendance_sessions").where("projectId", "==", P).where("active", "==", true).get()).docs) await d.ref.update({ active: false });
      const GS = ["sara@lab.test", "Sara Prueba", "Sara Saturno"];
      for (let k = 0; k < 2 && !(await fichaDe(GS[0], P)); k++) { const a = await nueva("Alta Sara"); await alistar(a, GS[0], GS[1], GS[2], 0); await a.cerrar(); }
      const FS = await fichaDe(GS[0], P);
      for (const d of (await fs.collection("attendance_records").where("studentProfileId", "==", FS._id).get()).docs) await d.ref.delete();
      await ir_("Llamada a filas");
      c("🔴 sesión · la diapositiva de la llamada trae el botón para tocarla ahí mismo", await f2.hasta("!!document.getElementById('ses-ll-tocar')", 15));
      await f2.js("document.getElementById('ses-ll-tocar').click(); 1");
      c("sesión · tocada: «presentes» en directo y la cuenta atrás", await f2.hasta("!!document.getElementById('ses-ll-n') && /quedan/.test(document.getElementById('ses-ll-cuenta').textContent)", 20));
      const sara = await nueva("Sara ficha en su Nave");
      await sara.ir("entrar.html"); await sara.entrarComo(GS[0], GS[1]); await sara.ir("recluta.html?per=" + P); await sara.hasta("!!(window.SG&&window.SG.MOTOR)", 20);
      const fichado = await sara.js(`window.SG.MOTOR.ficharLlamada('${P}','${FS._id}').then(function(){return 'OK'},function(e){return 'ERROR '+e.message})`, 60000);
      await sara.cerrar();
      c("🔴 sesión · Sara ficha en su Nave y su cara aparece en la diapositiva, en directo", /OK/.test(fichado) && await f2.hasta("[].slice.call(document.querySelectorAll('#ses-ll-gente figcaption')).some(function(x){return /Sara Saturno/.test(x.textContent)}) && document.getElementById('ses-ll-n').textContent==='1'", 20),
        fichado + " · " + (await f2.texto()).slice(0, 160));
      await p.foto(FOTOS + "/26-sesion-llamada.png");
      await f2.js("document.getElementById('ses-ll-cerrar').click(); 1"); await f2.hasta("!!document.getElementById('ses-ll-tocar')", 15);
      // el podio de la semana se destapa de uno en uno (si hay podio)
      if (rots.indexOf("Ranking semanal") >= 0) {
        await ir_("Ranking semanal");
        const vistos = async () => Number(await f2.js("document.querySelectorAll('.podio-p.on').length"));
        const v0 = await vistos();
        await f2.js("document.getElementById('sig').click(); 1"); await dormir(300); const v1 = await vistos();
        await f2.js("document.getElementById('sig').click(); 1"); await dormir(300); const v2 = await vistos();
        const tercero = await f2.js("(document.querySelector('.podio-p.on')||{className:''}).className");
        c("🔴 sesión · el ranking semanal se destapa de uno en uno: nadie, el último del podio, el siguiente…", v0 === 0 && v1 === 1 && v2 === 2 && /p3|p2/.test(tercero), [v0, v1, v2, tercero].join(" · "));
        await dormir(900); await p.foto(FOTOS + "/26-sesion-podio.png");
      }
      c("sesión · nada de lo proyectado le habla al docente («Nómbralos en voz alta…»)", !/Nómbralos|la ceremonia la haces tú/.test(await f2.texto()));
      // el fotógrafo: una foto de cada diapositiva de datos (para mirarlas) y nada de letra por debajo de 12 px
      const chicas = [];
      for (const t of ["Misiones de la semana 9", "Han movido ficha", "Top 5", "Escuadrones", "Ticket de salida", "Misión 1", "Tu ejemplo"]) {
        if (!(await ir_(t))) continue;
        await dormir(1400); await p.foto(FOTOS + "/26-dia-" + t.replace(/\W+/g, "-").toLowerCase() + ".png");
        const m = await f2.js("(function(){ var out=[]; [].slice.call(document.querySelectorAll('.lienzo *')).forEach(function(e){ if(!e.childNodes.length||![].some.call(e.childNodes,function(n){return n.nodeType===3&&n.textContent.trim()})) return; var fz=parseFloat(getComputedStyle(e).fontSize); if(fz<12) out.push(e.tagName+':'+fz+':'+e.textContent.trim().slice(0,20)); }); return out.join(' | '); })()");
        if (m) chicas.push(t + " → " + m);
      }
      c("sesión · ninguna diapositiva con letra por debajo de 12 px", !chicas.length, chicas.join(" · "));
      await f2.js("document.getElementById('ses-cambiar').click(); 1");
      c("embed · «⇄ Cambiar de grupo» vuelve a preguntar", vista.cambiar && await f2.hasta("document.querySelectorAll('.ses-grupo').length>=2", 10));
      c("embed · sin errores dentro del iframe", !p.errores.filter(e => !/Failed to load resource/.test(e)).length, p.errores[0] || "");
      await p.cerrar();
      await fs.collection("projects").doc(P2).delete();
    }
    // ============================================================ 27 · CONGELAR, DAR DE BAJA… Y EL LEGENDARIO EN EL ZOCO
    /**
     * Norberto (14-sep): «los legendarios deben poder venderse en el Zoco» y «el referente tiene poder
     * de eliminar o congelar (puede acceder, pero no puede hacer nada, bloqueado)».
     */
    if (hacer(27)) {
      const A = admin(), fs = A.firestore(), P = "lab-clase";
      const GENTE = { gelida: ["gelida@lab.test", "Gélida Prueba", "Gélida"], brasa: ["brasa@lab.test", "Brasa Prueba", "Brasa"] };
      for (const k of Object.keys(GENTE)) {
        const [correo, nombre, alias] = GENTE[k];
        for (let i = 0; i < 2 && !(await fichaDe(correo, P)); i++) { const a = await nueva("Alta " + nombre); await alistar(a, correo, nombre, alias, 0); await a.cerrar(); }
      }
      const F = {}; for (const k of Object.keys(GENTE)) F[k] = await fichaDe(GENTE[k][0], P);
      const LEY = P + "__heroe_H25_desertor", CB = P + "__cromo_P1_bran";
      await fs.collection("student_profiles").doc(F.gelida._id).update({ coins: 300, inventory: [LEY, CB] });
      await fs.collection("student_profiles").doc(F.brasa._id).update({ coins: 300, inventory: [CB] });
      const naveDe = async (k, nota) => {
        const [correo, nombre] = GENTE[k], q = await nueva(nombre.split(" ")[0] + " · " + nota);
        await q.ir("entrar.html"); await q.entrarComo(correo, nombre); await sinBienvenidas(q);
        await q.ir("recluta.html?per=" + P); await q.hasta("!!document.querySelector('.nb-t[data-tab=\"mercado\"]')", 30);
        return q;
      };
      const llama = (q, fn, args) => q.js(`window.SG.MOTOR.${fn}(${args.map(x => JSON.stringify(x)).join(",")}).then(function(r){return JSON.stringify(r)||'OK'},function(e){return "ERROR " + e.message})`, 60000);
      const ficha = async k => (await fs.collection("student_profiles").doc(F[k]._id).get()).data();

      // 1 · el legendario, en el Zoco: su ÚNICA copia, y se vende
      const g1 = await naveDe("gelida", "vende su legendario");
      const puesto = JSON.parse((await llama(g1, "zocoPoner", [P, [LEY]])).replace(/^ERROR.*/, "{}"));
      c("🔴 legendario · Gélida pone en el Zoco su único legendario (El Desertor de la Estática)", !!(puesto.anuncios && puesto.anuncios[0]), JSON.stringify(puesto));
      await g1.cerrar();
      const b1 = await naveDe("brasa", "compra el legendario");
      c("legendario · por un héroe, como mucho 180 ◈ (también por un legendario)", /como mucho 180/i.test(await llama(b1, "zocoOfertar", [puesto.anuncios[0], { creditos: 181, piezas: [] }, ""])));
      await llama(b1, "zocoOfertar", [puesto.anuncios[0], { creditos: 150, piezas: [] }, "¡Lo quiero!"]); await b1.cerrar();
      const tLey = (await consultar("stargate_tratos", "projectId", P)).filter(t => t.anuncio === puesto.anuncios[0] && t.estado === "abierto")[0];
      const g2 = await naveDe("gelida", "acepta");
      const acep = await llama(g2, "zocoResponder", [tLey._id, "aceptar", {}]); await g2.cerrar();
      const [fg, fb] = [await ficha("gelida"), await ficha("brasa")];
      c("🔴 legendario · trato hecho: el Desertor pasa a Brasa y los 150 ◈ a Gélida", /aceptado/.test(acep) && fb.inventory.includes(LEY) && !fg.inventory.includes(LEY) && fg.coins === 450 && fb.coins === 150,
        acep + " · " + JSON.stringify([fg.inventory, fb.inventory, fg.coins, fb.coins]));

      // 2 · algo abierto en el Zoco antes de congelar: su anuncio (con una oferta de Brasa) y una oferta suya
      const g3 = await naveDe("gelida", "pone y oferta");
      const puesto2 = JSON.parse(await llama(g3, "zocoPoner", [P, [CB]])).anuncios[0];
      await g3.cerrar();
      const b2 = await naveDe("brasa", "pone y oferta");
      const puestoB = JSON.parse(await llama(b2, "zocoPoner", [P, [CB]])).anuncios[0];
      await llama(b2, "zocoOfertar", [puesto2, { creditos: 20, piezas: [] }, ""]); await b2.cerrar();
      const g4 = await naveDe("gelida", "oferta a Brasa");
      await llama(g4, "zocoOfertar", [puestoB, { creditos: 30, piezas: [] }, ""]); await g4.cerrar();
      const antesG = (await ficha("gelida")).coins, antesB = (await ficha("brasa")).coins;

      // 3 · Rita congela a Gélida desde su consola
      const rita = await nueva("Rita congela");
      await rita.ir("entrar.html"); await rita.entrarComo("rita@lab.test", "Rita Referente");
      await rita.ir("consola.html?per=" + P); await rita.hasta("!!document.querySelector('.pest[data-tab=\"alumnado\"]')", 25);
      await rita.js("document.querySelector('.pest[data-tab=\"alumnado\"]').click(); 1"); await rita.hasta("document.querySelectorAll('[data-r]').length>0", 20);
      const abreFicha = async (q, alias) => { await q.js(`(function(){ var f=[].slice.call(document.querySelectorAll('[data-r]')).filter(function(x){return x.querySelector('td:nth-child(2) b') && x.querySelector('td:nth-child(2) b').textContent===${JSON.stringify(alias)}})[0]; if(f) f.click(); return !!f; })()`); return q.hasta("!!document.querySelector('#c-ficha .card')", 10); };
      await abreFicha(rita, "Gélida");
      c("🔴 congelar · en la ficha, «Solo el referente»: 🧊 Congelar y Dar de baja", await rita.hasta("!!document.getElementById('c-congelar') && !!document.getElementById('c-baja')", 10));
      await rita.foto(FOTOS + "/27-ficha-referente.png");
      await rita.js("window.confirm=function(){return true}; document.getElementById('c-congelar').click(); 1");
      c("congelar · «🧊 Gélida está congelado: mira, pero no toca»", await rita.hasta("/está congelad/.test((document.getElementById('c-aviso')||{}).innerText||'')", 25), await rita.js("(document.getElementById('c-aviso')||{}).innerText||''"));
      const fgc = await ficha("gelida");
      c("🔴 congelar · la ficha lleva el candado (quién y cuándo)", !!(fgc.stargateCongelado && fgc.stargateCongelado.por === "rita@lab.test"), JSON.stringify(fgc.stargateCongelado));
      c("congelar · en Mi gente sale «🧊 congelado» a su lado", await rita.hasta("[].slice.call(document.querySelectorAll('[data-r]')).some(function(x){return /Gélida/.test(x.innerText)&&/congelado/i.test(x.innerText)})", 15));
      const tratos = await consultar("stargate_tratos", "projectId", P), zoco = await consultar("stargate_zoco", "projectId", P);
      c("🔴 congelar · lo suyo sale del Zoco y cada oferta se anula devolviendo lo apartado (a Brasa sus 20, a Gélida sus 30)",
        zoco.filter(a => a._id === puesto2)[0].estado === "retirado" && tratos.filter(t => t.anuncio === puesto2)[0].estado === "anulado" && tratos.filter(t => t.anuncio === puestoB)[0].estado === "anulado"
        && (await ficha("brasa")).coins === antesB + 20 && (await ficha("gelida")).coins === antesG + 30,
        JSON.stringify([(await ficha("brasa")).coins, antesB, (await ficha("gelida")).coins, antesG]));

      // 4 · Gélida entra: mira, pero no toca
      const g5 = await naveDe("gelida", "congelada");
      c("🔴 congelada · al entrar: «🧊 Tu referente ha congelado tu cuenta»", await g5.hasta("/ha congelado tu cuenta/.test((document.querySelector('.congelado-aviso')||{}).innerText||'')", 15));
      await g5.foto(FOTOS + "/27-nave-congelada.png");
      const sobre = (await consultar("rewards", "projectId", P)).filter(r => r.stargateTipo === "cromo" && r.consumeEffects && r.consumeEffects.lootBox)[0];
      c("🔴 congelada · no puede comprar (el servidor: «ha congelado tu cuenta»)", /congelado tu cuenta/.test(await g5.js(`window.SG.MOTOR.llamar('purchaseReward',{projectId:'${P}',rewardId:'${sobre._id}',studentProfileId:'${F.gelida._id}'}).then(function(){return 'COMPRÓ'},function(e){return e.message})`, 60000)));
      c("🔴 congelada · ni poner nada en el Zoco", /congelado tu cuenta/.test(await llama(g5, "zocoPoner", [P, [CB]])));
      c("🔴 congelada · ni tocar su ficha desde la consola del navegador", !/ESCRIBIÓ/.test(await g5.js(`window.SG.MOTOR.updateDoc(window.SG.MOTOR.doc(window.SG.MOTOR.db,'student_profiles','${F.gelida._id}'),{stargateTitulo:'Hielo'}).then(function(){return 'ESCRIBIÓ'},function(e){return e.code||e.message})`)));
      c("🔴 congelada · ni quitarse el candado", !/ESCRIBIÓ/.test(await g5.js(`window.SG.MOTOR.updateDoc(window.SG.MOTOR.doc(window.SG.MOTOR.db,'student_profiles','${F.gelida._id}'),{stargateCongelado:null}).then(function(){return 'ESCRIBIÓ'},function(e){return e.code||e.message})`)));
      await g5.cerrar();

      // 5 · un docente raso no puede
      const dani = await nueva("Dani mira la ficha");
      await dani.ir("entrar.html"); await dani.entrarComo("dani@lab.test", "Dani Docente");
      await dani.ir("consola.html?per=" + P); await dani.hasta("!!document.querySelector('.pest[data-tab=\"alumnado\"]')", 25);
      await dani.js("document.querySelector('.pest[data-tab=\"alumnado\"]').click(); 1"); await dani.hasta("document.querySelectorAll('[data-r]').length>0", 20);
      const hayG = await abreFicha(dani, "Gélida");
      c("🔴 congelar · un docente raso no ve ni «Congelar» ni «Dar de baja»", !hayG || !(await dani.js("!!document.getElementById('c-congelar') || !!document.getElementById('c-baja')")));
      c("🔴 congelar · y si lo intenta por la consola del navegador, el servidor dice que no", /Solo el referente/.test(await llama(dani, "alumno", [P, F.gelida._id, "descongelar"])));
      await dani.cerrar();

      // 6 · Rita la descongela, y vuelve a poder
      await abreFicha(rita, "Gélida");
      await rita.js("document.getElementById('c-congelar').click(); 1");
      c("congelar · «▶️ Descongelar»: vuelve a poder hacer de todo", await rita.hasta("/ya puede volver/.test((document.getElementById('c-aviso')||{}).innerText||'')", 25) && !(await ficha("gelida")).stargateCongelado);
      const g6 = await naveDe("gelida", "descongelada");
      c("descongelada · sin el aviso, y compra otra vez", !(await g6.js("!!document.querySelector('.congelado-aviso')")) && /COMPRÓ/.test(await g6.js(`window.SG.MOTOR.llamar('purchaseReward',{projectId:'${P}',rewardId:'${sobre._id}',studentProfileId:'${F.gelida._id}'}).then(function(){return 'COMPRÓ'},function(e){return e.message})`, 60000)));
      await g6.cerrar();

      // 7 · dar de baja (lo hace el servidor: Rita no es la dueña del grupo y antes le daba «permiso denegado»)
      await abreFicha(rita, "Brasa");
      await rita.js("window.confirm=function(){return true}; window.prompt=function(){return 'Brasa'}; document.getElementById('c-baja').click(); 1");
      c("🔴 baja · Rita da de baja a Brasa (sin ser la dueña del grupo)", await rita.hasta("/ya no está en el grupo/.test((document.getElementById('c-aviso')||{}).innerText||'')", 25), await rita.js("(document.getElementById('c-aviso')||{}).innerText||''"));
      const alias = await leerDoc("stargate_alias/" + P + "__brasa");
      c("🔴 baja · su ficha, sus datos y su alias ya no están (el alias queda libre)", !(await fs.collection("student_profiles").doc(F.brasa._id).get()).exists && !(await leerDoc("student_profiles/" + F.brasa._id + "/privado/datos")) && !alias);
      c("baja · y lo suyo del Zoco, retirado", (await consultar("stargate_zoco", "projectId", P)).filter(a => a._id === puestoB)[0].estado === "retirado");
      c("congelar · sin errores en la consola", !rita.errores.filter(e => !/Failed to load resource/.test(e)).length, rita.errores[0] || "");
      await rita.cerrar();
    }
    // ============================================================ 28 · SOBRES Y CÁPSULAS (COMO LOS COFRES DEL CLASH ROYALE)
    /**
     * Norberto (14-sep): «diferentes tipos de sobres… sobres con mayor probabilidad de mejores cartas…
     * para la 10 todo descubierto»; y para los héroes, «un cofre legendario donde siempre toca un avatar
     * legendario… quiero poder ocultarlos en Genially o darlos de recompensa».
     */
    if (hacer(28)) {
      const A = admin(), fs = A.firestore(), P = "lab-clase";
      const G = ["cofre@lab.test", "Cofre Prueba", "Cofrecillo"];
      for (let i = 0; i < 2 && !(await fichaDe(G[0], P)); i++) { const a = await nueva("Alta Cofre"); await alistar(a, G[0], G[1], G[2], 0); await a.cerrar(); }
      const FC = await fichaDe(G[0], P);
      await fs.collection("student_profiles").doc(FC._id).update({ coins: 2000, inventory: [] });
      const recs = await consultar("rewards", "projectId", P);
      const R = t => recs.filter(r => r.stargateTipo === t && r.inStore !== false)[0];
      const cat = JSON.parse(require("fs").readFileSync(require("path").join(L.RAIZ, "motor", "catalogo.json"), "utf8"));
      const rz = id => { const k = String(id).split("__").pop(); const x = /^cromo_/.test(k) ? cat.cromos.filter(c => "cromo_" + c.clave === k)[0] : cat.heroes.filter(h => "heroe_" + h.clave === k)[0]; return String((x || {}).rareza || "").toLowerCase(); };
      c("🔴 cofres · el grupo nace con los siete: sobre (3), grande (5), de raras, épico y las cápsulas de rescate, élite y legendaria",
        ["cromo", "sobre_grande", "sobre_raro", "sobre_epico", "heroe", "capsula_elite", "capsula_legendaria"].every(t => R(t) && R(t).consumeEffects && R(t).consumeEffects.lootBox)
        && R("sobre_grande").maxUses === 5 && R("sobre_epico").maxUses === 3 && R("capsula_legendaria").maxUses === 1,
        JSON.stringify(["cromo", "sobre_grande", "sobre_raro", "sobre_epico", "heroe", "capsula_elite", "capsula_legendaria"].map(t => [t, !!R(t), R(t) && R(t).maxUses])));
      const itemsDe = t => R(t).consumeEffects.lootBox.items.map(i => i.rewardId);
      c("🔴 cofres · el sobre épico no lleva ni una común, y la cápsula legendaria solo Mitos", itemsDe("sobre_epico").every(id => rz(id) !== "común")
        && itemsDe("capsula_legendaria").length === 4 && itemsDe("capsula_legendaria").every(id => rz(id) === "legendaria"),
        JSON.stringify(itemsDe("capsula_legendaria")));
      c("cofres · en el sobre de raras las comunes pesan 4 veces menos que en el de siempre",
        (() => { const w = (t, k) => R(t).consumeEffects.lootBox.items.filter(i => rz(i.rewardId) === k).reduce((a, i) => a + i.probability, 0); return Math.abs(w("sobre_raro", "común") * 4 - w("cromo", "común")) < 0.01; })());
      const q = await nueva("Cofrecillo compra");
      await q.ir("entrar.html"); await q.entrarComo(G[0], G[1]); await sinBienvenidas(q);
      await q.ir("recluta.html?per=" + P); await q.hasta("!!document.querySelector('.nb-t[data-tab=\"mercado\"]')", 30);
      await q.js("document.querySelector('.nb-t[data-tab=\"mercado\"]').click(); 1"); await dormir(1200);
      c("🔴 cofres · en el Mercado de la semana 10, las siete tarjetas con su imagen (la legendaria incluida)",
        await q.hasta("['sobre_grande','sobre_raro','sobre_epico','capsula_rescate','capsula_elite','capsula_legendaria'].every(function(i){ return !!document.querySelector('.rec-card img[src*=\"'+i+'.jpg\"]'); })", 15));
      await q.js("var c=[].slice.call(document.querySelectorAll('.rec-card')).filter(function(x){return /Cápsula legendaria/.test(x.innerText)})[0]; if(c) c.scrollIntoView({block:'center'}); 1"); await dormir(700);
      await q.foto(FOTOS + "/28-mercado-cofres.png");
      // el sobre grande, por la pantalla: cinco cartas carta a carta
      const antes = (await fichaDe(G[0], P)).inventory || [];
      await q.js("document.querySelector('[data-canje][data-tipo=\"sobre_grande\"]').click(); 1");
      await q.hasta("!!document.querySelector('.neb-capa [data-si]')", 10); await q.js("document.querySelector('.neb-capa [data-si]').click(); 1");
      c("🔴 cofres · el sobre grande se abre carta a carta: CINCO cartas", await q.hasta("!!document.querySelector('.sb-capa')", 30));
      await q.js("var s=document.querySelector('.sb-saltar'); if(s) s.click(); 1"); await dormir(900);
      await q.foto(FOTOS + "/28-sobre-grande.png");
      await q.js("var x=document.querySelector('.sb-fin'); if(x) x.click(); 1"); await dormir(1500);
      const tras = (await fichaDe(G[0], P)).inventory || [];
      c("cofres · …y las cinco están en su álbum (y le han cobrado 25 ◈)", tras.filter(x => /__cromo_/.test(x)).length - antes.filter(x => /__cromo_/.test(x)).length === 5 && (await fichaDe(G[0], P)).coins === 1975,
        (tras.length - antes.length) + " · " + (await fichaDe(G[0], P)).coins);
      // el épico y la legendaria, por la misma puerta que usa la Nave
      const canje = (t, usos) => q.js(`new Promise(function(ok){ window.SG.FUENTE.accion({accion:'canje',per:'${P}',recompensa:'${R(t)._id}',abrir:true,usos:${usos},tipo:'${t}'}).then(function(d){ ok(JSON.stringify(d)); },function(e){ ok('ERROR '+e.message); }); })`, 90000);
      const epico = JSON.parse(await canje("sobre_epico", 3));
      c("🔴 cofres · el sobre épico: tres cartas y ninguna común", (epico.botines || []).length === 3 && epico.botines.every(b => rz(b.id || b.rewardId || b) !== "común"), JSON.stringify(epico.botines && epico.botines.map(b => b.id || b)));
      const leg = JSON.parse(await canje("capsula_legendaria", 1));
      const idLeg = leg.botines && leg.botines[0] && (leg.botines[0].id || leg.botines[0]);
      c("🔴 cofres · la cápsula legendaria trae SIEMPRE un Mito", rz(idLeg) === "legendaria" && ((await fichaDe(G[0], P)).inventory || []).includes(idLeg), String(idLeg));
      c("cofres · y cuesta lo que dice (2000 − 25 − 60 − 320)", (await fichaDe(G[0], P)).coins === 1595, String((await fichaDe(G[0], P)).coins));
      await q.cerrar();
      // de premio en clase, y escondida en un enlace
      const rita = await nueva("Rita regala una cápsula legendaria");
      await rita.ir("entrar.html"); await rita.entrarComo("rita@lab.test", "Rita Referente");
      await rita.ir("aula.html?per=" + P); await rita.hasta("!!(window.SG&&window.SG.MOTOR)", 20); await dormir(2500);
      await rita.js("var b=[].slice.call(document.querySelectorAll('[data-au]')).filter(function(x){return x.getAttribute('data-au')==='premios'})[0]; if(b) b.click(); 1");
      c("cofres · en el aula, «Premiar» ofrece las cápsulas y los sobres nuevos", await rita.hasta("!!document.querySelector('.au-pr[data-k=\"capsula_legendaria\"]')", 15));
      const antesR = ((await fichaDe(G[0], P)).inventory || []).length;
      const reg = await rita.js(`window.SG.MOTOR.regalarEnClase('${P}',['${FC._id}'],{tipo:'cofre',cual:'capsula_legendaria'}).then(function(r){return JSON.stringify(r)},function(e){return 'ERROR '+e.message})`, 60000);
      const nuevaR = ((await fichaDe(G[0], P)).inventory || []).slice(antesR);
      c("🔴 cofres · la docente le regala una cápsula legendaria: un Mito a su vestuario", nuevaR.length === 1 && rz(nuevaR[0]) === "legendaria", reg);
      const huevos = JSON.parse(await rita.js(`window.SG.MOTOR.huevosDe('${P}').then(function(h){return JSON.stringify(h)})`) || "[]");
      await rita.js(`window.SG.MOTOR.guardarHuevos('${P}', ${JSON.stringify(huevos.concat([{ id: "leyenda-lab", nombre: "Una leyenda escondida", premio: "capsula_legendaria", activo: true, limite: 0, porEscuadron: 0 }]))}).then(function(){return 'OK'})`, 60000);
      const hv = await leerDoc("rewards/" + P + "__huevo_leyenda-lab");
      c("cofres · el referente la esconde en un enlace («Premios por enlace» → 🟨 cápsula legendaria)", hv && hv.stargateHuevo.premio === "capsula_legendaria" && hv.consumeEffects.lootBox.items.length === 4, JSON.stringify(hv && hv.stargateHuevo));
      await rita.cerrar();
      const h1 = await nueva("Cofrecillo encuentra la leyenda");
      await h1.ir("huevo.html?h=leyenda-lab&per=" + P); await h1.entrarComo(G[0], G[1]);
      await h1.ir("huevo.html?h=leyenda-lab&per=" + P); await h1.hasta("!!document.getElementById('hv-abrir')", 25);
      const antesH = ((await fichaDe(G[0], P)).inventory || []).length;
      await h1.js("document.getElementById('hv-abrir').click(); 1");
      c("🔴 cofres · abre el enlace y le sale su Mito, con la carta en grande", await h1.hasta("!!document.querySelector('.sb-capa')", 30));
      await dormir(1500); await h1.foto(FOTOS + "/28-enlace-legendario.png");
      const nuevaH = ((await fichaDe(G[0], P)).inventory || []).slice(antesH);
      c("cofres · …y es legendario de verdad", nuevaH.length === 1 && rz(nuevaH[0]) === "legendaria", JSON.stringify(nuevaH));
      await h1.cerrar();
      // la sesión de la semana 8 presenta el Hangar
      const ses = await nueva("Rita proyecta la semana 8");
      await ses.ir("entrar.html"); await ses.entrarComo("rita@lab.test", "Rita Referente");
      await ses.ir("sesion.html?per=" + P + "&sem=8"); await ses.hasta("document.querySelectorAll('.barra-pasos .p').length>0", 25);
      const loN = await ses.js("(function(){ var t=''; [].slice.call(document.querySelectorAll('.barra-pasos .p')).forEach(function(b){ if(b.getAttribute('title')==='Lo nuevo'){ b.click(); var d=document.querySelector('.lienzo .dia.nuevo-nave'); t+=(d?d.textContent:'')+' | '; } }); return t; })()");
      c("cofres · la sesión de la semana 8 presenta «El Hangar de las Leyendas»", /Hangar de las Leyendas/.test(loN), loN.slice(0, 160));
      await ses.cerrar();
    }
    // ============================================================ 29 · LA OFERTA DE LA SEMANA
    /**
     * Norberto (14-sep): «ofertas temporales: un ítem que aparece aleatoriamente… rebajado… stock
     * limitado en tiempo (una semana) y en unidades, proporcional a los inscritos y a la rareza… el
     * referente tiene el poder siempre de extender el tiempo, cancelar, editar unidades o elegir y
     * configurar lo que se vende».
     */
    if (hacer(29)) {
      const A = admin(), fs = A.firestore(), P = "lab-clase";
      const G = ["ofer@lab.test", "Ofer Prueba", "Oferton"];
      for (let i = 0; i < 2 && !(await fichaDe(G[0], P)); i++) { const a = await nueva("Alta Ofer"); await alistar(a, G[0], G[1], G[2], 0); await a.cerrar(); }
      const FO = await fichaDe(G[0], P);
      await fs.collection("student_profiles").doc(FO._id).update({ coins: 1000, stargateOfertas: {} });
      for (const d of (await fs.collection("rewards").where("projectId", "==", P).where("stargateTipo", "==", "oferta").get()).docs) await d.ref.delete();
      const nave = async nota => { const q = await nueva("Oferton · " + nota); await q.ir("entrar.html"); await q.entrarComo(G[0], G[1]); await sinBienvenidas(q);
        await q.ir("recluta.html?per=" + P); await q.hasta("!!document.querySelector('.nb-t[data-tab=\"mercado\"]')", 30); return q; };
      // 1 · al entrar, la oferta de la semana sale sola
      const q1 = await nave("entra");
      c("🔴 ofertas · al entrar alguien, el servidor crea la oferta de la semana 10 (sola, sin tareas programadas)", await (async () => { for (let i = 0; i < 20; i++) { if (await leerDoc("rewards/" + P + "__oferta_s10")) return true; await dormir(700); } return false; })());
      const auto = await leerDoc("rewards/" + P + "__oferta_s10");
      const inscritos = (await consultar("student_profiles", "projectId", P)).filter(x => !x.graduatedAt && x.isTeacherPreview !== true).length;
      const F = { "común": null, "rara": 0.5, "épica": 0.25, "legendaria": 0.1 }, FH = { "rara": null, "épica": 0.3, "legendaria": 0.1 };
      const so = auto.stargateOferta, fac = so.que.tipo === "heroe" ? FH[so.rareza] : F[so.rareza];
      const esperadas = fac == null ? null : Math.max(1, Math.ceil(inscritos * fac));
      c("🔴 ofertas · rebajada un 20-40 %, dura la semana y con unidades según los inscritos y la rareza",
        auto.flashOffer.discountPercent >= 20 && auto.flashOffer.discountPercent <= 40 && so.semana === 10 && so.unidades === esperadas
        && auto.flashOffer.endsAt - so.desde > 6.9 * 864e5 && auto.flashOffer.endsAt - so.desde < 7.1 * 864e5,
        JSON.stringify({ que: so.que, rz: so.rareza, uds: so.unidades, esperadas, inscritos, pct: auto.flashOffer.discountPercent }));
      await q1.js("document.querySelector('.nb-t[data-tab=\"mercado\"]').click(); 1");
      c("🔴 ofertas · y en el Mercado, arriba: «⚡ Oferta de la semana» con el precio tachado y cuándo termina",
        await q1.hasta("!!document.querySelector('.oferta-card') && /Oferta de la semana/i.test(document.querySelector('.oferta-card').innerText) && /Termina en/.test(document.querySelector('.oferta-card').innerText)", 25),
        await q1.js("(document.querySelector('.oferta-card')||{}).innerText||''"));
      await q1.cerrar();
      // 2 · el referente crea una a mano: una cápsula legendaria al 30 %, con las unidades que tocan
      const rita = await nueva("Rita y las ofertas");
      await rita.ir("entrar.html"); await rita.entrarComo("rita@lab.test", "Rita Referente");
      await rita.ir("consola.html?per=" + P); await rita.hasta("!!document.querySelector('.pest[data-tab=\"ofertas\"]')", 25);
      await rita.js("document.querySelector('.pest[data-tab=\"ofertas\"]').click(); 1"); await rita.hasta("!!document.getElementById('of-nueva')", 15);
      c("ofertas · la consola del referente tiene su pestaña «Ofertas», con la de la semana", await rita.hasta("document.querySelectorAll('[data-of]').length>=1", 10));
      await rita.js("document.getElementById('of-nueva').click(); 1"); await rita.hasta("!!document.getElementById('of-que')", 10);
      await rita.js("var s=document.getElementById('of-que'); s.value='cofre:capsula_legendaria'; document.getElementById('of-pct').value='30'; document.getElementById('of-dias').value='3'; document.getElementById('of-crear').click(); 1");
      c("ofertas · «+ Crear una oferta» → «Oferta creada»", await rita.hasta("/Oferta creada/.test((document.getElementById('c-aviso')||{}).innerText||'')", 25));
      const manual = (await consultar("rewards", "projectId", P)).filter(r => r.stargateTipo === "oferta" && !r.stargateOferta.auto)[0];
      const udsLeg = Math.max(1, Math.ceil(inscritos * 0.1));
      c("🔴 ofertas · la cápsula legendaria: 320 ◈ con el 30 % (224 ◈) y el 10 % de los inscritos en unidades", manual && manual.cost === 320 && manual.flashOffer.discountPercent === 30
        && manual.stargateOferta.unidades === udsLeg && manual.globalStock === udsLeg, JSON.stringify(manual && { c: manual.cost, u: manual.stargateOferta.unidades, g: manual.globalStock, udsLeg }));
      await rita.foto(FOTOS + "/29-consola-ofertas.png");
      // 2b · y en la sesión que se proyecta, su diapositiva: la misma oferta que hay en la Nave
      const ses = await nueva("Rita proyecta la oferta");
      await ses.ir("entrar.html"); await ses.entrarComo("rita@lab.test", "Rita Referente");
      await ses.ir("sesion.html?per=" + P);
      const hayDia = await ses.hasta("[].slice.call(document.querySelectorAll('.barra-pasos .p')).some(function(b){return b.getAttribute('title')==='La oferta'})", 30);
      if (hayDia) { await ses.js("[].slice.call(document.querySelectorAll('.barra-pasos .p')).filter(function(b){return b.getAttribute('title')==='La oferta'})[0].click(); 1"); await dormir(1500); }
      const txtOf = hayDia ? await ses.js("(function(){ var d=document.querySelector('.lienzo .dia.oferta-dia'); return d?d.innerText:''; })()") : "";
      const dbgOf = await ses.js("(function(){ var t=document.querySelector('.lienzo .of-dia-txt'); if(!t) return 'sin .of-dia-txt · '+((document.querySelector('.lienzo')||{}).innerHTML||'').slice(0,400); var c=getComputedStyle(t), r=t.getBoundingClientRect(); return JSON.stringify({d:c.display,v:c.visibility,o:c.opacity,a:c.animationName,w:r.width,h:r.height,x:r.x,y:r.y,html:t.outerHTML.slice(0,160)}); })()");
      c("ofertas · la sesión proyectada tiene «⚡ La oferta de la semana»: imagen, precio tachado, unidades y hasta cuándo",
        /oferta de la semana/i.test(txtOf) && /◈/.test(txtOf) && /una por persona/.test(txtOf) && /hasta el (lunes|martes|miércoles|jueves|viernes|sábado|domingo)/.test(txtOf)
        && await ses.js("(function(){var i=document.querySelector('.lienzo .of-dia-img img'); return !!(i&&i.complete&&i.naturalWidth>0);})()"), txtOf.slice(0, 200) + " · " + dbgOf);
      c("ofertas · y en la diapositiva no hay letra por debajo de 12 px", await ses.js("[].slice.call(document.querySelectorAll('.lienzo .dia.oferta-dia *')).filter(function(e){return e.children.length===0&&e.textContent.trim()&&parseFloat(getComputedStyle(e).fontSize)<12}).length===0"));
      await ses.foto(FOTOS + "/29-sesion-oferta.png");
      await ses.cerrar();
      // 3 · Oferton la compra por la pantalla
      const q2 = await nave("compra la legendaria");
      await q2.js("document.querySelector('.nb-t[data-tab=\"mercado\"]').click(); 1");
      await q2.hasta(`!!document.querySelector('[data-canje="${manual._id}"]')`, 20);
      await q2.foto(FOTOS + "/29-mercado-oferta.png");
      await q2.js(`document.querySelector('[data-canje="${manual._id}"]').click(); 1`);
      await q2.hasta("!!document.querySelector('.neb-capa [data-si]')", 10); await q2.js("document.querySelector('.neb-capa [data-si]').click(); 1");
      c("🔴 ofertas · la compra se abre como una cápsula: su Mito, en grande", await q2.hasta("!!document.querySelector('.sb-capa')", 30));
      await dormir(1200); await q2.js("var x=document.querySelector('.sb-fin'); if(x) x.click(); 1"); await dormir(1200);
      const fo = await fichaDe(G[0], P), trasM = await leerDoc("rewards/" + manual._id);
      const leg = (fo.inventory || []).filter(x => /__heroe_H(25|26|29|30)_/.test(x));
      c("🔴 ofertas · pagó 224 ◈, tiene su legendario, y queda una unidad menos", fo.coins === 776 && leg.length === 1 && trasM.flashOffer.unitsSold === 1 && trasM.globalStock === udsLeg - 1,
        JSON.stringify([fo.coins, leg, trasM.flashOffer.unitsSold, trasM.globalStock]));
      const otra = await q2.js(`window.SG.MOTOR.oferta('${P}','comprar',{ofertaId:'${manual._id}'}).then(function(){return 'COMPRÓ'},function(e){return e.message})`, 60000);
      c("🔴 ofertas · una por persona: la segunda, no", /una por persona/.test(otra), otra);
      const porGP = await q2.js(`window.SG.MOTOR.llamar('purchaseReward',{projectId:'${P}',rewardId:'${manual._id}',studentProfileId:'${FO._id}'}).then(function(){return 'COMPRÓ'},function(e){return e.message})`, 60000);
      c("🔴 ofertas · y la tienda de GamificaPro no se la vende por detrás", !/COMPRÓ/.test(porGP), porGP);
      c("ofertas · un estudiante no puede crear ofertas", /Solo el referente/.test(await q2.js(`window.SG.MOTOR.oferta('${P}','crear',{que:{tipo:'cofre',cual:'cromo'},pct:90}).then(function(){return 'CREÓ'},function(e){return e.message})`)));
      await q2.cerrar();
      // 4 · el referente alarga, cambia unidades y cancela
      await rita.js("document.querySelector('.pest[data-tab=\"ofertas\"]').click(); 1"); await rita.hasta("document.querySelectorAll('[data-of]').length>=2", 15);
      const finAntes = (await leerDoc("rewards/" + manual._id)).flashOffer.endsAt;
      await rita.js(`document.querySelector('[data-of="${manual._id}"] [data-of-mas="1"]').click(); 1`);
      await rita.hasta("/Oferta alargada/.test((document.getElementById('c-aviso')||{}).innerText||'')", 20);
      const finDespues = (await leerDoc("rewards/" + manual._id)).flashOffer.endsAt;
      c("🔴 ofertas · «+1 día» la alarga un día", Math.abs(finDespues - finAntes - 864e5) < 5000, (finDespues - finAntes) + "");
      await rita.js(`window.prompt=function(){return '1'}; document.querySelector('[data-of="${manual._id}"] [data-of-uds]').click(); 1`);
      await rita.hasta("/Unidades cambiadas/.test((document.getElementById('c-aviso')||{}).innerText||'')", 20);
      const tras1 = await leerDoc("rewards/" + manual._id);
      c("ofertas · «Unidades…» → 1: vendida la única, se agota", tras1.stargateOferta.unidades === 1 && tras1.globalStock === 0, JSON.stringify([tras1.stargateOferta.unidades, tras1.globalStock]));
      // una errata no deja la oferta agotada: ni la consola la manda, ni el servidor la acepta
      await rita.js("document.getElementById('c-aviso') && (document.getElementById('c-aviso').innerText=''); 1");
      await rita.js(`window.prompt=function(){return 'cinco'}; document.querySelector('[data-of="${P}__oferta_s10"] [data-of-uds]').click(); 1`);
      c("ofertas · «Unidades…» con una errata («cinco»): la consola pide un número y no toca nada",
        await rita.hasta("/Escribe un número de unidades/.test((document.getElementById('c-aviso')||{}).innerText||'')", 10)
        && (await leerDoc("rewards/" + P + "__oferta_s10")).stargateOferta.unidades === so.unidades);
      const errata = await rita.js(`window.SG.MOTOR.oferta('${P}','unidades',{ofertaId:'${P}__oferta_s10',unidades:'cinco'}).then(function(){return 'CAMBIÓ'},function(e){return e.message})`, 60000);
      c("🔴 ofertas · y el servidor tampoco la acepta si le llega por otro camino", /Escribe un número/.test(errata) && (await leerDoc("rewards/" + P + "__oferta_s10")).stargateOferta.unidades === so.unidades, errata);
      await rita.js(`window.confirm=function(){return true}; document.querySelector('[data-of="${P}__oferta_s10"] [data-of-cancelar]').click(); 1`);
      await rita.hasta("/cancelada/.test((document.getElementById('c-aviso')||{}).innerText||'')", 20);
      c("ofertas · «Cancelar» la de la semana: fuera del Mercado ya", (await leerDoc("rewards/" + P + "__oferta_s10")).stargateOferta.cancelada === true);
      const q3 = await nave("tras cancelar");
      await q3.js("document.querySelector('.nb-t[data-tab=\"mercado\"]').click(); 1"); await dormir(2000);
      c("🔴 ofertas · y en el Mercado ya no sale ninguna (una cancelada, la otra agotada)", !(await q3.js("!!document.querySelector('.oferta-card')")));
      await q3.cerrar();
      await rita.js("var a=document.getElementById('of-auto'); a.checked=false; a.dispatchEvent(new Event('change')); 1");
      c("ofertas · y se pueden apagar las automáticas", await rita.hasta("/apagadas/.test((document.getElementById('c-aviso')||{}).innerText||'')", 20) && (await leerDoc("projects/" + P)).stargate.ofertasAuto === false);
      await fs.collection("projects").doc(P).update({ "stargate.ofertasAuto": true });
      c("ofertas · sin errores en la consola", !rita.errores.filter(e => !/Failed to load resource/.test(e)).length, rita.errores[0] || "");
      await rita.cerrar();
    }

    // ============================================================ 30 · EL SORTEO SE RESUELVE SOLO (SEMANA 16)
    /**
     * Norberto (14-sep): «el dinero no se devuelve: es como una lotería… se resuelve la semana 16,
     * automáticamente. Los estudiantes cuando entran esa semana les aparecerá "ver resultado del
     * sorteo" y aparecen los ganadores. Importante guardar estos datos para dar las licencias».
     */
    if (hacer(30)) {
      const A = admin(), fs = A.firestore(), P = "lab-clase", T = P + "__sorteoauto", PR = P + "__premio_sorteoauto", T0 = P + "__sorteovacio", PR0 = P + "__premio_sorteovacio";
      const GENTE = { gana: ["gana@lab.test", "Gana Prueba", "Fortuna"], pierde: ["pierde@lab.test", "Pierde Prueba", "Revés"], hielo: ["hielo@lab.test", "Hielo Prueba", "Escarcha"] };
      for (const k of Object.keys(GENTE)) { const [correo, nombre, alias] = GENTE[k];
        for (let i = 0; i < 2 && !(await fichaDe(correo, P)); i++) { const a = await nueva("Alta " + nombre); await alistar(a, correo, nombre, alias, 0); await a.cerrar(); } }
      const F = {}; for (const k of Object.keys(GENTE)) F[k] = await fichaDe(GENTE[k][0], P);
      const ayer = Date.now() - 3600e3, sem6 = Date.now() - 60 * 864e5;
      const premio = (id, t) => ({ projectId: P, title: t, description: "", cost: 0, inStore: false, type: "item", stargateTipo: "premio_sorteo", isLimitedStock: true, globalStock: 1, globalStockInitial: 1, requiresDelivery: true });
      const ticket = (id, pr, t) => ({ projectId: P, title: "Participación · " + t, description: "", cost: 20, type: "digital", enabled: true, inStore: true, systemEffect: "lottery_ticket",
        linkedItemId: pr, ticketDeadline: ayer, availableFrom: sem6, availableUntil: ayer, stargateTipo: "sorteo", stargateSemana: 6,
        stargateSorteo: { premio: t, ganadores: 1, fecha: ayer, desde: sem6, fijo: true, imagen: "sorteo.jpg" } });
      await fs.collection("rewards").doc(PR).set(premio(PR, "Una licencia de prueba"));
      await fs.collection("rewards").doc(T).set(ticket(T, PR, "Una licencia de prueba"));
      await fs.collection("rewards").doc(PR0).set(premio(PR0, "Un sorteo sin nadie"));
      await fs.collection("rewards").doc(T0).set(ticket(T0, PR0, "Un sorteo sin nadie"));
      // una sola papeleta en el bombo: gana Fortuna seguro (así se comprueba lo que ve quien gana y quien no)
      await fs.collection("student_profiles").doc(F.gana._id).update({ ["lotteryEntries." + T]: 3 });
      // 15-sep (decisión de Norberto): una cuenta congelada no entra en el bombo, aunque lleve 50 papeletas
      await fs.collection("student_profiles").doc(F.hielo._id).update({ ["lotteryEntries." + T]: 50, stargateCongelado: { por: "rita@lab.test", fecha: Date.now() } });
      const n1 = await nueva("Revés entra en la semana 16");
      // (el Gran Sorteo de Genially —si ya se sorteó en la 25— y el vacío, ya vistos: así el aviso es el de este)
      const vistosOtros = q => q.js(`['${P}__sorteo1','${T0}'].forEach(function(d){ localStorage.setItem('sgSorteoVisto_${P}_'+d,'1'); }); 1`);
      await n1.ir("entrar.html"); await n1.entrarComo(GENTE.pierde[0], GENTE.pierde[1]); await sinBienvenidas(n1); await vistosOtros(n1);
      await n1.ir("recluta.html?per=" + P);
      c("🔴 sorteo auto · al entrar alguien, el sorteo vencido se resuelve SOLO en el servidor", await (async () => { for (let i = 0; i < 30; i++) { const t = await leerDoc("rewards/" + T); if (t && t.isRaffleCompleted) return true; await dormir(700); } return false; })());
      const tk = await leerDoc("rewards/" + T), arch = await leerDoc("projects/" + P + "/lottery_archives/" + T);
      c("🔴 sorteo auto · la cuenta congelada (Escarcha, 50 papeletas) no entra en el bombo ni gana",
        !!arch && !(arch.bombo || []).some(b => b.ficha === F.hielo._id) && (tk.raffleWinnerIds || []).indexOf(F.hielo._id) < 0, JSON.stringify(arch && arch.bombo));
      c("🔴 sorteo auto · gana quien tenía papeletas, lo marca como automático y guarda su contacto (para dar la licencia a mano)",
        tk.raffleWinnerIds[0] === F.gana._id && tk.raffleResolvedBy === "auto" && arch && arch.automatico === true && arch.ganadoresContacto[0].correo === "gana@lab.test" && /Gana/.test(arch.ganadoresContacto[0].nombre),
        JSON.stringify(arch && arch.ganadoresContacto));
      c("sorteo auto · y el que no tenía a nadie se cierra sin ganadores", (await leerDoc("rewards/" + T0)).isRaffleCompleted === true && (await leerDoc("rewards/" + T0)).raffleWinnerIds.length === 0);
      c("🔴 sorteo auto · quien no ha ganado lo ve al entrar: «Ver resultado del sorteo»", await n1.hasta("!!document.querySelector('[data-sorteo-ver]')", 25), await n1.js("(document.querySelector('.sorteo-aviso')||{}).innerText||''"));
      await n1.js("document.querySelector('[data-sorteo-ver]').click(); 1");
      c("sorteo auto · NEBULA enseña el resultado: el ganador con su cara, y «esta vez no te ha tocado… lo jugado no se devuelve»",
        await n1.hasta("!!document.querySelector('.sorteo-resultado') && /Fortuna/.test(document.querySelector('.sorteo-resultado').innerText) && /no se devuelve/.test(document.querySelector('.sorteo-resultado').innerText)", 15));
      await dormir(1800); await n1.foto(FOTOS + "/30-resultado-no-gana.png");
      await n1.cerrar();
      const g1 = await nueva("Fortuna entra");
      await g1.ir("entrar.html"); await g1.entrarComo(GENTE.gana[0], GENTE.gana[1]); await sinBienvenidas(g1); await vistosOtros(g1);
      await g1.ir("recluta.html?per=" + P); await g1.hasta("!!document.querySelector('[data-sorteo-ver]')", 25);
      await g1.js("document.querySelector('[data-sorteo-ver]').click(); 1");
      c("🔴 sorteo auto · y quien gana: «🏆 ¡Eres tú!»", await g1.hasta("/Eres tú/.test((document.querySelector('.sorteo-resultado')||{}).innerText||'')", 15));
      await dormir(1800); await g1.foto(FOTOS + "/30-resultado-gana.png");
      await g1.cerrar();
      const rita = await nueva("Rita copia los ganadores");
      await rita.ir("entrar.html"); await rita.entrarComo("rita@lab.test", "Rita Referente");
      await rita.ir("consola.html?per=" + P); await rita.hasta("!!document.querySelector('.pest[data-tab=\"sorteos\"]')", 25);
      await rita.js("document.querySelector('.pest[data-tab=\"sorteos\"]').click(); 1"); await rita.hasta(`!!document.querySelector('[data-copiar-gan="${T}"]')`, 20);
      await rita.js("window.__copiado=''; navigator.clipboard.writeText=function(t){ window.__copiado=t; return Promise.resolve(); }; document.querySelector('[data-copiar-gan=\"" + T + "\"]').click(); 1");
      c("🔴 sorteo auto · en la consola, «se resolvió solo» y «📋 Copiar ganadores» copia alias, nombre y correo",
        await rita.hasta("/gana@lab\\.test/.test(window.__copiado||'') && /Fortuna/.test(window.__copiado)", 15) && /se resolvió solo/.test(await rita.texto()),
        await rita.js("window.__copiado||''"));
      await rita.foto(FOTOS + "/30-consola-ganadores.png");
      await rita.cerrar();
    }
    // ============================================================ 31 · EL RETO SECRETO S7 (EL FRAGMENTO PROHIBIDO)
    /**
     * «En la presentación del planeta Vínculo hay un enlace que no debería estar ahí. Encuéntralo,
     * resuelve el enigma que esconde y trae la PALABRA que Vaeon borró.» En el motor nuevo nadie la
     * pedía: S7 se regalaba con un clic. Tres puertas, tres personas: la Nave, el enigma y el enlace
     * universal de validar suelto. Y en ninguna se regala.
     */
    if (hacer(31)) {
      const P = "lab-clase";
      const S7 = (await consultar("missions", "projectId", P)).filter(m => m.stargateId === "S7")[0];
      c("secreto · el grupo tiene su reto S7", !!S7);
      const tiene = async (correo) => { const f = await fichaDe(correo, P); return !!f && (f.completedMissionIds || []).indexOf(S7._id) >= 0; };
      const PAL = "Ander";   // (la del enigma de Datos.gs; si cambia, esta sección lo dirá)
      // 1 · por la Nave: la ficha de la insignia pide la palabra
      const G1 = ["sira@lab.test", "Sira Secreta", "Sirena"];
      for (let i = 0; i < 2 && !(await fichaDe(G1[0], P)); i++) { const a = await nueva("Alta Sira"); await alistar(a, G1[0], G1[1], G1[2], 0); await a.cerrar(); }
      const q1 = await nueva("Sira, por la Nave");
      await q1.ir("entrar.html"); await q1.entrarComo(G1[0], G1[1]); await sinBienvenidas(q1);
      await q1.ir("recluta.html?per=" + P); await q1.hasta("!!window.SG_OPEN_BADGE && !!document.querySelector('.nb-t')", 30); await dormir(1500);
      await q1.js("window.SG_OPEN_BADGE('E3_vaeon'); 1");
      c("secreto · en la ficha de la insignia de Vaeon, la casilla pide «La palabra que borró Vaeon»",
        await q1.hasta("!!document.querySelector('input.mi-ev.secreto') && /La palabra que borró Vaeon/.test(document.querySelector('input.mi-ev.secreto').placeholder)", 15));
      await q1.js("document.getElementById('mi-hecho').click(); 1"); await dormir(800);
      c("🔴 secreto · «Lo he hecho» sin la palabra: no se registra y dice qué pide",
        /pide una palabra/.test(await q1.texto()) && !(await tiene(G1[0])));
      await q1.js("document.querySelector('input.mi-ev.secreto').value='Vaeon'; document.getElementById('mi-hecho').click(); 1"); await dormir(1500);
      c("🔴 secreto · con otra palabra («Vaeon»): «Esa no es» y tampoco", /Esa no es la palabra/.test(await q1.texto()) && !(await tiene(G1[0])));
      await q1.js("document.querySelector('input.mi-ev.secreto').value='" + PAL.toLowerCase() + " vaeon'; document.getElementById('mi-hecho').click(); 1");
      c("🔴 secreto · con la palabra (en minúsculas y con su apellido), S7 queda registrado",
        await (async () => { for (let i = 0; i < 30; i++) { if (await tiene(G1[0])) return true; await dormir(600); } return false; })());
      const fS = await fichaDe(G1[0], P);
      c("secreto · y la palabra no queda guardada como «evidencia» (no es un enlace)",
        !(await consultar("mission_deliveries", "projectId", P)).filter(d => d.missionId === S7._id && d.studentProfileId === fS._id && d.enlace).length);
      await q1.cerrar();
      // 2 · por el enigma: el telar, el sello y la revelación, y de ahí a validar
      const G2 = ["iker@lab.test", "Íker Enigma", "Íkaro"];
      for (let i = 0; i < 2 && !(await fichaDe(G2[0], P)); i++) { const a = await nueva("Alta Íker"); await alistar(a, G2[0], G2[1], G2[2], 0); await a.cerrar(); }
      const q2 = await nueva("Íker resuelve el enigma");
      await q2.ir("entrar.html"); await q2.entrarComo(G2[0], G2[1]);
      await q2.ir("fragmento.html"); await q2.hasta("!!document.getElementById('fr-app')", 20);
      await q2.js("localStorage.removeItem('sgFragmento'); location.reload(); 1"); await q2.hasta("!!document.getElementById('fr-seguir')", 20);
      c("secreto · el enigma abre con «El Fragmento Prohibido», fuera de los buscadores", /El Fragmento Prohibido/.test(await q2.texto())
        && await q2.js("(document.querySelector('meta[name=robots]')||{}).content==='noindex,nofollow'"));
      await q2.foto(FOTOS + "/31-portada.png");
      await q2.js("document.getElementById('fr-seguir').click(); 1"); await dormir(700);
      await q2.js("[['0','competidor'],['1','triunfador'],['2','explorador'],['3','socializador']].forEach(function(x){ document.querySelector('.fr-op[data-h=\"'+x[0]+'\"][data-t=\"'+x[1]+'\"]').click(); }); document.getElementById('fr-tensar').click(); 1"); await dormir(400);
      c("secreto · el telar con dos hilos cruzados se destensa (y no deja pasar)", /2 hilos cruzados/.test(await q2.js("document.getElementById('fr-msg').textContent")) && !(await q2.js("!!document.querySelector('.fr-revela')")));
      await q2.js("document.querySelector('.fr-op[data-h=\"2\"][data-t=\"socializador\"]').click(); document.querySelector('.fr-op[data-h=\"3\"][data-t=\"explorador\"]').click(); document.getElementById('fr-tensar').click(); 1"); await dormir(500);
      c("secreto · bien tensado, escribe la pista: «tantas veces como planetas has pisado»", /tantas veces como planetas/.test(await q2.texto()));
      await q2.foto(FOTOS + "/31-telar.png");
      await q2.js("document.getElementById('fr-seguir').click(); 1"); await dormir(700);
      for (let i = 0; i < 7; i++) { await q2.js("document.getElementById('fr-atras').click(); 1"); await dormir(100); }
      await dormir(500);
      c("🔴 secreto · siete giros atrás (Vínculo es el séptimo planeta) y el sello dice la palabra",
        (await q2.js("document.querySelector('.fr-lee').textContent")) === PAL.toUpperCase(), await q2.js("document.querySelector('.fr-lee').textContent"));
      await q2.js("document.getElementById('fr-palabra').value='Vaeon'; document.getElementById('fr-romper').click(); 1"); await dormir(900);
      c("secreto · con otra palabra, Vaeon se ríe y el sello no se rompe", !!(await q2.js("!!document.querySelector('.fr-vaeon')")) && !(await q2.js("!!document.querySelector('.fr-nombre')")));
      await q2.foto(FOTOS + "/31-sello.png");
      await q2.js("document.getElementById('fr-palabra').value='" + PAL + "'; document.getElementById('fr-romper').click(); 1"); await dormir(1500);
      c("🔴 secreto · con la palabra, la revelación: el nombre y su carta", (await q2.js("(document.querySelector('.fr-nombre')||{}).textContent")) === PAL.toUpperCase()
        && await q2.js("(function(){var i=document.getElementById('fr-carta'); return !!(i&&i.complete&&i.naturalWidth>0);})()"));
      await q2.foto(FOTOS + "/31-revelacion.png");
      await q2.js("document.getElementById('fr-registrar').click(); 1");
      c("🔴 secreto · «Registrar el reto secreto» → validar.html lo registra solo (la palabra viene del enigma)",
        await q2.hasta("/Registrado/.test(document.body.innerText)", 40) && await tiene(G2[0]), (await q2.texto()).slice(0, 160));
      c("secreto · y la palabra traída se borra del navegador", !(await q2.js("localStorage.getItem('sgSecreto:S7')")));
      c("secreto · el enigma, sin errores", !q2.errores.filter(e => !/Failed to load resource/.test(e)).length, q2.errores[0] || "");
      await q2.cerrar();
      // 3 · el enlace universal, suelto: ya no regala S7
      const G3 = ["otto@lab.test", "Otto Atajo", "Otilio"];
      for (let i = 0; i < 2 && !(await fichaDe(G3[0], P)); i++) { const a = await nueva("Alta Otto"); await alistar(a, G3[0], G3[1], G3[2], 0); await a.cerrar(); }
      const q3 = await nueva("Otto va directo a validar");
      await q3.ir("entrar.html"); await q3.entrarComo(G3[0], G3[1]);
      await q3.ir("validar.html?reto=S7");
      c("🔴 secreto · validar.html?reto=S7 sin haber resuelto nada: pide la palabra (antes lo regalaba)",
        await q3.hasta("!!document.getElementById('v-palabra')", 30) && !(await tiene(G3[0])));
      await q3.js("document.getElementById('v-palabra').value='nebula'; document.getElementById('v-ok').click(); 1"); await dormir(1200);
      c("secreto · con otra palabra: «Esa no es» y no se registra", /Esa no es la palabra/.test(await q3.texto()) && !(await tiene(G3[0])));
      await q3.js("document.getElementById('v-palabra').value='" + PAL + "'; document.getElementById('v-ok').click(); 1");
      c("secreto · con la palabra, sí", await q3.hasta("/Registrado/.test(document.body.innerText)", 40) && await tiene(G3[0]));
      await q3.cerrar();
      // 4 · la consola da el enlace para esconderlo
      const rita = await nueva("Rita copia el enlace escondido");
      await rita.ir("entrar.html"); await rita.entrarComo("rita@lab.test", "Rita Referente");
      await rita.ir("consola.html?per=" + P); await rita.hasta("!!document.querySelector('.pest[data-tab=\"ajustes\"]')", 25);
      await rita.js("document.querySelector('.pest[data-tab=\"ajustes\"]').click(); 1");
      c("secreto · consola → Ajustes → «Para los Geniallys»: el enlace escondido del reto secreto (fragmento.html)",
        await rita.hasta("[].slice.call(document.querySelectorAll('[data-copiar]')).some(function(b){return /fragmento\\.html$/.test(b.getAttribute('data-copiar'))})", 15));
      await rita.cerrar();
    }
    // ============================================================ 32 · EL EQUIPO DOCENTE, POR EL SERVIDOR
    /**
     * Norberto (15-sep): «sí, pásalo al servidor». Añadir a alguien al equipo lo hace `stargateEquipo`,
     * solo para el referente; y las reglas ya no dejan que un codocente toque el mando del grupo
     * (los correos con acceso, el dueño, la lista de roles). Rita es referente pero NO dueña del grupo.
     */
    if (hacer(32)) {
      const P = "lab-clase";
      const rita = await nueva("Rita añade a alguien al equipo");
      await rita.ir("entrar.html"); await rita.entrarComo("rita@lab.test", "Rita Referente");
      await rita.ir("consola.html?per=" + P); await rita.hasta("!!document.querySelector('.pest[data-tab=\"equipo\"]')", 25);
      await rita.js("document.querySelector('.pest[data-tab=\"equipo\"]').click(); 1"); await rita.hasta("!!document.getElementById('e-add')", 15);
      await rita.js("document.getElementById('e-nom').value='Nuria Nueva'; document.getElementById('e-mail').value='Nuria@Lab.test'; document.getElementById('e-rol').value='docente'; document.getElementById('e-add').click(); 1");
      c("equipo · la referente (que no es la dueña) añade a Nuria desde «Equipo docente»",
        await rita.hasta("/ya está en el equipo/.test((document.getElementById('c-aviso')||{}).innerText||'')", 30), await rita.js("(document.getElementById('c-aviso')||{}).innerText||''"));
      const pr = await leerDoc("projects/" + P), pv = await leerDoc("projects/" + P + "/privado/stargate");
      c("🔴 equipo · lo hace el servidor: su correo (en minúsculas) en los accesos y Nuria en la lista, como docente",
        (pr.coTeacherEmails || []).indexOf("nuria@lab.test") >= 0 && (pv.docentes || []).some(d => d.correo === "nuria@lab.test" && d.rol === "docente"),
        JSON.stringify([(pr.coTeacherEmails || []).slice(-2), (pv.docentes || []).slice(-1)]));
      await rita.cerrar();
      // Dani, docente raso, intenta hacerse referente: por el servidor y a pelo contra Firestore
      const dani = await nueva("Dani intenta hacerse referente");
      await dani.ir("entrar.html"); await dani.entrarComo("dani@lab.test", "Dani Docente");
      await dani.ir("consola.html?per=" + P); await dani.hasta("!!(window.SG && window.SG.MOTOR && window.SG.MOTOR.db)", 25); await dormir(1500);
      const porServidor = await dani.js(`window.SG.MOTOR.anadirDocente('${P}', { nombre: 'Dani', correo: 'dani@lab.test', rol: 'referente' }).then(function(){return 'LO HIZO'},function(e){return e.message})`, 60000);
      c("🔴 equipo · un docente raso no se hace referente por el servidor", !/LO HIZO/.test(porServidor) && /referente/i.test(porServidor), porServidor);
      const intento = (codigo) => dani.js(`(function(){ var M=window.SG.MOTOR; return (${codigo}).then(function(){return 'ESCRIBIÓ'},function(e){return String(e.code||e.message)}); })()`, 60000);
      const a1 = await intento(`M.setDoc(M.doc(M.db,'projects','${P}','privado','stargate'), { docentes: [{ nombre: 'Dani', correo: 'dani@lab.test', rol: 'referente' }] }, { merge: true })`);
      const a2 = await intento(`M.updateDoc(M.doc(M.db,'projects','${P}'), { ownerId: M.auth.currentUser.uid })`);
      const a3 = await intento(`M.updateDoc(M.doc(M.db,'projects','${P}'), { coTeacherEmails: ['dani@lab.test', 'amigo@lab.test'] })`);
      c("🔴 equipo · ni escribiendo a pelo en Firestore: ni la lista de roles, ni el dueño, ni los correos con acceso",
        [a1, a2, a3].every(x => /permission/i.test(x)), JSON.stringify([a1, a2, a3]));
      const pv2 = await leerDoc("projects/" + P + "/privado/stargate");
      c("equipo · y Dani sigue siendo docente", (pv2.docentes || []).some(d => d.correo === "dani@lab.test" && d.rol !== "referente"), JSON.stringify((pv2.docentes || []).filter(d => /dani/.test(d.correo))));
      const a4 = await intento(`M.updateDoc(M.doc(M.db,'projects','${P}'), { 'stargate.paneles.Dani': 'https://view.genially.com/dani' })`);
      c("equipo · lo de siempre lo sigue pudiendo: su panel en «Mis enlaces»", a4 === "ESCRIBIÓ", a4);
      await dani.cerrar();
    }
    // ============================================================ 33 · EL BUZÓN DEL MANDO («📡 Frecuencia de mando»)
    /**
     * Norberto (15-sep): «una página sencilla donde los docentes pongan problemas o recomendaciones, y
     * que lo resuelvas casi todo sin que yo intervenga». Dani (docente raso) escribe desde la llamada;
     * el Capitán le ofrece la solución al instante; envía; el Mando responde; Dani lo ve, contesta y
     * lo cierra. Rita no ve lo de Dani. Y una idea («interfaz rosa») no recibe soluciones inventadas.
     */
    if (hacer(33)) {
      const P = "lab-clase";
      const dani = await nueva("Dani escribe al Mando");
      await dani.ir("entrar.html"); await dani.entrarComo("dani@lab.test", "Dani Docente");
      await dani.ir("buzon.html?desde=llamada&per=" + P);
      c("buzón · la «Frecuencia de mando» se abre con la cuenta del docente, y lo más habitual a un clic",
        await dani.hasta("!!document.getElementById('bz-texto') && document.querySelectorAll('[data-chip]').length>=5", 30));
      await dani.js("document.querySelector('[data-chip=\"lista\"]').click(); 1"); await dormir(500);
      c("🔴 buzón · «No puedo pasar lista» → el Capitán da la solución conocida al instante (sin enviar nada)",
        await dani.hasta("[].slice.call(document.querySelectorAll('.bz-sol h3')).some(function(h){return /pasar lista/.test(h.textContent)})", 10));
      await dani.foto(FOTOS + "/33-buzon-capitan.png");
      await dani.js("var t=document.getElementById('bz-texto'); t.value='He cambiado el Genially del panel y sigue saliendo el viejo'; t.dispatchEvent(new Event('input')); 1"); await dormir(900);
      c("buzón · y mientras escribe, busca: «el Genially sigue saliendo el viejo» → su solución",
        await dani.js("[].slice.call(document.querySelectorAll('.bz-sol h3')).some(function(h){return /Genially/.test(h.textContent)})"));
      await dani.js("var t=document.getElementById('bz-texto'); t.value='No puedo pasar lista: los alumnos de mi escuadrón no ven el botón de Presente aunque la llamada está abierta'; t.dispatchEvent(new Event('input')); document.getElementById('bz-urgente').checked=true; document.getElementById('bz-urgente').dispatchEvent(new Event('change')); document.getElementById('bz-enviar').click(); 1");
      c("buzón · «📡 Transmitir al Mando» → «Transmisión recibida»", await dani.hasta("/Transmisión recibida/.test((document.getElementById('bz-aviso')||{}).innerText||'')", 25));
      const m1 = (await consultar("stargate_buzon", "correo", "dani@lab.test")).filter(m => /Presente/.test(m.texto))[0];
      c("🔴 buzón · llega con su contexto: grupo, desde la llamada, urgente, y lo que el Capitán le ofreció",
        m1 && m1.projectId === P && m1.contexto && m1.contexto.desde === "llamada" && m1.urgente === true && m1.estado === "nuevo" && (m1.autoayuda || []).length >= 1,
        JSON.stringify(m1 && { p: m1.projectId, d: m1.contexto && m1.contexto.desde, u: m1.urgente, a: m1.autoayuda }));
      await dani.js("document.querySelector('[data-tipo=\"idea\"]').click(); 1"); await dormir(300);
      await dani.js("var t=document.getElementById('bz-texto'); t.value='Quiero la interfaz rosa'; t.dispatchEvent(new Event('input')); 1"); await dormir(700);
      c("buzón · una idea («quiero la interfaz rosa»): ninguna solución inventada; se envía como idea",
        !(await dani.js("document.querySelectorAll('.bz-sol').length")));
      await dani.js("document.getElementById('bz-enviar').click(); 1"); await dani.hasta("/Transmisión recibida/.test((document.getElementById('bz-aviso')||{}).innerText||'')", 25);
      c("buzón · y en «Tus transmisiones», las dos", (await dani.js("document.querySelectorAll('.bz-lista .bz-msg').length")) === 2);
      await dani.cerrar();
      // Rita no ve lo de Dani (ni por la página ni a pelo)
      const rita = await nueva("Rita no ve lo de Dani");
      await rita.ir("entrar.html"); await rita.entrarComo("rita@lab.test", "Rita Referente");
      await rita.ir("buzon.html?per=" + P); await rita.hasta("!!document.getElementById('bz-texto')", 30); await dormir(1200);
      const aPelo = await rita.js("(function(){ var M=window.SG.MOTOR; return M.getDocs(M.collection(M.db,'stargate_buzon')).then(function(r){return 'LEYÓ '+r.size},function(e){return String(e.code||e.message)}); })()", 30000);
      c("🔴 buzón · Rita no ve las transmisiones de Dani (ni en su página ni pidiendo toda la colección)",
        (await rita.js("document.querySelectorAll('.bz-lista .bz-msg').length")) === 0 && !(await rita.js("!!document.querySelector('.bz-mando')")) && /permission/i.test(aPelo), aPelo);
      await rita.cerrar();
      // el Mando lo ve todo y responde
      const nor = await nueva("El Mando responde");
      await nor.ir("entrar.html"); await nor.entrarComo("n.cuartero.10@gmail.com", "Norberto Cuartero");
      await nor.ir("buzon.html"); await nor.hasta("!!document.querySelector('.bz-mando')", 30); await dormir(800);
      c("buzón · el Mando ve «Todas las transmisiones», con la urgente arriba y su contexto",
        await nor.js(`(function(){ var a=document.querySelector('.bz-mando .bz-msg[data-m="${m1 && m1._id}"]'); return !!a && a.classList.contains('urgente') && /desde llamada/.test(a.innerText) && document.querySelector('.bz-mando .bz-msg') === a; })()`));
      c("buzón · y a la idea, el Mando le propone «Anotado» (no «Resuelto»)",
        await nor.js("(function(){ var i=[].filter.call(document.querySelectorAll('.bz-mando .bz-msg'), function(a){ return /interfaz rosa/.test(a.innerText); })[0]; return !!i && i.querySelector('select').value === 'anotado'; })()"));
      await nor.js("window.scrollTo({ top: document.querySelector('.bz-mando').getBoundingClientRect().top + scrollY - 70, behavior: 'instant' }); 1"); await dormir(600);
      await nor.foto(FOTOS + "/33-buzon-mando.png");
      await nor.js(`(function(){ var a=document.querySelector('.bz-mando .bz-msg[data-m="${m1 && m1._id}"]'); a.querySelector('textarea').value='Arreglado: ya cada Comandante ve su propia llamada. Pide que recarguen la Nave.'; a.querySelector('select').value='resuelto'; a.querySelector('[data-responder]').click(); return 1; })()`);
      await nor.hasta("/Respondido/.test((document.getElementById('bz-aviso')||{}).innerText||'')", 20);
      const m1b = await leerDoc("stargate_buzon/" + m1._id);
      c("🔴 buzón · la respuesta del Mando queda en el hilo, «resuelto» y marcada como no leída para Dani",
        m1b && m1b.estado === "resuelto" && m1b.visto === false && (m1b.respuestas || []).slice(-1)[0].de === "mando", JSON.stringify(m1b && { e: m1b.estado, v: m1b.visto }));
      await nor.cerrar();
      // Dani ve el aviso en su consola, lee, contesta y lo cierra
      const dani2 = await nueva("Dani lee la respuesta");
      await dani2.ir("entrar.html"); await dani2.entrarComo("dani@lab.test", "Dani Docente");
      await dani2.ir("consola.html"); await dani2.hasta("!!document.querySelector('[data-bz]')", 30); await dormir(2500);
      c("buzón · en su consola, «📡 ¿Algo falla?» avisa de la respuesta sin leer (1)",
        await dani2.hasta("!!document.querySelector('[data-bz] .bz-n') && document.querySelector('[data-bz] .bz-n').textContent==='1'", 15));
      await dani2.foto(FOTOS + "/33-consola-aviso.png");
      await dani2.js("document.querySelector('[data-bz]').click(); 1"); await dani2.hasta("!!document.querySelector('.bz-msg.fresco')", 30);
      c("buzón · y en el buzón, la respuesta nueva resaltada", /respuesta nueva/i.test(await dani2.js(`document.querySelector('.bz-msg[data-m="${m1._id}"]').innerText`)));
      await dani2.js(`(function(){ var a=document.querySelector('.bz-msg[data-m="${m1._id}"]'); window.scrollTo({ top: a.getBoundingClientRect().top + scrollY - 70, behavior: 'instant' }); return 1; })()`); await dormir(600);
      await dani2.foto(FOTOS + "/33-buzon-respuesta.png");
      await dormir(1500);
      c("buzón · al verla, deja de estar «sin leer»", (await leerDoc("stargate_buzon/" + m1._id)).visto === true);
      await dani2.js(`(function(){ var a=document.querySelector('.bz-lista .bz-msg[data-m="${m1._id}"]'); a.querySelector('textarea').value='Funciona, gracias'; a.querySelector('[data-responder]').click(); return 1; })()`);
      await dani2.hasta("/Enviado al Mando/.test((document.getElementById('bz-aviso')||{}).innerText||'')", 20);
      const m1c = await leerDoc("stargate_buzon/" + m1._id);
      c("buzón · Dani contesta: su respuesta, en el hilo, y el mensaje vuelve a «nuevo» (el Mando lo verá)",
        m1c.estado === "nuevo" && m1c.respuestas.length === 2 && m1c.respuestas[1].de === "docente");
      await dani2.js(`document.querySelector('.bz-lista .bz-msg[data-m="${m1._id}"] [data-cerrar]').click(); 1`);
      await dani2.hasta("/Cerrado/.test((document.getElementById('bz-aviso')||{}).innerText||'')", 20);
      c("buzón · y lo da por resuelto él mismo", (await leerDoc("stargate_buzon/" + m1._id)).estado === "resuelto");
      c("buzón · sin errores en la página", !dani2.errores.filter(e => !/Failed to load resource/.test(e)).length, dani2.errores[0] || "");
      await dani2.cerrar();
    }

    // ============================================================ 34 · LA CLASE DEL 15-SEP: MENSAJE, FICHAS, ENTREGAS, SIMULACRO…
    /**
     * Lo que Norberto pidió probando la sesión dentro de su Genially: el mensaje del foro como apertura de
     * saga antes del vídeo; la ficha de cada recluta al pulsar su cara (sin datos personales); sus enlaces
     * debajo del avatar; el simulacro en todas las semanas con selector; cerrar sesión en el embed; que un
     * estudiante que entre por ahí vaya a su Nave (y quien no es nadie, a «ningún comandante»). Y de paso:
     * el temporizador del aula, las dudas del Capitán, las insignias por temas y el «+» del segundo enlace.
     */
    if (hacer(34)) {
      const P = "lab-clase", A = admin(), fs = A.firestore();
      const dani = await nueva("Dani proyecta la sesión");
      await dani.ir("entrar.html"); await dani.entrarComo("dani@lab.test", "Dani Docente");
      // una semana cuya anterior tenga misiones hechas (para las caras y sus entregas)
      let sem = 0;
      for (const k of [3, 4, 5, 6, 7, 8, 9, 10]) {
        await dani.ir("sesion.html?per=" + P + "&sem=" + k);
        if (!(await dani.hasta("!!document.querySelector('.barra-pasos .p')", 30))) continue;
        if (await dani.js("!![].slice.call(document.querySelectorAll('.barra-pasos .p')).filter(function(b){return /^Misiones de la semana/.test(b.title)})[0]")) { sem = k; break; }
      }
      const titulos = await dani.js("[].slice.call(document.querySelectorAll('.barra-pasos .p')).map(function(b){return b.title})");
      const iLl = titulos.indexOf("Llamada a filas"), iMs = titulos.indexOf("El mensaje");
      c("🔴 sesión · el mensaje de la semana va justo después de la llamada a filas (antes del vídeo)", iMs > 0 && iMs === iLl + 1, JSON.stringify(titulos.slice(0, 5)));
      const irA = async (re) => dani.js(`(function(){ var b=[].slice.call(document.querySelectorAll('.barra-pasos .p')).filter(function(x){return ${re}.test(x.title)})[0]; if(b){ b.click(); return true; } return false; })()`);
      await irA("/^El mensaje$/"); await dormir(900);
      c("sesión · el mensaje, como la apertura de una saga: «Hace muy poco…», el logo y el texto subiendo",
        await dani.hasta("!!document.querySelector('.foro-crawl.f1') && /Hace muy poco/.test(document.querySelector('.fc-intro').textContent)", 8));
      c("sesión · sin enlaces ni la marca del grupo (en una proyección no se pulsan)",
        await dani.js("(function(){ var t=document.querySelector('.fc-texto').textContent; return t.length>80 && !/https?:|id-del-PER|\\{/.test(t) && /Semana/.test(t); })()"));
      c("sesión · con su botón de música", await dani.js("!!document.querySelector('.fc-son')"));
      await dormir(5600);
      c("sesión · y a los 6 s el texto ya sube", await dani.js("document.querySelector('.foro-crawl').classList.contains('f3')"));
      await dani.foto(FOTOS + "/34-crawl.png");
      // las misiones de la semana pasada: sus entregas, a un clic
      if (sem) {
        await irA("/^Misiones de la semana/"); await dormir(800);
        const fig = await dani.js("(function(){ var f=document.querySelector('.anteriores figure[data-ficha][data-reto]'); return f?{ficha:f.getAttribute('data-ficha'), reto:f.getAttribute('data-reto')}:null; })()");
        c("sesión · cada cara de «¿Quién las ha superado?» sabe su ficha y su reto", !!(fig && fig.ficha && fig.reto), JSON.stringify(fig));
        if (fig && fig.ficha) {
          await fs.collection("mission_deliveries").doc("lab34__" + fig.ficha).set({ projectId: P, missionId: "lab34__" + fig.reto, studentProfileId: fig.ficha,
            userId: "lab34", stargateReto: fig.reto, enlace: "padlet.com/lab/primera https://lab.test/segunda", createdAt: Date.now() });
          await dani.ir("sesion.html?per=" + P + "&sem=" + sem); await dani.hasta("!!document.querySelector('.barra-pasos .p')", 30);
          await irA("/^Misiones de la semana/");
          c("🔴 sesión · debajo de su cara, «🔗 Ver» y «🔗 Ver 2»: sus dos enlaces, en otra pestaña",
            await dani.hasta(`(function(){ var f=document.querySelector('.anteriores figure[data-ficha="${fig.ficha}"][data-reto="${fig.reto}"]'); if(!f) return false;
              var a=f.querySelectorAll('.ev-ver'); return a.length===2 && a[0].href==='https://padlet.com/lab/primera' && a[1].target==='_blank'; })()`, 15));
          await dormir(1500); await dani.foto(FOTOS + "/34-entregas.png");
        }
        // la ficha del recluta al pulsar su cara
        await dani.js("document.querySelector('.anteriores .cara[data-quien]').click(); 1"); await dormir(500);
        const ficha = await dani.js("(function(){ var o=document.querySelector('#mazo .ses-ficha'); return o?o.innerText:''; })()");
        c("🔴 sesión · al pulsar una cara se abre su ficha (dentro del mazo): nivel, insignias y retos conseguidos",
          /Nivel \d+/.test(ficha) && /retos conseguidos/i.test(ficha), ficha.slice(0, 160));
        c("sesión · sin datos personales: ni correos ni créditos", !/@|◈|créditos/i.test(ficha), ficha.slice(0, 200));
        await dani.foto(FOTOS + "/34-ficha.png");
        await dani.js("document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'})); 1"); await dormir(300);
        c("sesión · Escape la cierra (y no pasa de diapositiva)", await dani.js("!document.querySelector('.ses-ficha')"));
      }
      // el simulacro, en todas las semanas y con selector
      await irA("/^(La Nave|Enséñalo)$/"); await dormir(800);
      const nSem = await dani.js("(document.querySelectorAll('.sim-sem option')||[]).length");
      c("🔴 sesión · el simulacro sale esta semana también, con el selector de las 15 semanas", nSem === 15, "opciones: " + nSem);
      await dani.js("var s=document.querySelector('.sim-sem'); s.value='2'; s.dispatchEvent(new Event('change')); 1"); await dormir(400);
      c("sesión · al elegir la semana 2, la Nave simulada salta a esa semana (y NEBULA enseña el Mercado)",
        await dani.js("(function(){ var f=document.querySelector('.dia.simulacro iframe'); return !!f && /semana=2/.test(f.src) && /nebula=1/.test(f.src) && /simulacro=1/.test(f.src); })()"));
      await dani.cerrar();

      // el embed: salir, y quién entra por ahí
      const dani3 = await nueva("Dani sale del embed");
      await dani3.ir("entrar.html"); await dani3.entrarComo("dani@lab.test", "Dani Docente");
      await dani3.ir("sesion.html?embed=1");
      c("embed · con la sesión dentro del Genially, «⏻» para cerrar sesión (o «⏻ Cerrar sesión» al elegir grupo)",
        await dani3.hasta("!!document.querySelector('#ses-salir-b, #ses-salir')", 30));
      await dani3.js("(document.querySelector('#ses-salir-b')||document.querySelector('#ses-salir')).click(); 1"); await dormir(300);
      await dani3.js("var b=document.querySelector('#ses-salir-b'); if(b) b.click(); 1");
      c("🔴 embed · y sale: vuelve la puerta de Google", await dani3.hasta("/Entra con tu cuenta de docente/.test(document.body.innerText)", 20));
      await dani3.cerrar();
      const ana = await nueva("Ana entra por la sesión");
      await ana.ir("entrar.html"); await ana.entrarComo("ana@lab.test", "Ana Nueva");
      await ana.ir("sesion.html?embed=1");
      c("🔴 embed · una estudiante que entra por la sesión va directa a SU Nave (sin la cabecera)",
        await ana.hasta("location.pathname.indexOf('recluta.html')>=0 && /per=lab-clase/.test(location.search) && /embed=1/.test(location.search)", 30), await ana.js("location.href"));
      // su Nave: insignias por temas y el «+» del segundo enlace
      await ana.hasta("!!document.querySelector('.nb-t[data-tab=\"botin\"]')", 30);
      await ana.js("document.querySelector('.nb-t[data-tab=\"botin\"]').click(); 1");
      c("🔴 Nave · las insignias, por temas: 8 planetas + la historia + los hitos, las 24 casillas",
        await ana.hasta("document.querySelectorAll('.ins-tema').length===10 && document.querySelectorAll('.ins-temas .badge-col .b[data-key]').length===24", 15),
        await ana.js("document.querySelectorAll('.ins-tema').length+' temas · '+document.querySelectorAll('.ins-temas .b').length"));
      await ana.foto(FOTOS + "/34-insignias-temas.png");
      await ana.js("var t=document.querySelector('.nb-t[data-tab=\"retos\"]'); if(t) t.click(); 1"); await dormir(700);
      const mas = await ana.js("(function(){ var b=document.querySelector('[data-evmas]'); if(!b) return 'sin +'; b.click(); var i=b.parentNode.querySelector('[data-ev2]'); return i&&!i.hidden&&b.hidden?'ok':'no'; })()");
      c("Nave · el «+» abre un segundo enlace (opcional)", mas === "ok", mas);
      await ana.cerrar();
      const nadie = await nueva("Nadie entra por la sesión");
      await nadie.ir("entrar.html"); await nadie.entrarComo("nadie34@lab.test", "Nadie");
      await nadie.ir("sesion.html?embed=1");
      c("🔴 embed · quien no es ni docente ni recluta: «esas credenciales no coinciden con las de ningún comandante» y otra cuenta",
        await nadie.hasta("/ningún comandante/.test(document.body.innerText) && !!document.getElementById('ses-otra')", 30), (await nadie.texto()).slice(0, 160));
      await nadie.cerrar();

      // el temporizador del aula
      const au = await nueva("Dani pone el temporizador");
      await au.ir("entrar.html"); await au.entrarComo("dani@lab.test", "Dani Docente");
      await au.ir("aula.html?embed=1&per=" + P);
      await au.hasta("!!document.querySelector('[data-au=\"tiempo\"]')", 30);
      await au.js("document.querySelector('[data-au=\"tiempo\"]').click(); 1"); await dormir(300);
      await au.js("document.querySelector('[data-min=\"1\"]').click(); 1"); await dormir(200);
      await au.js("document.getElementById('au-t-go').click(); 1"); await dormir(2300);
      c("🔴 aula · ⏱️ Tiempo: 1 minuto, en marcha", /^0:5\d$/.test(await au.js("document.getElementById('au-reloj').textContent")), await au.js("document.getElementById('au-reloj').textContent"));
      await au.foto(FOTOS + "/34-temporizador.png");
      await au.js("document.querySelector('[data-au=\"clase\"]').click(); 1"); await dormir(700);
      c("aula · y sigue contando en la barra al cambiar de pestaña", await au.js("!!document.querySelector('.au-mini-reloj.corre')"));
      await au.cerrar();

      // el Capitán contesta las dudas al momento, con los datos del grupo
      const bz = await nueva("Dani pregunta al Capitán");
      await bz.ir("entrar.html"); await bz.entrarComo("dani@lab.test", "Dani Docente");
      await bz.ir("buzon.html?per=" + P);
      await bz.hasta("!!document.querySelector('[data-duda=\"invitacion\"]')", 30);
      await bz.js("document.querySelector('[data-duda=\"invitacion\"]').click(); 1"); await dormir(500);
      const cod = ((await leerDoc("projects/" + P)) || {}).joinCode || "";
      c("🔴 buzón · «¿Cuál es el código de invitación?» → el Capitán da SU código y el botón de copiar la invitación",
        !!cod && await bz.js(`(function(){ var s=document.querySelector('.bz-sol'); return !!s && s.innerText.indexOf(${JSON.stringify(cod)})>=0 && /Copiar invitación/.test(s.innerText); })()`), cod);
      await bz.foto(FOTOS + "/34-capitan-codigo.png");
      await bz.js("var t=document.getElementById('bz-texto'); t.value='¿Cómo cambio los enlaces de Genially?'; t.dispatchEvent(new Event('input')); 1"); await dormir(700);
      c("buzón · «¿Cómo cambio los enlaces de Genially?» → a sus «Mis enlaces», directo",
        await bz.js("!!document.querySelector('.bz-sol a[href*=\"tab=mios\"]')"));
      c("buzón · sin errores en la página", !bz.errores.filter(e => !/Failed to load resource/.test(e)).length, bz.errores[0] || "");
      await bz.cerrar();
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
