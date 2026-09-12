'use strict';
/**
 * BATERÍA 65 · ERRATAS Y TEXTO VISIBLE.
 *
 * 🔴 «No quiero ningún error, ningún botón que no lleva a donde tiene que llevar, ningún fallo de
 * escritura». Lo de los botones lo mira la 64; esto mira lo que se LEE.
 *
 * Solo el texto que ve una persona: fuera el código, los comentarios, los atributos y el contenido
 * de los <script>. Comprobar contra el HTML en bruto da falsos positivos a montones —una clase CSS
 * con dos palabras pegadas no es una errata— y acaba con una batería a la que nadie hace caso.
 */
const fs = require("fs"), path = require("path");
const RAIZ = path.resolve(__dirname, "..");
let ok = 0; const fallos = [];
function c(cierto, nombre, detalle) {
  if (cierto) { ok++; return; }
  fallos.push(nombre + (detalle ? " — " + detalle : ""));
}

const PAGINAS = fs.readdirSync(RAIZ).filter(f => f.endsWith(".html"));

/** El texto que se lee, y solo ese. */
function visible(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/[ \t]+/g, " ");
}

// ------------------------------------------------------------------ 1 · acentos rotos
/**
 * 🔴 Esto ya mordió: `cat x | pbcopy` pega «más» como «m√°s», y el viaje de ida y vuelta con
 * `pbpaste` NO lo detecta. Un acento roto en la portada es lo primero que ve alguien.
 */
{
  const rotas = [];
  PAGINAS.forEach(p => {
    const t = visible(fs.readFileSync(path.join(RAIZ, p), "utf8"));
    const m = t.match(/Ã.|â€.|Â[¡¿]|√°|√©|√≠|�/);
    if (m) rotas.push(p + " («" + m[0] + "»)");
  });
  c(rotas.length === 0, "🔴 ningún acento roto en el texto visible", rotas.join(" · "));
}

// ------------------------------------------------------------------ 2 · interrogaciones y exclamaciones
/**
 * En español se abren. Una pregunta sin «¿» es la errata más común de toda la web, porque el teclado
 * la pone sola en un sitio y no en otro.
 */
{
  const malas = [];
  PAGINAS.forEach(p => {
    const t = visible(fs.readFileSync(path.join(RAIZ, p), "utf8"));
    // se cuentan los pares: cada cierre debe tener su apertura
    const abre = (t.match(/¿/g) || []).length, cierra = (t.match(/\?/g) || []).length;
    const abreE = (t.match(/¡/g) || []).length, cierraE = (t.match(/!/g) || []).length;
    // 🔴 Los signos de cierre de más son normales: una URL con `?`, un `!` dentro de un nombre.
    // Lo que NO puede pasar es abrir y no cerrar — eso siempre es una errata.
    if (abre > cierra) malas.push(p + " (¿ sin ?: " + (abre - cierra) + ")");
    if (abreE > cierraE) malas.push(p + " (¡ sin !: " + (abreE - cierraE) + ")");
  });
  c(malas.length === 0, "ninguna interrogación o exclamación se queda abierta", malas.join(" · "));
}

// ------------------------------------------------------------------ 3 · comillas angulares
{
  const malas = [];
  PAGINAS.forEach(p => {
    const t = visible(fs.readFileSync(path.join(RAIZ, p), "utf8"));
    const a = (t.match(/«/g) || []).length, b = (t.match(/»/g) || []).length;
    if (a !== b) malas.push(p + " (« " + a + " / » " + b + ")");
  });
  c(malas.length === 0, "las comillas angulares se cierran todas", malas.join(" · "));
}

// ------------------------------------------------------------------ 4 · palabras repetidas
{
  const malas = [];
  PAGINAS.forEach(p => {
    const t = visible(fs.readFileSync(path.join(RAIZ, p), "utf8"));
    const m = t.match(/\b(de|la|el|que|los|las|un|una|en|y|se|su|con|por|para)  ?\1\b/gi);
    if (m) malas.push(p + " («" + [...new Set(m)].slice(0, 2).join("», «") + "»)");
  });
  c(malas.length === 0, "ninguna palabra repetida seguida («de de», «que que»)", malas.join(" · "));
}

// ------------------------------------------------------------------ 5 · huecos sin rellenar
/**
 * 🔴 El HTML se arma con `.format()` y f-strings. Un `{algo}` que se escapa llega a producción tal
 * cual y el lector ve una llave con una palabra en inglés dentro.
 */
{
  const malas = [];
  PAGINAS.forEach(p => {
    const t = visible(fs.readFileSync(path.join(RAIZ, p), "utf8"));
    // `{id-del-PER}` es intencionado: es una plantilla que el docente sustituye a mano
    const m = t.match(/\{[a-z_]{3,}\}/g);
    const reales = (m || []).filter(x => !/\{id-del-PER\}|\{codigo\}|\{nombre\}/.test(x));
    if (reales.length) malas.push(p + " " + [...new Set(reales)].slice(0, 3).join(" "));
  });
  c(malas.length === 0, "🔴 ningún hueco de plantilla sin rellenar", malas.join(" · "));
}

// ------------------------------------------------------------------ 6 · notas para uno mismo
{
  const malas = [];
  PAGINAS.forEach(p => {
    const t = visible(fs.readFileSync(path.join(RAIZ, p), "utf8"));
    if (/\b(TODO|FIXME|XXX)\b/.test(t) || /lorem ipsum|pendiente de escribir/i.test(t)) malas.push(p);
  });
  c(malas.length === 0, "ninguna nota de trabajo se ha colado al texto", malas.join(" · "));
}

// ------------------------------------------------------------------ 7 · el nombre público
/**
 * 🔴 REGLA DE NORBERTO, y no es un capricho: en lo que ve el público el proyecto se llama «Proyecto
 * Gamificado del Máster en Tecnología Educativa de la UNIR» y **Genially no se nombra**. Es un
 * acuerdo con la universidad. En `comosehizo.html` sí aparece, porque ahí se cuenta con qué
 * herramientas se hizo y esa página existe justo para eso.
 */
{
  // 🔴 `registro.html` NO entra: es dos cosas —el ranking publico con `?solo=1` y, tras la puerta,
  // la documentacion del metodo para el profesorado—, y en esa mitad Genially se nombra con toda
  // normalidad porque es la herramienta con la que se monta el curso. Lo que no puede es asomar en
  // lo que ve alguien de fuera.
  const PUBLICAS = ["index.html", "entrar.html", "recluta.html", "alistarse.html"];
  const malas = [];
  PUBLICAS.forEach(p => {
    if (!fs.existsSync(path.join(RAIZ, p))) return;
    const t = visible(fs.readFileSync(path.join(RAIZ, p), "utf8"));
    if (/genially/i.test(t)) malas.push(p);
  });
  c(malas.length === 0, "🔴 Genially no se nombra en las páginas del público", malas.join(" · "));

  const I = visible(fs.readFileSync(path.join(RAIZ, "index.html"), "utf8"));
  c(/Máster en Tecnología Educativa/.test(I), "la portada nombra el máster como toca");
  c(/UNIR/.test(I), "y la universidad");
}

// ------------------------------------------------------------------ 8 · el foro, con su nombre
/**
 * 🔴 Norberto: donde los retos mencionen el foro hay que decir «el foro de la plataforma de UNIR»,
 * no «el foro» a secas — porque hay dos y el alumnado publica en el que no es.
 */
{
  const malas = [];
  PAGINAS.forEach(p => {
    const t = visible(fs.readFileSync(path.join(RAIZ, p), "utf8"));
    // «en el foro» suelto, sin decir cuál, y sin que sea el foro dinamizador nuestro
    const m = t.match(/.{55}\ben el foro\b(?!\s+(de la plataforma|dinamizador))/gi);
    if (m) {
      const reales = m.filter(x => !/dinamizador|de esta web|del Genially|de STARGATE/i.test(x));
      if (reales.length) malas.push(p + " «…" + reales[0].trim().slice(-58) + "»");
    }
  });
  c(malas.length === 0, "«el foro» siempre dice cuál es", malas.slice(0, 3).join(" · "));
}

// ------------------------------------------------------------------ 9 · espacios antes de puntuación
{
  const malas = [];
  PAGINAS.forEach(p => {
    // 🔴 Sobre el HTML EN BRUTO, no sobre el texto visible: al quitar las etiquetas,
    // `<b>palabra</b>,` se convierte en `palabra ,` y la comprobacion acusaba a un parrafo
    // perfectamente escrito. El espacio de mas esta en el fuente o no esta en ninguna parte.
    const bruto = fs.readFileSync(path.join(RAIZ, p), "utf8")
      .replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<!--[\s\S]*?-->/g, " ");
    const m = bruto.match(/[a-záéíóúñ] +[,;](?= )/g);
    if (m) malas.push(p + " (" + m.length + ")");
  });
  c(malas.length === 0, "ningún espacio suelto antes de una coma o un punto y coma", malas.join(" · "));
}

// ------------------------------------------------------------------ 10 · los títulos de pestaña
{
  const sinTitulo = [], repes = {};
  PAGINAS.forEach(p => {
    const h = fs.readFileSync(path.join(RAIZ, p), "utf8");
    const m = h.match(/<title>([^<]*)<\/title>/i);
    const t = m ? m[1].trim() : "";
    if (!t) { sinTitulo.push(p); return; }
    (repes[t] = repes[t] || []).push(p);
  });
  c(sinTitulo.length === 0, "todas las páginas tienen título de pestaña", sinTitulo.join(" · "));
  const dobles = Object.keys(repes).filter(t => repes[t].length > 1);
  c(dobles.length === 0, "🔴 y ninguno se repite: con diez pestañas abiertas hay que distinguirlas",
    dobles.map(t => '"' + t + '" → ' + repes[t].join(", ")).join(" · "));
}

// ------------------------------------------------------------------ 11 · descripción y lang
{
  const sinDesc = [], sinLang = [];
  PAGINAS.forEach(p => {
    const h = fs.readFileSync(path.join(RAIZ, p), "utf8");
    if (!/<meta name="description" content="[^"]{20,}"/i.test(h)) sinDesc.push(p);
    if (!/<html lang="es"/i.test(h)) sinLang.push(p);
  });
  c(sinDesc.length === 0, "todas llevan descripción", sinDesc.join(" · "));
  c(sinLang.length === 0, "todas declaran que están en español", sinLang.join(" · "));
}

module.exports = { nombre: "Erratas y texto visible", ok, fallos };
if (require.main === module) {
  console.log("\n  Batería 65 · erratas y texto visible");
  console.log("  " + ok + " comprobaciones, " + fallos.length + " fallos");
  fallos.forEach(f => console.log("   ✗ " + f));
  process.exit(fallos.length ? 1 : 0);
}
