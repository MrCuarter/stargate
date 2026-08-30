'use strict';
/**
 * STARGATE · Banco de pruebas — Google Forms simulado
 * Lo justo para que crearPER / reestructurarBitacora_ / actualizarRecompensas funcionen de verdad,
 * y para que la pestaña de respuestas tenga LAS MISMAS CABECERAS que en Google (que es de donde
 * Code.gs saca los datos con idx_()).
 */
const { Archivo, Drive, Libro, cronometro } = require("./mocks.js");

// Toda ESCRITURA del formulario pasa por aquí: es lo que le cuesta el tiempo a Apps Script.
const cobrar = (n) => cronometro.cobrar(n);

const TIPOS = {
  TEXT: "TEXT", PARAGRAPH_TEXT: "PARAGRAPH_TEXT", LIST: "LIST", CHECKBOX: "CHECKBOX",
  MULTIPLE_CHOICE: "MULTIPLE_CHOICE", SCALE: "SCALE", PAGE_BREAK: "PAGE_BREAK",
  IMAGE: "IMAGE", SECTION_HEADER: "SECTION_HEADER", DATE: "DATE", GRID: "GRID"
};
// Los que generan columna en la hoja de respuestas
const PREGUNTA = ["TEXT", "PARAGRAPH_TEXT", "LIST", "CHECKBOX", "MULTIPLE_CHOICE", "SCALE", "DATE", "GRID"];

let nId = 0;

// Un item puede llegar envuelto en una VISTA (ver Formulario.getItems): por dentro se guarda
// siempre el objeto crudo, que es el que da identidad.
const crudo = x => (x && x._crudo) || x;

class Opcion {
  constructor(valor, destino) { this.valor = valor; this.destino = crudo(destino) || null; }
  getValue() { return this.valor; }
  getGotoPage() { return this.destino && this.destino.tipo === "PAGE_BREAK" ? this.destino : null; }
  getPageNavigationType() { return typeof this.destino === "string" ? this.destino : null; }
}

class Item {
  constructor(form, tipo) { this.form = form; this.tipo = tipo; this.titulo = ""; this.ayuda = ""; this.obligatorio = false; this.opciones = []; this.id = ++nId; }
  getId() { return this.id; }
  getType() { return this.tipo; }
  getTitle() { return this.titulo; }
  setTitle(t) { cobrar(); this.titulo = String(t); this.form._sincronizar(); return this; }
  getHelpText() { return this.ayuda; }
  setHelpText(t) { cobrar(); this.ayuda = String(t); return this; }
  isRequired() { return this.obligatorio; }
  setRequired(b) { cobrar(); this.obligatorio = !!b; return this; }
  getIndex() { return this.form.items.indexOf(this); }
  // listas / casillas
  // Google NO acepta una lista vacia: revienta con «La matriz está vacía: values». El simulador lo
  // aceptaba sin rechistar, y por eso el banco se quedo verde mientras crearPER se caia en produccion
  // al retirar los personajes exclusivos. Un simulador mas permisivo que la realidad no sirve de nada.
  setChoiceValues(vs) {
    if (!vs || !vs.length) throw new Error("La matriz está vacía: values");
    cobrar(); this.opciones = vs.map(v => new Opcion(v)); return this;
  }
  getChoices() { return this.opciones.slice(); }
  // Igual que setChoiceValues: Google no acepta una lista de opciones vacia.
  setChoices(cs) {
    if (!cs || !cs.length) throw new Error("La matriz está vacía: choices");
    cobrar(); this.opciones = cs.slice(); return this;
  }
  createChoice(v, destino) { return new Opcion(v, crudo(destino)); }
  showOtherOption() { return this; }
  setValidation(x) { cobrar(); this.validacion = x || null; return this; }
  // escala
  setBounds() { return this; }
  setLabels() { return this; }
  // imagen
  setImage(b) { cobrar(); this.blob = b; return this; }
  setAlignment() { return this; }
  setWidth(w) { cobrar(); this.ancho = w; return this; }   // se GUARDA: el banco comprueba que el orbe salió grande
  // salto de página
  // 🔴 Como en Google: `getGoToPage()` da la PÁGINA destino (o null) y el «enviar»/«continuar» se
  // lee con `getPageNavigationType()`, que es OTRA llamada. El simulador devolvía la constante por
  // `getGoToPage()`, así que el código no podía comprobar si el salto ya estaba puesto sin
  // reescribirlo — y reescribir de más es justo lo que no deja trocear la migración.
  setGoToPage(d) {
    cobrar();
    if (d && typeof d === "object") { this.destino = crudo(d); this.navTipo = "GO_TO_PAGE"; }
    else { this.destino = null; this.navTipo = d || "CONTINUE"; }
    return this;
  }
  getGoToPage() { return this.destino || null; }
  getPageNavigationType() { return this.navTipo || "CONTINUE"; }
  // conversiones
  asListItem() { return this; } asCheckboxItem() { return this; } asPageBreakItem() { return this; }
  asImageItem() { return this; } asTextItem() { return this; } asParagraphTextItem() { return this; }
  asMultipleChoiceItem() { return this; } asScaleItem() { return this; } asSectionHeaderItem() { return this; }
  duplicate() { const c = new Item(this.form, this.tipo); c.titulo = this.titulo; this.form.items.push(c); return c; }
  // 🔴 30-ago · CADA getItems() DEVUELVE ENVOLTORIOS NUEVOS, como Google. Antes el simulador
  // devolvía SIEMPRE el mismo objeto, así que comparar dos items con `===` funcionaba aquí y no en
  // producción: el filtro `sueltos` de `estructuraBitacora_` decía `it === tras` y eso es false
  // siempre en Google (dos getItems() dan dos envoltorios distintos del mismo item). La identidad
  // se compara con getId(), y ahora el banco lo obliga.
  _vista() {
    const o = this;
    const vista = new Proxy(o, { get(dst, k) {
      if (k === "_crudo") return o;
      const val = dst[k];
      if (typeof val !== "function") return val;
      return function () { const r = val.apply(o, arguments); return r === o ? vista : r; };
    } });
    return vista;
  }
}

class Formulario {
  constructor(titulo, id) {
    this.titulo = titulo; this.id = id || ("form_" + (++nId)); this.items = [];
    this.descripcion = ""; this.confirmacion = ""; this.recogeCorreo = false; this.aceptando = true; this.publicado = false;
    this.destino = null; this.hojaDestino = null;
    Formulario.registro[this.id] = this;
  }
  getId() { return this.id; }
  getTitle() { return this.titulo; }
  setTitle(t) { this.titulo = t; return this; }
  // 🔴 Form.getDescription() EXISTE en Apps Script. Faltaba aquí, así que la comparación de
  // `reestructurarBitacora_` («¿la descripción ya es la buena?») leía undefined y reescribía SIEMPRE.
  getDescription() { return this.descripcion || ""; }
  setDescription(d) { cobrar(); this.descripcion = d; return this; }
  getPublishedUrl() { return "https://docs.google.com/forms/d/e/" + this.id + "/viewform"; }
  getEditUrl() { return "https://docs.google.com/forms/d/" + this.id + "/edit"; }
  setCollectEmail(b) { this.recogeCorreo = !!b; this._sincronizar(); return this; }
  // Guardan el valor de verdad: si el mock los ignora, una batería que compruebe estos ajustes
  // compara contra undefined y pasa siempre. (Es el mismo error que nos escondió lo de las opciones
  // vacías en el canje.)
  setLimitOneResponsePerUser(b) { this.unaRespuesta = !!b; return this; }
  setAllowResponseEdits() { return this; }
  setShowLinkToRespondAgain(b) { this.otraVez = !!b; return this; }
  setConfirmationMessage(m) { cobrar(); this.confirmacion = m; return this; }
  getConfirmationMessage() { return this.confirmacion || ""; }
  setAcceptingResponses(b) { this.aceptando = !!b; return this; }
  isAcceptingResponses() { return this.aceptando; }
  setPublished(b) { this.publicado = !!b; return this; }
  // 🔴 Google devuelve cosas DISTINTAS: getItems() da Items GENERICOS (con asListItem() y compañia)
  // y addListItem() da ya un ListItem, que NO tiene as*Item. Encadenar los dos revienta, y el
  // simulador lo dejaba pasar porque devolvia el mismo objeto en los dos casos: por eso crearPER se
  // cayo en produccion el 27-ago con «act.asListItem is not a function» y el banco seguia verde.
  // Aqui se devuelve una VISTA sin esos metodos, que es lo que hace Google.
  _add(tipo) {
    cobrar();
    const it = new Item(this, tipo); this.items.push(it); this._sincronizar();
    // 🔴 Y los metodos encadenables tienen que devolver LA VISTA, no el objeto crudo: si
    // addListItem().setTitle(x) devolviera el Item de dentro, la cadena recuperaria los as*Item que
    // Google no da, y el simulador volveria a mentir justo donde nos mordio.
    let vista;
    vista = new Proxy(it, { get(o, k) {
      if (k === "_crudo") return o;   // el item de dentro: es quien da identidad y quien es destino
      if (typeof k === "string" && /^as[A-Z].*Item$/.test(k)) return undefined;
      const v = o[k];
      if (typeof v !== "function") return v;
      return function () { const r = v.apply(o, arguments); return r === o ? vista : r; };
    } });
    return vista;
  }
  addTextItem() { return this._add(TIPOS.TEXT); }
  addParagraphTextItem() { return this._add(TIPOS.PARAGRAPH_TEXT); }
  addListItem() { return this._add(TIPOS.LIST); }
  addCheckboxItem() { return this._add(TIPOS.CHECKBOX); }
  addMultipleChoiceItem() { return this._add(TIPOS.MULTIPLE_CHOICE); }
  addScaleItem() { return this._add(TIPOS.SCALE); }
  addPageBreakItem() { return this._add(TIPOS.PAGE_BREAK); }
  addImageItem() { return this._add(TIPOS.IMAGE); }
  addSectionHeaderItem() { return this._add(TIPOS.SECTION_HEADER); }
  getItems(tipo) {
    return (tipo ? this.items.filter(i => i.tipo === tipo) : this.items).map(i => i._vista());
  }
  // 🔴 30-ago · GOOGLE NO DEJA BORRAR UNA PÁGINA A LA QUE ALGUIEN NAVEGA. Si una opción de un
  // desplegable (o el salto de otra página) apunta a este salto de página, Forms responde
  // «Invalid data updating form» y el borrado NO se hace. El simulador lo permitía sin rechistar,
  // y por eso el banco daba verde mientras `estructuraBitacora_` fallaba SIEMPRE en producción al
  // intentar quitar «La batalla final» antes de reescribir el selector de planeta.
  _quienNavegaA(it) {
    const quien = [];
    this.items.forEach(otro => {
      if (otro === it) return;
      if (otro.destino && typeof otro.destino === "object" && otro.destino === it) quien.push(otro);
      (otro.opciones || []).forEach(op => { if (op.destino && op.destino === it) quien.push(otro); });
    });
    return quien;
  }
  deleteItem(it) {
    const i = typeof it === "number" ? it : this.items.indexOf(crudo(it));
    if (i < 0) return this;
    const obj = this.items[i];
    if (obj.tipo === TIPOS.PAGE_BREAK) {
      const quien = this._quienNavegaA(obj);
      if (quien.length) throw new Error("Invalid data updating form. Detalles: la página «" + obj.titulo +
        "» sigue siendo destino de " + quien.map(x => "«" + x.titulo + "»").join(", "));
    }
    cobrar();
    this.items.splice(i, 1);
    return this;
  }
  moveItem(desde, hasta) {
    const it = typeof desde === "number" ? this.items[desde] : crudo(desde);
    const i = this.items.indexOf(it); if (i < 0) return it;
    cobrar();
    this.items.splice(i, 1); this.items.splice(hasta, 0, it); return it;
  }
  getDestinationId() { return this.destino ? this.destino.getId() : null; }
  getDestinationType() { return this.destino ? "SPREADSHEET" : null; }
  setDestination(tipo, ssId) {
    // El banco puede simular el fallo transitorio de Google al vincular dos formularios seguidos
    // a la MISMA hoja: «Failed to set response destination». Pasa de verdad (visto en producción).
    if (FormAppMock._fallosVinculacion > 0) {
      FormAppMock._fallosVinculacion--;
      throw new Error("Failed to set response destination. Verify the destination ID and try again.");
    }
    const libro = Libro.registro[ssId];
    if (!libro) throw new Error("No existe la hoja de destino " + ssId);
    this.destino = libro;
    let n = 1, nombre;
    do { nombre = "Respuestas de formulario " + n; n++; } while (libro.getSheetByName(nombre));
    this.hojaDestino = libro.insertSheet(nombre);
    this.hojaDestino._formUrl = this.getEditUrl();
    this._sincronizar();
    return this;
  }
  removeDestination() { if (this.hojaDestino) this.hojaDestino._formUrl = ""; this.hojaDestino = null; this.destino = null; return this; }
  // Cabeceras como en Google: marca temporal, correo (si se recoge) y una columna por pregunta.
  // Las columnas NO se borran al borrar una pregunta (igual que en Google): solo se añaden.
  _sincronizar() {
    const sh = this.hojaDestino; if (!sh) return;
    const cab = sh.getLastColumn() ? sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String) : [];
    const quiero = ["Marca temporal"];
    if (this.recogeCorreo) quiero.push("Dirección de correo electrónico");
    this.items.forEach(i => { if (PREGUNTA.indexOf(i.tipo) >= 0 && i.titulo) quiero.push(i.titulo); });
    quiero.forEach(t => { if (cab.indexOf(t) < 0) { cab.push(t); } });
    if (cab.length) sh.getRange(1, 1, 1, cab.length).setValues([cab]);
  }
  _copiar(id, titulo) {
    const f = new Formulario(titulo, id);
    this.items.forEach(i => { const c = new Item(f, i.tipo); c.titulo = i.titulo; c.ayuda = i.ayuda; c.opciones = i.opciones.slice(); f.items.push(c); });
    f.recogeCorreo = this.recogeCorreo;
    return f;
  }
}
Formulario.registro = {};

const FormAppMock = {
  _fallosVinculacion: 0,   // cuántas veces debe fallar el próximo setDestination
  ItemType: TIPOS,
  Alignment: { LEFT: "LEFT", CENTER: "CENTER", RIGHT: "RIGHT" },
  PageNavigationType: { CONTINUE: "CONTINUE", GO_TO_PAGE: "GO_TO_PAGE", RESTART: "RESTART", SUBMIT: "SUBMIT" },
  DestinationType: { SPREADSHEET: "SPREADSHEET" },
  create(titulo) {
    const f = new Formulario(titulo);
    const a = new Archivo(f.id, titulo, "application/vnd.google-apps.form", null);
    a._form = f;
    return f;
  },
  openById(id) { const f = Formulario.registro[id]; if (!f) throw new Error("No existe el formulario " + id); return f; },
  openByUrl(url) {
    const m = String(url).match(/forms\/d\/(?:e\/)?([^/]+)/);
    const f = m && Formulario.registro[m[1]];
    if (!f) throw new Error("No se ha podido abrir el formulario por URL: " + url);
    return f;
  },
  // v3.41 · la validación GUARDA lo que le piden: el huevo de Pascua depende de que el patrón
  // llegue de verdad al campo, y con un mock que lo tiraba nadie lo habría visto romperse.
  createTextValidation() { const d = { tipo: "", patron: "", ayuda: "" };
    const v = { requireTextIsUrl(){ d.tipo="url"; return v; }, requireTextIsEmail(){ d.tipo="email"; return v; },
      requireTextContainsPattern(p){ d.tipo="contiene"; d.patron=String(p); return v; },
      requireTextMatchesPattern(p){ d.tipo="coincide"; d.patron=String(p); return v; },
      setHelpText(t){ d.ayuda=String(t); return v; }, build: () => d }; return v; },
  _Formulario: Formulario, _Item: Item
};

module.exports = FormAppMock;
