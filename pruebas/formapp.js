'use strict';
/**
 * STARGATE · Banco de pruebas — Google Forms simulado
 * Lo justo para que crearPER / reestructurarBitacora_ / actualizarRecompensas funcionen de verdad,
 * y para que la pestaña de respuestas tenga LAS MISMAS CABECERAS que en Google (que es de donde
 * Code.gs saca los datos con idx_()).
 */
const { Archivo, Drive, Libro } = require("./mocks.js");

const TIPOS = {
  TEXT: "TEXT", PARAGRAPH_TEXT: "PARAGRAPH_TEXT", LIST: "LIST", CHECKBOX: "CHECKBOX",
  MULTIPLE_CHOICE: "MULTIPLE_CHOICE", SCALE: "SCALE", PAGE_BREAK: "PAGE_BREAK",
  IMAGE: "IMAGE", SECTION_HEADER: "SECTION_HEADER", DATE: "DATE", GRID: "GRID"
};
// Los que generan columna en la hoja de respuestas
const PREGUNTA = ["TEXT", "PARAGRAPH_TEXT", "LIST", "CHECKBOX", "MULTIPLE_CHOICE", "SCALE", "DATE", "GRID"];

let nId = 0;

class Opcion {
  constructor(valor, destino) { this.valor = valor; this.destino = destino || null; }
  getValue() { return this.valor; }
  getGotoPage() { return this.destino && this.destino.tipo === "PAGE_BREAK" ? this.destino : null; }
  getPageNavigationType() { return typeof this.destino === "string" ? this.destino : null; }
}

class Item {
  constructor(form, tipo) { this.form = form; this.tipo = tipo; this.titulo = ""; this.ayuda = ""; this.obligatorio = false; this.opciones = []; this.id = ++nId; }
  getId() { return this.id; }
  getType() { return this.tipo; }
  getTitle() { return this.titulo; }
  setTitle(t) { this.titulo = String(t); this.form._sincronizar(); return this; }
  getHelpText() { return this.ayuda; }
  setHelpText(t) { this.ayuda = String(t); return this; }
  isRequired() { return this.obligatorio; }
  setRequired(b) { this.obligatorio = !!b; return this; }
  getIndex() { return this.form.items.indexOf(this); }
  // listas / casillas
  // Google NO acepta una lista vacia: revienta con «La matriz está vacía: values». El simulador lo
  // aceptaba sin rechistar, y por eso el banco se quedo verde mientras crearPER se caia en produccion
  // al retirar los personajes exclusivos. Un simulador mas permisivo que la realidad no sirve de nada.
  setChoiceValues(vs) {
    if (!vs || !vs.length) throw new Error("La matriz está vacía: values");
    this.opciones = vs.map(v => new Opcion(v)); return this;
  }
  getChoices() { return this.opciones.slice(); }
  // Igual que setChoiceValues: Google no acepta una lista de opciones vacia.
  setChoices(cs) {
    if (!cs || !cs.length) throw new Error("La matriz está vacía: choices");
    this.opciones = cs.slice(); return this;
  }
  createChoice(v, destino) { return new Opcion(v, destino); }
  showOtherOption() { return this; }
  setValidation() { return this; }
  // escala
  setBounds() { return this; }
  setLabels() { return this; }
  // imagen
  setImage(b) { this.blob = b; return this; }
  setAlignment() { return this; }
  setWidth() { return this; }
  // salto de página
  setGoToPage(d) { this.destino = d; return this; }
  getGoToPage() { return this.destino; }
  // conversiones
  asListItem() { return this; } asCheckboxItem() { return this; } asPageBreakItem() { return this; }
  asImageItem() { return this; } asTextItem() { return this; } asParagraphTextItem() { return this; }
  asMultipleChoiceItem() { return this; } asScaleItem() { return this; } asSectionHeaderItem() { return this; }
  duplicate() { const c = new Item(this.form, this.tipo); c.titulo = this.titulo; this.form.items.push(c); return c; }
}

class Formulario {
  constructor(titulo, id) {
    this.titulo = titulo; this.id = id || ("form_" + (++nId)); this.items = [];
    this.descripcion = ""; this.recogeCorreo = false; this.aceptando = true; this.publicado = false;
    this.destino = null; this.hojaDestino = null;
    Formulario.registro[this.id] = this;
  }
  getId() { return this.id; }
  getTitle() { return this.titulo; }
  setTitle(t) { this.titulo = t; return this; }
  setDescription(d) { this.descripcion = d; return this; }
  getPublishedUrl() { return "https://docs.google.com/forms/d/e/" + this.id + "/viewform"; }
  getEditUrl() { return "https://docs.google.com/forms/d/" + this.id + "/edit"; }
  setCollectEmail(b) { this.recogeCorreo = !!b; this._sincronizar(); return this; }
  // Guardan el valor de verdad: si el mock los ignora, una batería que compruebe estos ajustes
  // compara contra undefined y pasa siempre. (Es el mismo error que nos escondió lo de las opciones
  // vacías en el canje.)
  setLimitOneResponsePerUser(b) { this.unaRespuesta = !!b; return this; }
  setAllowResponseEdits() { return this; }
  setShowLinkToRespondAgain(b) { this.otraVez = !!b; return this; }
  setConfirmationMessage() { return this; }
  setAcceptingResponses(b) { this.aceptando = !!b; return this; }
  isAcceptingResponses() { return this.aceptando; }
  setPublished(b) { this.publicado = !!b; return this; }
  // 🔴 Google devuelve cosas DISTINTAS: getItems() da Items GENERICOS (con asListItem() y compañia)
  // y addListItem() da ya un ListItem, que NO tiene as*Item. Encadenar los dos revienta, y el
  // simulador lo dejaba pasar porque devolvia el mismo objeto en los dos casos: por eso crearPER se
  // cayo en produccion el 27-ago con «act.asListItem is not a function» y el banco seguia verde.
  // Aqui se devuelve una VISTA sin esos metodos, que es lo que hace Google.
  _add(tipo) {
    const it = new Item(this, tipo); this.items.push(it); this._sincronizar();
    // 🔴 Y los metodos encadenables tienen que devolver LA VISTA, no el objeto crudo: si
    // addListItem().setTitle(x) devolviera el Item de dentro, la cadena recuperaria los as*Item que
    // Google no da, y el simulador volveria a mentir justo donde nos mordio.
    let vista;
    vista = new Proxy(it, { get(o, k) {
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
  getItems(tipo) { return tipo ? this.items.filter(i => i.tipo === tipo) : this.items.slice(); }
  deleteItem(it) {
    const i = typeof it === "number" ? it : this.items.indexOf(it);
    if (i >= 0) this.items.splice(i, 1);
    return this;
  }
  moveItem(desde, hasta) {
    const it = typeof desde === "number" ? this.items[desde] : desde;
    const i = this.items.indexOf(it); if (i < 0) return it;
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
  createTextValidation() { const v = { requireTextIsUrl: () => v, requireTextIsEmail: () => v, build: () => ({}) }; return v; },
  _Formulario: Formulario, _Item: Item
};

module.exports = FormAppMock;
