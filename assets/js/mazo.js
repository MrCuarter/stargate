/**
 * GAMIFICAPRO · EL MAZO DE UNA SESIÓN, EN MINIATURAS (15-oct-2026) — pieza del motor para cualquier mod.
 *
 * Norberto (DPG1, 15-oct): «En cada tarjeta una rueda dentada para configurar las diapositivas. Para facilitarlo añade un
 * interruptor que cambie entre personalizado o por defecto. Por defecto aparecerán las diapositivas que hemos elegido. Si el
 * docente quita una diapositiva el interruptor cambia a personalizado automáticamente. […] Cuando configuramos las sesiones deben
 * aparecer las miniaturas de todas las diapositivas con opción de ampliar para ver mejor su contenido.»
 *
 * Un ajuste del mazo es `{ off: [claves quitadas], orden: [claves en el orden del docente], extras: [las suyas], … }` (DPG:
 * `mod_clase/{grupo}.config.<sesión>`, motor/clase.js → cfgLimpia). Lo demás que lleve el mod (p. ej. las preguntas del alumnado)
 * no es de esta pieza y se respeta siempre.
 *
 * Lo puro (lo prueba tests/sdk/mazo.test.ts):
 *   GP.mazo.estado(cfg)                 → "defecto" | "personalizado": personalizado si quita alguna, si ha cambiado el orden o si
 *                                          ha metido alguna suya.
 *   GP.mazo.porDefecto(cfg)             → el mismo ajuste sin `off`, `orden` ni `extras`.
 *   GP.mazo.alternar(cfg, k, ver)       → con `k` quitada (ver=false) o puesta (ver=true). Nunca toca el original.
 *   GP.mazo.conOrden(cfg, orden, serie) → con ese orden; si es el de serie, sin `orden` (vuelve a contar como «por defecto»).
 *
 * La ventana (en el navegador; la piel, con las variables --gpm-*):
 *   GP.mazo.abrir({ titulo, sub, cfg, serie, partes(cfg), miniatura(item, caja, grande), nota(item), resumen(cfg), guardar(cfg),
 *                   extra(caja, cfg), alCerrar(), clase, ayuda })
 *     · `partes(cfg)` → [{ titulo, items: [{ k, titulo, eti, min, fijo, quieta, auto }] }] en el orden de ese ajuste. `fijo`: no se
 *       puede quitar (el fichar de DPG); `quieta`: no se mueve (la portada, el cierre); `auto`: la pone el motor sola (el ranking de
 *       la semana, la llegada de un mentor…), con su porqué, que sale en la miniatura.
 *     · `miniatura(item, caja, grande)`: el mod pinta su diapositiva DE VERDAD en `caja` (16:9, con container queries escala sola).
 *       Las de la rejilla se pintan cuando asoman (IntersectionObserver); la ampliada, al abrirla.
 *     · `guardar(cfg)` → Promise. Se guarda al tocar (quitar, poner, mover o volver a lo de serie); si falla, vuelve atrás y lo dice.
 *     · velo, × y Esc (pulsar dentro no la cierra); en el móvil, a pantalla completa. Pulsar una miniatura la amplía encima, con ‹ ›
 *       (y las flechas del teclado) para pasar, su nota y «Quitar/Poner»; Esc cierra primero la ampliada.
 *     · Mover: con el asa ⠿ (GP.ordena, si la página la tiene: arrastrando o con el teclado), dentro de cada parte de la clase.
 *     · `extra(caja, cfg)`: lo del mod, debajo de las miniaturas (se llama una vez, al abrir); `alCerrar()`, al cerrarla.
 *   → { cerrar(), ponerCfg(cfg) (lo cambió otra persona del equipo), caja }
 *
 * 🔴 17-oct · EL MAZO EN EL PERFIL DEL DOCENTE (Norberto, opción A: «lo que un docente cambia en las diapositivas se guarda también en SU
 * PERFIL y se aplica en todos sus grupos, salvo que un grupo tenga lo suyo»). El del perfil vive en `mod_profes/{mod}__{uid}.mazos.<sesión>`
 * (el mismo documento que sus notas, sdk/notas.js; las reglas acotan `mazos`). Lo puro:
 *   GP.mazo.elegir(grupo, perfil)       → { cfg, de: "grupo" | "perfil" | "serie" }. Manda el del grupo si está personalizado (un grupo
 *                                          que ya tiene lo suyo sigue igual); si no, el del perfil de quien da o prepara la clase (si lo
 *                                          está); si no, el de serie. Lo demás del ajuste del grupo (las preguntas del alumnado…) se queda.
 *   GP.mazo.soloMazo(cfg)               → solo `off`, `orden` y `extras` (lo que se guarda en el perfil).
 * Y en la ventana, `donde: { valor, opciones: [{ v, t }], nota, alCambiar(v) }`: «Dónde se guarda», justo debajo del interruptor
 * (con una sola opción, solo el rótulo: en el grupo de práctica común, siempre en el perfil).
 *
 * 🔴 19-oct · LAS NOTAS DEL PRESENTADOR, EDITABLES EN LA RUEDA (Norberto: «en la rueda de “Clases”, que cada miniatura lleve sus notas y
 * se puedan editar, con “Volver al texto original”»). Son las de cada docente (`mod_profes/{mod}__{uid}.notas`, sdk/notas.js: valen
 * para todos sus grupos); la pieza solo las enseña y llama al mod. Opción `notas`:
 *   { ver(item) → { lineas: [..], propias } | null, guardar(item, lineas) → Promise, original(item) → Promise, puede() → bool,
 *     html(lineas) → el HTML de las notas (si no, una lista), aviso: el texto cuando no puede (sin cuenta) }
 *   · Cada miniatura lleva sus notas recortadas a 2 líneas (todas igual de altas; «Tuyas» si son del docente); pulsarlas abre la
 *     ampliada, que las enseña enteras con «Editar» y, si son suyas, «Volver al texto original».
 *   · `notasAlDia()` (lo que devuelve `abrir`): el perfil cambió (lo dice la escucha) → se repintan, salvo la que se está editando.
 *   · Sin miniaturas (STARGATE, cuya rueda va por secciones): GP.mazo.notasRejilla(caja, { items, notas }), más abajo.
 *   Lo puro: GP.mazo.lineasDe(texto) (una idea por línea, sin vacías, hasta 8) y GP.mazo.notaCorta(lineas) (el texto de la miniatura).
 *
 * Cada web la copia en su build (assets/js/mazo.js, con `guardas.copiar_pieza`) y NO se edita allí: aquí.
 * STARGATE podría heredarla para su rueda «Configurar las diapositivas» (hoy, `SG.CFGSESION`, por secciones y con capturas fijas).
 */
(function () {
  if (window.GP && window.GP.mazo) return;
  // ───────────────────────────────────────────────────────────────────────────────── lo puro
  function lista(a) { return Array.isArray(a) ? a.filter(function (x) { return x != null; }).map(String) : []; }
  function unicas(a) { var out = []; lista(a).forEach(function (k) { if (out.indexOf(k) < 0) out.push(k); }); return out; }
  function copia(cfg) {
    var c = {};
    if (cfg && typeof cfg === "object") Object.keys(cfg).forEach(function (k) { c[k] = Array.isArray(cfg[k]) ? cfg[k].slice() : cfg[k]; });
    return c;
  }
  function estado(cfg) {
    cfg = cfg || {};
    return lista(cfg.off).length || lista(cfg.orden).length || (Array.isArray(cfg.extras) && cfg.extras.length) ? "personalizado" : "defecto";
  }
  function soloMazo(cfg) {
    var c = {}; cfg = cfg || {};
    c.off = unicas(cfg.off);
    if (lista(cfg.orden).length) c.orden = unicas(cfg.orden);
    c.extras = Array.isArray(cfg.extras) ? cfg.extras.slice() : [];
    return c;
  }
  function elegir(grupo, perfil) {
    if (grupo && estado(grupo) === "personalizado") return { cfg: copia(grupo), de: "grupo" };
    if (perfil && estado(perfil) === "personalizado") return { cfg: Object.assign(copia(grupo), soloMazo(perfil)), de: "perfil" };
    return { cfg: grupo ? copia(grupo) : { off: [], extras: [] }, de: "serie" };
  }
  function porDefecto(cfg) {
    var c = copia(cfg);
    c.off = []; delete c.orden; c.extras = [];
    return c;
  }
  function alternar(cfg, k, ver) {
    var c = copia(cfg), off = unicas(c.off).filter(function (x) { return x !== String(k); });
    if (!ver) off.push(String(k));
    c.off = off;
    return c;
  }
  function conOrden(cfg, orden, serie) {
    var c = copia(cfg), o = unicas(orden), s = unicas(serie);
    // (solo cuenta lo que se ha movido de verdad: lo de serie que no está en `orden` va donde iba)
    var mismo = o.length === s.length && o.every(function (k, i) { return k === s[i]; });
    if (!o.length || mismo) delete c.orden; else c.orden = o;
    return c;
  }
  var MAX_LINEAS = 8;
  function lineasDe(t) {
    var L = Array.isArray(t) ? t : String(t == null ? "" : t).split(/\r?\n/);
    return L.map(function (x) { return String(x == null ? "" : x).replace(/\s+/g, " ").trim(); }).filter(Boolean).slice(0, MAX_LINEAS);
  }
  function notaCorta(lin) {
    return lineasDe(lin).map(function (x) { return x.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/[*_`]+/g, ""); }).join(" · ");
  }
  // ───────────────────────────────────────────────────────────────────────────────── la ventana
  var CSS =
    "html.gpm-abierta{overflow:hidden}" +
    ".gpm-velo{position:fixed;inset:0;z-index:2000;display:grid;place-items:center;padding:16px;background:var(--gpm-velo,rgba(0,0,0,.72));" +
      "color:var(--gpm-tx,#f3e9d6);font:15px/1.45 var(--gpm-letra,system-ui,sans-serif)}" +
    ".gpm-ventana{position:relative;display:flex;flex-direction:column;width:min(1180px,100%);max-height:calc(100dvh - 32px);min-width:0;" +
      "border-radius:16px;border:1px solid var(--gpm-borde,rgba(255,255,255,.16));background:var(--gpm-panel,#16110d);box-shadow:0 30px 90px rgba(0,0,0,.6);overflow:hidden}" +
    ".gpm-cab{display:flex;gap:12px;align-items:flex-start;justify-content:space-between;padding:16px 18px 10px;border-bottom:1px solid var(--gpm-borde,rgba(255,255,255,.12))}" +
    ".gpm-cab h2{margin:0;font:700 1.25rem/1.2 var(--gpm-titulo,inherit);color:var(--gpm-acento2,var(--gpm-acento,#e8c96a));overflow-wrap:anywhere}" +
    ".gpm-cab p{margin:4px 0 0;color:var(--gpm-suave,#cbbca2);font-size:.92rem}" +
    ".gpm-x{flex:none;width:42px;height:42px;border-radius:50%;border:1px solid var(--gpm-borde,rgba(255,255,255,.2));background:transparent;color:inherit;font-size:22px;line-height:1;cursor:pointer}" +
    ".gpm-cuerpo{overflow:auto;padding:12px 18px 20px;overscroll-behavior:contain}" +
    ".gpm-modo{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;margin-bottom:6px}" +
    ".gpm-interruptor{display:inline-flex;padding:3px;border-radius:999px;border:1px solid var(--gpm-borde,rgba(255,255,255,.2));background:rgba(0,0,0,.25)}" +
    ".gpm-interruptor button{min-height:40px;padding:0 16px;border:0;border-radius:999px;background:transparent;color:var(--gpm-suave,#cbbca2);font-weight:700;font-size:.92rem;line-height:1;font-family:inherit;cursor:pointer}" +
    ".gpm-interruptor button[aria-checked=true]{background:var(--gpm-acento,#e8c96a);color:var(--gpm-sobre-acento,#1a120a)}" +
    ".gpm-resumen{color:var(--gpm-suave,#cbbca2);font-size:.9rem}.gpm-guardado{color:var(--gpm-ok,#8fd19a);font-size:.9rem;font-weight:700}" +
    ".gpm-aviso{margin:6px 0;padding:8px 12px;border-radius:10px;background:rgba(0,0,0,.28);border:1px solid var(--gpm-borde,rgba(255,255,255,.16));font-size:.92rem}" +
    ".gpm-aviso[hidden]{display:none}.gpm-aviso button{min-height:40px;margin:6px 8px 0 0;padding:0 14px;border-radius:999px;border:1px solid var(--gpm-borde,rgba(255,255,255,.2));background:transparent;color:inherit;font-weight:700;font-size:.9rem;font-family:inherit;cursor:pointer}" +
    ".gpm-aviso button.gpm-si{background:var(--gpm-acento,#e8c96a);color:var(--gpm-sobre-acento,#1a120a);border-color:transparent}" +
    ".gpm-donde{margin-top:6px}.gpm-donde-t{font-weight:700;color:var(--gpm-suave,#cbbca2);font-size:.92rem}.gpm-donde-uno{font-size:.92rem}" +
    ".gpm-donde-nota{flex:1 1 14rem;min-width:0;color:var(--gpm-suave,#cbbca2);font-size:.88rem}" +
    ".gpm-ayuda{margin:2px 0 10px;color:var(--gpm-suave,#cbbca2);font-size:.88rem}" +
    ".gpm-parte h3{margin:16px 0 8px;font-weight:700;font-size:.8rem;line-height:1.2;font-family:inherit;letter-spacing:.08em;text-transform:uppercase;color:var(--gpm-suave,#cbbca2)}" +
    ".gpm-rejilla{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,190px),1fr));grid-auto-rows:1fr;gap:12px}" +
    ".gpm-dia{display:flex;flex-direction:column;min-width:0;border-radius:12px;border:1px solid var(--gpm-borde,rgba(255,255,255,.16));background:rgba(0,0,0,.22);overflow:hidden}" +
    ".gpm-dia.gpm-fuera .gpm-ver{opacity:.32;filter:grayscale(1)}.gpm-dia.gpm-fuera{border-style:dashed}" +
    ".gpm-ver{position:relative;display:block;width:100%;padding:0;border:0;background:#000;cursor:zoom-in;aspect-ratio:16/9;overflow:hidden}" +
    ".gpm-mini{position:absolute;inset:0;display:block;container-type:inline-size;overflow:hidden;pointer-events:none}" +
    ".gpm-num{position:absolute;left:6px;top:6px;z-index:3;min-width:24px;padding:2px 6px;border-radius:999px;background:rgba(0,0,0,.72);color:#fff;font:700 12px/1.3 system-ui,sans-serif}" +
    ".gpm-auto,.gpm-quitada{position:absolute;right:6px;top:6px;z-index:3;max-width:calc(100% - 46px);padding:2px 8px;border-radius:999px;font:700 11px/1.4 system-ui,sans-serif;" +
      "white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
    ".gpm-auto{background:var(--gpm-acento,#e8c96a);color:var(--gpm-sobre-acento,#1a120a)}.gpm-quitada{background:#2a2420;color:#f3e9d6}" +
    ".gpm-pie{display:flex;align-items:center;gap:4px;padding:6px 6px 6px 10px;margin-top:auto;min-height:52px}" +
    ".gpm-txt{flex:1;min-width:0}.gpm-txt b{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font-size:.86rem;line-height:1.25}" +
    ".gpm-txt small{display:block;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;color:var(--gpm-suave,#cbbca2);font-size:.76rem}" +
    ".gpm-on{flex:none;min-width:40px;min-height:40px;padding:0 10px;border-radius:999px;border:1px solid var(--gpm-borde,rgba(255,255,255,.2));background:transparent;color:inherit;font-weight:700;font-size:.8rem;font-family:inherit;cursor:pointer}" +
    ".gpm-on[aria-pressed=false]{background:var(--gpm-acento,#e8c96a);color:var(--gpm-sobre-acento,#1a120a);border-color:transparent}.gpm-on:disabled{opacity:.55;cursor:default}" +
    ".gpm-dia [data-ordena-asa]{color:var(--gpm-suave,#cbbca2)}" +
    ".gpm-nt{display:block;width:100%;margin:0;padding:6px 10px 0;border:0;border-top:1px dashed var(--gpm-borde,rgba(255,255,255,.14));background:transparent;color:var(--gpm-suave,#cbbca2);" +
      "font:inherit;font-size:.78rem;line-height:1.3;text-align:left;cursor:pointer;min-height:calc(2.6em + 6px)}" +
    ".gpm-nt span{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;overflow-wrap:anywhere}" +
    ".gpm-nt i{font-style:normal;font-weight:700;color:var(--gpm-acento,#e8c96a)}.gpm-nt:hover span,.gpm-nt:focus-visible span{color:var(--gpm-tx,#f3e9d6)}" +
    ".gpm-g-notas{flex:1 1 100%;min-width:0;padding:8px 12px;border-radius:10px;background:rgba(255,255,255,.05);border:1px solid var(--gpm-borde,rgba(255,255,255,.14))}" +
    ".gpm-g-notas h4{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;margin:0 0 4px;font-size:.82rem;letter-spacing:.06em;text-transform:uppercase;color:var(--gpm-suave,#cbbca2)}" +
    ".gpm-g-notas h4 em{font-style:normal;text-transform:none;letter-spacing:0;color:var(--gpm-acento,#e8c96a)}" +
    ".gpm-g-notas ul{margin:0;padding-left:1.2em}.gpm-g-notas p{margin:4px 0}" +
    ".gpm-g-notas textarea{display:block;box-sizing:border-box;width:100%;min-height:9em;margin:4px 0;padding:8px 10px;border-radius:8px;border:1px solid var(--gpm-borde,rgba(255,255,255,.25));" +
      "background:rgba(0,0,0,.35);color:var(--gpm-tx,#f3e9d6);font:inherit;font-size:.92rem;line-height:1.4;resize:vertical}" +
    ".gpm-nb{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}.gpm-nb button{min-height:40px;padding:0 14px;border-radius:999px;border:1px solid var(--gpm-borde,rgba(255,255,255,.2));" +
      "background:transparent;color:inherit;font-weight:700;font-size:.86rem;font-family:inherit;cursor:pointer}.gpm-nb button.gpm-si{background:var(--gpm-acento,#e8c96a);color:var(--gpm-sobre-acento,#1a120a);border-color:transparent}" +
    ".gpm-nvelo .gpm-ventana{width:min(720px,100%)}.gpm-ncard .gpm-pie{margin-top:0;align-items:flex-start}.gpm-ncard .gpm-nt{margin-top:auto}" +
    ".gpm-nb button:disabled{opacity:.55;cursor:default}.gpm-g-pie.gpm-editando{max-height:45dvh}" +
    ".gpm-grande:has(.gpm-editando){overflow:auto}.gpm-grande:has(.gpm-editando) .gpm-g-caja{width:min(calc(100% - 100px),calc((55dvh - 150px) * 16 / 9))}" +
    ".gpm-extra:empty{display:none}.gpm-extra{margin-top:18px;padding-top:6px;border-top:1px solid var(--gpm-borde,rgba(255,255,255,.12))}" +
    ".gpm-grande{position:fixed;inset:0;z-index:2001;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:14px;background:rgba(0,0,0,.96)}" +
    ".gpm-grande[hidden]{display:none}" +
    ".gpm-g-cab{display:flex;align-items:center;gap:10px;width:min(100%,calc((100dvh - 190px) * 16 / 9));min-width:min(100%,280px)}" +
    ".gpm-g-cab b{flex:1;min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}.gpm-g-cab small{color:var(--gpm-suave,#cbbca2);white-space:nowrap}" +
    ".gpm-g-fila{display:flex;align-items:center;gap:8px;width:100%;justify-content:center;min-width:0}" +
    ".gpm-g-caja{position:relative;flex:0 1 auto;width:min(calc(100% - 100px),calc((100dvh - 190px) * 16 / 9));min-width:0;aspect-ratio:16/9;container-type:inline-size;overflow:hidden;border-radius:10px;background:#000}" +
    ".gpm-g-paso{flex:none;width:44px;height:44px;border-radius:50%;border:1px solid var(--gpm-borde,rgba(255,255,255,.25));background:rgba(0,0,0,.5);color:#fff;font-size:22px;cursor:pointer}" +
    ".gpm-g-paso:disabled{opacity:.3;cursor:default}" +
    ".gpm-g-pie{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:flex-start;width:min(100%,calc((100dvh - 190px) * 16 / 9));min-width:min(100%,280px);max-height:24dvh;overflow:auto}" +
    ".gpm-g-nota{flex:1;min-width:200px;margin:0;color:var(--gpm-suave,#cbbca2);font-size:.9rem}" +
    "@media (max-width:699px),(max-height:500px){.gpm-velo{padding:0}.gpm-ventana{width:100%;height:100dvh;max-height:none;border-radius:0;border:0}" +
      ".gpm-cuerpo{padding:10px 12px calc(16px + env(safe-area-inset-bottom))}.gpm-cab{padding:12px}" +
      ".gpm-g-caja{width:100%}.gpm-g-fila{flex-wrap:wrap}.gpm-g-fila .gpm-g-paso{order:2}}" +
    "@media (max-height:500px) and (orientation:landscape){.gpm-g-caja{width:min(100%,calc((100dvh - 110px) * 16 / 9))}.gpm-g-pie{display:none}.gpm-g-pie.gpm-editando{display:flex;max-height:none}" +
      ".gpm-grande:has(.gpm-editando) .gpm-g-fila{display:none}.gpm-grande:has(.gpm-editando){justify-content:flex-start;overflow:auto}" +
      ".gpm-g-notas textarea{min-height:5em}}";
  function montarEstilo() {
    if (document.getElementById("gp-mazo-estilo")) return;
    var st = document.createElement("style"); st.id = "gp-mazo-estilo"; st.textContent = CSS; document.head.appendChild(st);
  }
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  function abrir(o) {
    o = o || {};
    montarEstilo();
    var cfg = copia(o.cfg), serie = unicas(o.serie), antesFoco = document.activeElement, VIVA = true;
    var velo = document.createElement("div");
    velo.className = "gpm-velo";
    velo.innerHTML = '<div class="gpm-ventana ' + esc(o.clase || "") + '" role="dialog" aria-modal="true" aria-labelledby="gpm-titulo">' +
      '<header class="gpm-cab"><div><h2 id="gpm-titulo">' + esc(o.titulo || "Las diapositivas") + "</h2>" + (o.sub ? "<p>" + esc(o.sub) + "</p>" : "") + "</div>" +
      '<button type="button" class="gpm-x" data-gpm="cerrar" aria-label="Cerrar">×</button></header>' +
      '<div class="gpm-cuerpo"><div class="gpm-modo"><div class="gpm-interruptor" role="radiogroup" aria-label="Qué diapositivas se ven">' +
      '<button type="button" role="radio" data-gpm="defecto">Por defecto</button><button type="button" role="radio" data-gpm="personalizado">Personalizado</button></div>' +
      '<span class="gpm-resumen"></span><span class="gpm-guardado" role="status" aria-live="polite"></span></div>' +
      (o.donde && (o.donde.opciones || []).length ? '<div class="gpm-modo gpm-donde"><span class="gpm-donde-t">Se guarda</span>' +
        ((o.donde.opciones || []).length > 1 ? '<div class="gpm-interruptor" role="radiogroup" aria-label="Dónde se guarda">' + o.donde.opciones.map(function (x) {
          return '<button type="button" role="radio" data-gpm-donde="' + esc(x.v) + '" aria-checked="' + String(x.v === o.donde.valor) + '">' + esc(x.t) + "</button>"; }).join("") + "</div>"
          : '<b class="gpm-donde-uno">' + esc(o.donde.opciones[0].t) + "</b>") +
        (o.donde.nota ? '<span class="gpm-donde-nota">' + esc(o.donde.nota) + "</span>" : "") + "</div>" : "") +
      '<div class="gpm-aviso" hidden></div>' +
      '<p class="gpm-ayuda">' + (o.ayuda || "Por defecto, las diapositivas que hemos preparado. Quita o mueve cualquiera y pasa a Personalizado solo; se guarda al momento. Pulsa una para verla en grande.") + "</p>" +
      '<div class="gpm-partes"></div><div class="gpm-extra"></div></div></div>' +
      '<div class="gpm-grande" hidden role="dialog" aria-modal="true" aria-label="La diapositiva, en grande"><div class="gpm-g-cab"><b></b><small></small>' +
      '<button type="button" class="gpm-x" data-gpm="cerrar-grande" aria-label="Cerrar la diapositiva en grande">×</button></div>' +
      '<div class="gpm-g-fila"><button type="button" class="gpm-g-paso" data-gpm="ant" aria-label="La anterior">‹</button><div class="gpm-g-caja"></div>' +
      '<button type="button" class="gpm-g-paso" data-gpm="sig" aria-label="La siguiente">›</button></div>' +
      '<div class="gpm-g-pie"><button type="button" class="gpm-on" data-gpm="ver-grande"></button><div class="gpm-g-nota"></div>' +
      (o.notas ? '<div class="gpm-g-notas" aria-live="polite"></div>' : "") + "</div></div>";
    document.body.appendChild(velo);
    document.documentElement.classList.add("gpm-abierta");
    var $ = function (s) { return velo.querySelector(s); };
    var G = { i: -1 }, obs = null, listas = [];

    function items() { var L = []; (o.partes ? o.partes(cfg) : []).forEach(function (p) { (p.items || []).forEach(function (it) { L.push(it); }); }); return L; }
    function fuera(k) { return lista(cfg.off).indexOf(String(k)) >= 0; }
    function pintarModo() {
      var e = estado(cfg);
      [].slice.call(velo.querySelectorAll(".gpm-interruptor [data-gpm]")).forEach(function (b) { b.setAttribute("aria-checked", String(b.getAttribute("data-gpm") === e)); });
      $(".gpm-resumen").textContent = o.resumen ? o.resumen(cfg) : "";
    }
    function guardado(t) { var g = $(".gpm-guardado"); g.textContent = t || ""; if (t) setTimeout(function () { if (g.textContent === t) g.textContent = ""; }, 2200); }
    function aviso(html) { var a = $(".gpm-aviso"); a.innerHTML = html || ""; a.hidden = !html; }
    function tile(it, n) {
      var off = fuera(it.k), asa = window.GP && window.GP.ordena && !it.quieta;
      return '<div class="gpm-dia' + (off ? " gpm-fuera" : "") + '" data-k="' + esc(it.k) + '"' + (asa ? ' data-ordena="' + esc(it.k) + '"' : "") + ">" +
        '<button type="button" class="gpm-ver" data-gpm="ampliar" aria-label="Ver en grande: ' + esc(it.titulo) + '"><span class="gpm-mini"></span><span class="gpm-num">' + n + "</span>" +
        marcas(it, off) + "</button>" +
        '<div class="gpm-pie"><span class="gpm-txt"><b>' + esc(it.titulo) + "</b><small>" + esc([it.eti, it.min ? it.min + "′" : ""].filter(Boolean).join(" · ")) + "</small></span>" +
        (asa ? '<button type="button" data-ordena-asa aria-label="Mover «' + esc(it.titulo) + '»: arrástrala o usa las flechas" title="Arrástrala para cambiar su orden">⠿</button>' : "") +
        '<button type="button" class="gpm-on" data-gpm="ver" aria-pressed="' + String(!off) + '"' + (it.fijo ? " disabled" : "") + ">" + (it.fijo ? "Siempre" : off ? "Poner" : "Quitar") + "</button></div>" + notaTile(it) + "</div>";
    }
    // las notas del presentador (opción `notas`): en la miniatura, recortadas; en la ampliada, enteras y editables (Notas, más abajo)
    var NT = o.notas ? Notas(o.notas, function () { if (VIVA) { guardado("✓ Notas guardadas"); notasAlDia(); } }) : null;
    function notaTile(it) { return NT ? NT.boton(it) : ""; }
    function notaTxt(it) { return NT ? NT.txt(it) : ""; }
    function pintarNotasGrande(it) {
      var caja = $(".gpm-g-notas"); if (!NT || !caja || !it) return;
      NT.panel(caja, it);
    }
    function notasAlDia() {
      if (!VIVA || !NT) return;
      var L = items();
      [].slice.call(velo.querySelectorAll(".gpm-dia")).forEach(function (t, i) { var it = L[i], b = t.querySelector(".gpm-nt span"); if (it && b && String(it.k) === t.getAttribute("data-k")) b.innerHTML = notaTxt(it); });
      if (G.i >= 0 && !NT.editando()) pintarNotasGrande(L[G.i]);
    }
    function marcas(it, off) {
      return off ? '<span class="gpm-quitada">Quitada</span>' : it.auto ? '<span class="gpm-auto" title="' + esc(it.auto) + '">Automática</span>' : "";
    }
    /** Si las diapositivas siguen en el mismo orden (quitar, poner, o lo que ya se movió arrastrando), solo cambian sus marcas: sin
     *  repintar las miniaturas (ni parpadeo ni salto). Si no, todo de nuevo. */
    function pintarPartes(forzar) {
      var L = items(), tiles = [].slice.call(velo.querySelectorAll(".gpm-dia"));
      if (!forzar && tiles.length === L.length && tiles.every(function (t, i) { return t.getAttribute("data-k") === String(L[i].k); })) {
        tiles.forEach(function (t, i) {
          var it = L[i], off = fuera(it.k), b = t.querySelector('[data-gpm="ver"]'), ver = t.querySelector(".gpm-ver");
          t.classList.toggle("gpm-fuera", off); t.querySelector(".gpm-num").textContent = i + 1;
          [].slice.call(ver.querySelectorAll(".gpm-quitada,.gpm-auto")).forEach(function (x) { x.remove(); });
          ver.insertAdjacentHTML("beforeend", marcas(it, off));
          b.setAttribute("aria-pressed", String(!off)); b.textContent = it.fijo ? "Siempre" : off ? "Poner" : "Quitar";
          var nt = t.querySelector(".gpm-nt span"); if (nt) nt.innerHTML = notaTxt(it);
        });
        pintarModo();
        return;
      }
      listas.forEach(function (l) { if (l && l.destruir) l.destruir(); }); listas = [];
      if (obs) obs.disconnect();
      var n = 0, P = o.partes ? o.partes(cfg) : [];
      $(".gpm-partes").innerHTML = P.map(function (p, pi) {
        return '<section class="gpm-parte">' + (p.titulo ? "<h3>" + esc(p.titulo) + "</h3>" : "") + '<div class="gpm-rejilla" data-parte="' + pi + '">' +
          (p.items || []).map(function (it) { return tile(it, ++n); }).join("") + "</div></section>";
      }).join("");
      var pintar = function (caja) {
        if (caja.getAttribute("data-pintada")) return;
        var k = caja.parentNode.parentNode.getAttribute("data-k"), it = L.filter(function (x) { return String(x.k) === k; })[0];
        caja.setAttribute("data-pintada", "1");
        if (it && o.miniatura) try { o.miniatura(it, caja, false); } catch (e) { /* una diapositiva rota no tumba la ventana */ }
      };
      var cajas = [].slice.call(velo.querySelectorAll(".gpm-mini"));
      if (window.IntersectionObserver) {
        obs = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { pintar(e.target); obs.unobserve(e.target); } }); }, { root: $(".gpm-cuerpo"), rootMargin: "300px" });
        cajas.forEach(function (c) { obs.observe(c); });
      } else cajas.forEach(pintar);
      if (window.GP && window.GP.ordena) [].slice.call(velo.querySelectorAll(".gpm-rejilla")).forEach(function (caja) {
        listas.push(window.GP.ordena.lista(caja, { alCambiar: function () {
          var orden = [].slice.call(velo.querySelectorAll(".gpm-dia")).map(function (x) { return x.getAttribute("data-k"); });
          cambiar(conOrden(cfg, orden, serie));
        } }));
      });
      pintarModo();
    }
    function cambiar(nuevo) {
      var antes = cfg;
      cfg = nuevo; aviso(""); pintarPartes(); guardado("Guardando…");
      Promise.resolve(o.guardar ? o.guardar(copia(cfg)) : null).then(function () { if (VIVA) guardado("✓ Guardado"); }, function (e) {
        if (!VIVA) return;
        cfg = antes; pintarPartes(true); guardado("");
        aviso("No se ha guardado: " + esc((e && e.message) || e || "sin conexión") + ".");
      });
    }
    // la ampliada
    function grande(i) {
      var L = items(); if (!L.length) return;
      G.i = Math.max(0, Math.min(L.length - 1, i));
      var it = L[G.i], g = $(".gpm-grande"), caja = $(".gpm-g-caja"), off = fuera(it.k), b = $('[data-gpm="ver-grande"]');
      g.hidden = false;
      $(".gpm-g-cab b").textContent = it.titulo || "";
      $(".gpm-g-cab small").textContent = (G.i + 1) + " / " + L.length + (off ? " · quitada" : it.auto ? " · automática" : "");
      caja.innerHTML = "";
      if (o.miniatura) try { o.miniatura(it, caja, true); } catch (e) { /* nada */ }
      b.textContent = it.fijo ? "Va siempre" : off ? "Ponerla" : "Quitarla"; b.disabled = !!it.fijo; b.setAttribute("aria-pressed", String(!off));
      $(".gpm-g-nota").innerHTML = (it.auto ? "<p><b>Automática.</b> " + esc(it.auto) + "</p>" : "") + (o.nota ? o.nota(it) || "" : "");
      if (NT && NT.editando() && NT.editando() !== String(it.k)) NT.soltar();
      pintarNotasGrande(it);
      $('[data-gpm="ant"]').disabled = G.i === 0; $('[data-gpm="sig"]').disabled = G.i === L.length - 1;
    }
    function cerrarGrande() { var g = $(".gpm-grande"); if (g.hidden) return false; g.hidden = true; if (NT) NT.soltar(); $(".gpm-g-caja").innerHTML = ""; var t = velo.querySelectorAll(".gpm-ver")[G.i]; if (t) t.focus(); G.i = -1; return true; }
    function cerrar() {
      if (!VIVA) return; VIVA = false;
      if (obs) obs.disconnect(); listas.forEach(function (l) { if (l && l.destruir) l.destruir(); });
      document.removeEventListener("keydown", teclas, true);
      velo.remove(); document.documentElement.classList.remove("gpm-abierta");
      if (antesFoco && antesFoco.focus) try { antesFoco.focus(); } catch (e) { /* nada */ }
      if (o.alCerrar) o.alCerrar();
    }
    function teclas(e) {
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); if (NT && NT.editando() && G.i >= 0) { NT.soltar(); pintarNotasGrande(items()[G.i]); return; } if (!cerrarGrande()) cerrar(); return; }
      if (NT && NT.editando()) return;   // (escribiendo: las flechas mueven el cursor, no pasan de diapositiva)
      if (G.i >= 0 && (e.key === "ArrowLeft" || e.key === "ArrowRight")) { e.preventDefault(); e.stopPropagation(); grande(G.i + (e.key === "ArrowRight" ? 1 : -1)); }
    }
    velo.addEventListener("click", function (e) {
      if (e.target === velo) { cerrar(); return; }
      var dn = e.target.closest && e.target.closest("[data-gpm-donde]");
      if (dn && o.donde) {
        var v = dn.getAttribute("data-gpm-donde");
        [].slice.call(velo.querySelectorAll("[data-gpm-donde]")).forEach(function (x) { x.setAttribute("aria-checked", String(x === dn)); });
        if (o.donde.alCambiar) { var nuevo = o.donde.alCambiar(v); if (nuevo) { cfg = copia(nuevo); pintarPartes(); } }
        return;
      }
      var b = e.target.closest && e.target.closest("[data-gpm]"); if (!b) return;
      var a = b.getAttribute("data-gpm"), tarj = b.closest(".gpm-dia");
      if (a === "cerrar") cerrar();
      else if (a === "cerrar-grande") cerrarGrande();
      else if (a === "notas") grande([].slice.call(velo.querySelectorAll(".gpm-dia")).indexOf(tarj));
      else if (a.indexOf("nota-") === 0) { if (NT && G.i >= 0) NT.accion(a, $(".gpm-g-notas"), items()[G.i]); }
      else if (a === "ampliar") grande([].slice.call(velo.querySelectorAll(".gpm-dia")).indexOf(tarj));
      else if (a === "ant" || a === "sig") grande(G.i + (a === "sig" ? 1 : -1));
      else if (a === "ver") cambiar(alternar(cfg, tarj.getAttribute("data-k"), fuera(tarj.getAttribute("data-k"))));
      else if (a === "ver-grande") { var it = items()[G.i]; if (it && !it.fijo) { cambiar(alternar(cfg, it.k, fuera(it.k))); grande(G.i); } }
      else if (a === "personalizado") {
        if (estado(cfg) === "defecto") aviso("Quita o mueve cualquier diapositiva y pasa a <b>Personalizado</b> solo. Para volver, «Por defecto».");
      } else if (a === "defecto") {
        if (estado(cfg) === "personalizado") aviso("¿Volver a las de serie? Vuelven todas las diapositivas, en su orden de siempre, y se quitan las tuyas." +
          '<br><button type="button" class="gpm-si" data-gpm="defecto-si">Sí, por defecto</button><button type="button" data-gpm="defecto-no">No</button>');
      } else if (a === "defecto-si") cambiar(porDefecto(cfg));
      else if (a === "defecto-no") aviso("");
    });
    velo.addEventListener("keydown", function (e) { if (e.target && e.target.tagName === "TEXTAREA" && e.key !== "Escape") e.stopPropagation(); });   // (escribir no pasa de diapositiva detrás)
    document.addEventListener("keydown", teclas, true);
    pintarPartes();
    if (o.extra) o.extra($(".gpm-extra"), copia(cfg));
    $(".gpm-x").focus();
    return {
      caja: velo, cerrar: cerrar,
      ponerCfg: function (c) { if (!VIVA) return; cfg = copia(c); pintarPartes(); if (G.i >= 0) grande(G.i); },
      cfg: function () { return copia(cfg); },
      notasAlDia: notasAlDia,
    };
  }

  /**
   * Las notas del presentador de un conjunto de diapositivas (`N`: la opción `notas`, ver arriba). Lo comparten la rueda (`abrir`) y la
   * rejilla suelta (`notasRejilla`). `hecho()`: tras guardar o volver al original.
   */
  function Notas(N, hecho) {
    var ed = null;   // la clave que se está editando
    function de(it) { var n = null; try { n = N.ver ? N.ver(it) : null; } catch (e) { /* nada */ } return n ? { lineas: lineasDe(n.lineas), propias: !!n.propias } : { lineas: [], propias: false }; }
    function puede() { try { return !N.puede || !!N.puede(); } catch (e) { return false; } }
    function htmlDe(lin) {
      if (N.html) try { return N.html(lin) || ""; } catch (e) { /* la lista de serie */ }
      return lin.length ? "<ul>" + lin.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>" : "";
    }
    function txt(it) {
      var n = de(it), t = notaCorta(n.lineas);
      return (n.propias ? "<i>Tuyas · </i>" : "") + (t ? esc(t) : "<i>Sin notas</i>" + (puede() ? " · añádelas" : ""));
    }
    function boton(it) {
      return '<button type="button" class="gpm-nt" data-gpm="notas" aria-label="Las notas de «' + esc(it.titulo) + '»: verlas y editarlas"><span>' + txt(it) + "</span></button>";
    }
    function panel(caja, it, msg) {
      var n = de(it), editando = ed === String(it.k), pie = caja.parentNode;
      if (pie && pie.classList && pie.classList.contains("gpm-g-pie")) pie.classList.toggle("gpm-editando", editando);
      var cab = "<h4>Notas del presentador" + (n.propias ? " <em>· las tuyas</em>" : " <em>· el texto original</em>") + "</h4>";
      var aviso = msg ? '<p class="gpm-aviso">' + esc(msg) + "</p>" : "";
      if (editando) {
        caja.innerHTML = cab + "<p>Una idea por línea (hasta " + MAX_LINEAS + "). Se guardan en tu perfil y valen para todos tus grupos.</p>" +
          '<textarea aria-label="Tus notas de esta diapositiva">' + esc(n.lineas.join("\n")) + "</textarea>" +
          '<div class="gpm-nb"><button type="button" class="gpm-si" data-gpm="nota-guardar">Guardar</button><button type="button" data-gpm="nota-cancelar">Cancelar</button></div>' + aviso;
        var t = caja.querySelector("textarea"); try { t.focus(); } catch (e) { /* nada */ }
        return;
      }
      caja.innerHTML = cab + (htmlDe(n.lineas) || "<p>Esta diapositiva no lleva notas.</p>") +
        (puede() ? '<div class="gpm-nb"><button type="button" data-gpm="nota-editar">Editar</button>' +
          (n.propias ? '<button type="button" data-gpm="nota-original">Volver al texto original</button>' : "") + "</div>"
          : "<p>" + esc(N.aviso || "Entra con tu cuenta de docente para adaptar estas notas.") + "</p>") + aviso;
    }
    function accion(a, caja, it) {
      if (!it) return;
      var botones = function (si) { [].slice.call(caja.querySelectorAll(".gpm-nb button")).forEach(function (b) { b.disabled = !si; }); };
      var tras = function (p, mal) {
        botones(false);
        Promise.resolve(p).then(function () { ed = null; panel(caja, it); if (hecho) hecho(it); },
          function (e) { botones(true); panel(caja, it, mal + ": " + ((e && e.message) || e || "sin conexión") + "."); });
      };
      if (a === "nota-editar") { ed = String(it.k); panel(caja, it); }
      else if (a === "nota-cancelar") { ed = null; panel(caja, it); }
      else if (a === "nota-guardar") {
        var lin = lineasDe(caja.querySelector("textarea").value);
        tras(lin.length ? N.guardar(it, lin) : N.original(it), "No se han guardado");
      } else if (a === "nota-original") tras(N.original(it), "No se ha podido volver al original");
    }
    return { txt: txt, boton: boton, panel: panel, accion: accion, editando: function () { return ed; }, soltar: function () { ed = null; } };
  }

  /**
   * 19-oct · LAS NOTAS, SIN MINIATURAS (STARGATE: su rueda es por secciones; las notas, por diapositiva de la clase que se prepara).
   * GP.mazo.notasRejilla(caja, { items: [{ k, titulo, eti }], notas }) → { alDia(), quitar() }
   *   Una tarjeta por diapositiva, todas iguales (título y notas recortados a 2 líneas, «Tuyas» si lo son); pulsarla abre la ventana
   *   encima (velo, × y Esc; pulsar dentro no la cierra; en el móvil, a pantalla completa) con las notas enteras, «Editar» y «Volver
   *   al texto original».
   */
  function notasRejilla(caja, o) {
    o = o || {}; montarEstilo();
    var L = (o.items || []).slice(), NR = Notas(o.notas || {}, function () { alDia(); }), V = null;
    function tarjeta(it, n) {
      return '<div class="gpm-dia gpm-ncard" data-k="' + esc(it.k) + '"><div class="gpm-pie"><span class="gpm-txt"><b>' + n + ". " + esc(it.titulo) + "</b><small>" + esc(it.eti || "") + "</small></span></div>" + NR.boton(it) + "</div>";
    }
    caja.innerHTML = '<div class="gpm-rejilla gpm-nrejilla">' + L.map(function (it, i) { return tarjeta(it, i + 1); }).join("") + "</div>";
    function alDia() {
      [].slice.call(caja.querySelectorAll(".gpm-ncard")).forEach(function (t, i) { var b = t.querySelector(".gpm-nt span"); if (L[i] && b) b.innerHTML = NR.txt(L[i]); });
      if (V && !NR.editando()) NR.panel(V.querySelector(".gpm-g-notas"), V.it);
    }
    function cerrarV() { if (!V) return; NR.soltar(); V.remove(); document.removeEventListener("keydown", teclaV, true); var b = V.foco; V = null; if (b && b.focus) try { b.focus(); } catch (e) { /* nada */ } }
    function teclaV(e) {
      if (e.key !== "Escape") return;
      e.preventDefault(); e.stopPropagation();
      if (NR.editando()) { NR.soltar(); NR.panel(V.querySelector(".gpm-g-notas"), V.it); } else cerrarV();
    }
    function abrirV(i, foco) {
      var it = L[i]; if (!it) return;
      V = document.createElement("div"); V.className = "gpm-velo gpm-nvelo"; V.it = it; V.foco = foco;
      V.innerHTML = '<div class="gpm-ventana" role="dialog" aria-modal="true" aria-label="Las notas de «' + esc(it.titulo) + '»">' +
        '<header class="gpm-cab"><div><h2>' + esc(it.titulo) + "</h2>" + (it.eti ? "<p>" + esc(it.eti) + "</p>" : "") + "</div>" +
        '<button type="button" class="gpm-x" data-gpm="cerrar" aria-label="Cerrar">×</button></header><div class="gpm-cuerpo"><div class="gpm-g-notas"></div></div></div>';
      document.body.appendChild(V);
      V.addEventListener("click", function (e) {
        if (e.target === V) { cerrarV(); return; }
        var b = e.target.closest && e.target.closest("[data-gpm]"); if (!b) return;
        var a = b.getAttribute("data-gpm");
        if (a === "cerrar") cerrarV(); else if (a.indexOf("nota-") === 0) NR.accion(a, V.querySelector(".gpm-g-notas"), it);
      });
      V.addEventListener("keydown", function (e) { if (e.key !== "Escape") e.stopPropagation(); });   // (escribir no toca lo de detrás)
      document.addEventListener("keydown", teclaV, true);
      NR.panel(V.querySelector(".gpm-g-notas"), it);
      try { V.querySelector(".gpm-x").focus(); } catch (e) { /* nada */ }
    }
    function clic(e) {
      var b = e.target.closest && e.target.closest('.gpm-ncard [data-gpm="notas"]'); if (!b) return;
      abrirV([].slice.call(caja.querySelectorAll(".gpm-ncard")).indexOf(b.closest(".gpm-ncard")), b);
    }
    caja.addEventListener("click", clic);
    return { alDia: alDia, quitar: function () { cerrarV(); caja.removeEventListener("click", clic); caja.innerHTML = ""; } };
  }

  window.GP = window.GP || {};
  window.GP.mazo = { estado: estado, elegir: elegir, soloMazo: soloMazo, porDefecto: porDefecto, alternar: alternar, conOrden: conOrden, abrir: abrir, notasRejilla: notasRejilla, lineasDe: lineasDe, notaCorta: notaCorta, CSS: CSS };
})();
