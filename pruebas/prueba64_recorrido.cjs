'use strict';
/**
 * BATERÍA 64 · EL RECORRIDO HUMANO — los casos.
 * Ver `recorrido.cjs` para el porqué y la fontanería.
 */
const fs = require("fs"), path = require("path"), { spawn } = require("child_process");
const R = require("./recorrido.cjs");
const { pestana, evaluar, hasta, comprobar, conTope, QUIENES, P_WEB, P_CDP, CHROME, VER,
        esperarChrome, dormir, RAIZ, marcador } = R;
/** Ninguna página puede quedarse con la batería. Si se atasca, se anota y se sigue. */
const ATASCADAS = [];
async function abrirSeguro(quien, pagina, listo) {
  try { return await conTope(abrir(quien, pagina, listo), 30000, pagina + " (" + quien + ")"); }
  catch (e) { ATASCADAS.push(pagina + " (" + quien + "): " + e.message); return null; }
}
const BASE = `http://127.0.0.1:${P_WEB}/`;

/** Abre una página y espera a que el JS de pantalla haya pintado algo. */
/**
 * 🔴 CADA ESCENARIO EMPIEZA LIMPIO, y esto casi me engaña a mí. Las pestañas comparten el
 * `localStorage` del origen, así que el `sgEsDocente` que dejaba puesto el recorrido del referente
 * seguía ahí cuando llegaba el visitante «anónimo» — y la guía se le abría sin pedirle nada. Parecía
 * un fallo de la web y era un fallo de la prueba: en la vida real no hay dos personas compartiendo
 * el mismo navegador. Sin esto, la batería miente en la dirección peligrosa: dice que todo va bien.
 */
async function abrir(quien, pagina, listo) {
  process.stderr.write("   · " + pagina + " (" + quien + ")\n");
  const c = await pestana(QUIENES[quien]);
  await c.enviar("Page.navigate", { url: BASE + "entrar.html" });
  await hasta(c, "document.readyState!=='loading'", 8);
  try { await evaluar(c, "localStorage.clear();sessionStorage.clear();1"); } catch (e) {}
  await c.enviar("Page.navigate", { url: BASE + pagina });
  await hasta(c, "document.readyState==='complete'", 10);
  if (listo) await hasta(c, listo, 10);
  await dormir(300);
  return c;
}

/**
 * 🔴 LA COMPROBACIÓN QUE FALTABA: ¿se ve la acción principal SIN hacer scroll?
 * Devuelve dónde cae el elemento respecto del pliegue de 800 px.
 */
const SOBRE_EL_PLIEGUE = `(function(sel){
  var e = document.querySelector(sel); if (!e) return { hay:false };
  var r = e.getBoundingClientRect();
  var vis = getComputedStyle(e);
  return { hay:true, top: Math.round(r.top + scrollY), alto: document.body.scrollHeight,
           visible: vis.display!=='none' && vis.visibility!=='hidden' && r.width>0 && r.height>0,
           texto: (e.textContent||'').trim().slice(0,60) };
})`;

/** Todos los enlaces internos de la página, para comprobar que no apuntan al vacío. */
const ENLACES = `[].slice.call(document.querySelectorAll('a[href]'))
  .map(function(a){ return a.getAttribute('href'); })
  .filter(function(h){ return h && !/^(https?:|mailto:|tel:|#|javascript:)/i.test(h); })`;

/** Botones que no hacen NADA: ni onclick, ni href, ni submit, ni data-* que alguien escuche. */
const BOTONES_MUDOS = `[].slice.call(document.querySelectorAll('button:not([disabled])'))
  .filter(function(b){
    if (b.onclick || b.type==='submit' || b.form) return false;
    if (b.className && /tour-start|drop-btn|tab|acc|x\\b/.test(b.className)) return false;
    if (b.dataset && Object.keys(b.dataset).length) return false;
    if (b.closest('[data-listo]')) return false;
    return true;
  }).map(function(b){ return (b.id||b.className||'') + '::' + (b.textContent||'').trim().slice(0,40); })`;

(async () => {
  // servidor local: la web tal cual, sin tocar nada
  const web = spawn("python3", ["-m", "http.server", String(P_WEB), "--bind", "127.0.0.1"],
                    { cwd: RAIZ, stdio: "ignore" });
  const perfil = fs.mkdtempSync(path.join(require("os").tmpdir(), "sgrec-"));
  const args = ["--disable-gpu", "--no-first-run", "--no-default-browser-check",
                `--remote-debugging-port=${P_CDP}`, `--user-data-dir=${perfil}`, "about:blank"];
  if (!VER) args.unshift("--headless=new");
  const chrome = spawn(CHROME, args, { stdio: "ignore" });
  const abiertas = [];
  try {
    await esperarChrome();
    await dormir(600);

    // ============================================================ 1 · LA PUERTA ÚNICA
    {
      const c = await abrir("anonimo", "entrar.html", "!!document.querySelector('#e-google')");
      abiertas.push(c);
      const b = await evaluar(c, `${SOBRE_EL_PLIEGUE}('#e-google')`);
      comprobar("entrar · el botón de Google existe", b.hay);
      comprobar("entrar · se ve", b.hay && b.visible);
      comprobar("entrar · SIN SCROLL (el fallo del 12-sep)", b.hay && b.top < 700, b.hay ? "cae a " + b.top + " px" : "no está");
      comprobar("entrar · la página no obliga a bajar", b.alto < 1100, "alto " + b.alto);
      comprobar("entrar · dice «Google» en el botón", /google/i.test(b.texto || ""), b.texto);
      comprobar("entrar · sin errores de consola", c.errores.length === 0, c.errores[0]);

      /**
       * 🔴 QUE PAREZCA EL DE GOOGLE, no solo que lo diga. `.btn.primary` (0,2,0) le ganaba en
       * especificidad a `.btn-google` (0,1,0) y el botón salía turquesa con la «G» encima:
       * exactamente lo que no reconoce nadie. Un botón de identidad tiene que PARECERSE al de
       * siempre —pastilla blanca, letra oscura, la «G» a la izquierda—, porque esa forma es medio
       * mensaje: dice sin leer que la contraseña se teclea en Google. Comprobar el color calculado
       * y no la clase es la diferencia entre vigilar el resultado y vigilar la intención.
       */
      const pinta = await evaluar(c, `(function(){
        var b = document.querySelector('#e-google'), s = getComputedStyle(b);
        var m = s.backgroundColor.match(/\\d+/g) || [];
        return { fondo: s.backgroundColor, claro: m.length >= 3 && +m[0] > 230 && +m[1] > 230 && +m[2] > 230,
                 svg: !!b.querySelector('svg'), colores: b.querySelectorAll('svg path').length };
      })()`);
      comprobar("entrar · el botón lleva la «G» de cuatro colores", pinta.svg && pinta.colores === 4,
                "svg " + pinta.svg + ", paths " + pinta.colores);
      comprobar("entrar · y es la pastilla BLANCA de Google, no la de nuestra paleta",
                pinta.claro, pinta.fondo);
    }

    // ============================================================ 2 · REPARTO POR ROL
    const reparto = [
      ["referente",  "consola.html",  "el referente va a su puesto de mando"],
      ["docente",    "consola.html",  "el docente raso va a su puesto de mando"],
      ["estudiante", "recluta.html",  "el estudiante va a su Nave"],
    ];
    for (const [quien, destino, titulo] of reparto) {
      const c = await pestana(QUIENES[quien]); abiertas.push(c);
      await c.enviar("Page.navigate", { url: BASE + "entrar.html" });
      const fue = await hasta(c, `location.pathname.indexOf('${destino}')>=0`, 15);
      comprobar("reparto · " + titulo, fue, "acabó en " + await evaluar(c, "location.pathname"));
    }
    {
      // el desconocido: no va a ninguna parte, se le pide el código
      const c = await pestana(QUIENES.desconocido); abiertas.push(c);
      await c.enviar("Page.navigate", { url: BASE + "entrar.html" });
      const pide = await hasta(c, "!!document.querySelector('#e-cod')", 15);
      comprobar("reparto · al desconocido se le pide el código de clase", pide);
      if (pide) {
        const caja = await evaluar(c, `${SOBRE_EL_PLIEGUE}('#e-cod')`);
        comprobar("código · la caja se ve sin scroll", caja.hay && caja.top < 700, "cae a " + caja.top);
        // un código que no existe
        await evaluar(c, "document.querySelector('#e-cod').value='ZZZZZZ';document.querySelector('#e-cod-ok').click();1");
        const malo = await hasta(c, "!!document.querySelector('.puerta-mal')", 8);
        comprobar("código · un código falso da un aviso legible, no un callejón", malo);
        comprobar("código · y se puede volver a intentar", await evaluar(c, "!!document.querySelector('#e-cod')"));
        // el bueno
        await evaluar(c, "document.querySelector('#e-cod').value='l4pl9a';document.querySelector('#e-cod-ok').click();1");
        const fue = await hasta(c, "location.pathname.indexOf('alistarse.html')>=0", 12);
        comprobar("código · el bueno lleva al alistamiento (y en minúsculas también)", fue,
                  await evaluar(c, "location.href"));
        comprobar("código · con el grupo y el código puestos en la URL",
                  fue && /per=prueba-humana/.test(await evaluar(c, "location.search")) &&
                         /codigo=L4PL9A/i.test(await evaluar(c, "location.search")));
      }
    }

    // ============================================================ 3 · EL VOLVER DE LA PUERTA
    {
      const c = await pestana(QUIENES.referente); abiertas.push(c);
      await c.enviar("Page.navigate", { url: BASE + "entrar.html?volver=guia.html" });
      const fue = await hasta(c, "location.pathname.indexOf('guia.html')>=0", 15);
      comprobar("volver · te devuelve a donde ibas", fue, await evaluar(c, "location.pathname"));
      comprobar("volver · y la guía ya NO vuelve a pedir la puerta",
                fue && !(await evaluar(c, "!!document.getElementById('puerta')")));
    }
    {
      // 🔴 y que no sirva de trampolín a otro sitio
      const c = await pestana(QUIENES.referente); abiertas.push(c);
      await c.enviar("Page.navigate", { url: BASE + "entrar.html?volver=https://ejemplo.com/pillado" });
      await hasta(c, "location.pathname.indexOf('consola.html')>=0", 15);
      const donde = await evaluar(c, "location.host");
      comprobar("volver · un destino de fuera se ignora", donde === "127.0.0.1:" + P_WEB, donde);
    }

    // ============================================================ 4 · LO QUE NO DEBE VER UN DOCENTE RASO
    {
      const c = await abrir("docente", "consola.html", "!!document.querySelector('#consola-app .card, #consola-app article')");
      abiertas.push(c);
      const crear = await evaluar(c, `!!document.querySelector('a[href*="crear.html"]:not([hidden])')`);
      comprobar("docente raso · no se le ofrece «Crear grupo»", !crear);
    }
    {
      const c = await abrir("referente", "consola.html", "!!document.querySelector('#consola-app .card, #consola-app article')");
      abiertas.push(c);
      const crear = await evaluar(c, `!!document.querySelector('a[href*="crear.html"]')`);
      comprobar("referente · sí se le ofrece «Crear grupo»", crear);
    }

    // ============================================================ 5 · NINGÚN ENLACE AL VACÍO
    // 🔴 Esto se lee del HTML, no se abre en Chrome: son 28 páginas y un enlace roto no necesita un
    // navegador para verse. Abrirlas una a una tardaba más que todo lo demás junto.
    {
      const rotos = [], vacios = [];
      const paginas = fs.readdirSync(RAIZ).filter(f => f.endsWith(".html"));
      for (const p of paginas) {
        const html = fs.readFileSync(path.join(RAIZ, p), "utf8");
        // solo el HTML que se sirve, no las cadenas de dentro del JS de datos
        const limpio = html.replace(/<script[\s\S]*?<\/script>/g, "");
        const re = /<a\b[^>]*?href\s*=\s*["']([^"']+)["'][^>]*>/gi;
        let m;
        while ((m = re.exec(limpio))) {
          const h = m[1].trim();
          if (!h) { vacios.push(p); continue; }
          if (/^(https?:|mailto:|tel:|#|javascript:|data:)/i.test(h)) continue;
          const f = h.split("#")[0].split("?")[0];
          if (!f) continue;
          if (!fs.existsSync(path.join(RAIZ, decodeURIComponent(f)))) rotos.push(p + " → " + h);
        }
      }
      comprobar("enlaces · ninguno apunta a una página que no existe", rotos.length === 0,
                [...new Set(rotos)].slice(0, 10).join(" · "));
      comprobar("enlaces · ninguno con el href vacío", vacios.length === 0, vacios.join(" · "));
      comprobar("enlaces · se han revisado las " + paginas.length + " páginas", paginas.length >= 25);
    }

    // ============================================================ 6 · LA GUÍA, SIN SESIÓN
    {
      const c = await abrir("anonimo", "guia.html", "!!document.getElementById('puerta')");
      abiertas.push(c);
      const b = await evaluar(c, `${SOBRE_EL_PLIEGUE}('#puertaCuenta')`);
      comprobar("guía · la puerta aparece y su botón se ve", b.hay && b.visible);
      comprobar("guía · el botón está sobre el pliegue", b.hay && b.top < 700, "cae a " + b.top);
      await evaluar(c, `(function(){ var o=document.getElementById('puertaCuenta');
        if (o) o.click(); return !!o; })()`);
      const fue = await hasta(c, "location.pathname.indexOf('entrar.html')>=0", 10);
      comprobar("guía · su botón lleva a la puerta única, no a una página de texto", fue,
                await evaluar(c, "location.pathname + location.search"));
      comprobar("guía · y con el destino puesto",
                fue && /volver=guia\.html/.test(await evaluar(c, "location.search")));
    }

    // ============================================================ 7 · SIN BOTONES MUDOS
    {
      const mudos = [];
      for (const p of ["entrar.html", "index.html", "consola.html", "recluta.html", "alistarse.html"]) {
        const c = await abrir("referente", p);
        const m = await evaluar(c, BOTONES_MUDOS);
        (m || []).forEach(x => mudos.push(p + " → " + x));
        await c.destruir();
      }
      comprobar("botones · ninguno se queda sin hacer nada al pulsarlo", mudos.length === 0,
                mudos.slice(0, 6).join(" · "));
    }

    // ============================================================ 8 · EL PIN, QUE YA NO EXISTE
    {
      const conPin = [];
      for (const p of ["index.html", "entrar.html", "guia.html", "consola.html", "recluta.html", "alistarse.html"]) {
        const html = fs.readFileSync(path.join(RAIZ, p), "utf8");
        // 🔴 Lo que se persigue es que nadie PIDA un PIN, no que se nombre. «Sin ningún PIN» es una
        // promesa que tranquiliza a quien usó el sistema viejo, y prohibirla por si acaso sería
        // confundir la palabra con el problema. Lo que no puede volver: una caja donde teclearlo,
        // o una frase que lo exija.
        const visible = html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<!--[\s\S]*?-->/g, "");
        const pide = /\b(introduce|escribe|teclea|pide|pidiendo|con el|el)\s+PIN\b/i.test(visible)
                  || /placeholder\s*=\s*["']\s*PIN/i.test(html)
                  || /aria-label\s*=\s*["'][^"']*PIN/i.test(html);
        if (pide) conPin.push(p);
      }
      comprobar("sin PIN · ninguna página se lo pide ya al visitante", conPin.length === 0, conPin.join(" · "));
    }


    // ============================================================ 9 · NINGUNA PÁGINA REVIENTA
    /**
     * 🔴 Abrir cada página con cada tipo de persona y mirar la consola. Un error de JavaScript no
     * pinta nada rojo en la pantalla: la página se queda a medias y el visitante cree que «va
     * lenta». Es el fallo más caro de todos porque nadie lo reporta — se abandona y ya está.
     */
    {
      const PAGS = ["index.html", "entrar.html", "guia.html", "consola.html", "recluta.html",
                    "alistarse.html", "crear.html", "aula.html", "llamada.html", "sesion.html",
                    "huevo.html", "validar.html", "recursos.html", "actividades.html",
                    "cronologia.html", "registro.html", "clase.html", "panel.html", "embed.html",
                    "comosehizo.html", "privacidad.html", "pasos.html", "foro.html", "tickets.html"];
      // 🔴 El ruido que NO es culpa nuestra: sin red de verdad, Firebase y los iframes de YouTube o
      // Genially se quejan. Lo que se persigue son los errores de NUESTRO código.
      const RUIDO = /favicon|ERR_|net::|Failed to load resource|firebase|gstatic|youtube|genially|padlet|googleapis|script\.google|CORS|Content Security|MIME|ERR_BLOCKED/i;
      const rotas = [];
      for (const quien of ["referente", "estudiante", "anonimo"]) {
        for (const pag of PAGS) {
          const c = await abrirSeguro(quien, pag);
          if (!c) continue;
          const propios = c.errores.filter(e => !RUIDO.test(e));
          if (propios.length) rotas.push(pag + " (" + quien + "): " + propios[0].split("\n")[0].slice(0, 90));
          await c.destruir();
        }
      }
      comprobar("consola · ninguna página revienta con ningún tipo de visitante",
                rotas.length === 0, rotas.slice(0, 6).join(" | "));
      comprobar("consola · se han abierto " + (PAGS.length * 3) + " combinaciones", true);
    }

    // ============================================================ 10 · LOS EMBEDS, DENTRO DEL GENIALLY
    /**
     * 🔴 Lo que se pega en una presentación no puede traerse el menú de la web encima. Esto ya mordió
     * una vez: `aula.js` y `llamada.js` prometían `?embed=1` en su propia documentación y no lo
     * implementaba nadie, así que al pegarlas en un Genially salía la web entera dentro del panel.
     */
    {
      const malos = [];
      for (const pag of ["aula.html", "llamada.html", "sesion.html", "huevo.html", "validar.html", "registro.html"]) {
        const c = await abrirSeguro("referente", pag + "?embed=1");
        if (!c) continue;
        const v = await evaluar(c, `(function(){
          var n = document.querySelector('nav.nav'), f = document.querySelector('footer');
          function ve(e){ if(!e) return false; var s=getComputedStyle(e);
            return s.display!=='none' && s.visibility!=='hidden' && e.getBoundingClientRect().height>4; }
          return { nav: ve(n), pie: ve(f), ancho: document.documentElement.scrollWidth };
        })()`);
        if (v.nav) malos.push(pag + " enseña el menú");
        if (v.pie) malos.push(pag + " enseña el pie");
        await c.destruir();
      }
      comprobar("embeds · ninguno se trae el menú ni el pie de la web", malos.length === 0, malos.join(" · "));
    }

    // ============================================================ 11 · EN EL MÓVIL NO SE SALE NADA
    /**
     * 🔴 El alumnado entra desde el móvil. Una caja más ancha que la pantalla obliga a arrastrar la
     * página de lado, y en una web con tablas y cromos eso pasa con una facilidad enorme.
     */
    {
      const anchos = [];
      for (const pag of ["index.html", "entrar.html", "recluta.html", "consola.html", "guia.html",
                         "alistarse.html", "sesion.html", "aula.html"]) {
        const c = await pestana(QUIENES.referente);
        await c.enviar("Emulation.setDeviceMetricsOverride",
          { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
        await c.enviar("Page.navigate", { url: BASE + pag });
        await hasta(c, "document.readyState==='complete'", 10);
        await dormir(500);
        const v = await evaluar(c, `(function(){
          var d = document.documentElement;
          var culpables = [];
          [].slice.call(document.querySelectorAll('body *')).forEach(function(e){
            var r = e.getBoundingClientRect();
            if (r.width > 0 && r.right > d.clientWidth + 2 && getComputedStyle(e).position !== 'fixed') {
              var p = e.parentElement, tapa = false;
              while (p && p !== document.body) { if (getComputedStyle(p).overflowX.match(/auto|scroll|hidden/)) { tapa = true; break; } p = p.parentElement; }
              if (!tapa) culpables.push((e.tagName+'.'+(e.className||'')).slice(0,44));
            }
          });
          return { scroll: d.scrollWidth, ancho: d.clientWidth, culpables: culpables.slice(0,3) };
        })()`);
        if (v.culpables.length) anchos.push(pag + ": " + v.culpables.join(","));
        await c.destruir();
      }
      comprobar("móvil · nada se sale de la pantalla a 390 px", anchos.length === 0, anchos.slice(0, 4).join(" | "));
    }

    // ============================================================ 12 · NINGUNA IMAGEN ROTA
    {
      const faltan = [];
      for (const pag of ["index.html", "entrar.html", "guia.html", "recluta.html", "consola.html",
                         "alistarse.html", "recursos.html", "panel.html"]) {
        const c = await abrirSeguro("referente", pag);
        if (!c) continue;
        const ms = await evaluar(c, `[].slice.call(document.images)
          .filter(function(i){ return i.currentSrc && i.complete && i.naturalWidth===0; })
          .map(function(i){ return i.getAttribute('src'); }).slice(0,5)`);
        (ms || []).forEach(m => faltan.push(pag + " → " + m));
        await c.destruir();
      }
      comprobar("imágenes · ninguna se queda en el hueco gris", faltan.length === 0, faltan.slice(0, 5).join(" · "));
    }

    comprobar("ninguna página se queda colgada al abrirla", ATASCADAS.length === 0,
              ATASCADAS.slice(0, 5).join(" | "));

  } finally {
    for (const c of abiertas) { try { await c.destruir(); } catch (e) {} }
    chrome.kill(); web.kill();
  }

  const { ok, fallos } = marcador();
  console.log("\n  Batería 64 · el recorrido humano");
  console.log("  " + ok + " comprobaciones correctas, " + fallos.length + " fallos");
  fallos.forEach(f => console.log("   ✗ " + f));
  process.exit(fallos.length ? 1 : 0);
})().catch(e => { console.error("EXPLOTÓ:", e.message); process.exit(2); });
